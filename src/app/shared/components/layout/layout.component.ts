import { Component, HostListener, OnInit } from '@angular/core';

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
interface OptionMenu {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  type: string;
  idMPather: string | null;
  order: string;
  idApplication: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    RouterOutlet,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export default class LayoutComponent implements OnInit {

  optionsMenu: OptionMenu[] = [];

  isSidebarVisible = true;
  isLargeScreen = false;
  application: Application | undefined;
  
  constructor(
    private rolesService: RolesService,
    private userService: UserService,
    private applicationsService: ApplicationsService
  ) {
    if (typeof window !== 'undefined') {
      this.isLargeScreen = window.innerWidth >= 992;
    }
  }

  ngOnInit(): void {
    this.applicationsService.loadApplications();
    this.fetchApplication('Authoriza'); 
  }

  fetchApplication(name: string): void {
    this.applicationsService.getApplicationByName(name).subscribe(
      (app) => {
        if (!app) {
          console.error('Aplicación no encontrada');
          return;
        }
  
        this.application = app;
        // Validamos que strRoles y strMenuOptions existen antes de mapear
        this.optionsMenu = this.application?.strRoles?.flatMap(role =>
          role?.menuOptions?.map(menu => ({
            id: menu?.id ?? '',
            name: menu?.strName ?? 'Unnamed Menu',
            description: menu?.strDescription ?? '',
            url: menu?.strUrl ?? '#',
            icon: menu?.strIcon ?? 'default-icon',
            type: menu?.strType ?? 'main_menu',
            idMPather: null,
            order: menu?.ingOrder ?? '99',
            idApplication: this.application?.id ?? '',
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
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if (typeof window !== 'undefined') {
      this.isLargeScreen = window.innerWidth >= 992;
    }
  }
}
