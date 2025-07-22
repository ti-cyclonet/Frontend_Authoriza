import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-assign-dependency',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-dependency.component.html',
  styleUrls: ['./assign-dependency.component.scss'],
})
export class AssignDependencyComponent implements OnInit {
  @Input() currentUser: any = null;
  @Output() dependencyAssigned = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  searchTerm = '';
  usersFullList: any[] = [];
  filteredUsers: any[] = [];

  page = 1;
  pageSize = 6;
  totalPages = 0;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsersOnce();
  }

  loadUsersOnce() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.usersFullList = users;
        this.applyFilter();
      },
      error: () => console.error('Error loading users'),
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredUsers = this.usersFullList.filter((user) => {
      const userName = user?.strUserName?.toLowerCase() || '';
      const personType = user?.basicData?.strPersonType;

      const naturalName =
        personType === 'N'
          ? [
              user?.basicData?.naturalPersonData?.firstName,
              user?.basicData?.naturalPersonData?.secondName,
              user?.basicData?.naturalPersonData?.firstSurname,
              user?.basicData?.naturalPersonData?.secondSurname,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
          : '';

      const businessName =
        personType === 'J'
          ? user?.basicData?.legalEntityData?.businessName?.toLowerCase() || ''
          : '';

      return (
        userName.includes(term) ||
        naturalName.includes(term) ||
        businessName.includes(term)
      );
    });

    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.page = 1;
  }

  get pagedUsers() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  async selectDependency(user: any) {
    const result = await Swal.fire({
      title: 'Assign Dependency',
      html: `
        <p>Are you sure you want to assign <b>${user.strUserName}</b> as the dependency?</p>
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
    });

    if (result.isConfirmed) {
      this.dependencyAssigned.emit(user);
      this.closeModal();
    }
  }

  closeModal() {
    this.modalClosed.emit();
  }
}
