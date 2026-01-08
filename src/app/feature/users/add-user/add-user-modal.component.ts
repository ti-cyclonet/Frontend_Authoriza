import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../../../shared/services/user/user.service';
import { User } from '../../../shared/model/user';
import { NotificationsComponent } from '../../../shared/components/notifications/notifications.component';
import { CommonModule } from '@angular/common';
import { CreateFullUser } from '../../../shared/model/createfulluser';
import { RolesService } from '../../../shared/services/roles/roles.service';
import { Rol } from '../../../shared/model/rol';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ApplicationWithRoles } from '../../../shared/model/application-with-roles';
import Swal from 'sweetalert2';
import { AssignRoleComponent } from '../assign-role/assign-role.component';
import { AssignDependencyComponent } from '../assign-dependency/assign-dependency.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AssignRoleComponent,
    AssignDependencyComponent,
    TranslatePipe,
  ],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css'],
})
export class AddUserModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() close2 = new EventEmitter<void>();
  @Output() userCreated = new EventEmitter<{
    message?: string;
    type?: 'success' | 'warning' | 'danger' | 'primary';
    alertType?: 'A' | 'B';
    container?: 0 | 1;
    id?: string | null;
  }>();

  currentStep = 1;
  emailTaken = false;

  userForm: FormGroup;
  basicDataForm: FormGroup;
  documentForm: FormGroup;
  naturalForm: FormGroup;
  legalForm: FormGroup;
  roleSearchForm: FormGroup;

  roles: any[] = [];
  selectedRole: any = null;
  createdUserId: string | null = null;
  showAssignRole = false;

  allApplicationsWithRoles: ApplicationWithRoles[] = [];
  filteredRoles: { applicationName: string; role: Rol }[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RolesService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) {
    this.userForm = this.fb.group({
      strUserName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      strStatus: ['ACTIVE'],
    });

    this.basicDataForm = this.fb.group({
      strPersonType: ['N', Validators.required],
      strStatus: ['ACTIVE'],
    });

    this.documentForm = this.fb.group({
      strDocumentType: ['CC', Validators.required],
      strDocumentNumber: ['', Validators.required],
      strDocumentDV: [''],
    });

    this.naturalForm = this.fb.group({
      firstName: ['', Validators.required],
      secondName: [''],
      firstSurname: ['', Validators.required],
      secondSurname: [''],
      birthDate: ['', Validators.required],
      maritalStatus: ['', Validators.required],
      sex: ['', Validators.required],
    });

    this.legalForm = this.fb.group({
      businessName: ['', Validators.required],
      webSite: [''],
      contactName: ['', Validators.required],
      contactEmail: ['', Validators.required],
      contactPhone: ['', Validators.required],
    });

    this.roleSearchForm = this.fb.group({
      appName: [''],
      roleName: [''],
    });

    this.basicDataForm.get('strPersonType')?.valueChanges.subscribe(personType => {
      if (personType === 'J') {
        this.documentForm.patchValue({ strDocumentType: 'NIT' });
        this.documentForm.get('strDocumentType')?.disable();
        this.documentForm.get('strDocumentNumber')?.setValidators([Validators.required, Validators.pattern(/^\d{9}$/)]);
        this.documentForm.get('strDocumentDV')?.setValidators([Validators.required, Validators.pattern(/^\d{1}$/)]);
      } else {
        this.documentForm.get('strDocumentType')?.enable();
        this.documentForm.patchValue({ strDocumentType: 'CC' });
        this.documentForm.get('strDocumentNumber')?.setValidators([Validators.required]);
        this.documentForm.get('strDocumentDV')?.clearValidators();
      }
      this.documentForm.get('strDocumentNumber')?.updateValueAndValidity();
      this.documentForm.get('strDocumentDV')?.updateValueAndValidity();
    });
  }

  ngOnInit() {}

  openAssignRoleModal(role: Rol) {
    this.selectedRole = role;
    // abrir tu modal
  }

  nextStep() {
    this.currentStep++;
  }

  prevStep() {
    this.currentStep--;
  }

  createUser() {
    this.emailTaken = false;

    // Validar el formulario completo antes de continuar
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const userName = this.userForm.value.strUserName;

    this.userService.checkUserNameAvailability(userName).subscribe({
      next: (res) => {
        if (!res.available) {
          this.emailTaken = true;
          this.userForm.get('strUserName')?.setErrors({ taken: true });
          return;
        }

        this.nextStep();
      },
      error: () => {
        this.emailTaken = true;
        this.userForm.get('strUserName')?.setErrors({ taken: true });
      },
    });
  }

  createBasicData() {
    if (this.basicDataForm.invalid) {
      this.basicDataForm.markAllAsTouched();
      return;
    }

    this.nextStep();
  }

  async finish() {
    // Validar formulario básico
    if (this.basicDataForm.invalid) {
      this.basicDataForm.markAllAsTouched();
      return;
    }

    // Validar formulario de documento
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    // Validar formulario específico según tipo de persona
    if (
      this.basicDataForm.value.strPersonType === 'N' &&
      this.naturalForm.invalid
    ) {
      this.naturalForm.markAllAsTouched();
      return;
    }

    if (
      this.basicDataForm.value.strPersonType === 'J' &&
      this.legalForm.invalid
    ) {
      this.legalForm.markAllAsTouched();
      return;
    }

    const isPrincipalResult = await Swal.fire({
      title: this.translationService.translate('users.modal.isPrimaryUser'),
      text: this.translationService.translate('users.modal.primaryUserText'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.translationService.translate('users.modal.yesPrimary'),
      cancelButtonText: this.translationService.translate('users.modal.noRequiresRole'),
    });

    const isPrincipal = isPrincipalResult.isConfirmed;

    const dto: CreateFullUser = {
      user: {
        ...this.userForm.value,
        strStatus: isPrincipal ? 'UNCONFIRMED' : this.userForm.value.strStatus,
      },
      basicData: {
        ...this.basicDataForm.value,
        strStatus: isPrincipal
          ? 'ACTIVE'
          : this.basicDataForm.value.strStatus,
      },
      documentType: {
        strDocumentType: this.basicDataForm.value.strPersonType === 'J' ? 'NIT' : this.documentForm.value.strDocumentType,
        strDocumentNumber: this.basicDataForm.value.strPersonType === 'J' 
          ? `${this.documentForm.value.strDocumentNumber}-${this.documentForm.value.strDocumentDV}`
          : this.documentForm.value.strDocumentNumber,
      },
      naturalPersonData:
        this.basicDataForm.value.strPersonType === 'N'
          ? this.naturalForm.value
          : undefined,
      legalEntityData:
        this.basicDataForm.value.strPersonType === 'J'
          ? this.legalForm.value
          : undefined,
    };

    console.log('Sending DTO to backend:', dto);

    this.userService.createFullUser(dto).subscribe({
      next: (createdUser) => {
        this.createdUserId = createdUser?.id;
        if (isPrincipal) {
          this.userCreated.emit({
            message: 'Usuario primario creado exitosamente',
            type: 'success',
            alertType: 'A',
            container: 0,
            id: createdUser?.id
          });
          this.close.emit();
        } else {
          this.nextStep();
        }
      },
      error: (err) => {
        console.error('Error creating user:', err);
        this.userCreated.emit({
          message:
            'Error creating user: ' + (err.error?.message || 'Desconocido'),
          type: 'danger',
          alertType: 'B',
          container: 0,
        });
      },
    });
  }

  onUserCreated() {
    this.showAssignRole = true;
  }

  onRoleAssigned() {
    this.showAssignRole = false;
    this.currentStep++;
  }

  onDependencyAssigned() {
    this.close.emit();
  }
}
