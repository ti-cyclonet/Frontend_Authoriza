import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { NotificationsComponent } from './components/notifications/notifications.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent
  ],
  exports: [
    SidebarComponent
  ]
})
export class SharedModule { }