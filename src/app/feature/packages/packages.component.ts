import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { MockPackage, mockPackages } from '../../shared/mocks/packages.mock';
import { Package } from '../../shared/model/package.model';
import { PackageService } from '../../shared/services/packages/package.service';
import { AddPackageComponent } from './add-package/add-package.component';
import 'bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, AddPackageComponent],
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

  constructor(private packageService: PackageService) {}

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
      title: 'Package created',
      text: 'The package was created successfully',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }
}
