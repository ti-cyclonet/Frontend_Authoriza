import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserDependenciesService } from '../../shared/services/user-dependencies/user-dependencies.service';
import { UserService } from '../../shared/services/user/user.service';

@Component({
  selector: 'app-user-dependencies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h2>Gestión de Dependencias de Usuarios</h2>
          
          <!-- Crear nueva dependencia -->
          <div class="card mb-4">
            <div class="card-header">
              <h5>Crear Nueva Dependencia</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-5">
                  <label>Usuario Principal:</label>
                  <select [(ngModel)]="selectedPrincipal" class="form-select">
                    <option value="">Seleccionar usuario principal</option>
                    <option *ngFor="let user of users" [value]="user.id">
                      {{user.strUserName}} - {{getUserDisplayName(user)}}
                    </option>
                  </select>
                </div>
                <div class="col-md-5">
                  <label>Usuario Dependiente:</label>
                  <select [(ngModel)]="selectedDependent" class="form-select">
                    <option value="">Seleccionar usuario dependiente</option>
                    <option *ngFor="let user of users" [value]="user.id">
                      {{user.strUserName}} - {{getUserDisplayName(user)}}
                    </option>
                  </select>
                </div>
                <div class="col-md-2">
                  <label>&nbsp;</label>
                  <button 
                    class="btn btn-primary d-block w-100" 
                    (click)="createDependency()"
                    [disabled]="!selectedPrincipal || !selectedDependent">
                    Crear Dependencia
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Lista de dependencias existentes -->
          <div class="card">
            <div class="card-header">
              <h5>Dependencias Existentes</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Usuario Principal</th>
                      <th>Usuario Dependiente</th>
                      <th>Estado</th>
                      <th>Fecha Creación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let dependency of dependencies">
                      <td>{{dependency.principalUser?.strUserName}}</td>
                      <td>{{dependency.dependentUser?.strUserName}}</td>
                      <td>
                        <span class="badge" 
                              [class]="dependency.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'">
                          {{dependency.status}}
                        </span>
                      </td>
                      <td>{{dependency.createdAt | date:'short'}}</td>
                      <td>
                        <button 
                          *ngIf="dependency.status === 'ACTIVE'"
                          class="btn btn-sm btn-warning me-2" 
                          (click)="deactivateDependency(dependency.id)">
                          Desactivar
                        </button>
                        <button 
                          class="btn btn-sm btn-danger" 
                          (click)="deleteDependency(dependency.id)">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    .table th {
      background-color: #f8f9fa;
    }
  `]
})
export class UserDependenciesComponent implements OnInit {
  users: any[] = [];
  dependencies: any[] = [];
  selectedPrincipal: string = '';
  selectedDependent: string = '';

  constructor(
    private userDependenciesService: UserDependenciesService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadDependencies();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => console.error('Error loading users:', error)
    });
  }

  loadDependencies() {
    this.userDependenciesService.getAllDependencies().subscribe({
      next: (dependencies) => {
        this.dependencies = dependencies;
      },
      error: (error) => console.error('Error loading dependencies:', error)
    });
  }

  getUserDisplayName(user: any): string {
    if (user.basicData?.strPersonType === 'N') {
      const natural = user.basicData.naturalPersonData;
      return `${natural?.firstName || ''} ${natural?.firstSurname || ''}`.trim();
    } else if (user.basicData?.strPersonType === 'J') {
      return user.basicData.legalEntityData?.businessName || '';
    }
    return '';
  }

  createDependency() {
    if (!this.selectedPrincipal || !this.selectedDependent) return;

    if (this.selectedPrincipal === this.selectedDependent) {
      alert('Un usuario no puede ser dependiente de sí mismo');
      return;
    }

    this.userDependenciesService.createDependency({
      principalUserId: this.selectedPrincipal,
      dependentUserId: this.selectedDependent
    }).subscribe({
      next: () => {
        this.selectedPrincipal = '';
        this.selectedDependent = '';
        this.loadDependencies();
        alert('Dependencia creada exitosamente');
      },
      error: (error) => {
        console.error('Error creating dependency:', error);
        alert('Error al crear la dependencia');
      }
    });
  }

  deactivateDependency(id: string) {
    this.userDependenciesService.deactivateDependency(id).subscribe({
      next: () => {
        this.loadDependencies();
        alert('Dependencia desactivada');
      },
      error: (error) => {
        console.error('Error deactivating dependency:', error);
        alert('Error al desactivar la dependencia');
      }
    });
  }

  deleteDependency(id: string) {
    if (confirm('¿Está seguro de eliminar esta dependencia?')) {
      this.userDependenciesService.deleteDependency(id).subscribe({
        next: () => {
          this.loadDependencies();
          alert('Dependencia eliminada');
        },
        error: (error) => {
          console.error('Error deleting dependency:', error);
          alert('Error al eliminar la dependencia');
        }
      });
    }
  }
}