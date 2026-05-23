import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Contract } from '../../shared/model/contract.model';
import { ContractService, ContractStatus } from '../../shared/services/contracts/contract.service';
import { CommonModule } from '@angular/common';
import { AddContractComponent } from './add-contract/add-contract.component';
import { CurrencyFormatPipe } from "../../shared/pipes/custom-currency.pipe";
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CyclonAssistantComponent } from '../../shared/components/cyclon-assistant/cyclon-assistant.component';
import { TranslationService } from '../../shared/services/translation.service';
import { PackageService } from '../../shared/services/packages/package.service';
import { Package } from '../../shared/model/package.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AddContractComponent, CurrencyFormatPipe, TranslatePipe, CyclonAssistantComponent],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.css',
})
export class ContractsComponent implements OnInit {
  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  total: number = 0;
  page: number = 1;
  limit: number = 8;
  totalPages: number = 0;

  ContractStatus = ContractStatus;
  statusOptions = Object.values(ContractStatus);

  statuses: string[] = ['DRAFT', 'PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'TERMINATED', 'RENEWED'];
  selectedStatus: string = '';
  searchTerm: string = '';
  Math: any = window.Math;

  showAddContractModal: boolean = false;
  showViewModal: boolean = false;
  showEditModal: boolean = false;
  selectedContract: Contract | null = null;
  isEditLoading: boolean = false;
  editData = { value: 0, payday: 1, startDate: '', endDate: '', status: '', businessSector: '', packageId: '' };
  availablePackages: Package[] = [];

  constructor(private contractService: ContractService, private translationService: TranslationService, private packageService: PackageService) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.contractService
      .findAll(1, 1000)
      .subscribe((response) => {
        this.contracts = response.data;
        this.total = response.total;
        this.applyFilters();
      });
  }

  applyFilters(): void {
    let result = [...this.contracts];

    // Filtrar por estado
    if (this.selectedStatus) {
      result = result.filter(c => c.status === this.selectedStatus);
    }

    // Filtrar por búsqueda (usuario o paquete)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c =>
        c.user?.strUserName?.toLowerCase().includes(term) ||
        c.package?.name?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term)
      );
    }

    this.filteredContracts = result;
    this.totalPages = Math.ceil(this.filteredContracts.length / this.limit);
    this.page = 1;
  }

  get pagedContracts(): Contract[] {
    const start = (this.page - 1) * this.limit;
    return this.filteredContracts.slice(start, start + this.limit);
  }

  openAddContractModal() {
    this.showAddContractModal = true;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
    }
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  closeModal() {
    this.showAddContractModal = false;
    this.loadContracts();
  }

  activateContract(contract: Contract): void {
    // Validar que tenga usuarios dependientes
    if (!contract.user || !contract.user.dependentCount || contract.user.dependentCount === 0) {
      Swal.fire({
        title: 'No se puede activar',
        text: 'Debe crear al menos una cuenta de usuario dependiente antes de activar el contrato.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Validar que tenga PDF generado
    if (!contract.pdfUrl || contract.pdfUrl.trim() === '' || contract.pdfUrl === null) {
      Swal.fire({
        title: 'No se puede activar',
        text: 'Debe generar el PDF del contrato antes de activarlo.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar spinner mientras valida
    Swal.fire({
      title: 'Activando contrato...',
      text: 'Validando requisitos y activando el contrato',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.contractService.activateContract(contract.id).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Activado!',
          text: 'El contrato ha sido activado exitosamente.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        this.loadContracts();
      },
      error: (error) => {
        const errorMsg = error?.error?.message || 'Error al activar el contrato';
        Swal.fire({
          title: 'Error',
          text: errorMsg,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
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
      'EXPIRED': { en: 'Expired', es: 'Expirado' },
      'SUSPENDED': { en: 'Suspended', es: 'Suspendido' },
      'CANCELLED': { en: 'Cancelled', es: 'Cancelado' },
      'TERMINATED': { en: 'Terminated', es: 'Terminado' },
      'RENEWED': { en: 'Renewed', es: 'Renovado' },
      'DELETED': { en: 'Deleted', es: 'Eliminado' }
    };
    
    return statusTranslations[status]?.[currentLang] || status;
  }

  getTranslation(key: string): string {
    const currentLang = localStorage.getItem('language') || 'en';
    
    const translations: { [key: string]: { [lang: string]: string } } = {
      'contracts.title': { en: 'Contract Management', es: 'Gestión de Contratos' },
      'contracts.description': { en: 'Manage contracts and agreements', es: 'Gestionar contratos y acuerdos' },
      'contracts.allStatuses': { en: 'All Statuses', es: 'Todos los Estados' },
      'contracts.code': { en: 'Code', es: 'Código' },
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

  viewContract(contract: Contract) {
    this.selectedContract = contract;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedContract = null;
  }

  viewAndActivate() {
    const contract = this.selectedContract;
    if (!contract) return;
    this.closeViewModal();
    this.activateContract(contract);
  }

  viewAndEdit() {
    const contract = this.selectedContract;
    if (!contract) return;
    this.closeViewModal();
    this.selectedContract = contract;
    
    this.editData = {
      value: contract.value || 0,
      payday: contract.payday || 1,
      startDate: contract.startDate || '',
      endDate: contract.endDate || '',
      status: contract.status || 'DRAFT',
      businessSector: contract.businessSector || '',
      packageId: contract.package?.id || ''
    };

    // Cargar paquetes disponibles para el selector
    this.packageService.getAllPackages().subscribe({
      next: (packages) => {
        this.availablePackages = packages;
      },
      error: (err) => {
        console.error('Error al cargar paquetes:', err);
        this.availablePackages = [];
      }
    });

    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedContract = null;
  }

  saveEdit() {
    if (!this.selectedContract) return;
    this.isEditLoading = true;

    const payload: any = {
      value: this.editData.value,
      payday: this.editData.payday,
      startDate: this.editData.startDate,
      endDate: this.editData.endDate,
      status: this.editData.status,
      businessSector: this.editData.businessSector
    };

    // Solo incluir packageId si cambió respecto al paquete actual
    if (this.editData.packageId && this.editData.packageId !== this.selectedContract.package?.id) {
      payload.packageId = this.editData.packageId;
    }

    this.contractService.updateContract(this.selectedContract.id, payload).subscribe({
      next: () => {
        this.isEditLoading = false;
        this.closeEditModal();
        this.loadContracts();
        Swal.fire({
          icon: 'success',
          title: 'Contrato actualizado',
          text: 'Los cambios se guardaron correctamente.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.isEditLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error?.error?.message || 'No se pudo actualizar el contrato.',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  viewAndDelete() {
    const contract = this.selectedContract;
    if (!contract) return;

    Swal.fire({
      title: '¿Eliminar contrato?',
      html: `¿Está seguro de eliminar el contrato <strong>${contract.code || contract.id}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.closeViewModal();
        Swal.fire({
          icon: 'info',
          title: 'Funcionalidad en desarrollo',
          text: 'La eliminación de contratos estará disponible próximamente.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#6600CC'
        });
      }
    });
  }
}
