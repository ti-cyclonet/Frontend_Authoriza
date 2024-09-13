import { Component, OnInit } from '@angular/core';
import { UserService } from '../../shared/services/user/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'], // Asegúrate de que `styleUrls` esté en plural
})
export class UsersComponent implements OnInit {
  users: any[] = [];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // Suscribirse al observable de usuarios para obtener los datos
    this.userService.users$.subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (e) => {
        console.log(e);
      },
    });

    // Cargar los usuarios desde el servicio
    this.userService.loadUsers();
  }
}
