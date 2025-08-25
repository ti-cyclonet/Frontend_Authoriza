import { Component, OnInit } from '@angular/core';
import { Contract } from '../../shared/model/contract.model';
import { ContractService } from '../../shared/services/contracts/contract.service';
import { CommonModule } from '@angular/common';
import { AddContractComponent } from './add-contract/add-contract.component';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, AddContractComponent],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.css',
})
export class ContractsComponent implements OnInit {
  contracts: Contract[] = [];
  total: number = 0;
  page: number = 1;
  limit: number = 10;
  totalPages: number = 0;

  statuses: string[] = ['DRAFT', 'ACTIVE', 'EXPIRED'];
  selectedStatus: string | undefined;
  Math: any = window.Math;

  showAddContractModal: boolean = false;

  constructor(private contractService: ContractService) {}

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
}
