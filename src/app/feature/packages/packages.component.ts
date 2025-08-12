import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { MockPackage, mockPackages } from '../../shared/mocks/packages.mock';
import { Package } from '../../shared/model/package.model';
import { PackageService } from '../../shared/services/packages/package.service';
import { AddPackageComponent } from './add-package/add-package.component';
import 'bootstrap';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, AddPackageComponent],
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css'],
})
export class PackagesComponent implements OnInit {
  packages: Package[] = [];
  iconStep1Visible: boolean = false;
  iconStep2Visible: boolean = false;
  iconStep3Visible: boolean = false;
  isModalClosed: boolean = false;

  viewMode: 'list' | 'cards' = 'list';

  constructor(private packageService: PackageService) {}

  ngOnInit(): void {
    this.loadPackages();
    this.viewMode = localStorage.getItem('viewMode') as 'list' | 'cards' || 'list';
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

  handleIconChange(show: boolean) {
    this.iconStep1Visible = show;
  }

  handleIconChange2(show: boolean) {
    this.iconStep2Visible = show;
  }

  handleIconChange3(show: boolean) {
    this.iconStep3Visible = show;
  }

  closeModal(closeMd: boolean) {
    this.loadPackages();
    if (closeMd) {
      // const modalEl = document.getElementById('addPackage');
      // if (modalEl) {
      //   const modalInstance = window.bootstrap.Modal.getInstance(modalEl);
      //   modalInstance?.hide();
      // }
    }
  }
}
