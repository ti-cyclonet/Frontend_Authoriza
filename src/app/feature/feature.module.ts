import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home/home.component';
import { SetupComponent } from './setup/setup.component';
import { UsersComponent } from './users/users.component';
import { RouterModule } from '@angular/router';
import { RolesComponent } from './roles/roles.component';
import { ApplicationsComponent } from './applications/applications.component';
import { CuApplicationComponent } from './applications/cu-application/cu-application.component';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    HomeComponent,
    RolesComponent,
    SetupComponent,
    UsersComponent,
    ApplicationsComponent,
    CuApplicationComponent,
    NgbCarouselModule 
  ]
})
export class FeatureModule { }
