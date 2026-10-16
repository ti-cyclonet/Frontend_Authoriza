import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { UserDependenciesService } from '../../shared/services/user-dependencies/user-dependencies.service';
import { UserService } from '../../shared/services/user/user.service';

@Component({
  selector: 'app-user-dependencies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="title-container">
      <a routerLink="/user-dependencies" class="title-link">
        <svg viewBox="0 0 16 16"><use xlink:href="./assets/icons/bootstrap-icons.svg#diagram-3-fill" /></svg>
        /user-dependencies
      </a>
    </div>

    <div class="card shadow m-3">
      <div class="card-body">
        <div class="az-page-header">
          <div>
            <h3 class="az-page-title">Dependencias de usuarios</h3>
            <p class="az-page-subtitle">Quién depende de quién: el principal administra a sus dependientes y puede autorizarlos a firmar.</p>
          </div>
        </div>

        <!-- Nueva dependencia -->
        <div class="dep-create">
          <div class="dep-field">
            <label class="form-label" for="dep-principal">Usuario principal</label>
            <select id="dep-principal" [(ngModel)]="selectedPrincipal" class="form-select">
              <option value="">Selecciona el principal</option>
              <option *ngFor="let user of users" [value]="user.id">{{ optionLabel(user) }}</option>
            </select>
          </div>
          <svg class="dep-arrow" viewBox="0 0 16 16" aria-hidden="true"><use xlink:href="./assets/icons/bootstrap-icons.svg#arrow-right" /></svg>
          <div class="dep-field">
            <label class="form-label" for="dep-dependent">Usuario dependiente</label>
            <select id="dep-dependent" [(ngModel)]="selectedDependent" class="form-select">
              <option value="">Selecciona el dependiente</option>
              <option *ngFor="let user of users" [value]="user.id" [disabled]="user.id === selectedPrincipal">{{ optionLabel(user) }}</option>
            </select>
          </div>
          <button class="btn btn-primary dep-submit" (click)="createDependency()" [disabled]="!selectedPrincipal || !selectedDependent || creating">
            <svg viewBox="0 0 16 16" aria-hidden="true"><use xlink:href="./assets/icons/bootstrap-icons.svg#link-45deg" /></svg>
            {{ creating ? 'Creando…' : 'Crear dependencia' }}
          </button>
        </div>
      </div>

      <div class="dep-toolbar">
        <strong>{{ filtered.length }} {{ filtered.length === 1 ? 'dependencia' : 'dependencias' }}</strong>
        <div class="dep-search">
          <svg viewBox="0 0 16 16" aria-hidden="true"><use xlink:href="./assets/icons/bootstrap-icons.svg#search" /></svg>
          <input class="form-control form-control-sm" type="search" [(ngModel)]="search" placeholder="Buscar por nombre o correo" aria-label="Buscar dependencias">
        </div>
      </div>

      <div class="table-responsive dep-table">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Principal</th>
              <th>Dependiente</th>
              <th class="text-center">Estado</th>
              <th class="d-none d-md-table-cell">Creada</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let dependency of filtered">
              <td>
                <div class="dep-person">
                  <span class="dep-avatar">{{ initials(dependency.principalUser) }}</span>
                  <span><strong>{{ nameOf(dependency.principalUser) }}</strong><small>{{ dependency.principalUser?.strUserName }}</small></span>
                </div>
              </td>
              <td>
                <div class="dep-person">
                  <span class="dep-avatar alt">{{ initials(dependency.dependentUser) }}</span>
                  <span>
                    <strong>{{ nameOf(dependency.dependentUser) }} <span class="az-chip" *ngIf="dependency.isAuthorizedSigner">Firmante</span></strong>
                    <small>{{ dependency.dependentUser?.strUserName }}</small>
                  </span>
                </div>
              </td>
              <td class="text-center">
                <span class="az-status" [class.ok]="dependency.status === 'ACTIVE'" [class.off]="dependency.status !== 'ACTIVE'">
                  {{ dependency.status === 'ACTIVE' ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="d-none d-md-table-cell text-nowrap">{{ fmtDate(dependency.createdAt) }}</td>
              <td class="text-end">
                <span class="az-actions">
                  <button *ngIf="dependency.status === 'ACTIVE'" class="az-icon-btn" (click)="deactivateDependency(dependency)" title="Desactivar" aria-label="Desactivar dependencia">
                    <svg viewBox="0 0 16 16"><use xlink:href="./assets/icons/bootstrap-icons.svg#pause-circle" /></svg>
                  </button>
                  <button class="az-icon-btn danger" (click)="deleteDependency(dependency)" title="Eliminar" aria-label="Eliminar dependencia">
                    <svg viewBox="0 0 16 16"><use xlink:href="./assets/icons/bootstrap-icons.svg#trash" /></svg>
                  </button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="az-empty" *ngIf="!filtered.length">
          <svg viewBox="0 0 16 16" aria-hidden="true"><use xlink:href="./assets/icons/bootstrap-icons.svg#diagram-3" /></svg>
          <strong>{{ search ? 'Sin resultados' : 'Aún no hay dependencias' }}</strong>
          {{ search ? 'Prueba con otro nombre o correo.' : 'Crea la primera con el formulario de arriba.' }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .title-container { display: flex; align-items: center; }
    .title-link { display: inline-flex; align-items: center; }
    .dep-create { display: grid; grid-template-columns: 1fr auto 1fr auto; gap: 0.75rem; align-items: end; margin-top: 1.25rem; padding: 1rem; border-radius: 14px; background: var(--az-soft, #f7f5fc); }
    .dep-field { min-width: 0; }
    .dep-arrow { width: 18px; height: 18px; fill: #b7aed0; margin-bottom: 0.75rem; }
    .dep-submit { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 42px; white-space: nowrap; }
    .dep-submit svg { width: 18px; height: 18px; fill: currentColor; }
    .dep-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; padding: 0.75rem 1.25rem; border-top: 1px solid var(--az-line, #e6e3ef); background: #fcfbfe; }
    .dep-toolbar strong { font-size: 0.86rem; color: var(--az-ink, #0f1d3a); }
    .dep-search { position: relative; width: min(320px, 100%); }
    .dep-search svg { position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; fill: #9aa3b2; }
    .dep-search input { padding-left: 2rem; }
    .dep-table { margin: 0; border-radius: 0 0 14px 14px !important; }
    .dep-person { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
    .dep-person > span:last-child { display: flex; flex-direction: column; min-width: 0; }
    .dep-person strong { color: var(--az-ink, #0f1d3a); font-size: 0.86rem; }
    .dep-person small { color: var(--az-muted, #64748b); font-size: 0.76rem; overflow: hidden; text-overflow: ellipsis; }
    .dep-avatar { flex: 0 0 auto; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 0.72rem; font-weight: 700; color: #fff; background: linear-gradient(135deg, #8b5cf6, #6600cc); }
    .dep-avatar.alt { background: linear-gradient(135deg, #38bdf8, #2563eb); }
    @media (max-width: 767.98px) {
      .dep-create { grid-template-columns: 1fr; }
      .dep-arrow { display: none; }
    }
  `],
})
export class UserDependenciesComponent implements OnInit {
  users: any[] = [];
  dependencies: any[] = [];
  selectedPrincipal: string = '';
  selectedDependent: string = '';
  search = '';
  creating = false;

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

  /** Dependencias que coinciden con la búsqueda (nombre o correo de cualquiera de los dos). */
  get filtered(): any[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.dependencies;
    return this.dependencies.filter((d) =>
      [d.principalUser, d.dependentUser].some((u) =>
        `${this.nameOf(u)} ${u?.strUserName || ''}`.toLowerCase().includes(q)));
  }

  getUserDisplayName(user: any): string {
    if (user?.basicData?.strPersonType === 'N') {
      const natural = user.basicData.naturalPersonData;
      return `${natural?.firstName || ''} ${natural?.firstSurname || ''}`.trim();
    } else if (user?.basicData?.strPersonType === 'J') {
      return user.basicData.legalEntityData?.businessName || '';
    }
    return '';
  }

  /** Nombre para mostrar (o el correo si no tiene datos básicos). */
  nameOf(user: any): string {
    return this.getUserDisplayName(user) || user?.displayName || user?.strUserName || '—';
  }

  initials(user: any): string {
    const parts = this.nameOf(user).replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
  }

  /** "16 oct 2026, 10:16 a. m." */
  fmtDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  optionLabel(user: any): string {
    const name = this.getUserDisplayName(user);
    return name ? `${name} · ${user.strUserName}` : user.strUserName;
  }

  createDependency() {
    if (!this.selectedPrincipal || !this.selectedDependent) return;

    if (this.selectedPrincipal === this.selectedDependent) {
      Swal.fire({ icon: 'warning', title: 'No es posible', text: 'Un usuario no puede ser dependiente de sí mismo.' });
      return;
    }

    this.creating = true;
    this.userDependenciesService.createDependency({
      principalUserId: this.selectedPrincipal,
      dependentUserId: this.selectedDependent
    }).subscribe({
      next: () => {
        this.creating = false;
        this.selectedPrincipal = '';
        this.selectedDependent = '';
        this.loadDependencies();
        Swal.fire({ icon: 'success', title: 'Dependencia creada', timer: 1600, showConfirmButton: false, toast: true, position: 'top-end' });
      },
      error: (error) => {
        this.creating = false;
        console.error('Error creating dependency:', error);
        Swal.fire({ icon: 'error', title: 'No se pudo crear', text: error?.error?.message || 'Error al crear la dependencia.' });
      }
    });
  }

  deactivateDependency(dependency: any) {
    this.userDependenciesService.deactivateDependency(dependency.id).subscribe({
      next: () => {
        this.loadDependencies();
        Swal.fire({ icon: 'success', title: 'Dependencia desactivada', timer: 1600, showConfirmButton: false, toast: true, position: 'top-end' });
      },
      error: (error) => {
        console.error('Error deactivating dependency:', error);
        Swal.fire({ icon: 'error', title: 'No se pudo desactivar', text: error?.error?.message || 'Error al desactivar la dependencia.' });
      }
    });
  }

  deleteDependency(dependency: any) {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar la dependencia?',
      text: `${this.nameOf(dependency.dependentUser)} dejará de depender de ${this.nameOf(dependency.principalUser)}.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b91c1c',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.userDependenciesService.deleteDependency(dependency.id).subscribe({
        next: () => {
          this.loadDependencies();
          Swal.fire({ icon: 'success', title: 'Dependencia eliminada', timer: 1600, showConfirmButton: false, toast: true, position: 'top-end' });
        },
        error: (error) => {
          console.error('Error deleting dependency:', error);
          Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: error?.error?.message || 'Error al eliminar la dependencia.' });
        }
      });
    });
  }
}
