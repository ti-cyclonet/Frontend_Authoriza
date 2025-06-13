import { Component, OnInit } from '@angular/core';
import { UserService } from '../../shared/services/user/user.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  pagedUsers: any[] = [];

  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 1;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe((data) => {
      this.users = data;
      this.applyFilter(); // Aplica filtro y paginación automáticamente
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredUsers = this.users.filter((user) =>
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
}
