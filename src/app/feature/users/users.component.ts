import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UserService } from '../../shared/services/user/user.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationsComponent } from '../../shared/components/notifications/notifications.component';
import { User } from '../../shared/model/user';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    RouterModule,
    NotificationsComponent,
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
  dependentId: string = '';

  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 1;

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
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.notifications = [];
  }

  loadUsers() {
    this.userService.getUsers().subscribe((data) => {
      this.users = data;
      this.applyFilter();
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
    this.userService.toggleUserStatus(user.id).subscribe({
      next: (updatedUser: User) => {
        user.strStatus = updatedUser.strStatus;
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
    this.userService.getAllUsers().subscribe(
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
