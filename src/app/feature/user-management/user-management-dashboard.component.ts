import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../shared/services/user/user.service';
import { UserDependenciesService } from '../../shared/services/user-dependencies/user-dependencies.service';
import { UserRolesService } from '../../shared/services/user-roles/user-roles.service';
import { ContractService } from '../../shared/services/contracts/contract.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { User } from '../../shared/model/user';
import { UserCreationWizardComponent } from './user-creation-wizard/user-creation-wizard.component';
import { DependencyManagementComponent } from './dependency-management/dependency-management.component';
import { UserEditModalComponent } from './user-edit-modal/user-edit-modal.component';
import Swal from 'sweetalert2';

interface ExtendedUser extends User {
  displayName: string;
  roles: any[];
  isPrincipal: boolean;
  dependentCount: number;
  avatar?: string;
  email?: string;
  hasContracts?: boolean;
}

@Component({
  selector: 'app-user-management-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    UserCreationWizardComponent,
    DependencyManagementComponent,
    UserEditModalComponent
  ],
  templateUrl: './user-management-dashboard.component.html',
  styleUrls: ['./user-management-dashboard.component.css']
})
export class UserManagementDashboardComponent implements OnInit {
  // Datos principales
  users: ExtendedUser[] = [];
  filteredUsers: ExtendedUser[] = [];
  pagedUsers: ExtendedUser[] = [];
  selectedUser: ExtendedUser | null = null;

  // Filtros y búsqueda
  searchTerm: string = '';
  selectedFilter: string = 'all';
  statusFilter: string = 'all';
  sortField: string = 'displayName';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  // Vista
  isGridView: boolean = false;
  isLoading: boolean = false;

  // Estadísticas
  totalUsers: number = 0;
  activeUsers: number = 0;
  principalUsers: number = 0;
  dependentUsers: number = 0;

  // Modales
  showCreateWizard: boolean = false;
  showDependencyModal: boolean = false;
  showEditModal: boolean = false;
  showViewModal: boolean = false;

  constructor(
    private userService: UserService,
    private userDependenciesService: UserDependenciesService,
    private userRolesService: UserRolesService,
    private contractService: ContractService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadViewPreference();
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    
    this.userService.getUsersExcludingDependency().subscribe({
      next: (users) => {
        this.processUsers(users);
        this.loadUserDependencies();
        this.loadUserContracts();
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  private processUsers(users: User[]): void {
    this.users = users.map(user => ({
      ...user,
      displayName: this.getUserDisplayName(user),
      roles: [],
      isPrincipal: true,
      dependentCount: 0,
      avatar: this.generateAvatar(user)
    }));
  }

  loadUserRoles(): void {
    this.userRolesService.getAllUserRoles().subscribe({
      next: (userRoles) => {
        this.users.forEach(user => {
          user.roles = userRoles
            .filter(ur => ur.userId === user.id && ur.status === 'ACTIVE')
            .map(ur => ur.role);
        });
        this.cdr.detectChanges();
      }
    });
  }

  loadUserDependencies(): void {
    this.userDependenciesService.getAllDependencies().subscribe({
      next: (dependencies) => {
        const dependentIds = new Set(dependencies.map(d => d.dependentUserId));
        const dependentCounts: { [key: string]: number } = {};
        
        dependencies.forEach(dep => {
          dependentCounts[dep.principalUserId] = (dependentCounts[dep.principalUserId] || 0) + 1;
        });

        this.users.forEach(user => {
          user.isPrincipal = !dependentIds.has(user.id);
          user.dependentCount = dependentCounts[user.id] || 0;
        });
        
        this.cdr.detectChanges();
      }
    });
  }

  loadUserContracts(): void {
    this.contractService.findAll(1, 1000).subscribe({
      next: (response: any) => {
        const usersWithContracts = new Set(
          response.data.map((c: any) => c.user.id)
        );
        
        this.users.forEach(user => {
          user.hasContracts = usersWithContracts.has(user.id);
        });
        
        this.cdr.detectChanges();
      },
      error: () => {
        this.users.forEach(user => {
          user.hasContracts = false;
        });
      }
    });
  }

  private calculateStats(): void {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.strStatus === 'ACTIVE').length;
    this.principalUsers = this.users.filter(u => u.isPrincipal).length;
    this.dependentUsers = this.totalUsers - this.principalUsers;
  }

  // Filtros y búsqueda
  onSearch(): void {
    this.applyFilters();
  }

  setFilter(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  setStatusFilter(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.users];

    // Filtro de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.displayName.toLowerCase().includes(term) ||
        user.strUserName.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.statusFilter === 'principals') {
      filtered = filtered.filter(u => u.hasContracts);
    } else if (this.statusFilter !== 'all') {
      filtered = filtered.filter(u => u.strStatus === this.statusFilter);
    }

    // Filtros por tipo
    switch (this.selectedFilter) {
      case 'principals':
        filtered = filtered.filter(u => u.isPrincipal);
        break;
      case 'dependents':
        filtered = filtered.filter(u => !u.isPrincipal);
        break;
      case 'active':
        filtered = filtered.filter(u => u.strStatus === 'ACTIVE');
        break;
      case 'inactive':
        filtered = filtered.filter(u => u.strStatus !== 'ACTIVE');
        break;
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      const aValue = this.getSortValue(a, this.sortField);
      const bValue = this.getSortValue(b, this.sortField);
      
      if (this.sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    this.filteredUsers = filtered;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePagedUsers();
  }

  private getSortValue(user: ExtendedUser, field: string): string {
    switch (field) {
      case 'displayName':
        return user.displayName;
      case 'username':
        return user.strUserName;
      case 'status':
        return user.strStatus;
      case 'lastUpdate':
        return user.dtmLatestUpdateDate || '';
      default:
        return '';
    }
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // Paginación
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedUsers();
    }
  }

  private updatePagedUsers(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.pagedUsers = this.filteredUsers.slice(start, end);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Vista
  toggleView(): void {
    this.isGridView = !this.isGridView;
    this.saveViewPreference();
  }

  private loadViewPreference(): void {
    const savedView = localStorage.getItem('userManagementView');
    if (savedView) {
      this.isGridView = savedView === 'grid';
    }
  }

  private saveViewPreference(): void {
    localStorage.setItem('userManagementView', this.isGridView ? 'grid' : 'list');
  }

  // Acciones de usuario
  viewUser(user: ExtendedUser): void {
    this.selectedUser = user;
    this.showViewModal = true;
  }

  editUser(user: ExtendedUser): void {
    this.selectedUser = user;
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  manageDependencies(user: ExtendedUser): void {
    this.selectedUser = user;
    this.showDependencyModal = true;
  }

  openCreateUserWizard(): void {
    this.showCreateWizard = true;
  }

  // Eventos de modales
  onWizardClose(): void {
    this.showCreateWizard = false;
  }

  onUserCreated(user: any): void {
    this.showCreateWizard = false;
    this.loadUsers(); // Recargar usuarios
  }

  onDependencyModalClose(): void {
    this.showDependencyModal = false;
    this.selectedUser = null;
  }

  onDependencyUpdated(): void {
    this.loadUserDependencies();
  }

  onEditModalClose(): void {
    this.showEditModal = false;
    this.selectedUser = null;
  }

  onViewModalClose(): void {
    this.showViewModal = false;
    this.selectedUser = null;
  }

  onUserUpdated(user: User): void {
    this.showEditModal = false;
    this.loadUsers(); // Recargar usuarios
  }

  async deleteUser(user: ExtendedUser): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      html: `¿Está seguro de eliminar a <strong>${user.displayName}</strong>?<br><small>Esta acción desactivará el usuario y sus dependencias.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (!result.isConfirmed) return;

    this.isLoading = true;

    try {
      await this.userService.deleteUser(user.id).toPromise();
      
      Swal.fire({
        icon: 'success',
        title: 'Usuario eliminado',
        text: `${user.displayName} ha sido eliminado correctamente`,
        timer: 2000,
        showConfirmButton: false
      });

      this.loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.error?.message || 'No se pudo eliminar el usuario',
        confirmButtonText: 'OK'
      });
    } finally {
      this.isLoading = false;
    }
  }

  // Utilidades
  getUserDisplayName(user: User): string {
    if (user.basicData?.strPersonType === 'N') {
      const natural = user.basicData.naturalPersonData;
      return `${natural?.firstName || ''} ${natural?.firstSurname || ''}`.trim();
    } else if (user.basicData?.strPersonType === 'J') {
      return user.basicData.legalEntityData?.businessName || user.strUserName;
    }
    return user.strUserName;
  }

  getUserAvatar(user: ExtendedUser): string {
    if (user.avatar) {
      return user.avatar;
    }
    // Generar avatar por defecto basado en iniciales
    return this.generateAvatar(user);
  }

  private generateAvatar(user: User): string {
    const name = this.getUserDisplayName(user);
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const color = colors[name.length % colors.length];
    
    // Crear SVG avatar
    const svg = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="${color}"/>
        <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  getUserTypeBadgeClass(user: ExtendedUser): string {
    return user.isPrincipal ? 'bg-primary' : 'bg-secondary';
  }

  getUserTypeLabel(user: ExtendedUser): string {
    return user.isPrincipal ? 'userManagement.types.principal' : 'userManagement.types.dependent';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'active';
      case 'DELETED':
        return 'deleted';
      case 'INACTIVE':
        return 'inactive';
      default:
        return 'inactive';
    }
  }

  getStatusDotClass(status: string): string {
    if (status === 'ACTIVE') return 'active';
    if (status === 'DELETED') return 'deleted';
    return 'inactive';
  }

  trackByUserId(index: number, user: ExtendedUser): string {
    return user.id;
  }
}