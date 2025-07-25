import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { UserService } from '../../shared/services/user/user.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { User } from '../../shared/model/user';
import { AddUserModalComponent } from './add-user/add-user-modal.component';
import { NotificationsComponent } from '../../shared/components/notifications/notifications.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { AssignRoleComponent } from './assign-role/assign-role.component';
import { RolesService } from '../../shared/services/roles/roles.service';
import { ApplicationsService } from '../../shared/services/applications/applications.service';
import { forkJoin, map, switchMap } from 'rxjs';
import { Application } from '../../shared/model/application.model';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    RouterModule,
    AddUserModalComponent,
    NotificationsComponent,
    UserDetailsComponent,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  applications: Application[] = [];
  filteredUsers: User[] = [];
  pagedUsers: User[] = [];
  roleAppMap: { [roleName: string]: string } = {};
  selectedUser: any = null;
  editingUser: boolean = false;
  originalUser: any = null;
  dependentId: string = '';
  createdUserId: string = '';

  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 1;

  showAddUserModal = false;
  showAssignRoleModal = false;
  showUserDetailsModal = false;

  allowedStatuses: string[] = [
    'ACTIVE',
    'INACTIVE',
    'UNCONFIRMED',
    'EXPIRING',
    'SUSPENDED',
    'DELINQUENT',
  ];
  statusMenuMap: { [userId: string]: boolean } = {};
  showingMenuUser: User | null = null;

  @ViewChild('statusMenuContainer', { static: false })
  statusMenuRef!: ElementRef;

  // configuración notificaciones tipo toast
  toastTitle: string = '';
  toastType: 'success' | 'warning' | 'danger' | 'primary' = 'success';
  notifications: Array<{
    title: string;
    type: 'success' | 'warning' | 'danger' | 'primary';
    alertType: 'A' | 'B';
    container: 0 | 1;
    visible: boolean;
  }> = [];
  SWNTF: number = 0;
  // ----------------------------------------------

  constructor(
    private userService: UserService,
    private roleService: RolesService,
    private applicationsService: ApplicationsService,
    private cdr: ChangeDetectorRef
  ) {
    this.notifications = [];
  }

  ngOnInit(): void {
    this.loadUsersExcludingDependency();
    this.loadApplicationsAndRoles();
  }

  loadUsers() {
    this.userService.getUsers().subscribe((data) => {
      this.users = data;
      this.filteredUsers = data;
      this.totalPages = Math.ceil(
        this.filteredUsers.length / this.itemsPerPage
      );
      this.goToPage(1);
      this.cdr.detectChanges();
    });
  }

  loadApplicationsAndRoles(): void {
    this.applicationsService
      .loadApplications()
      .pipe(
        switchMap((apps: Application[]) => {
          const requests = apps.map((app) =>
            this.roleService
              .getRolesByApplicationName(app.strName)
              .pipe(map((roles: string[]) => ({ appName: app.strName, roles })))
          );
          return forkJoin(requests);
        })
      )
      .subscribe((results) => {
        this.roleAppMap = {};
        results.forEach(({ appName, roles }) => {
          roles.forEach((role) => {
            this.roleAppMap[role] = appName;
          });
        });
      });
  }

  getApplicationName(user: User): string {
    const roleName = user?.rol?.strName;
    return roleName && this.roleAppMap[roleName]
      ? this.roleAppMap[roleName]
      : '-';
  }

  mapRolesToApplications(): void {
    this.applicationsService
      .loadApplications()
      .pipe(
        switchMap((apps: any[]) => {
          const requests = apps.map((app) =>
            this.roleService
              .getRolesByApplicationName(app.name)
              .pipe(map((roles: string[]) => ({ appName: app.name, roles })))
          );
          return forkJoin(requests);
        })
      )
      .subscribe((results) => {
        results.forEach(({ appName, roles }) => {
          roles.forEach((role) => {
            this.roleAppMap[role] = appName;
          });
        });
      });
  }

  showUserDetails(user: any) {
    if (!user.id) return;

    this.userService.getUserById(user.id).subscribe({
      next: (fullUser) => {
        this.selectedUser = fullUser;
        this.showUserDetailsModal = true;
      },
      error: (err) => {
        console.error('Error fetching full user data:', err);
        this.showToast('Error loading user details.', 'danger', 'B', 0);
      },
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredUsers = this.users.filter(
      (user) =>
        user.strUserName?.toLowerCase().includes(term) ||
        user.rol?.strName?.toLowerCase().includes(term) ||
        user.basicData?.strPersonType?.toLowerCase().includes(term)
    );

    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.goToPage(1);
    this.cdr.markForCheck();
  }

  goToPage(page: number) {
    this.currentPage = page;

    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.pagedUsers = this.filteredUsers.slice(start, end);
  }

  onSearch() {
    this.applyFilter();
  }

  saveUserDetails() {
    this.userService.updateUser(this.selectedUser).subscribe({
      next: () => {
        this.showToast('User updated successfully!', 'success', 'A', 0);
        this.editingUser = false;
      },
      error: (err) => {
        this.showToast(
          'Error updating user: ' + (err.error?.message || 'Unknown'),
          'danger',
          'B',
          0
        );
      },
    });
  }

  getFullName(user: any): string {
    if (user.basicData?.strPersonType === 'N') {
      const names = [
        user.basicData?.naturalPersonData?.firstName,
        user.basicData?.naturalPersonData?.secondName,
        user.basicData?.naturalPersonData?.firstSurname,
      ].filter((value) => !!value);
      return names.join(' ');
    } else {
      return user.basicData?.legalEntityData?.businessName || '-';
    }
  }

  toggleStatusMenu(user: User): void {
    this.showingMenuUser = this.showingMenuUser === user ? null : user;
  }

  onChangeStatus(user: User, newStatus: string): void {
    if (!user.id) {
      this.showToast('User does not have a valid ID.', 'danger', 'B', 0);
      return;
    }
    user.strStatus = newStatus;
    this.showingMenuUser = null;

    this.userService.updateUserStatus(user.id, newStatus).subscribe({
      next: (updatedUser: User) => {
        user.strStatus = updatedUser.strStatus;
        (user as any).showStatusMenu = false;
        this.cdr.markForCheck();
        this.showToast(
          `Status changed to <b>${updatedUser.strStatus}</b> for <b>${updatedUser.strUserName} and depentents</b>.`,
          updatedUser.strStatus === 'ACTIVE' ? 'success' : 'warning',
          'A',
          0
        );
        this.loadUsersExcludingDependency();
      },
      error: (err) => {
        this.showToast(
          'Error updating user status: ' +
            (err.error?.message || 'Unknown error'),
          'danger',
          'B',
          0
        );
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (
      this.statusMenuRef &&
      !this.statusMenuRef.nativeElement.contains(target)
    ) {
      this.showingMenuUser = null;
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  filterByDependent() {
    if (this.dependentId.trim()) {
      this.userService
        .getUsersByDependentOnId(this.dependentId.trim())
        .subscribe((users) => {
          this.users = users;
          this.filteredUsers = users;
          this.currentPage = 1;
          this.updatePagination();
        });
    }
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  clearDependenceFilter() {
    this.dependentId = '';
    this.loadUsersExcludingDependency();
  }

  getAllUsers(): void {
    this.userService.getUsersExcludingDependency().subscribe(
      (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.currentPage = 1;
        this.updatePagination();
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );
  }

  startEditing() {
    this.originalUser = JSON.parse(JSON.stringify(this.selectedUser));
    this.editingUser = true;
  }

  cancelEditing() {
    if (this.originalUser) {
      this.selectedUser = JSON.parse(JSON.stringify(this.originalUser));
    }
    this.editingUser = false;
  }

  closeUserDetails() {
    if (this.editingUser && this.originalUser) {
      this.selectedUser = JSON.parse(JSON.stringify(this.originalUser));
    }
    this.editingUser = false;
    this.selectedUser = null;
    this.loadUsersExcludingDependency();

    this.showAddUserModal = false;
  }

  loadUsersExcludingDependency() {
    this.userService.getUsersExcludingDependency().subscribe({
      next: (users) => {
        const dependentMap: { [userId: string]: number } = {};

        users.forEach((user) => {
          const dependsOnId = user.dependentOn?.id;
          if (dependsOnId) {
            dependentMap[dependsOnId] = (dependentMap[dependsOnId] || 0) + 1;
          }
        });

        users.forEach((user) => {
          user.dependentCount = dependentMap[user.id] || 0;
        });

        this.users = users.sort((a, b) => {
          const dateA = a.dtmLatestUpdateDate
            ? new Date(a.dtmLatestUpdateDate).getTime()
            : 0;
          const dateB = b.dtmLatestUpdateDate
            ? new Date(b.dtmLatestUpdateDate).getTime()
            : 0;
          return dateB - dateA;
        });

        this.applyFilter();
      },
      error: (error) => {
        this.showToast('Error loading users', 'danger', 'B', 0);
      },
    });
  }

  openAddUserModal() {
    this.showAddUserModal = true;
  }

  onUserCreated(user: any) {
    this.createdUserId = user.id;
    this.loadUsersExcludingDependency();
  }

  refreshSelectedUser(): void {
    const userId = this.selectedUser?.id;
    if (!userId) return;

    this.userService.getUserById(userId).subscribe({
      next: (updatedUser) => {
        this.selectedUser = updatedUser;
      },
      error: (err) => {
        console.error('Error fetching user:', err);
      },
    });
  }

  // Funciones para NOTIFICACIONES
  addNotification(
    title: string,
    type: 'success' | 'warning' | 'danger' | 'primary',
    alertType: 'A' | 'B',
    container: 0 | 1
  ) {
    this.notifications.push({
      title,
      type,
      alertType,
      container,
      visible: true,
    });
  }

  removeNotification(index: number) {
    this.notifications.splice(index, 1);
  }

  getIconColor() {
    return 'var(--header-background-color)';
  }

  showToast(
    message: string,
    type: 'success' | 'warning' | 'danger' | 'primary',
    alertType: 'A' | 'B',
    container: 0 | 1
  ) {
    const notification = {
      title: message,
      type,
      alertType,
      container,
      visible: true,
    };
    this.notifications.push(notification);
    this.cdr.detectChanges();

    if (alertType === 'A') {
      setTimeout(() => {
        notification.visible = false;
        this.cdr.detectChanges();
      }, 5000);
    }
  }
  // ----------------------------------------------
}
