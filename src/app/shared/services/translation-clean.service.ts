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
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.view': 'View',
      'common.actions': 'Actions',
      'common.status': 'Status',
      'common.close': 'Close',
      'common.previous': 'Previous',
      'common.next': 'Next',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.warning': 'Warning',
      'common.info': 'Info',

      // Contracts
      'contracts.title': 'Contracts Management',
      'contracts.addNew': 'Add a New Contract',
      'contracts.selectPrimaryUser': 'SELECT A PRIMARY USER',
      'contracts.selectPackage': 'SELECT A PACKAGE',
      'contracts.contractDetails': 'CONTRACT DETAILS CONFIGURATION',
      'contracts.searchUserPlaceholder': 'Enter part of the username or first/last name',
      'contracts.searchUserLabel': 'Type a word here',
      'contracts.userNotFound': 'If you can\'t find it, please create it in the Users Module',
      'contracts.listUsersFound': 'List of primary users found',
      'contracts.userName': 'User Name',
      'contracts.name': 'Name',
      'contracts.action': 'Action',
      'contracts.selected': 'was selected',
      'contracts.cancelSelection': 'Cancel Selection',
      'contracts.noUsersAvailable': 'No independent users available.',
      'contracts.searchPackagePlaceholder': 'Enter part of the package name or description',
      'contracts.packageNotFound': 'If you can\'t find it, please create it in the Packages Module',
      'contracts.listPackagesFound': 'List of packages found',
      'contracts.description': 'Description',
      'contracts.noPackagesAvailable': 'No packages available.',
      'contracts.packageSelected': 'Package',
      'contracts.contractValue': 'Contract Value',
      'contracts.mode': 'Mode',
      'contracts.monthly': 'Monthly',
      'contracts.semiannual': 'Semiannual',
      'contracts.annual': 'Annual',
      'contracts.payday': 'Payday',
      'contracts.status': 'Status',
      'contracts.startDate': 'Start Date',
      'contracts.endDate': 'End Date',
      'contracts.previous': 'Previous',
      'contracts.next': 'Next',
      'contracts.send': 'Send',
      'contracts.cancel': 'Cancel',
      'contracts.selectUser': 'Please select a user',
      'contracts.formIncomplete': 'Form Incomplete',
      'contracts.fillRequiredFields': 'Please fill all required fields',
      'contracts.contractCreated': 'Contract successfully created!',
      'contracts.errorCreating': 'There was an error creating the contract.'
    },
    es: {
      // Common
      'common.yes': 'Sí',
      'common.no': 'No',
      'common.cancel': 'Cancelar',
      'common.save': 'Guardar',
      'common.edit': 'Editar',
      'common.delete': 'Eliminar',
      'common.view': 'Ver',
      'common.actions': 'Acciones',
      'common.status': 'Estado',
      'common.close': 'Cerrar',
      'common.previous': 'Anterior',
      'common.next': 'Siguiente',
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.success': 'Éxito',
      'common.warning': 'Advertencia',
      'common.info': 'Información',

      // Contracts
      'contracts.title': 'Gestión de Contratos',
      'contracts.addNew': 'Agregar un Nuevo Contrato',
      'contracts.selectPrimaryUser': 'SELECCIONAR UN USUARIO PRINCIPAL',
      'contracts.selectPackage': 'SELECCIONAR UN PAQUETE',
      'contracts.contractDetails': 'CONFIGURACIÓN DE DETALLES DEL CONTRATO',
      'contracts.searchUserPlaceholder': 'Ingrese parte del nombre de usuario o nombre/apellido',
      'contracts.searchUserLabel': 'Escriba una palabra aquí',
      'contracts.userNotFound': 'Si no lo encuentra, por favor créelo en el Módulo de Usuarios',
      'contracts.listUsersFound': 'Lista de usuarios principales encontrados',
      'contracts.userName': 'Nombre de Usuario',
      'contracts.name': 'Nombre',
      'contracts.action': 'Acción',
      'contracts.selected': 'fue seleccionado',
      'contracts.cancelSelection': 'Cancelar Selección',
      'contracts.noUsersAvailable': 'No hay usuarios independientes disponibles.',
      'contracts.searchPackagePlaceholder': 'Ingrese parte del nombre o descripción del paquete',
      'contracts.packageNotFound': 'Si no lo encuentra, por favor créelo en el Módulo de Paquetes',
      'contracts.listPackagesFound': 'Lista de paquetes encontrados',
      'contracts.description': 'Descripción',
      'contracts.noPackagesAvailable': 'No hay paquetes disponibles.',
      'contracts.packageSelected': 'Paquete',
      'contracts.contractValue': 'Valor del Contrato',
      'contracts.mode': 'Modalidad',
      'contracts.monthly': 'Mensual',
      'contracts.semiannual': 'Semestral',
      'contracts.annual': 'Anual',
      'contracts.payday': 'Día de Pago',
      'contracts.status': 'Estado',
      'contracts.startDate': 'Fecha de Inicio',
      'contracts.endDate': 'Fecha de Fin',
      'contracts.previous': 'Anterior',
      'contracts.next': 'Siguiente',
      'contracts.send': 'Enviar',
      'contracts.cancel': 'Cancelar',
      'contracts.selectUser': 'Por favor seleccione un usuario',
      'contracts.formIncomplete': 'Formulario Incompleto',
      'contracts.fillRequiredFields': 'Por favor complete todos los campos requeridos',
      'contracts.contractCreated': '¡Contrato creado exitosamente!',
      'contracts.errorCreating': 'Hubo un error al crear el contrato.'
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