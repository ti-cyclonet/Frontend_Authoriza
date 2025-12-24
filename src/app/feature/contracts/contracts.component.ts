import { Component, OnInit } from '@angular/core';
import { Contract } from '../../shared/model/contract.model';
import { ContractService, ContractStatus } from '../../shared/services/contracts/contract.service';
import { CommonModule } from '@angular/common';
import { AddContractComponent } from './add-contract/add-contract.component';
import { CurrencyFormatPipe } from "../../shared/pipes/custom-currency.pipe";
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CyclonAssistantComponent } from '../../shared/components/cyclon-assistant/cyclon-assistant.component';
import { TranslationService } from '../../shared/services/translation.service';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, AddContractComponent, CurrencyFormatPipe, TranslatePipe, CyclonAssistantComponent],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.css',
})
export class ContractsComponent implements OnInit {
  contracts: Contract[] = [];
  total: number = 0;
  page: number = 1;
  limit: number = 10;
  totalPages: number = 0;

  ContractStatus = ContractStatus;
  statusOptions = Object.values(ContractStatus);

  statuses: string[] = ['DRAFT', 'ACTIVE', 'EXPIRED'];
  selectedStatus: string | undefined;
  Math: any = window.Math;

  showAddContractModal: boolean = false;

  constructor(private contractService: ContractService, private translationService: TranslationService) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    const statusParam = this.selectedStatus || undefined;
    this.contractService
      .findAll(this.page, this.limit)
      .subscribe((response) => {
        this.contracts = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
      });
  }

  openAddContractModal() {
    this.showAddContractModal = true;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadContracts();
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.page = 1;
    this.loadContracts();
  }

  closeModal() {
    this.showAddContractModal = false;
    this.loadContracts();
  }

  // Contexto para CYCLON
  get cyclonContext() {
    return {
      currentPage: this.page,
      totalPages: this.totalPages,
      totalContracts: this.total,
      selectedStatus: this.selectedStatus,
      showingModal: this.showAddContractModal
    };
  }

  get currentLanguage(): string {
    return localStorage.getItem('language') || 'en';
  }

  getStatusTranslation(status: string): string {
    const currentLang = localStorage.getItem('language') || 'en';
    
    const statusTranslations: { [status: string]: { [lang: string]: string } } = {
      'ACTIVE': { en: 'Active', es: 'Activo' },
      'PENDING': { en: 'Pending', es: 'Pendiente' },
      'DRAFT': { en: 'Draft', es: 'Borrador' },
      'EXPIRED': { en: 'Expired', es: 'Expirado' }
    };
    
    return statusTranslations[status]?.[currentLang] || status;
  }

  getTranslation(key: string): string {
    const currentLang = localStorage.getItem('language') || 'en';
    
    const translations: { [key: string]: { [lang: string]: string } } = {
      'contracts.title': { en: 'Contract Management', es: 'Gestión de Contratos' },
      'contracts.description': { en: 'Manage contracts and agreements', es: 'Gestionar contratos y acuerdos' },
      'contracts.allStatuses': { en: 'All Statuses', es: 'Todos los Estados' },
      'contracts.user': { en: 'User', es: 'Usuario' },
      'contracts.package': { en: 'Package', es: 'Paquete' },
      'contracts.value': { en: 'Value', es: 'Valor' },
      'contracts.payday': { en: 'Pay Day', es: 'Día de Pago' },
      'contracts.startDate': { en: 'Start Date', es: 'Fecha de Inicio' },
      'contracts.endDate': { en: 'End Date', es: 'Fecha de Fin' },
      'contracts.status': { en: 'Status', es: 'Estado' },
      'common.actions': { en: 'Actions', es: 'Acciones' },
      'contracts.showing': { en: 'Showing', es: 'Mostrando' },
      'contracts.of': { en: 'of', es: 'de' },
      'contracts.contracts': { en: 'contracts', es: 'contratos' }
    };
    
    return translations[key]?.[currentLang] || key;
  }
}
