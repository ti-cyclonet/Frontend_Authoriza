import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  PaginatedResponse,
  UserService,
} from '../../../shared/services/user/user.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/model/user';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Package } from '../../../shared/model/package.model';
import { PackageService } from '../../../shared/services/packages/package.service';
import {
  ContractService,
  ContractStatus,
  CreateContractDto,
} from '../../../shared/services/contracts/contract.service';
import { Contract } from '../../../shared/model/contract.model';
import Swal from 'sweetalert2';
import { CurrencyFormatPipe } from '../../../shared/pipes/custom-currency.pipe';

@Component({
  selector: 'app-add-contract',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IconComponent,
    CurrencyFormatPipe,
  ],
  templateUrl: './add-contract.component.html',
  styleUrl: './add-contract.component.css',
})
export class AddContractComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() close2 = new EventEmitter<void>();

  step1: boolean = true;
  step2: boolean = false;
  step3: boolean = false;

  showStp1: boolean = false;
  showStp2: boolean = false;
  showStp3: boolean = false;

  allUsers: User[] = [];
  usersWithoutDependency: User[] = [];

  selectedUser: User | null = null;
  selectedPackage: Package | null = null;

  allPackages: Package[] = [];

  currentPage: number = 0;
  totalUsers: number = 0;
  readonly PAGE_SIZE = 5;
  totalPages: number = 0;

  currentPackagePage: number = 1;
  totalPackagePages: number = 0;
  totalPackages: number = 0;
  readonly PACKAGE_PAGE_SIZE = 5;

  search = new FormControl<string>('', { nonNullable: true });
  searchTerm = '';

  searchPackage = new FormControl<string>('', { nonNullable: true });
  packageSearchTerm = '';

  contractForm: FormGroup;
  contractValue: number = 0;

  contractStatus = ContractStatus;
  statusOptions = Object.values(ContractStatus);

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private packageService: PackageService,
    private contractService: ContractService
  ) {
    this.contractForm = this.fb.group({
      value: [null, Validators.required],
      mode: ['MONTHLY', Validators.required],
      payday: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      status: ['PENDING', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUsersWithoutDependency();
    this.loadPackages();

    this.search.valueChanges.subscribe((value) => {
      this.searchTerm = value || '';
      this.currentPage = 1;
      this.updatePagination();
      this.cdr.detectChanges();
    });

    this.searchPackage.valueChanges.subscribe((value) => {
      this.packageSearchTerm = value || '';
      this.currentPackagePage = 1;
      this.updatePackagePagination();
    });

    this.contractForm = this.fb.group({
      value: [{ value: 0, disabled: true }],
      mode: ['MONTHLY', Validators.required],
      payday: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      status: ['PENDING', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  calculateContractValue(pkgId: string) {
    const selectedPkg = this.allPackages.find((p) => p.id === pkgId);

    if (!selectedPkg || !selectedPkg.configurations) {
      this.contractForm.get('value')?.setValue(0);
      this.contractValue = 0;
      return;
    }

    const total = selectedPkg.configurations.reduce((sum, config) => {
      const qty = config.totalAccount || 0;
      const price = parseFloat(config.price) || 0;
      return sum + qty * price * 12;
    }, 0);

    this.contractForm.get('value')?.setValue(total);
    this.contractValue = total;
  }

  onSelectPackage(pkg: Package) {
    this.selectedPackage = pkg;
    this.calculateContractValue(pkg.id);
  }

  loadUsersWithoutDependency(): void {
    this.userService.getIndependentUsers().subscribe({
      next: (users: User[]) => {
        this.usersWithoutDependency = users;
        this.updatePagination();

        this.totalPages = Math.ceil(this.totalUsers / this.PAGE_SIZE);
        this.currentPage = 1;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar usuarios independientes:', err);
      },
    });
  }

  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredUsers.slice(start, start + this.PAGE_SIZE);
  }

  get filteredUsers(): User[] {
    const q = (this.searchTerm || '').trim().toLowerCase();
    if (!q) return this.usersWithoutDependency;

    return this.usersWithoutDependency.filter((u) => {
      const fields: string[] = [];

      fields.push(u.strUserName ?? '');

      if (u.basicData?.naturalPersonData) {
        const np = u.basicData.naturalPersonData;
        fields.push(np.firstName ?? '');
        fields.push(np.secondName ?? '');
        fields.push(np.firstSurname ?? '');
        fields.push(np.secondSurname ?? '');
      }

      if (u.basicData?.legalEntityData) {
        const le = u.basicData.legalEntityData;
        fields.push(le.businessName ?? '');
      }

      return fields.some((f) => f.toLowerCase().includes(q));
    });
  }

  cancelSelection(): void {
    this.selectedUser = null;
    this.search.setValue('');
    this.currentPage = 1;
    this.loadUsersWithoutDependency();
  }

  updatePagination(): void {
    this.totalUsers = this.filteredUsers.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalUsers / this.PAGE_SIZE));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Logica para paquetes
  // ----------------------------------------
  loadPackages(): void {
    this.packageService.getAllPackages().subscribe({
      next: (pkgs: Package[]) => {
        this.allPackages = pkgs;
        this.updatePackagePagination();
      },
      error: (err) => console.error('Error al cargar paquetes:', err),
    });
  }

  get filteredPackages(): Package[] {
    const q = (this.packageSearchTerm || '').trim().toLowerCase();
    if (!q) return this.allPackages;
    return this.allPackages.filter(
      (p) =>
        (p.name ?? '').toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    );
  }

  get paginatedPackages(): Package[] {
    const start = (this.currentPackagePage - 1) * this.PACKAGE_PAGE_SIZE;
    return this.filteredPackages.slice(start, start + this.PACKAGE_PAGE_SIZE);
  }

  updatePackagePagination(): void {
    this.totalPackages = this.filteredPackages.length;
    this.totalPackagePages = Math.max(
      1,
      Math.ceil(this.totalPackages / this.PACKAGE_PAGE_SIZE)
    );
    this.currentPackagePage = Math.min(
      this.currentPackagePage,
      this.totalPackagePages
    );
    this.cdr.detectChanges();
  }

  nextPackagePage(): void {
    if (this.currentPackagePage < this.totalPackagePages) {
      this.currentPackagePage++;
    }
  }

  prevPackagePage(): void {
    if (this.currentPackagePage > 1) {
      this.currentPackagePage--;
    }
  }

  cancelSelectionP(): void {
    this.selectedPackage = null;
    this.searchPackage.setValue('');
    this.currentPackagePage = 1;
    this.loadPackages();
  }

  // ---------------------------------------

  goToStep(direction: number) {
    if (direction === -1) {
      if (this.step3) {
        this.step3 = false;
        this.step2 = true;
        this.step1 = false;
        this.showStepIcons(true, false, false);
      } else if (this.step2) {
        this.step2 = false;
        this.step1 = true;
        this.step3 = false;
        this.showStepIcons(false, false, false);
      }
    } else {
      if (this.step1) {
        this.step1 = false;
        this.step2 = true;
        this.step3 = false;
        this.showStepIcons(true, false, false);
      } else if (this.step2) {
        this.step2 = false;
        this.step3 = true;
        this.step1 = false;
        this.showStepIcons(true, true, false);
      }
    }
  }

  submitContract(): void {
    if (!this.selectedUser) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please select a user',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    if (!this.selectedPackage) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please select a package',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Form Incomplete',
        text: 'Please fill all required fields',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const formValues = this.contractForm.getRawValue();

    const payload: CreateContractDto = {
      userId: this.selectedUser.id,
      packageId: this.selectedPackage.id,
      value: formValues.value,
      mode: formValues.mode,
      payday: formValues.payday,
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      status: formValues.status || ContractStatus.DRAFT,
    };

    this.contractService.createContract(payload).subscribe({
      next: (response: Contract) => {
        this.showStepIcons(true, true, true);
        console.log('Contrato creado con éxito:', response);

        Swal.fire({
          icon: 'success',
          title: 'Contract successfully created!',
          timer: 2000,
          showConfirmButton: false,
          willClose: () => {
            this.close.emit();
          },
        });
      },
      error: (error) => {
        console.error('Error al crear contrato:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'There was an error creating the contract.',
          timer: 2500,
          showConfirmButton: false,
        });
      },
    });
  }

  showStepIcons(stp1: boolean, stp2: boolean, stp3: boolean): void {
    this.showStp1 = stp1;
    this.showStp2 = stp2;
    this.showStp3 = stp3;
  }

  onCancel(): void {
    this.close.emit();
  }
}
