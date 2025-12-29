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
      // Common
      'common.warning': 'Warning',
      'common.error': 'Error',
      'common.previous': 'Previous',
      'common.next': 'Next',
      'common.cancel': 'Cancel',
      'common.status': 'Status',
      'common.actions': 'Actions',
      
      // Header
      'header.language': 'Language',
      'header.notifications': 'Notifications',
      'header.changePassword': 'Change password',
      'header.logout': 'Logout',
      'header.passwordChangeForm': 'Password Change Form',
      'header.appTitle': 'Access Control for Cyclonet Applications',
      
      // Menu/Sidebar
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
      'users.status.ACTIVE': 'Active',
      'users.status.INACTIVE': 'Inactive',
      'users.status.UNCONFIRMED': 'Unconfirmed',
      'users.status.EXPIRING': 'Expiring',
      'users.status.SUSPENDED': 'Suspended',
      'users.status.DELINQUENT': 'Delinquent',
      'users.success.created': 'User created',
      'users.success.createdMessage': 'The user was created successfully',
      'users.success.updated': 'User updated successfully',
      'users.error.updating': 'Error updating user',
      'users.error.loading': 'Error loading users',
      
      // User Assign Role
      'users.assignRole.confirmTitle': 'Assign Role',
      'users.assignRole.confirmText': 'Are you sure you want to assign the role "{roleName}"?',
      'users.assignRole.typeAssign': 'Type "Assign" to confirm',
      'users.assignRole.placeholder': 'Type "Assign" here',
      'users.assignRole.confirm': 'Assign Role',
      'users.assignRole.mustType': 'You must type exactly "Assign" to continue',
      'users.assignRole.successMessage': 'Role assigned successfully!',
      'users.assignRole.searchApp': 'Search by application',
      'users.assignRole.searchRole': 'Search by role name',
      'users.assignRole.assign': 'Assign',
      
      // User Assign Dependency
      'users.assignDependency.title': 'Dependency',
      'users.assignDependency.searchPlaceholder': 'Search by name, email or application',
      'users.assignDependency.username': 'Username',
      'users.assignDependency.name': 'Name',
      'users.assignDependency.role': 'Role',
      'users.assignDependency.select': 'Select',
      'users.assignDependency.confirmTitle': 'Assign Dependency',
      'users.assignDependency.confirmText': 'Are you sure you want to assign dependency to "{username}"?',
      'users.assignDependency.typeAssign': 'Type "Assign" to confirm',
      'users.assignDependency.placeholder': 'Type "Assign" here',
      'users.assignDependency.confirm': 'Assign Dependency',
      'users.assignDependency.mustType': 'You must type exactly "Assign" to continue',
      'users.assignDependency.successTitle': 'Success!',
      'users.assignDependency.errorTitle': 'Error',
      'users.assignDependency.errorText': 'There was an error assigning the dependency.',
      
      // User Details
      'users.details.title': 'User Details',
      'users.details.natural': 'Natural',
      'users.details.juridical': 'Juridical',
      'users.details.basicData': 'Basic Data',
      'users.details.generalData': 'General Data',
      'users.details.username': 'Username',
      'users.details.lastUpdate': 'Last Update',
      'users.details.roleAssigned': 'Assigned Role',
      'users.details.userDependency': 'User Dependency',
      'users.details.firstName': 'First Name',
      'users.details.secondName': 'Second Name',
      'users.details.firstSurname': 'First Surname',
      'users.details.secondSurname': 'Second Surname',
      'users.details.birthDate': 'Birth Date',
      'users.details.maritalStatus': 'Marital Status',
      'users.details.sex': 'Sex',
      'users.details.businessName': 'Business Name',
      'users.details.website': 'Website',
      'users.details.contactName': 'Contact Name',
      'users.details.contactEmail': 'Contact Email',
      'users.details.contactPhone': 'Contact Phone',
      'users.details.saveChanges': 'Save Changes',
      'users.details.editUser': 'Edit User',
      'users.details.close': 'Close'
    },
    es: {
      // Common
      'common.warning': 'Advertencia',
      'common.error': 'Error',
      'common.previous': 'Anterior',
      'common.next': 'Siguiente',
      'common.cancel': 'Cancelar',
      'common.status': 'Estado',
      'common.actions': 'Acciones',
      
      // Header
      'header.language': 'Idioma',
      'header.notifications': 'Notificaciones',
      'header.changePassword': 'Cambiar contraseña',
      'header.logout': 'Cerrar sesión',
      'header.passwordChangeForm': 'Formulario de Cambio de Contraseña',
      'header.appTitle': 'Control de Acceso para Aplicaciones Cyclonet',
      
      // Menu/Sidebar
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
      'users.status.ACTIVE': 'Activo',
      'users.status.INACTIVE': 'Inactivo',
      'users.status.UNCONFIRMED': 'Sin confirmar',
      'users.status.EXPIRING': 'Expirando',
      'users.status.SUSPENDED': 'Suspendido',
      'users.status.DELINQUENT': 'Moroso',
      'users.success.created': 'Usuario creado',
      'users.success.createdMessage': 'El usuario fue creado exitosamente',
      'users.success.updated': 'Usuario actualizado exitosamente',
      'users.error.updating': 'Error actualizando usuario',
      'users.error.loading': 'Error cargando usuarios',
      
      // User Assign Role
      'users.assignRole.confirmTitle': 'Asignar Rol',
      'users.assignRole.confirmText': '¿Estás seguro de que quieres asignar el rol "{roleName}"?',
      'users.assignRole.typeAssign': 'Escribe "Asignar" para confirmar',
      'users.assignRole.placeholder': 'Escribe "Asignar" aquí',
      'users.assignRole.confirm': 'Asignar Rol',
      'users.assignRole.mustType': 'Debes escribir exactamente "Asignar" para continuar',
      'users.assignRole.successMessage': '¡Rol asignado exitosamente!',
      'users.assignRole.searchApp': 'Buscar por aplicación',
      'users.assignRole.searchRole': 'Buscar por nombre del rol',
      'users.assignRole.assign': 'Asignar',
      
      // User Assign Dependency
      'users.assignDependency.title': 'Dependencia',
      'users.assignDependency.searchPlaceholder': 'Buscar por nombre, email o aplicación',
      'users.assignDependency.username': 'Nombre de Usuario',
      'users.assignDependency.name': 'Nombre',
      'users.assignDependency.role': 'Rol',
      'users.assignDependency.select': 'Seleccionar',
      'users.assignDependency.confirmTitle': 'Asignar Dependencia',
      'users.assignDependency.confirmText': '¿Estás seguro de que quieres asignar dependencia a "{username}"?',
      'users.assignDependency.typeAssign': 'Escribe "Asignar" para confirmar',
      'users.assignDependency.placeholder': 'Escribe "Asignar" aquí',
      'users.assignDependency.confirm': 'Asignar Dependencia',
      'users.assignDependency.mustType': 'Debes escribir exactamente "Asignar" para continuar',
      'users.assignDependency.successTitle': '¡Éxito!',
      'users.assignDependency.errorTitle': 'Error',
      'users.assignDependency.errorText': 'Hubo un error asignando la dependencia.',
      
      // User Details
      'users.details.title': 'Detalles del Usuario',
      'users.details.natural': 'Natural',
      'users.details.juridical': 'Jurídica',
      'users.details.basicData': 'Datos Básicos',
      'users.details.generalData': 'Datos Generales',
      'users.details.username': 'Nombre de Usuario',
      'users.details.lastUpdate': 'Última Actualización',
      'users.details.roleAssigned': 'Rol Asignado',
      'users.details.userDependency': 'Dependencia de Usuario',
      'users.details.firstName': 'Primer Nombre',
      'users.details.secondName': 'Segundo Nombre',
      'users.details.firstSurname': 'Primer Apellido',
      'users.details.secondSurname': 'Segundo Apellido',
      'users.details.birthDate': 'Fecha de Nacimiento',
      'users.details.maritalStatus': 'Estado Civil',
      'users.details.sex': 'Sexo',
      'users.details.businessName': 'Razón Social',
      'users.details.website': 'Sitio Web',
      'users.details.contactName': 'Nombre de Contacto',
      'users.details.contactEmail': 'Email de Contacto',
      'users.details.contactPhone': 'Teléfono de Contacto',
      'users.details.saveChanges': 'Guardar Cambios',
      'users.details.editUser': 'Editar Usuario',
      'users.details.close': 'Cerrar'
    }
  };

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('language') || 'en';
      this.currentLanguage.next(savedLang);
    } else {
      this.currentLanguage.next('en');
    }
  }

  setLanguage(lang: string) {
    this.currentLanguage.next(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('language', lang);
    }
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
}