import { Component, EventEmitter, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { DESCRIPTION_APP } from '../../../config/config';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  
  userName: string | null = null;
  userEmail: string | null = null;
  userRol: string | null = null;
  userImage: string | null = null;
  private _isSidebarVisible: boolean = false;

  @Input() 
  set isSidebarVisible(value: boolean) {
    this._isSidebarVisible = value;
  }
  get isSidebarVisible(): boolean {
    return this._isSidebarVisible;
  }

  @Output() sidebarToggle = new EventEmitter<void>();

  nombreApp = DESCRIPTION_APP;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router 
  ) {}

  /*ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) { 
      this.userName = sessionStorage.getItem('user_name');
      this.userEmail = sessionStorage.getItem('user_email');
      this.userRol = sessionStorage.getItem('user_rol');
      this.userImage = sessionStorage.getItem('user_image');

      // 🔍 Agregar logs para verificar si sessionStorage tiene los datos correctos
      console.log('[HeaderComponent] Datos de sessionStorage:');
      console.log('👤 Nombre:', this.userName);
      console.log('📧 Email:', this.userEmail);
      console.log('🔐 Rol:', this.userRol);
      console.log('🖼️ Imagen:', this.userImage);
    }
  }*/
    ngOnInit(): void {
      if (isPlatformBrowser(this.platformId)) {
    
        // Sólo para pruebas:
        sessionStorage.setItem('user_name', 'Jane Smith');
        sessionStorage.setItem('user_email', 'jane.smith@example.com');
        sessionStorage.setItem('user_rol', 'Editor');
        sessionStorage.setItem('user_image', 'https://i.pravatar.cc/100');
    
        this.userName = sessionStorage.getItem('user_name');
        this.userEmail = sessionStorage.getItem('user_email');
        this.userRol = sessionStorage.getItem('user_rol');
        this.userImage = sessionStorage.getItem('user_image');
    
        console.log('[HeaderComponent] Datos simulados de sesión cargados');
      }
    }
    

  onToggleSidebar(): void {
    this._isSidebarVisible = !this._isSidebarVisible;
    this.sidebarToggle.emit(); 
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      console.log('[HeaderComponent] Cerrando sesión...');
      sessionStorage.clear();
    }

    this.router.navigate(['/login']).then(() => {        
      setTimeout(() => {
        console.log('[HeaderComponent] Página recargada después de logout.');
        window.location.reload();
      }, 100);
    });
  }
}
