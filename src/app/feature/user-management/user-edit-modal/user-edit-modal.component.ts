import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user/user.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { User } from '../../../shared/model/user';

@Component({
  selector: 'app-user-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './user-edit-modal.component.html',
  styleUrls: ['./user-edit-modal.component.css']
})
export class UserEditModalComponent implements OnInit {
  @Input() user!: User;
  @Output() close = new EventEmitter<void>();
  @Output() userUpdated = new EventEmitter<User>();

  editForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.editForm = this.fb.group({
      strUserName: [this.user.strUserName, [Validators.required, Validators.email]],
      strStatus: [this.user.strStatus, Validators.required],
      // Campos para persona natural
      firstName: [(this.user.basicData?.naturalPersonData as any)?.firstName || ''],
      secondName: [(this.user.basicData?.naturalPersonData as any)?.secondName || ''],
      firstSurname: [(this.user.basicData?.naturalPersonData as any)?.firstSurname || ''],
      secondSurname: [(this.user.basicData?.naturalPersonData as any)?.secondSurname || ''],
      birthDate: [(this.user.basicData?.naturalPersonData as any)?.birthDate || ''],
      sex: [(this.user.basicData?.naturalPersonData as any)?.sex || ''],
      maritalStatus: [(this.user.basicData?.naturalPersonData as any)?.maritalStatus || ''],
      // Campos para persona jurídica
      businessName: [(this.user.basicData?.legalEntityData as any)?.businessName || ''],
      webSite: [(this.user.basicData?.legalEntityData as any)?.webSite || ''],
      contactName: [(this.user.basicData?.legalEntityData as any)?.contactName || ''],
      contactEmail: [(this.user.basicData?.legalEntityData as any)?.contactEmail || ''],
      contactPhone: [(this.user.basicData?.legalEntityData as any)?.contactPhone || '']
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.editForm.value;

    const updateData: any = {
      strUserName: formValue.strUserName,
      strStatus: formValue.strStatus
    };

    // Agregar datos específicos según tipo de persona
    if (this.user.basicData?.strPersonType === 'N') {
      updateData.naturalPersonData = {
        firstName: formValue.firstName,
        secondName: formValue.secondName,
        firstSurname: formValue.firstSurname,
        secondSurname: formValue.secondSurname,
        birthDate: formValue.birthDate,
        sex: formValue.sex,
        maritalStatus: formValue.maritalStatus
      };
    } else if (this.user.basicData?.strPersonType === 'J') {
      updateData.legalEntityData = {
        businessName: formValue.businessName,
        webSite: formValue.webSite,
        contactName: formValue.contactName,
        contactEmail: formValue.contactEmail,
        contactPhone: formValue.contactPhone
      };
    }

    this.userService.updateUser(this.user.id, updateData).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        this.userUpdated.emit(updatedUser);
        this.closeModal();
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.isLoading = false;
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'validation.required';
      if (field.errors['email']) return 'validation.email';
    }
    return '';
  }

  closeModal(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}