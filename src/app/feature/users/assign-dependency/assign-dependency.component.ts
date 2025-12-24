import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user/user.service';
import Swal from 'sweetalert2';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-assign-dependency',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
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

  constructor(private userService: UserService, private translationService: TranslationService) {}

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
      title: this.translationService.translate('users.assignDependency.confirmTitle'),
      html: `
      <p>${this.translationService.translate('users.assignDependency.confirmText').replace('{username}', user.strUserName)}</p>
      <p>${this.translationService.translate('users.assignDependency.typeAssign')}</p>
    `,
      input: 'text',
      inputPlaceholder: this.translationService.translate('users.assignDependency.placeholder'),
      inputAttributes: {
        autocomplete: 'off',
      },
      showCancelButton: true,
      confirmButtonText: this.translationService.translate('users.assignDependency.confirm'),
      cancelButtonText: this.translationService.translate('common.cancel'),
      preConfirm: (inputValue: any) => {
        const expectedText = this.translationService.getCurrentLanguage() === 'es' ? 'Asignar' : 'Assign';
        if (inputValue !== expectedText) {
          Swal.showValidationMessage(
            this.translationService.translate('users.assignDependency.mustType')
          );
          return false;
        }
        return true;
      },
    });

    if (result.isConfirmed) {
      this.userService.assignDependency(this.currentUser, user.id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: this.translationService.translate('users.assignDependency.successTitle'),
            showConfirmButton: false,
            timer: 2000,
          });

          this.dependencyAssigned.emit(user);
          this.closeModal();
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: this.translationService.translate('users.assignDependency.errorTitle'),
            text: this.translationService.translate('users.assignDependency.errorText'),
          });
        },
      });
    }
  }

  closeModal() {
    this.modalClosed.emit();
  }
}
