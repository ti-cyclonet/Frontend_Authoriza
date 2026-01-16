import { Routes } from '@angular/router';
import { UserManagementDashboardComponent } from './user-management-dashboard.component';

export const USER_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    component: UserManagementDashboardComponent,
    data: { 
      title: 'Gestión Avanzada de Usuarios',
      breadcrumb: 'Dashboard'
    }
  },
  {
    path: 'dashboard',
    component: UserManagementDashboardComponent,
    data: { 
      title: 'Dashboard de Usuarios',
      breadcrumb: 'Dashboard'
    }
  }
];

// Configuración para integración con el router principal
export const INTEGRATED_USER_ROUTES: Routes = [
  {
    path: 'user-management',
    loadChildren: () => import('./user-management.routes').then(m => m.USER_MANAGEMENT_ROUTES),
    data: {
      title: 'Gestión de Usuarios',
      breadcrumb: 'Usuarios'
    }
  }
];