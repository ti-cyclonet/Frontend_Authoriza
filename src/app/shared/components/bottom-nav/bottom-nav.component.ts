import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuOption } from '../../model/menu_option';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { menuLabel } from '../../utils/menu-label';

/** Acción rápida del botón central (abre el formulario de creación de la vista). */
interface QuickAction {
  label: string;
  icon: string;
  url: string;
}

/**
 * Menú inferior en móvil (como en Kiri): dos accesos a cada lado, un botón
 * central "+" con acciones rápidas y "Más" con el resto del menú del rol.
 * Las opciones salen del mismo menú que el lateral (optionsMenu); en
 * pantallas grandes no se muestra (ver az-ui.css).
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css',
})
export class BottomNavComponent {
  @Input() optionsMenu: MenuOption[] = [];

  actionsOpen = false;
  moreOpen = false;
  currentUrl = '';

  /** Rutas preferidas para la barra (en este orden); el resto va en "Más". */
  private static readonly PREFERRED = ['/home', '/users', '/contracts', '/packages'];

  private static readonly QUICK: (QuickAction & { route: string })[] = [
    { route: '/users', label: 'nav.newUser', icon: 'person-plus', url: '/users' },
    { route: '/contracts', label: 'nav.newContract', icon: 'file-earmark-plus', url: '/contracts' },
    { route: '/packages', label: 'nav.newPackage', icon: 'box-seam', url: '/packages' },
  ];

  constructor(private router: Router, private translations: TranslationService) {
    this.currentUrl = this.router.url;
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.currentUrl = (e as NavigationEnd).urlAfterRedirects;
      this.actionsOpen = false;
      this.moreOpen = false;
    });
  }

  private get links(): MenuOption[] {
    return (this.optionsMenu || []).filter((o) => !!o.strUrl && o.strUrl !== '#');
  }

  /** Cuatro accesos: los preferidos que tenga el rol, completando con el resto. */
  private get barItems(): MenuOption[] {
    const links = this.links;
    const preferred = BottomNavComponent.PREFERRED
      .map((u) => links.find((o) => this.norm(o.strUrl) === u))
      .filter((o): o is MenuOption => !!o);
    const rest = links.filter((o) => !preferred.includes(o));
    // Si hay más de 4 opciones, el último lugar de la derecha es "Más"
    const max = links.length > 4 ? 3 : 4;
    return [...preferred, ...rest].slice(0, max);
  }

  get leftItems(): MenuOption[] {
    return this.barItems.slice(0, 2);
  }

  get rightItems(): MenuOption[] {
    return this.barItems.slice(2);
  }

  get hasMore(): boolean {
    return this.links.length > 4;
  }

  /** Lo que no cabe en la barra. */
  get moreItems(): MenuOption[] {
    const shown = this.barItems;
    return this.links.filter((o) => !shown.includes(o));
  }

  /** Acciones rápidas disponibles para las vistas que tiene el rol. */
  get quickActions(): QuickAction[] {
    const urls = this.links.map((o) => this.norm(o.strUrl));
    return BottomNavComponent.QUICK.filter((q) => urls.includes(q.route));
  }

  isActive(option: MenuOption): boolean {
    const url = this.norm(option.strUrl);
    const current = this.norm(this.currentUrl.split('?')[0]);
    return current === url || current.startsWith(url + '/');
  }

  get moreActive(): boolean {
    return this.moreItems.some((o) => this.isActive(o));
  }

  /** Texto visible: la descripción traducida (strName es un id interno, p. ej. "homeAuthoriza"). */
  label(option: MenuOption): string {
    return menuLabel(option.strDescription, this.translations, option.strName);
  }

  link(option: MenuOption): string {
    return this.norm(option.strUrl);
  }

  icon(option: MenuOption): string {
    return './assets/icons/bootstrap-icons.svg#' + (option.strIcon || 'circle');
  }

  toggleActions(): void {
    this.moreOpen = false;
    this.actionsOpen = !this.actionsOpen;
  }

  toggleMore(): void {
    this.actionsOpen = false;
    this.moreOpen = !this.moreOpen;
  }

  /** Abre la vista con ?nuevo=1: la vista abre su formulario de creación. */
  runQuick(action: QuickAction): void {
    this.actionsOpen = false;
    this.router.navigate([action.url], { queryParams: { nuevo: 1 } });
  }

  @HostListener('document:keydown.escape')
  closeAll(): void {
    this.actionsOpen = false;
    this.moreOpen = false;
  }

  private norm(url: string | null | undefined): string {
    const u = String(url || '').trim();
    return '/' + u.replace(/^\/+/, '').replace(/\/+$/, '');
  }
}
