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

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AssignRoleComponent,
    NotificationsComponent,
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
})
export class UserDetailsComponent implements OnChanges {
  private baseApiUrl = environment.apiBaseUrl;
  private roleUrl = this.baseApiUrl + '/api/roles';

  @Input() user: any;
  // @Input() editing: boolean = false;
  @Output() cancel = new EventEmitter<void>();

  originalUser: any;
  activeTab = 'BasicData';
  editingUser = false;
  editing: boolean = false;
  roleName: string = '';
  roleId: string = '';

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

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    this.notifications = [];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      this.originalUser = JSON.parse(JSON.stringify(this.user));
      this.roleId = this.user?.rol?.id ?? '';
      this.loadRoleName();
    }
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
    this.user.rol = {
      id: this.roleId,
      strName: this.roleName,
      strDescription1: this.user.rol.strDescription1,
    };
    this.user.strStatus = 'ACTIVE';
    this.originalUser = JSON.parse(JSON.stringify(this.user));
    console.log('Guardando cambios...', this.user);
    this.toggleEditing();
  }

  cancelChanges() {
    if (this.originalUser) {
      this.user = JSON.parse(JSON.stringify(this.originalUser));
      this.roleId = this.user?.rol?.id ?? '';
      this.roleName = this.user?.rol?.strName ?? '';
      this.user.rol.strDescription1 = this.user?.rol?.strDescription1 ?? '';
      this.user.strStatus = 'ACTIVE';
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

  onRoleAssigned(event: {
    role: Rol;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'primary';
    alertType: 'A' | 'B';
    container: 0 | 1;
  }) {
    this.user.rol = event.role;
    this.showAssignRole = false;

    // muestra la notificación usando el showToast centralizado
    this.showToast(event.message, event.type, event.alertType, event.container);
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
      }, 5000);
    }
  }
  // ----------------------------------------------
}
