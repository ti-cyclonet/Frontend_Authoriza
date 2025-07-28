import {
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { RolesService } from '../../services/roles/roles.service';
import { UserService } from '../../services/user/user.service';
import { ApplicationsService } from '../../services/applications/applications.service';
import { MenuOption } from '../../model/menu_option';
import { Application } from '../../model/application.model';
import { SpinnerComponent } from '../spinner/spinner.component';
import { LoadingService } from '../../services/loading.service';
import { NotificationsComponent } from '../notifications/notifications.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    SpinnerComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    RouterOutlet,
    NotificationsComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export default class LayoutComponent implements OnInit {
  loadingService = inject(LoadingService);
  optionsMenu: MenuOption[] = [];

  isSidebarVisible = true;
  isLargeScreen = false;
  application: Application | undefined;

  applications: Application[] = [];
  localApplications: Application[] = [];

  isLoading = this.loadingService.loading$;

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
  isVisible = false;
  // ----------------------------------------------

  constructor(
    private rolesService: RolesService,
    private userService: UserService,
    private applicationsService: ApplicationsService,
    private cdr: ChangeDetectorRef
  ) {
    this.notifications = [];
    if (typeof window !== 'undefined') {
      this.isLargeScreen = window.innerWidth >= 992;
    }
  }

  ngOnInit(): void {
    // this.loadingService.show();
    // setTimeout(() => this.loadingService.hide(), 3000);
    this.loadSidebarPreference();
    this.applicationsService.applications$.subscribe((apps) => {
      this.applications = apps;
    });

    this.applicationsService.loadApplications();
    this.fetchApplication('Authoriza');
    // this.showToast('Your password is about to expire. You should change it soon.','warning', 'B', 1);
    if (sessionStorage.getItem('mustChangePassword') === 'true') {
      this.showToast(
        'Your password is about to expire. You should change it soon.',
        'warning',
        'B',
        1
      );
    }
  }

  addLocalApplication(app: any) {
    this.localApplications.push({ ...app, isUnsaved: true });
  }

  fetchApplication(name: string): void {
    const userRol = sessionStorage.getItem('user_rol');
    if (!userRol) {
      console.error('No se encontró el rol del usuario en la sesión');
      return;
    }

    this.applicationsService
      .getApplicationByNameAndRol(name, userRol)
      .subscribe(
        (app) => {
          if (!app) {
            console.error('Aplicación no encontrada');
            return;
          }

          this.application = app;
          // Validamos que strRoles y strMenuOptions existen antes de mapear
          this.optionsMenu =
            this.application?.strRoles?.flatMap(
              (role) =>
                role?.menuOptions?.map((menu) => ({
                  id: menu?.id ?? '',
                  strName: menu?.strName ?? 'Unnamed Menu',
                  strDescription: menu?.strDescription ?? '',
                  strUrl: menu?.strUrl ?? '#',
                  strIcon: menu?.strIcon ?? 'default-icon',
                  strType: menu?.strType ?? 'main_menu',
                  ingOrder: menu?.ingOrder ?? '99',
                  strState: menu?.strState ?? 'active',
                  strSubmenus: menu?.strSubmenus ?? [],
                })) || []
            ) || [];
        },
        (error) => {
          console.error('Error fetching application:', error);
        }
      );
  }

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem(
        'sidebarVisible',
        JSON.stringify(this.isSidebarVisible)
      );
    }
  }

  loadSidebarPreference(): void {
    if (typeof window !== 'undefined' && localStorage) {
      const storedValue = localStorage.getItem('sidebarVisible');
      if (storedValue !== null) {
        this.isSidebarVisible = JSON.parse(storedValue);
      } else {
        this.isSidebarVisible = this.isLargeScreen;
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if (typeof window !== 'undefined') {
      this.isLargeScreen = window.innerWidth >= 992;
    }
  }

  // Funciones para NOTIFICACIONES
  // -------------------------------------------
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

  getIcon() {
    switch (this.toastType) {
      case 'success':
        return 'check-circle';
      case 'danger':
        return 'x-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'primary':
        return 'exclamation-triangle';
      default:
        return 'info-circle';
    }
  }

  getIconColor() {
    return 'var(--header-background-color)';
  }

  getClass() {
    return {
      show: this.isVisible,
      'bg-success': this.toastType === 'success',
      'bg-danger': this.toastType === 'danger',
      'bg-warning': this.toastType === 'warning',
      'bg-primary': this.toastType === 'primary',
    };
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
