import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Rol } from '../../../shared/model/rol';
import { AssignRoleComponent } from '../assign-role/assign-role.component';
import { NotificationsComponent } from '../../../shared/components/notifications/notifications.component';
import { AssignDependencyComponent } from '../assign-dependency/assign-dependency.component';
import { UserService } from '../../../shared/services/user/user.service';
import Swal from 'sweetalert2';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AssignRoleComponent,
    NotificationsComponent,
    AssignDependencyComponent,
    TranslatePipe,
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
})
export class UserDetailsComponent implements OnChanges {
  private baseApiUrl = environment.apiBaseUrl;
  private roleUrl = this.baseApiUrl + '/api/roles';

  @Input() user: any;
  @Input() usersList: any[] = [];
  @Output() cancel = new EventEmitter<void>();
  @Output() userUpdated = new EventEmitter<void>();

  originalUser: any;
  activeTab = 'BasicData';
  editingUser = false;
  editing: boolean = false;
  roleName: string = '';
  roleId: string = '';

  // Campos para documento
  documentTypes: any[] = [];
  documentTypeId: string = '';
  documentNumber: string = '';
  documentDV: string = '';

  // configuración notificaciones tipo toast
  toastTitle: string = '';
  toastType: 'success' | 'warning' | 'danger' | 'primary' = 'success';
  notifications: Array<{
    title: string;
    type: 'success' | 'warning' | 'danger' | 'primary';
    alertType: 'A' | 'B';
    container: 0 | 1;
    visible: boolean;
  }> = [];
  SWNTF: number = 0;
  // ----------------------------------------------

  showAssignRole = false;
  showAssignDependency = false;
  showAssignDependencyModal = false;
  allUsers: any[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    public translationService: TranslationService
  ) {
    this.notifications = [];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      this.originalUser = JSON.parse(JSON.stringify(this.user));
      this.roleId = this.user?.rol?.id ?? '';
      this.loadRoleName();
      this.loadDocumentTypes();
      this.initializeDocumentFields();
    }
  }

  loadDocumentTypes() {
    this.http.get<any[]>(`${this.baseApiUrl}/api/document-types`).subscribe({
      next: (types) => {
        this.documentTypes = types;
      },
      error: (err) => console.error('Error loading document types:', err)
    });
  }

  initializeDocumentFields() {
    if (this.user?.basicData?.documentNumber) {
      const parts = this.user.basicData.documentNumber.split('-');
      if (parts.length === 2 && this.user.basicData.strPersonType === 'J') {
        this.documentNumber = parts[0];
        this.documentDV = parts[1];
      } else {
        this.documentNumber = this.user.basicData.documentNumber;
        this.documentDV = '';
      }
    } else {
      this.documentNumber = '';
      this.documentDV = '';
    }
    this.documentTypeId = this.user?.basicData?.documentTypeId || '';
  }

  getDocumentTypeDescription(): string {
    if (!this.user?.basicData?.documentTypeId) {
      return 'No especificado';
    }
    const docType = this.documentTypes.find(dt => dt.id === this.user.basicData.documentTypeId);
    return docType?.description || 'No especificado';
  }

  openAssignDependency() {
    this.showAssignDependency = true;
  }

  cancelAssignDependency() {
    this.showAssignDependency = false;
  }

  onDependencySelected(selectedUser: any) {
    this.userService.assignDependency(this.user.id, selectedUser.id).subscribe({
      next: () => {
        this.user.dependentOn = selectedUser.strUserName;
        this.showAssignDependency = false;
        Swal.fire({
          icon: 'success',
          title: this.translationService.translate('users.details.dependencyAssigned'),
          showConfirmButton: false,
          timer: 2000,
        });
      },
      error: () => {
        Swal.fire(
          this.translationService.translate('common.error'),
          this.translationService.translate('users.details.errorAssigning'),
          'error'
        );
      },
    });
  }

  closeModal() {
    this.cancel.emit();
  }

  detectChanges() {
    if (
      JSON.stringify({
        ...this.user,
        rol: { ...this.user.rol, id: this.roleId },
      }) !== JSON.stringify(this.originalUser)
    ) {
      this.user.strStatus = 'TEMPORARY';
    } else {
      this.user.strStatus = 'ACTIVE';
    }
  }

  loadRoleName() {
    if (this.roleId) {
      this.http.get<any>(`${this.roleUrl}/${this.roleId}`).subscribe({
        next: (role) => (
          (this.roleName = role.strName),
          (this.user.rol.strDescription1 = role.strDescription1)
        ),
        error: () => (
          (this.roleName = ''),
          (this.user.rol.id = this.roleId),
          this.detectChanges()
        ),
      });
    } else {
      this.roleName = '';
    }
  }

  saveChanges() {
    // Actualizar documento si es persona jurídica
    if (this.user.basicData.strPersonType === 'J') {
      this.user.basicData.documentNumber = `${this.documentNumber}-${this.documentDV}`;
    } else {
      this.user.basicData.documentNumber = this.documentNumber;
    }
    this.user.basicData.documentTypeId = this.documentTypeId;
    
    // Preparar datos para actualización
    const updateData: any = {
      strUserName: this.user.strUserName,
      strStatus: 'ACTIVE',
      basicData: {
        documentTypeId: this.documentTypeId,
        documentNumber: this.user.basicData.documentNumber
      }
    };

    // Solo agregar rolId si no está vacío
    if (this.roleId && this.roleId.trim() !== '') {
      updateData.rolId = this.roleId;
    }

    // Agregar naturalPersonData si es persona natural
    if (this.user.basicData.strPersonType === 'N' && this.user.basicData.naturalPersonData) {
      updateData.naturalPersonData = {
        firstName: this.user.basicData.naturalPersonData.firstName,
        secondName: this.user.basicData.naturalPersonData.secondName,
        firstSurname: this.user.basicData.naturalPersonData.firstSurname,
        secondSurname: this.user.basicData.naturalPersonData.secondSurname,
        birthDate: this.user.basicData.naturalPersonData.birthDate,
        maritalStatus: this.user.basicData.naturalPersonData.maritalStatus,
        sex: this.user.basicData.naturalPersonData.sex
      };
    }

    // Agregar legalEntityData si es persona jurídica
    if (this.user.basicData.strPersonType === 'J' && this.user.basicData.legalEntityData) {
      updateData.legalEntityData = {
        businessName: this.user.basicData.legalEntityData.businessName,
        webSite: this.user.basicData.legalEntityData.webSite,
        contactName: this.user.basicData.legalEntityData.contactName,
        contactEmail: this.user.basicData.legalEntityData.contactEmail,
        contactPhone: this.user.basicData.legalEntityData.contactPhone
      };
    }

    console.log('Updating user with data:', updateData);

    // Llamar al servicio para actualizar
    this.userService.updateUser(this.user.id, updateData).subscribe({
      next: (updatedUser) => {
        console.log('User updated successfully:', updatedUser);
        this.user = updatedUser;
        this.originalUser = JSON.parse(JSON.stringify(this.user));
        this.user.strStatus = 'ACTIVE';
        this.toggleEditing();
        this.userUpdated.emit();
        Swal.fire({
          icon: 'success',
          title: 'Usuario actualizado correctamente',
          showConfirmButton: false,
          timer: 2000,
        });
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.showToast('Error al actualizar usuario: ' + (err.error?.message || 'Error desconocido'), 'danger', 'A', 0);
      }
    });
  }

  cancelChanges() {
    if (this.originalUser) {
      this.user = JSON.parse(JSON.stringify(this.originalUser));
      this.roleId = this.user?.rol?.id ?? '';
      this.roleName = this.user?.rol?.strName ?? '';
      // Validar si hay rol antes de asignar propiedades
      if (this.originalUser.rol) {
        this.user.rol = { ...this.originalUser.rol };
      } else {
        this.user.rol = null; // o undefined, según el modelo
      }
      this.user.strStatus = this.user?.strStatus ?? 'ACTIVE';
      this.editingUser = false;
      this.editing = false;
      this.cancel.emit();
      this.toggleEditing();
      this.detectChanges();
    }
  }

  toggleEditing() {
    if (!this.editingUser) {
      this.startEditing();
    } else {
      this.cancelEditing();
    }
  }

  startEditing() {
    this.editingUser = true;
    this.editing = true;
    this.detectChanges();
  }

  cancelEditing() {
    this.editingUser = false;
    this.editing = false;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  openAssignRoleModal() {
    this.showAssignRole = true;
  }

  onRoleAssigned(event: { role: Rol }) {
    this.user.rol = event.role;
    this.showAssignRole = false;
    Swal.fire({
      icon: 'success',
      title: this.translationService.translate('users.assignRole.successMessage'),
      showConfirmButton: false,
      timer: 2000,
    });
  }

  onDependencyAssigned(selectedUser: any) {
    this.user.dependentOn = selectedUser;
    this.showAssignDependencyModal = false;
    this.detectChanges();
  }

  removeDependency(): void {
    Swal.fire({
      title: this.translationService.translate('users.details.confirmRemove'),
      text: this.translationService.translate('users.details.typeConfirm'),
      input: 'text',
      inputPlaceholder: this.translationService.translate('users.details.typeConfirmHere'),
      inputAttributes: {
        autocomplete: 'off',
      },
      showCancelButton: true,
      confirmButtonText: this.translationService.translate('users.details.remove'),
      cancelButtonText: this.translationService.translate('common.cancel'),
      inputValidator: (value) => {
        if (value !== 'Confirm') {
          return this.translationService.translate('users.details.mustTypeConfirm');
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed && result.value === 'Confirm') {
        this.userService.removeDependency(this.user.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: this.translationService.translate('users.details.dependencyRemoved'),
              showConfirmButton: false,
              timer: 2000,
            }).then(() => {
              this.userUpdated.emit();
            });
          },
          error: (err) => {
            this.showToast(this.translationService.translate('users.details.errorRemoving'), 'danger', 'A', 0);
            console.error(err);
          },
        });
      }
    });
  }

  // Funciones para NOTIFICACIONES
  addNotification(
    title: string,
    type: 'success' | 'warning' | 'danger' | 'primary',
    alertType: 'A' | 'B',
    container: 0 | 1
  ) {
    this.notifications.push({
      title,
      type,
      alertType,
      container,
      visible: true,
    });
  }

  removeNotification(index: number) {
    this.notifications.splice(index, 1);
  }

  getIconColor() {
    return 'var(--header-background-color)';
  }

  showToast(
    message: string,
    type: 'success' | 'warning' | 'danger' | 'primary',
    alertType: 'A' | 'B',
    container: 0 | 1
  ) {
    const notification = {
      title: message,
      type,
      alertType,
      container,
      visible: true,
    };
    this.notifications.push(notification);
    this.cdr.detectChanges();

    if (alertType === 'A') {
      setTimeout(() => {
        notification.visible = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          const index = this.notifications.indexOf(notification);
          if (index > -1) {
            this.notifications.splice(index, 1);
          }
        }, 300);
      }, 3000);
    }
  }
  // ----------------------------------------------
}
