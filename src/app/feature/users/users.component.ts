import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManagementDashboardComponent } from '../user-management/user-management-dashboard.component';

interface UserWithRoles {
  id: string;
  strUserName: string;
  displayName: string;
  strStatus: string;
  isPrincipal: boolean;
  roles: any[];
  availableRoles: any[];
}
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    UserManagementDashboardComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent {
  constructor() {}
}
