import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, NgStyle } from '@angular/common';
import { MenuOption } from '../../model/menu_option';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgStyle, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  @Input() optionsMenu: MenuOption[] = [];
  @Output() sidebarToggle = new EventEmitter<void>();
  private openSubmenuId: string | null = null;
  private isMobile = false;

  constructor(private translationService: TranslationService) {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth < 992;
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 992;
  }

  ngOnInit(): void {
    this.optionsMenu.sort(
      (a, b) => a.ingOrder - b.ingOrder
    );
  }

  /**
   * Normaliza la URL para que sea una ruta absoluta compatible con routerLink.
   * Convierte cualquier formato de URL a un array con ruta absoluta (ej: ['/users']).
   * Esto garantiza navegación consistente dentro del layout sin recargar la página.
   */
  getNormalizedUrl(url: string | null): string[] | null {
    if (!url) return null;
    // Quitar slashes iniciales y construir ruta absoluta como array
    const cleanPath = url.replace(/^\/+/, '');
    return ['/', cleanPath];
  }

  getSubmenus(id: string): MenuOption[] {
    const menu = this.optionsMenu.find((option) => option.id === id);
    return (
      menu?.strSubmenus.sort(
        (a, b) => a.ingOrder - b.ingOrder
      ) || []
    );
  }

  toggleSubmenu(id: string) {
    this.openSubmenuId = this.openSubmenuId === id ? null : id;
  }

  isSubmenuOpen(id: string): boolean {
    return this.openSubmenuId === id;
  }

  onToggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  onMenuItemClick(option: MenuOption): void {
    if (option.strUrl && this.isMobile) {
      this.sidebarToggle.emit();
    }
  }

  hasSubmenu(optionId: string): boolean {
    const submenus = this.getSubmenus(optionId);
    return submenus && submenus.length > 0;
  }

  getTranslatedMenuText(description: string): string {
    const menuMap: { [key: string]: string } = {
      'Home': 'menu.home',
      'Users': 'menu.users',
      'Applications': 'menu.applications',
      'Packages': 'menu.packages',
      'Contracts': 'menu.contracts',
      'Settings': 'menu.settings',
      'Dashboard': 'menu.dashboard',
      'Materials': 'menu.materials',
      'Kardex': 'menu.kardex',
      'Invoices': 'menu.invoices',
      'Parameters': 'menu.parameters'
    };
    
    const translationKey = menuMap[description];
    return translationKey ? this.translationService.translate(translationKey) : description;
  }
}
