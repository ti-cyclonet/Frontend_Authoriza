import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home/home.component';
import { SetupComponent } from './setup/setup.component';
import { UsersComponent } from './users/users.component';
import { RouterModule } from '@angular/router';
import { RolesComponent } from './roles/roles.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    HomeComponent,
    RolesComponent,
    SetupComponent,
    UsersComponent
  ]
})
export class FeatureModule { }
