import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UserService } from '../../shared/services/user/user.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { User } from '../../shared/model/user';
import { AddUserModalComponent } from './add-user/add-user-modal.component';
import { NotificationsComponent } from '../../shared/components/notifications/notifications.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { AssignRoleComponent } from './assign-role/assign-role.component';
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
    AssignRoleComponent,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  pagedUsers: User[] = [];
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
    private cdr: ChangeDetectorRef
  ) {
    this.notifications = [];
  }

  ngOnInit(): void {
    this.loadUsersExcludingDependency();
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

  showUserDetails(user: any) {
    this.selectedUser = user;
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

  onToggleStatus(user: User) {
    if (!user.id) {
      this.showToast('User does not have a valid ID.', 'danger', 'B', 0);
      return;
    }

    this.userService.toggleUserStatus(user.id).subscribe({
      next: (updatedUser: User) => {
        user.strStatus = updatedUser.strStatus;
        this.cdr.markForCheck();
        this.showToast(
          `The status of the user <b>${updatedUser.strUserName}</b> changed to <b>${updatedUser.strStatus}</b>`,
          updatedUser.strStatus === 'ACTIVE' ? 'success' : 'danger',
          'A',
          0
        );
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
    this.getAllUsers();
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
  }

  loadUsersExcludingDependency() {
    this.userService.getUsersExcludingDependency().subscribe({
      next: (users) => {
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
    this.loadUsers();

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
