import { Component, HostListener, inject, OnInit } from '@angular/core';

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
    this.loadSidebarPreference();
    this.applicationsService.loadApplications();
    this.fetchApplication('Authoriza'); 
  } 

  addLocalApplication(app: any) {
    this.localApplications.push({ ...app, isUnsaved: true });
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
            strName: menu?.strName ?? 'Unnamed Menu',
            strDescription: menu?.strDescription ?? '',
            strUrl: menu?.strUrl ?? '#',
            strIcon: menu?.strIcon ?? 'default-icon',
            strType: menu?.strType ?? 'main_menu',            
            ingOrder: menu?.ingOrder ?? '99',
            strState: menu?.strState ?? 'active',
            strSubmenus: menu?.strSubmenus ?? []
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
      localStorage.setItem('sidebarVisible', JSON.stringify(this.isSidebarVisible));
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
}
