import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user/user.service';
import { UserDependenciesService } from '../../../shared/services/user-dependencies/user-dependencies.service';
import { RolesService } from '../../../shared/services/roles/roles.service';
import { PackagesService } from '../../../shared/services/packages/packages.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface WizardStep {
  label: string;
  isValid: boolean;
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  roles: any[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  applicationName: string;
}

@Component({
  selector: 'app-user-creation-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './user-creation-wizard.component.html',
  styleUrls: ['./user-creation-wizard.component.css']
})
export class UserCreationWizardComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() userCreated = new EventEmitter<any>();

  currentStep: number = 1;
  isCreating: boolean = false;

  steps: WizardStep[] = [
    { label: 'userWizard.steps.basicInfo', isValid: false }
  ];

  // Formularios
  basicInfoForm!: FormGroup;
  accountConfigForm!: FormGroup;

  // Datos para selección
  availablePrincipals: any[] = [];
  availablePackages: Package[] = [];
  availableRoles: Role[] = [];
  selectedPackages: Package[] = [];
  selectedRoles: Role[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private userDependenciesService: UserDependenciesService,
    private rolesService: RolesService,
    private packagesService: PackagesService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadAvailablePrincipals();
  }

  private loadAvailablePrincipals(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.availablePrincipals = users.map(user => ({
          ...user,
          displayName: this.getUserDisplayName(user)
        }));
      },
      error: (error) => {
        console.error('Error loading principal users:', error);
      }
    });
  }

  private initializeForms(): void {
    this.basicInfoForm = this.fb.group({
      username: ['', {
        validators: [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)],
        asyncValidators: [this.usernameValidator.bind(this)],
        updateOn: 'blur'
      }],
      personType: ['', Validators.required],
      // Persona Natural
      documentType: [''],
      documentNumber: [''],
      firstName: [''],
      secondName: [''],
      firstSurname: [''],
      secondSurname: [''],
      birthDate: [''],
      sex: [''],
      maritalStatus: [''],
      phone: [''],
      // Persona Jurídica
      businessName: [''],
      documentTypeJ: ['NIT'],
      documentNumberJ: [''],
      documentDV: [''],
      website: [''],
      phoneJ: [''],
      contactName: [''],
      contactEmail: [''],
      legalRepresentative: ['']
    });

    this.accountConfigForm = this.fb.group({
      userType: ['principal', Validators.required],
      principalUserId: [''],
      status: ['UNCONFIRMED', Validators.required],
      expirationDate: ['']
    });

    // Suscribirse a cambios en el tipo de persona
    this.basicInfoForm.get('personType')?.valueChanges.subscribe(type => {
      this.updatePersonTypeValidators(type);
    });

    // Suscribirse a cambios en el tipo de usuario
    this.accountConfigForm.get('userType')?.valueChanges.subscribe(type => {
      this.updateUserTypeValidators(type);
    });
  }

  private updatePersonTypeValidators(type: string): void {
    const documentTypeControl = this.basicInfoForm.get('documentType');
    const documentNumberControl = this.basicInfoForm.get('documentNumber');
    const firstNameControl = this.basicInfoForm.get('firstName');
    const firstSurnameControl = this.basicInfoForm.get('firstSurname');
    const businessNameControl = this.basicInfoForm.get('businessName');
    const documentTypeJControl = this.basicInfoForm.get('documentTypeJ');
    const documentNumberJControl = this.basicInfoForm.get('documentNumberJ');

    // Limpiar validadores existentes
    documentTypeControl?.clearValidators();
    documentNumberControl?.clearValidators();
    firstNameControl?.clearValidators();
    firstSurnameControl?.clearValidators();
    businessNameControl?.clearValidators();
    documentTypeJControl?.clearValidators();
    documentNumberJControl?.clearValidators();

    if (type === 'N') {
      // Persona Natural
      documentTypeControl?.setValidators([Validators.required]);
      documentNumberControl?.setValidators([Validators.required]);
      firstNameControl?.setValidators([Validators.required]);
      firstSurnameControl?.setValidators([Validators.required]);
    } else if (type === 'J') {
      // Persona Jurídica
      businessNameControl?.setValidators([Validators.required]);
      documentTypeJControl?.setValidators([Validators.required]);
      documentNumberJControl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{9}$/)]);
      
      // Establecer NIT como valor por defecto
      this.basicInfoForm.patchValue({ documentTypeJ: 'NIT' });
    }

    // Actualizar validación
    documentTypeControl?.updateValueAndValidity();
    documentNumberControl?.updateValueAndValidity();
    firstNameControl?.updateValueAndValidity();
    firstSurnameControl?.updateValueAndValidity();
    businessNameControl?.updateValueAndValidity();
    documentTypeJControl?.updateValueAndValidity();
    documentNumberJControl?.updateValueAndValidity();
  }

  private updateUserTypeValidators(type: string): void {
    const principalUserIdControl = this.accountConfigForm.get('principalUserId');
    
    principalUserIdControl?.clearValidators();
    
    if (type === 'dependent') {
      principalUserIdControl?.setValidators([Validators.required]);
    }
    
    principalUserIdControl?.updateValueAndValidity();
  }

  // Navegación del Wizard
  nextStep(): void {
    if (this.canProceedToNext()) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canProceedToNext(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.basicInfoForm.valid;
      default:
        return false;
    }
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.steps.length) * 100;
  }

  // Selección de tipos
  selectPersonType(type: string): void {
    this.basicInfoForm.patchValue({ personType: type });
  }

  selectUserType(type: string): void {
    this.accountConfigForm.patchValue({ userType: type });
  }

  // Validación de campos
  isFieldInvalid(fieldName: string): boolean {
    const field = this.basicInfoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.basicInfoForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'validation.required';
      if (field.errors['email']) return 'validation.email';
      if (field.errors['pattern']) return 'validation.email';
      if (field.errors['taken']) return 'users.modal.emailTaken';
      if (field.errors['minlength']) return 'validation.minLength';
    }
    return '';
  }

  // Función para validar entrada de números en el documento
  onDocumentNumberInput(event: any): void {
    const input = event.target;
    const value = input.value;
    // Remover cualquier carácter que no sea número
    const numericValue = value.replace(/[^0-9]/g, '');
    // Limitar a 9 dígitos
    const limitedValue = numericValue.substring(0, 9);
    
    if (value !== limitedValue) {
      input.value = limitedValue;
      this.basicInfoForm.patchValue({ documentNumberJ: limitedValue });
    }
  }

  // Validador asíncrono para verificar disponibilidad del username
  private usernameValidator(control: any) {
    if (!control.value) {
      return Promise.resolve(null);
    }

    return this.userService.checkUserNameAvailability(control.value)
      .toPromise()
      .then(response => {
        return response?.available ? null : { taken: true };
      })
      .catch(() => {
        return { taken: true };
      });
  }

  // Información para el resumen
  getPersonTypeLabel(): string {
    const type = this.basicInfoForm.get('personType')?.value;
    return type === 'N' ? 'userWizard.step1.naturalPerson' : 'userWizard.step1.legalEntity';
  }

  getUserTypeLabel(): string {
    const type = this.accountConfigForm.get('userType')?.value;
    return type === 'principal' ? 'userWizard.step2.principalUser' : 'userWizard.step2.dependentUser';
  }

  getFullName(): string {
    const form = this.basicInfoForm.value;
    return `${form.firstName || ''} ${form.secondName || ''} ${form.firstSurname || ''} ${form.secondSurname || ''}`.trim();
  }

  getPrincipalUserName(): string {
    const principalId = this.accountConfigForm.get('principalUserId')?.value;
    const principal = this.availablePrincipals.find(p => p.id === principalId);
    return principal ? `${principal.displayName} (${principal.strUserName})` : '';
  }

  private getUserDisplayName(user: any): string {
    if (user.basicData?.strPersonType === 'N') {
      const natural = user.basicData.naturalPersonData;
      return `${natural?.firstName || ''} ${natural?.firstSurname || ''}`.trim();
    } else if (user.basicData?.strPersonType === 'J') {
      return user.basicData.legalEntityData?.businessName || user.strUserName;
    }
    return user.strUserName;
  }

  // Creación del usuario
  createUser(): void {
    if (!this.canProceedToNext()) return;

    this.isCreating = true;

    const userData = this.buildUserData();

    this.userService.createFullUser(userData).subscribe({
      next: (createdUser) => {
        this.handleUserCreated(createdUser);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.isCreating = false;
      }
    });
  }

  private buildUserData(): any {
    const basicInfo = this.basicInfoForm.value;
    const accountConfig = this.accountConfigForm.value;

    const userData: any = {
      user: {
        strUserName: basicInfo.username,
        strStatus: 'UNCONFIRMED'
      },
      basicData: {
        strPersonType: basicInfo.personType,
        strStatus: 'ACTIVE'
      },
      documentType: {
        strDocumentType: basicInfo.personType === 'J' ? 'NIT' : basicInfo.documentType || 'CC',
        strDocumentNumber: basicInfo.personType === 'J' 
          ? `${basicInfo.documentNumberJ}-${basicInfo.documentDV}`
          : basicInfo.documentNumber
      }
    };

    // Datos específicos según el tipo de persona
    if (basicInfo.personType === 'N') {
      userData.naturalPersonData = {
        firstName: basicInfo.firstName,
        secondName: basicInfo.secondName || '',
        firstSurname: basicInfo.firstSurname,
        secondSurname: basicInfo.secondSurname || '',
        birthDate: basicInfo.birthDate,
        maritalStatus: basicInfo.maritalStatus,
        sex: basicInfo.sex
      };
    } else if (basicInfo.personType === 'J') {
      userData.legalEntityData = {
        businessName: basicInfo.businessName,
        webSite: basicInfo.website || '',
        contactName: basicInfo.contactName,
        contactEmail: basicInfo.contactEmail,
        contactPhone: basicInfo.phoneJ
      };
    }

    return userData;
  }

  private handleUserCreated(createdUser: any): void {
    this.completeUserCreation(createdUser);
  }

  private completeUserCreation(user: any): void {
    this.isCreating = false;
    this.userCreated.emit(user);
    this.closeWizard();
  }

  // Eventos del modal
  closeWizard(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeWizard();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    this.closeWizard();
  }
}