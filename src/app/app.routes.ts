import { Routes } from '@angular/router';
import {
  ROOT_APPLICATIONS,
  ROOT_CONFIGURATION,
  ROOT_HOME,
  ROOT_LOGIN,
  ROOT_REGISTER,
  ROOT_ROLES,
  ROOT_USUERS,
} from './config/config';

export const routes: Routes = [
  {
    path: ROOT_LOGIN,
    loadComponent: () =>
      import('./shared/components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: ROOT_REGISTER,
    loadComponent: () =>
      import('./shared/components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component'),
    children: [
      {
        path: ROOT_HOME,
        loadComponent: () =>
          import('./feature/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: ROOT_USUERS,
        loadComponent: () =>
          import('./feature/users/users.component').then(
            (m) => m.UsersComponent
          ),
      },
      {
        path: ROOT_APPLICATIONS,
        loadComponent: () =>
          import('./feature/applications/applications.component').then(
            (m) => m.ApplicationsComponent
          ),
      },
      {
        path: ROOT_ROLES,
        loadComponent: () =>
          import('./feature/roles/roles.component').then(
            (m) => m.RolesComponent
          ),
      },
      {
        path: ROOT_CONFIGURATION,
        loadComponent: () =>
          import('./feature/setup/setup.component').then(
            (m) => m.SetupComponent
          ),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import(
            './shared/components/change-password/change-password.component'
          ).then((m) => m.ChangePasswordComponent),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
