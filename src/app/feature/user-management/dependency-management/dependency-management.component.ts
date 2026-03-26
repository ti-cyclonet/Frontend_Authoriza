import { Component, OnInit, Input, Output, EventEmitter, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user/user.service';
import { UserDependenciesService } from '../../../shared/services/user-dependencies/user-dependencies.service';
import { UserRolesService } from '../../../shared/services/user-roles/user-roles.service';
import { RolesService } from '../../../shared/services/roles/roles.service';
import { ContractService } from '../../../shared/services/contracts/contract.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import Swal from 'sweetalert2';

interface ExtendedUser {
  id: string;
  strUserName: string;
  displayName: string;
  strStatus: string;
  isPrincipal: boolean;
  roles: any[];
  avatar?: string;
  dependencyStatus?: string;
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  roles: any[];
  contractDate?: Date;
  expirationDate?: Date;
}

interface Role {
  id: string;
  name: string;
  strName: string;
  description: string;
  applicationName: string;
  assignedDate?: Date;
}

@Component({
  selector: 'app-dependency-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './dependency-management.component.html',
  styleUrls: ['./dependency-management.component.css']
})
export class DependencyManagementComponent implements OnInit {
  @Input() user!: ExtendedUser;
  @Output() close = new EventEmitter<void>();
  @Output() dependencyUpdated = new EventEmitter<void>();

  activeTab: string = 'overview';
  isLoading: boolean = false;
  isSaving: boolean = false;

  // Datos del usuario
  userRoles: Role[] = [];
  contractedPackages: any[] = [];
  dependentUsers: ExtendedUser[] = [];
  principalUsers: ExtendedUser[] = [];
  principalPackages: Package[] = [];

  // Selección de contrato
  selectedContract: any | null = null;
  roleAvailability: Map<string, { total: number, assigned: number, available: number }> = new Map();

  // Modales
  showAssignRoleModal: boolean = false;
  showUnassignRoleModal: boolean = false;
  showContractPackageModal: boolean = false;
  showAddDependentModal: boolean = false;

  // Datos para asignación
  availableRoles: Role[] = [];
  availablePackages: Package[] = [];
  selectedRoleForAssignment: any | null = null;
  
  // Datos para dependientes
  availableUsers: ExtendedUser[] = [];
  filteredAvailableUsers: ExtendedUser[] = [];
  selectedUserForDependency: ExtendedUser | null = null;
  dependentSearchTerm: string = '';
  selectedDependencyStatus: string = 'ACTIVE';

  constructor(
    private userService: UserService,
    private userDependenciesService: UserDependenciesService,
    private userRolesService: UserRolesService,
    private rolesService: RolesService,
    private contractService: ContractService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  private async loadUserData(): Promise<void> {
    this.isLoading = true;
    
    try {
      await this.loadUserRoles();
      await this.loadContractedPackages();
      await this.loadDependentUsers();
      await this.loadUserDependencies();
      await this.loadAvailableUsers();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadUserRoles(): Promise<void> {
    try {
      const userRoles = await this.userRolesService.getUserRoles(this.user.id).toPromise();
      this.userRoles = userRoles?.filter(ur => ur.status === 'ACTIVE').map(ur => ({
        ...ur.role,
        assignedDate: ur.createdAt
      })) || [];
    } catch (error) {
      console.error('Error loading user roles:', error);
      this.userRoles = [];
    }
    this.cdr.detectChanges();
  }

  private async loadUserDependencies(): Promise<void> {
    try {
      const dependencies = await this.userDependenciesService.getPrincipalsByDependent(this.user.id).toPromise();
      this.principalUsers = [];
      
      if (dependencies && dependencies.length > 0) {
        for (const dep of dependencies) {
          try {
            const user = await this.userService.getUserById(dep.principalUserId).toPromise();
            if (user) {
              // Obtener contratos del principal
              const principalContracts = await this.contractService.getContractsByUser(dep.principalUserId).toPromise();
              const principalContractIds = principalContracts?.map(c => c.id) || [];
              
              // Cargar roles asignados desde contratos de este principal
              const userRolesFromPrincipal = await this.userRolesService.getUserRoles(this.user.id).toPromise();
              const rolesFromThisPrincipal = userRolesFromPrincipal?.filter(ur => 
                ur.status === 'ACTIVE' && ur.contractId && principalContractIds.includes(ur.contractId)
              ).map(ur => ur.role) || [];
              
              this.principalUsers.push({
                ...user,
                displayName: this.getUserDisplayName(user),
                roles: rolesFromThisPrincipal,
                isPrincipal: true,
                dependencyStatus: dep.status
              });
            }
          } catch (userError) {
            console.error('Error loading principal user:', userError);
          }
        }
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading user dependencies:', error);
    }
  }

  private async loadContractedPackages(): Promise<void> {
    try {
      const contracts = await this.contractService.getContractsByUser(this.user.id).toPromise();
      this.contractedPackages = contracts || [];
    } catch (error) {
      console.error('Error loading contracted packages:', error);
      this.contractedPackages = [];
    }
    this.cdr.detectChanges();
  }

  private async loadDependentUsers(): Promise<void> {
    try {
      const dependencies = await this.userDependenciesService.getDependentsByPrincipal(this.user.id).toPromise();
      this.dependentUsers = [];
      
      if (dependencies && dependencies.length > 0) {
        for (const dep of dependencies) {
          try {
            const user = await this.userService.getUserById(dep.dependentUserId).toPromise();
            if (user) {
              const userRoles = await this.userRolesService.getUserRoles(dep.dependentUserId).toPromise();
              const roles = userRoles?.filter(ur => ur.status === 'ACTIVE').map(ur => ur.role) || [];
              
              this.dependentUsers.push({
                ...user,
                displayName: this.getUserDisplayName(user),
                roles: roles,
                isPrincipal: false,
                dependencyStatus: dep.status
              });
            }
          } catch (userError) {
            console.error('Error loading dependent user:', userError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading dependent users:', error);
      this.dependentUsers = [];
    }
  }

  private async loadPrincipalPackages(): Promise<void> {
    // No implementado
  }

  // Navegación de tabs
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Gestión de roles
  async selectContract(contract: any): Promise<void> {
    this.selectedContract = contract;
    await this.loadRoleAvailability();
    this.cdr.detectChanges();
  }

  async loadRoleAvailability(): Promise<void> {
    if (!this.selectedContract) return;
    
    try {
      const availability = await this.userRolesService.getRoleAvailability(this.selectedContract.id).toPromise();
      this.roleAvailability.clear();
      availability?.forEach(item => {
        this.roleAvailability.set(item.role.id, {
          total: item.total,
          assigned: item.assigned,
          available: item.available
        });
      });
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading role availability:', error);
    }
  }

  getAvailableRoles(): Role[] {
    if (!this.selectedContract) return [];
    
    const availableRoles: Role[] = [];
    this.selectedContract.package?.configurations?.forEach((config: any) => {
      const availability = this.roleAvailability.get(config.rol.id);
      if (availability && availability.available > 0) {
        if (!this.userRoles.some(ur => ur.id === config.rol.id)) {
          availableRoles.push(config.rol);
        }
      }
    });
    return availableRoles;
  }

  selectRoleForAssignment(role: Role): void {
    this.selectedRoleForAssignment = role;
  }

  openAssignRoleModal(role: any): void {
    this.selectedRoleForAssignment = role;
    this.showAssignRoleModal = true;
  }

  openUnassignRoleModal(role: any): void {
    this.selectedRoleForAssignment = role;
    this.showUnassignRoleModal = true;
  }

  async assignRoleToDependent(dependent: ExtendedUser): Promise<void> {
    if (!this.selectedRoleForAssignment || !this.selectedContract) return;

    const result = await Swal.fire({
      title: '¿Confirmar asignación?',
      html: `¿Desea asignar el rol <strong>${this.selectedRoleForAssignment.strName}</strong> al usuario <strong>${dependent.displayName}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await this.userRolesService.assignRole({
        userId: dependent.id,
        roleId: this.selectedRoleForAssignment.id,
        contractId: this.selectedContract.id,
        status: 'ACTIVE'
      }).toPromise();

      this.showAssignRoleModal = false;
      this.selectedRoleForAssignment = null;
      await this.loadUserRoles();
      await this.loadRoleAvailability();
      this.dependencyUpdated.emit();
      this.cdr.detectChanges();

      Swal.fire({
        icon: 'success',
        title: 'Rol asignado',
        text: `El rol se asignó correctamente a ${dependent.displayName}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('Error assigning role:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.error?.message || 'Error al asignar el rol',
        confirmButtonText: 'OK'
      });
    }
  }

  async unassignRoleFromDependent(dependent: ExtendedUser): Promise<void> {
    if (!this.selectedRoleForAssignment) return;

    const result = await Swal.fire({
      title: '¿Confirmar desasignación?',
      html: `¿Desea desasignar el rol <strong>${this.selectedRoleForAssignment.strName}</strong> del usuario <strong>${dependent.displayName}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await this.userRolesService.removeRole(dependent.id, this.selectedRoleForAssignment.id).toPromise();

      this.showUnassignRoleModal = false;
      this.selectedRoleForAssignment = null;
      await this.loadDependentUsers();
      await this.loadRoleAvailability();
      this.dependencyUpdated.emit();
      this.cdr.detectChanges();

      Swal.fire({
        icon: 'success',
        title: 'Rol desasignado',
        text: `El rol se desasignó correctamente de ${dependent.displayName}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('Error unassigning role:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.error?.message || 'Error al desasignar el rol',
        confirmButtonText: 'OK'
      });
    }
  }

  async assignSelectedRole(): Promise<void> {
    if (!this.selectedRoleForAssignment || !this.selectedContract) return;

    try {
      await this.userRolesService.assignRole({
        userId: this.user.id,
        roleId: this.selectedRoleForAssignment.id,
        contractId: this.selectedContract.id,
        status: 'ACTIVE'
      }).toPromise();

      this.showAssignRoleModal = false;
      this.selectedRoleForAssignment = null;
      await this.loadUserRoles();
      await this.loadRoleAvailability();
      this.dependencyUpdated.emit();
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  }

  async removeRole(role: Role): Promise<void> {
    try {
      await this.userRolesService.removeRole(this.user.id, role.id).toPromise();
      await this.loadUserRoles();
      this.dependencyUpdated.emit();
    } catch (error) {
      console.error('Error removing role:', error);
    }
  }

  // Gestión de paquetes
  async renewPackage(pkg: any): Promise<void> {
    // No implementado
  }

  async cancelPackage(pkg: any): Promise<void> {
    // No implementado
  }

  // Gestión de dependientes
  private async loadAvailableUsers(): Promise<void> {
    try {
      const allUsers = await this.userService.getUsers().toPromise();
      this.availableUsers = [];
      this.filteredAvailableUsers = [];
      
      if (allUsers && allUsers.length > 0) {
        const currentDependentIds = this.dependentUsers.map(d => d.id);
        
        this.availableUsers = allUsers
          .filter(user => {
            return user.id !== this.user.id && 
                   !currentDependentIds.includes(user.id) &&
                   (user.strStatus === 'ACTIVE' || user.strStatus === 'UNCONFIRMED');
          })
          .map(user => ({
            id: user.id,
            strUserName: user.strUserName,
            strStatus: user.strStatus,
            displayName: this.getUserDisplayName(user),
            roles: [],
            isPrincipal: true
          }));
        
        this.filteredAvailableUsers = [...this.availableUsers];
      }
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading available users:', error);
      this.availableUsers = [];
      this.filteredAvailableUsers = [];
    }
  }

  searchAvailableUsers(): void {
    if (!this.dependentSearchTerm.trim()) {
      this.filteredAvailableUsers = [...this.availableUsers];
      return;
    }
    
    const term = this.dependentSearchTerm.toLowerCase();
    this.filteredAvailableUsers = this.availableUsers.filter(user =>
      user.displayName.toLowerCase().includes(term) ||
      user.strUserName.toLowerCase().includes(term)
    );
  }

  selectUserForDependency(user: ExtendedUser): void {
    this.selectedUserForDependency = user;
  }

  async addSelectedDependent(): Promise<void> {
    if (!this.selectedUserForDependency) return;

    try {
      await this.userDependenciesService.createDependency({
        principalUserId: this.user.id,
        dependentUserId: this.selectedUserForDependency.id,
        status: this.selectedDependencyStatus
      }).toPromise();
      
      this.dependentUsers.push({
        ...this.selectedUserForDependency,
        isPrincipal: false
      });
      
      this.availableUsers = this.availableUsers.filter(u => u.id !== this.selectedUserForDependency!.id);
      this.filteredAvailableUsers = [...this.availableUsers];
      
      this.selectedUserForDependency = null;
      this.selectedDependencyStatus = 'ACTIVE';
      
      this.dependencyUpdated.emit();
      this.cdr.detectChanges();
      
      Swal.fire({
        title: 'Éxito',
        text: 'Usuario asignado como dependiente exitosamente',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
    } catch (error) {
      console.error('Error creating dependency:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al crear la dependencia.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }

  manageDependentRoles(dependent: ExtendedUser): void {
    // No implementado
  }

  assignUserAsDependent(user: ExtendedUser): void {
    this.selectedUserForDependency = user;
    this.addSelectedDependent();
  }

  async removeDependency(dependent: ExtendedUser): Promise<void> {
    try {
      const dependencies = await this.userDependenciesService.getDependentsByPrincipal(this.user.id).toPromise();
      const dependency = dependencies?.find(d => d.dependentUserId === dependent.id);
      if (dependency) {
        await this.userDependenciesService.deleteDependency(dependency.id).toPromise();
      }
      await this.loadDependentUsers();
      await this.loadAvailableUsers();
      this.dependencyUpdated.emit();
    } catch (error) {
      console.error('Error removing dependency:', error);
    }
  }

  // Utilidades
  getUserDisplayName(user: any): string {
    if (user.basicData?.strPersonType === 'N') {
      const natural = user.basicData.naturalPersonData;
      return `${natural?.firstName || ''} ${natural?.firstSurname || ''}`.trim();
    } else if (user.basicData?.strPersonType === 'J') {
      return user.basicData.legalEntityData?.businessName || user.strUserName;
    }
    return user.strUserName;
  }

  getUserAvatar(): string {
    return this.generateAvatar(this.user);
  }

  getPrincipalAvatar(): string {
    return this.principalUsers.length > 0 ? this.generateAvatar(this.principalUsers[0]) : '';
  }

  getDependentAvatar(dependent: ExtendedUser): string {
    return this.generateAvatar(dependent);
  }

  private generateAvatar(user: any): string {
    const name = this.getUserDisplayName(user);
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const color = colors[name.length % colors.length];
    
    const svg = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="${color}"/>
        <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  getRoleIcon(roleName: string): string {
    const iconMap: { [key: string]: string } = {
      'admin': 'shield-check',
      'user': 'person',
      'manager': 'person-badge',
      'viewer': 'eye',
      'editor': 'pencil',
      'operator': 'gear',
      'supervisor': 'binoculars',
      'default': 'shield'
    };
    
    const lowerRoleName = roleName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerRoleName.includes(key)) {
        return icon;
      }
    }
    return iconMap['default'];
  }

  getStatusIcon(): string {
    switch (this.user.strStatus) {
      case 'ACTIVE':
        return 'check-circle-fill';
      case 'INACTIVE':
        return 'x-circle-fill';
      case 'SUSPENDED':
        return 'pause-circle-fill';
      case 'EXPIRING':
        return 'exclamation-triangle-fill';
      default:
        return 'question-circle-fill';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'active';
      case 'INACTIVE':
        return 'inactive';
      default:
        return 'inactive';
    }
  }

  // Eventos del modal
  async saveChanges(): Promise<void> {
    this.isSaving = true;
    
    try {
      // Implementar lógica de guardado si es necesario
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular guardado
      this.dependencyUpdated.emit();
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      this.isSaving = false;
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (!this.showAssignRoleModal && !this.showUnassignRoleModal && !this.showContractPackageModal && !this.showAddDependentModal) {
      this.closeModal();
    }
  }

  getTotalAssignedRolesToDependents(): number {
    return this.dependentUsers.reduce((total, dependent) => total + (dependent.roles?.length || 0), 0);
  }
}