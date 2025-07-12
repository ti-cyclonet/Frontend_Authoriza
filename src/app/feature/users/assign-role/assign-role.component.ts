import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { UserService } from '../../../shared/services/user/user.service';
import { RolesService } from '../../../shared/services/roles/roles.service';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationWithRoles } from '../../../shared/model/application-with-roles';
import { Rol } from '../../../shared/model/rol';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-assign-role-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './assign-role.component.html',
  styleUrls: ['./assign-role.component.css'],
})
export class AssignRoleComponent {
  @Input() userId!: string;
  @Output() roleAssigned = new EventEmitter<{
    role: Rol;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'primary';
    alertType: 'A' | 'B';
    container: 0 | 1;
  }>();
  @Input() editing = false;
  @Output() close = new EventEmitter<void>();

  roles: Rol[] = [];
  selectedRole!: Rol;

  roleSearchForm: FormGroup;
  createdUserId: string | null = null;

  allApplicationsWithRoles: ApplicationWithRoles[] = [];
  filteredRoles: { applicationName: string; role: Rol }[] = [];
  flattenedRoles: { applicationName: string; role: Rol }[] = [];

  // PAGINATION
  page = 1;
  pageSize = 6;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RolesService,
    private cdr: ChangeDetectorRef
  ) {
    this.roleSearchForm = this.fb.group({
      appName: [''],
      roleName: [''],
    });
  }

  ngOnInit() {
    this.editing = true;
    this.setupSearchListener();
    this.roleService.getAllApplicationsWithRoles().subscribe((apps) => {
      this.allApplicationsWithRoles = apps;
      this.flattenedRoles = this.flattenRoles(apps);
    });
  }

  get appNameControl(): FormControl {
    return this.roleSearchForm.get('appName') as FormControl;
  }

  get roleNameControl(): FormControl {
    return this.roleSearchForm.get('roleName') as FormControl;
  }

  get pagedRoles() {
    const start = (this.page - 1) * this.pageSize;
    return this.flattenedRoles.slice(start, start + this.pageSize);
  }

  openAssignRoleModal(role: Rol) {
    this.selectedRole = role;
    // abrir tu modal
  }

  loadRoles() {
    this.roleService.getAllApplicationsWithRoles().subscribe((apps) => {
      this.allApplicationsWithRoles = apps;
      this.filteredRoles = this.flattenRoles(apps);
    });
  }

  flattenRoles(apps: ApplicationWithRoles[]) {
    return apps.flatMap((app) =>
      (app.strRoles || []).map((role) => ({
        applicationName: app.strName,
        role,
      }))
    );
  }

  cancelEdit() {
    this.editing = false;
    this.roleSearchForm.reset();
  }

  setupSearchListener() {
    this.roleSearchForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(({ appName, roleName }) => {
        this.page = 1; // reset page
        this.flattenedRoles = this.flattenRoles(
          this.allApplicationsWithRoles
        ).filter(
          (item) =>
            (!appName ||
              item.applicationName
                .toLowerCase()
                .includes(appName.toLowerCase())) &&
            (!roleName ||
              item.role.strName.toLowerCase().includes(roleName.toLowerCase()))
        );
      });
  }

  confirmAssignRole() {
    if (!this.selectedRole || !this.userId) return;

    this.userService
      .assignRoleToUser(this.userId, this.selectedRole.id)
      .subscribe({
        next: () => {
          this.roleAssigned.emit();
        },
        error: () => alert('Error assigning role.'),
      });
  }

  searchRoles() {
    const { appName, roleName } = this.roleSearchForm.value;

    if (!appName) {
      return;
    }

    if (roleName) {
      this.roleService
        .getRoleByApplicationAndName(appName, roleName)
        .subscribe({
          next: (application) => {
            this.roles = (application.strRoles || []).map((role: Rol) => ({
              id: role.id,
              strName: role.strName,
              strDescription1: role.strDescription1,
              strDescription2: role.strDescription2,
              menuOptions: role.menuOptions,
            }));
          },
          error: () => {
            this.roles = [];
          },
        });
    } else {
      this.roleService.getRolesByApplicationName(appName).subscribe({
        next: (roleNames: string[]) => {
          this.roles = roleNames.map((roleName) => ({
            id: '',
            strName: roleName,
            strDescription1: '',
            strDescription2: '',
            menuOptions: [],
          }));
        },
        error: () => {
          this.roles = [];
        },
      });
    }
  }

  assignRole(role: Rol) {
    const targetUserId = this.createdUserId || this.userId;
    Swal.fire({
      title: 'Assign Role',
      html: `
        <p>Are you sure you want to assign the role <b>${role.strName}</b> to this user?</p>
        <p>Please type <b>Assign</b> to confirm.</p>
      `,
      input: 'text',
      inputPlaceholder: 'Type Assign here...',
      inputAttributes: {
        autocomplete: 'off',
      },
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      preConfirm: (inputValue: any) => {
        if (inputValue !== 'Assign') {
          Swal.showValidationMessage(
            'You must type "Assign" exactly to confirm.'
          );
          return false;
        }
        return true;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.assignRoleToUser(targetUserId, role.id).subscribe({
          next: () => {
            this.roleAssigned.emit({
              role,
              message: 'Role Assigned to User Successfully!',
              type: 'success',
              alertType: 'A',
              container: 1,
            });
          },
          error: () => alert('Error assigning role.'),
        });
      }
    });
  }

  onCancel() {
    this.close.emit();
  }
}
