import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { MockPackage, mockPackages } from '../../shared/mocks/packages.mock';
import { Package } from '../../shared/model/package.model';
import { PackageService } from '../../shared/services/packages/package.service';
import { AddPackageComponent } from './add-package/add-package.component';
import 'bootstrap';
import Swal from 'sweetalert2';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CyclonAssistantComponent } from '../../shared/components/cyclon-assistant/cyclon-assistant.component';
import { TranslationService } from '../../shared/services/translation.service';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, AddPackageComponent, TranslatePipe, CyclonAssistantComponent],
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css'],
})
export class PackagesComponent implements OnInit {
  packages: Package[] = [];
  showAddPackageModal: boolean = false;

  viewMode: 'list' | 'cards' = 'list';
  currentPage: number = 1;
  itemsPerPageList: number = 10;
  itemsPerPageCards: number = 6;

  constructor(private packageService: PackageService, private translationService: TranslationService) {}

  ngOnInit(): void {
    this.loadPackages();
    this.viewMode =
      (localStorage.getItem('viewMode') as 'list' | 'cards') || 'list';
  }

  setView(mode: 'list' | 'cards') {
    this.viewMode = mode;
    this.currentPage = 1;
    localStorage.setItem('viewMode', mode);
  }

  loadPackages() {
    this.packageService.getAllPackages().subscribe({
      next: (data) => {
        this.packages = data;
      },
      error: (err) => console.error('Error fetching packages:', err),
    });
  }

  get paginatedPackages(): Package[] {
    const startIndex =
      (this.currentPage - 1) *
      (this.viewMode === 'list'
        ? this.itemsPerPageList
        : this.itemsPerPageCards);
    const endIndex =
      startIndex +
      (this.viewMode === 'list'
        ? this.itemsPerPageList
        : this.itemsPerPageCards);
    return this.packages.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    const itemsPerPage =
      this.viewMode === 'list' ? this.itemsPerPageList : this.itemsPerPageCards;
    return Math.ceil(this.packages.length / itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openAddPackageModal() {
    this.showAddPackageModal = true;
  }

  getTotalPrice(pkg: Package): number {
    return (
      pkg.configurations?.reduce((sum, conf) => {
        const price = parseFloat(conf.price);
        return sum + price * conf.totalAccount;
      }, 0) || 0
    );
  }

  getNumberOfRoles(pkg: Package): number {
    return pkg.configurations?.length ?? 0;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  closeModal() {
    this.showAddPackageModal = false;
    this.loadPackages();
  }

  closeModal2() {
    this.showAddPackageModal = false;
    this.loadPackages();
    Swal.fire({
      icon: 'success',
      title: this.translationService.translate('packages.success.created'),
      text: this.translationService.translate('packages.success.createdMessage'),
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }

  deletePackage(pkg: Package) {
    Swal.fire({
      title: 'Eliminar Paquete',
      html: `¿Estás seguro de que quieres eliminar el paquete <strong>"${pkg.name}"</strong>?<br><br><small class="text-muted">Esta acción no se puede deshacer. El paquete será eliminado permanentemente si no tiene contratos activos.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '¡Sí, eliminarlo!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.packageService.deletePackage(pkg.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: response.message,
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
            });
            this.loadPackages();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'No se puede eliminar el paquete',
              text: error.error?.message || 'Ocurrió un error al eliminar el paquete',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }

  // Contexto para CYCLON
  get cyclonContext() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalPackages: this.packages.length,
      viewMode: this.viewMode,
      showingModal: this.showAddPackageModal
    };
  }

  get currentLanguage(): string {
    return localStorage.getItem('language') || 'en';
  }
}
