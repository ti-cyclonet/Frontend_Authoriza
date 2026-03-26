import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    this.optionsMenu.sort(
      (a, b) => a.ingOrder - b.ingOrder
    );
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
