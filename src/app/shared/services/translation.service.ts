import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = new BehaviorSubject<string>('en');
  public language$ = this.currentLanguage.asObservable();

  private translations: { [key: string]: { [key: string]: string } } = {
    en: {
      // Dashboard
      'dashboard.title': 'Main Dashboard',
      'dashboard.subtitle': 'System overview',
      'dashboard.loading': 'Loading...',
      'dashboard.loadingStats': 'Loading statistics...',
      'dashboard.totalUsers': 'Total Users',
      'dashboard.active': 'Active',
      'dashboard.inactive': 'Inactive',
      'dashboard.unconfirmed': 'Unconfirmed',
      'dashboard.invoices': 'Invoices',
      'dashboard.paid': 'Paid',
      'dashboard.pending': 'Pending',
      'dashboard.overdue': 'Overdue',
      'dashboard.totalRevenue': 'Total Revenue',
      'dashboard.contracts': 'Contracts',
      'dashboard.expired': 'Expired',
      'dashboard.usersByRole': 'Users by Role',
      'dashboard.invoiceStatus': 'Invoice Status',
      'dashboard.monthlyRevenue': 'Monthly Revenue',
      'dashboard.recentActivity': 'Recent Activity',
      'dashboard.recentUsers': 'Recent Users',
      'dashboard.recentInvoices': 'Recent Invoices',
      'dashboard.recentContracts': 'Recent Contracts',

      // Users
      'users.title': 'User Management',
      'users.searchPlaceholder': 'Search by name, email, or application',
      'users.filterPlaceholder': 'Write some words to filter',
      'users.filterByDependency': 'Filter by dependency',
      'users.filterByLeader': 'Filter by leader ID',
      'users.showing': 'Showing',
      'users.of': 'of',
      'users.users': 'users',
      'users.page': 'Page',
      'users.noResults': 'No results were found.',
      'users.code': 'Code',
      'users.userName': 'User Name',
      'users.name': 'Name',
      'users.application': 'Application',
      'users.role': 'Role',
      'users.state': 'State',
      'users.updateDate': 'Update date',
      'users.actions': 'Actions',
      'users.deleted': 'DELETED',
      'users.previous': 'Previous',
      'users.next': 'Next',
      'users.addNew': 'Add new user',

      // Applications
      'apps.title': 'Application Management',
      'apps.save': 'Save',
      'apps.addNew': 'Add new app',
      'apps.list': 'Applications list',
      'apps.description': 'Description',
      'apps.logo': 'Logo',
      'apps.slug': 'Slug',
      'apps.tags': 'Tags',
      'apps.notSaved': 'NOT SAVED',
      'apps.details': 'Details',
      'apps.edit': 'Edit',
      'apps.delete': 'Delete',
      'apps.rolesFor': 'Roles for',
      'apps.app': 'app',
      'apps.addNewRole': 'Add new role',
      'apps.descriptionA': 'Description A',
      'apps.descriptionB': 'Description B',
      'apps.menuOptionsFor': 'Menu options for',
      'apps.rol': 'rol',
      'apps.cancelChanges': 'Cancel Changes',
      'apps.addNewMenuOption': 'Add new menu option',
      'apps.order': 'Order',
      'apps.url': 'Url',
      'apps.icon': 'Icon',
      'apps.type': 'Type',
      'apps.submenu': 'Submenu',
      'apps.availableMenuOptions': 'Available Menu Options',
      'apps.select': 'Select',
      'apps.submenusFor': 'Submenus for',

      // Packages
      'packages.title': 'Packages Management',
      'packages.description': 'Manage your packages, add new ones, and view details.',
      'packages.addNew': 'Add new package',
      'packages.listView': 'List view',
      'packages.cardsView': 'Cards view',
      'packages.roles': '# Roles',
      'packages.priceTotal': 'Price (Total)',
      'packages.totalPrice': 'Total price',
      'packages.view': 'View',
      'packages.showing': 'Showing',
      'packages.of': 'of',

      // Contracts
      'contracts.title': 'Contracts Management',
      'contracts.description': 'Manage your contracts, add new ones, and view details.',
      'contracts.addNew': 'Add new contract',
      'contracts.allStatuses': 'All Statuses',
      'contracts.user': 'User',
      'contracts.package': 'Package',
      'contracts.value': 'Value',
      'contracts.payday': 'Payday',
      'contracts.startDate': 'Start Date',
      'contracts.endDate': 'End Date',
      'contracts.status': 'Status',
      'contracts.showing': 'Showing',
      'dashboard.recentEntityCodes': 'Recent Entity Codes',
      'dashboard.userCodes': 'User Codes',
      'dashboard.invoiceCodes': 'Invoice Codes',
      'dashboard.contractCodes': 'Contract Codes',

      // Sidebar/Menu
      'menu.home': 'Home',
      'menu.users': 'Users',
      'menu.applications': 'Applications',
      'menu.packages': 'Packages',
      'menu.contracts': 'Contracts',
      'menu.settings': 'Settings',
      'menu.dashboard': 'Dashboard',
      'menu.materials': 'Materials',
      'menu.kardex': 'Kardex',
      'menu.invoices': 'Invoices',
      'menu.parameters': 'Parameters',

      // Common
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.view': 'View',
      'common.actions': 'Actions',
      'common.close': 'Close',
      'common.previous': 'Previous',
      'common.next': 'Next',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.warning': 'Warning',
      'common.info': 'Info',

      // Dynamic descriptions
      'app.authoriza.description': 'Control Access for Cyclonet Applications'
    },
    es: {
      // Dashboard
      'dashboard.title': 'Dashboard Principal',
      'dashboard.subtitle': 'Resumen general del sistema',
      'dashboard.loading': 'Cargando...',
      'dashboard.loadingStats': 'Cargando estadísticas...',
      'dashboard.totalUsers': 'Usuarios Totales',
      'dashboard.active': 'Activos',
      'dashboard.inactive': 'Inactivos',
      'dashboard.unconfirmed': 'Sin confirmar',
      'dashboard.invoices': 'Facturas',
      'dashboard.paid': 'Pagadas',
      'dashboard.pending': 'Pendientes',
      'dashboard.overdue': 'Vencidas',
      'dashboard.totalRevenue': 'Ingresos Totales',
      'dashboard.contracts': 'Contratos',
      'dashboard.expired': 'Expirados',
      'dashboard.usersByRole': 'Usuarios por Rol',
      'dashboard.invoiceStatus': 'Estado de Facturas',
      'dashboard.monthlyRevenue': 'Ingresos Mensuales',
      'dashboard.recentActivity': 'Actividad Reciente',
      'dashboard.recentUsers': 'Usuarios Recientes',
      'dashboard.recentInvoices': 'Facturas Recientes',
      'dashboard.recentContracts': 'Contratos Recientes',

      // Users
      'users.title': 'Gestión de Usuarios',
      'users.searchPlaceholder': 'Buscar por nombre, email o aplicación',
      'users.filterPlaceholder': 'Escribe algunas palabras para filtrar',
      'users.filterByDependency': 'Filtrar por dependencia',
      'users.filterByLeader': 'Filtrar por ID del líder',
      'users.showing': 'Mostrando',
      'users.of': 'de',
      'users.users': 'usuarios',
      'users.page': 'Página',
      'users.noResults': 'No se encontraron resultados.',
      'users.code': 'Código',
      'users.userName': 'Nombre de Usuario',
      'users.name': 'Nombre',
      'users.application': 'Aplicación',
      'users.role': 'Rol',
      'users.state': 'Estado',
      'users.updateDate': 'Fecha de actualización',
      'users.actions': 'Acciones',
      'users.deleted': 'ELIMINADO',
      'users.previous': 'Anterior',
      'users.next': 'Siguiente',
      'users.addNew': 'Agregar nuevo usuario',

      // Applications
      'apps.title': 'Gestión de Aplicaciones',
      'apps.save': 'Guardar',
      'apps.addNew': 'Agregar nueva app',
      'apps.list': 'Lista de aplicaciones',
      'apps.description': 'Descripción',
      'apps.logo': 'Logo',
      'apps.slug': 'Slug',
      'apps.tags': 'Etiquetas',
      'apps.notSaved': 'NO GUARDADO',
      'apps.details': 'Detalles',
      'apps.edit': 'Editar',
      'apps.delete': 'Eliminar',
      'apps.rolesFor': 'Roles para',
      'apps.app': 'app',
      'apps.addNewRole': 'Agregar nuevo rol',
      'apps.descriptionA': 'Descripción A',
      'apps.descriptionB': 'Descripción B',
      'apps.menuOptionsFor': 'Opciones de menú para',
      'apps.rol': 'rol',
      'apps.cancelChanges': 'Cancelar Cambios',
      'apps.addNewMenuOption': 'Agregar nueva opción de menú',
      'apps.order': 'Orden',
      'apps.url': 'Url',
      'apps.icon': 'Icono',
      'apps.type': 'Tipo',
      'apps.submenu': 'Submenú',
      'apps.availableMenuOptions': 'Opciones de Menú Disponibles',
      'apps.select': 'Seleccionar',
      'apps.submenusFor': 'Submenús para',

      // Packages
      'packages.title': 'Gestión de Paquetes',
      'packages.description': 'Gestiona tus paquetes, agrega nuevos y ve detalles.',
      'packages.addNew': 'Agregar nuevo paquete',
      'packages.listView': 'Vista de lista',
      'packages.cardsView': 'Vista de tarjetas',
      'packages.roles': '# Roles',
      'packages.priceTotal': 'Precio (Total)',
      'packages.totalPrice': 'Precio total',
      'packages.view': 'Ver',
      'packages.showing': 'Mostrando',
      'packages.of': 'de',

      // Contracts
      'contracts.title': 'Gestión de Contratos',
      'contracts.description': 'Gestiona tus contratos, agrega nuevos y ve detalles.',
      'contracts.addNew': 'Agregar nuevo contrato',
      'contracts.allStatuses': 'Todos los Estados',
      'contracts.user': 'Usuario',
      'contracts.package': 'Paquete',
      'contracts.value': 'Valor',
      'contracts.payday': 'Día de pago',
      'contracts.startDate': 'Fecha de inicio',
      'contracts.endDate': 'Fecha de fin',
      'contracts.status': 'Estado',
      'contracts.showing': 'Mostrando',
      'dashboard.recentEntityCodes': 'Códigos de Entidad Recientes',
      'dashboard.userCodes': 'Códigos de Usuario',
      'dashboard.invoiceCodes': 'Códigos de Factura',
      'dashboard.contractCodes': 'Códigos de Contrato',

      // Sidebar/Menu
      'menu.home': 'Inicio',
      'menu.users': 'Usuarios',
      'menu.applications': 'Aplicaciones',
      'menu.packages': 'Paquetes',
      'menu.contracts': 'Contratos',
      'menu.settings': 'Configuración',
      'menu.dashboard': 'Tablero',
      'menu.materials': 'Materiales',
      'menu.kardex': 'Kardex',
      'menu.invoices': 'Facturas',
      'menu.parameters': 'Parámetros',

      // Common
      'common.yes': 'Sí',
      'common.no': 'No',
      'common.cancel': 'Cancelar',
      'common.save': 'Guardar',
      'common.edit': 'Editar',
      'common.delete': 'Eliminar',
      'common.view': 'Ver',
      'common.actions': 'Acciones',
      'common.close': 'Cerrar',
      'common.previous': 'Anterior',
      'common.next': 'Siguiente',
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.success': 'Éxito',
      'common.warning': 'Advertencia',
      'common.info': 'Información',

      // Dynamic descriptions
      'app.authoriza.description': 'Control de Acceso para Aplicaciones Cyclonet'
    }
  };

  constructor() {
    const savedLang = localStorage.getItem('language') || 'en';
    this.currentLanguage.next(savedLang);
  }

  setLanguage(lang: string) {
    this.currentLanguage.next(lang);
    localStorage.setItem('language', lang);
  }

  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }

  translate(key: string): string {
    const lang = this.getCurrentLanguage();
    return this.translations[lang]?.[key] || key;
  }

  toggleLanguage() {
    const current = this.getCurrentLanguage();
    this.setLanguage(current === 'en' ? 'es' : 'en');
  }

  translateAppDescription(description: string, appName: string): string {
    const key = `app.${appName.toLowerCase()}.description`;
    const translation = this.translate(key);
    return translation !== key ? translation : description;
  }
}