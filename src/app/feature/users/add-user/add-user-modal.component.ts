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

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AssignRoleComponent,
    AssignDependencyComponent,
  ],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css'],
})
export class AddUserModalComponent {
  @Output() close = new EventEmitter<void>();
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
    private cdr: ChangeDetectorRef
  ) {
    this.userForm = this.fb.group({
      strUserName: ['', [Validators.required, Validators.email]],
      strPassword: ['', Validators.required],
      strStatus: ['ACTIVE'],
    });

    this.basicDataForm = this.fb.group({
      strPersonType: ['N', Validators.required],
      strStatus: ['ACTIVE'],
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

    const userName = this.userForm.value.strUserName;

    if (!userName) {
      this.userForm.get('strUserName')?.markAsTouched();
      return;
    }

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
      title: '¿Is this a primary user?',
      text: 'The primary user does not require role assignment or dependency.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, it is a primary user',
      cancelButtonText: 'No, it requires role assignment',
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
      naturalPersonData:
        this.basicDataForm.value.strPersonType === 'N'
          ? this.naturalForm.value
          : undefined,
      legalEntityData:
        this.basicDataForm.value.strPersonType === 'J'
          ? this.legalForm.value
          : undefined,
    };

    this.userService.createFullUser(dto).subscribe({
      next: (createdUser) => {
        this.createdUserId = createdUser?.id;

        Swal.fire({
          icon: 'success',
          title: 'User created',
          text: 'User created successfully!',
          confirmButtonText: 'Continue',
        }).then(() => {
          if (isPrincipal) {
            this.close.emit();
          } else {
            this.nextStep();
          }
        });
      },
      error: (err) => {
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
    this.userCreated.emit({
      message: 'User created, role and dependency assigned successfully!',
      type: 'success',
      alertType: 'A',
      container: 0,
      id: this.createdUserId,
    });
    this.close.emit();
  }
}
