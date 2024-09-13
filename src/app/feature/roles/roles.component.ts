import { Component, OnInit } from '@angular/core';
import { RolesService } from '../../shared/services/roles/roles.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  roles: any[] = [];

  constructor(private rolesService: RolesService) {}

  ngOnInit(): void {
    // Suscribirse a los roles cargados en el servicio
    this.rolesService.roles$.subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (e) => {
        console.log(e);
      },
    });
  }

  getApplicationName(applicationId: number): string {
    switch (applicationId) {
      case 1:
        return 'AUTHORIZA';
      case 2:
        return 'SHOTRA';
      case 3:
        return 'INOUT';
      case 4:
        return 'MAGENTA';
      case 5:
        return 'FINANCIAL AID';
      default:
        return 'UNKNOWN'; // En caso de que no haya coincidencia
    }
  }
}
