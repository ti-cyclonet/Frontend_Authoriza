import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home/home.component';
import { SetupComponent } from './setup/setup.component';
import { UsersComponent } from './users/users.component';
import { RouterModule } from '@angular/router';
import { ApplicationsComponent } from './applications/applications.component';
import { CuApplicationComponent } from './applications/cu-application/cu-application.component';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { PackagesComponent } from './packages/packages.component';
import { AddPackageComponent } from './packages/add-package/add-package.component';
import { ContractsComponent } from './contracts/contracts.component';
import { AddContractComponent } from './contracts/add-contract/add-contract.component';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    HomeComponent,
    SetupComponent,
    UsersComponent,
    ApplicationsComponent,
    CuApplicationComponent,
    PackagesComponent,
    ContractsComponent,
    AddPackageComponent,
    AddContractComponent,
    NgbCarouselModule
  ]
})
export class FeatureModule { }
