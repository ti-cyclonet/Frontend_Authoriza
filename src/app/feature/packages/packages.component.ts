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

  constructor(private packageService: PackageService) {}

  ngOnInit(): void {
    this.loadPackages();
    this.viewMode =
      (localStorage.getItem('viewMode') as 'list' | 'cards') || 'list';
  }

  setView(mode: 'list' | 'cards') {
    this.viewMode = mode;
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
