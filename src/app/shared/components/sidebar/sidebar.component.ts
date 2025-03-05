import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, NgStyle } from '@angular/common';
import { MenuOption } from '../../model/menu_option';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgStyle],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  @Input() optionsMenu: MenuOption[] = [];
  @Output() sidebarToggle = new EventEmitter<void>();
  private openSubmenuId: string | null = null;

  ngOnInit(): void {
    this.optionsMenu.sort(
      (a, b) => parseInt(a.ingOrder, 10) - parseInt(b.ingOrder, 10)
    );
  }

  getSubmenus(id: string): MenuOption[] {
    const menu = this.optionsMenu.find((option) => option.id === id);
    return (
      menu?.strSubmenus.sort(
        (a, b) => parseInt(a.ingOrder, 10) - parseInt(b.ingOrder, 10)
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
}
