import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PackageService } from '../../../shared/services/packages/package.service';
import { Rol } from '../../../shared/model/rol';
import Swal from 'sweetalert2';
import {
  NewPackageDTO,
  RoleConfigurationDTO,
} from '../../../shared/model/new-package-dto';
import { ApplicationsService } from '../../../shared/services/applications/applications.service';
import { Application } from '../../../shared/model/application.model';
import { forkJoin } from 'rxjs';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-add-package',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-package.component.html',
  styleUrl: './add-package.component.css',
})
export class AddPackageComponent {
  @Output() close = new EventEmitter<void>();
  @Output() close2 = new EventEmitter<void>();
  basicPackageForm: FormGroup;
  checkingName = false;
  nameExists = false;
  disabled = true;
  showConfigurationRecord = false;

  step1: boolean = true;
  step2: boolean = false;
  step3: boolean = false;

  showStp1: boolean = false;
  showStp2: boolean = false;
  showStp3: boolean = false;

  roles: Rol[] = [];
  totalRoles: number = 0;
  currentPage: number = 0;
  readonly PAGE_SIZE = 5;
  Math = Math;

  applications: Application[] = [];
  rolesByApplication: { [appId: string]: Rol[] } = {};
  filteredRoles: { application: string; role: Rol }[] = [];
  pagedRoles: { application: string; role: Rol }[] = [];
  roleConfigs: RoleConfigurationDTO[] = [];

  images: File[] = [];

  imageFiles: File[] = [];
  previewImages: string[] = [];
  defaultImage: string = './assets/img/default-package.png';

  searchText: string = '';
  hasRoleConfigs: boolean = false;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private packageService: PackageService
  ) {
    this.basicPackageForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadApplicationsAndRoles();
  }

  showStepIcons(stp1: boolean, stp2: boolean, stp3: boolean): void {
    this.showStp1 = stp1;
    this.showStp2 = stp2;
    this.showStp3 = stp3;
  }

  formOneValid(): void {
    const name = this.basicPackageForm.value.name?.trim();

    if (!name) return;

    this.checkingName = true;
    this.packageService.checkPackageName(name).subscribe({
      next: (res) => {
        this.nameExists = res.exists;
        this.checkingName = false;

        if (!res.exists && this.basicPackageForm.valid) {
          this.showStepIcons(true, false, false);
          this.step1 = false;
          this.step2 = true;
          this.step3 = false;
        }
      },
      error: (err) => {
        this.checkingName = false;
        console.error('Error checking name:', err);
      },
    });
  }

  formTwoValid(): void {
    this.showStepIcons(true, true, false);
    this.step1 = false;
    this.step2 = false;
    this.step3 = true;
  }

  private updateHasRoleConfigs(): void {
    this.hasRoleConfigs = this.roleConfigs.length > 0;
  }

  async onAddRole(rol: Rol) {
    const { value: formValues } = await Swal.fire({
      title: `Add configuration for role: <b>${rol.strName}</b>`,
      html: `
      <input id="swal-quantity" type="number" min="1" class="swal2-input" placeholder="Quantity">
      <input id="swal-price" type="number" min="0" step="0.01" class="swal2-input" placeholder="Unit price (COP)">
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Add',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const quantity = parseInt(
          (document.getElementById('swal-quantity') as HTMLInputElement)?.value
        );
        const unitPrice = parseFloat(
          (document.getElementById('swal-price') as HTMLInputElement)?.value
        );

        if (!quantity || isNaN(unitPrice) || quantity <= 0 || unitPrice < 0) {
          Swal.showValidationMessage('Please enter valid values');
          return;
        }

        return { quantity, unitPrice };
      },
    });

    if (formValues) {
      const newConfig: RoleConfigurationDTO = {
        rolId: rol.id,
        roleName: rol.strName,
        totalAccount: formValues.quantity,
        price: formValues.unitPrice,
      };

      this.roleConfigs.push(newConfig);
      this.updateHasRoleConfigs();
      this.showConfigurationRecord = true;

      Swal.fire({
        icon: 'success',
        title: 'Role added',
        text: `Quantity: ${formValues.quantity}, Unit price: $${formValues.unitPrice}`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  }

  isRoleAdded(roleId: string): boolean {
    return this.roleConfigs.some((config) => config.rolId === roleId);
  }

  get canGoNext(): boolean {
    return this.roleConfigs.length > 0;
  }

  loadApplicationsAndRoles(): void {
    this.packageService.getApplications().subscribe((apps) => {
      this.applications = apps;

      const allRoles: { application: string; role: Rol }[] = [];

      apps.forEach((app) => {
        app.strRoles.forEach((role) => {
          allRoles.push({ application: app.strName, role });
        });
      });

      this.filteredRoles = allRoles;
      this.filterRoles();
    });
  }

  filterRoles(): void {
    const search = this.searchText.toLowerCase();

    this.filteredRoles = this.applications.flatMap((app) =>
      app.strRoles
        .filter(
          (role) =>
            role.strName.toLowerCase().includes(search) ||
            app.strName.toLowerCase().includes(search)
        )
        .map((role) => ({
          application: app.strName,
          role,
        }))
    );

    this.totalRoles = this.filteredRoles.length;
    this.currentPage = 0;
    this.updatePagedRoles();
  }

  clearSearch(): void {
    this.searchText = '';
    this.filteredRoles = this.applications.flatMap((app) =>
      app.strRoles.map((role) => ({
        application: app.strName,
        role,
      }))
    );
    this.totalRoles = this.filteredRoles.length;
    this.currentPage = 0;
    this.updatePagedRoles();
  }

  updatePagedRoles(): void {
    const start = this.currentPage * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    this.pagedRoles = this.filteredRoles.slice(start, end);
  }

  nextPage() {
    if ((this.currentPage + 1) * this.PAGE_SIZE < this.totalRoles) {
      this.currentPage++;
      this.updatePagedRoles();
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagedRoles();
    }
  }

  onFilterChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchText = target.value;
    this.filterRoles();
  }

  onPrevious() {
    if (this.step2) {
      this.step1 = true;
      this.step2 = false;
      this.step3 = false;
      this.showStepIcons(false, false, false);
      this.showConfigurationRecord = false;
    }
    if (this.step3) {
      this.step2 = true;
      this.step3 = false;
      this.showStepIcons(true, false, false);
      this.showConfigurationRecord = false;
    }
  }

  onCancel(): void {
    this.cleanForm();
    this.close.emit();
  }

  onSuccess(): void {
    this.cleanForm();
    this.close2.emit();
  }

  cleanForm(): void {
    this.roleConfigs = [];
    this.nameExists = false;
    this.basicPackageForm.reset();
    this.showStepIcons(false, false, false);
    this.step1 = true;
    this.step2 = false;
    this.step3 = false;
    this.showConfigurationRecord = false;
    this.searchText = '';
    this.updateHasRoleConfigs();
    this.filterRoles();
  }

  submitPackage(): void {
    const dto: NewPackageDTO = {
      name: this.basicPackageForm.value.name,
      description: this.basicPackageForm.value.description,
      configurations: this.roleConfigs,
      images: this.images,
    };

    this.packageService.createPackage(dto, this.imageFiles).subscribe({
      next: () => {
        this.showStepIcons(true, true, true);
        this.onSuccess();
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error creating package',
          text: 'There was a problem saving your data. Please try again.',
          confirmButtonText: 'Accept',
        });
        console.error('Error creating package:', error);
      },
    });
  }

  getTotalPrice(): number {
    return this.roleConfigs.reduce(
      (acc, config) => acc + config.totalAccount * config.price,
      0
    );
  }

  removeRoleConfig(roleId: string): void {
    this.roleConfigs = this.roleConfigs.filter((c) => c.rolId !== roleId);
    this.updateHasRoleConfigs();
  }

  viewRole(config: RoleConfigurationDTO): void {
    Swal.fire({
      title: 'Role Info',
      html: `
      <strong>Application:</strong> ${this.getApplicationName(config.rolId)}<br>
      <strong>Role:</strong> ${config.roleName}<br>
      <strong>Quantity:</strong> ${config.totalAccount}<br>
      <strong>Unit Price:</strong> $${config.price} COP
    `,
      icon: 'info',
    });
  }

  editRole(config: RoleConfigurationDTO): void {
    Swal.fire({
      title: 'Edit Role',
      html: `
      <input id="quantity" class="swal2-input" placeholder="Quantity" value="${config.totalAccount}" />
      <input id="price" class="swal2-input" placeholder="Unit Price" value="${config.price}" />
    `,
      showCancelButton: true,
      confirmButtonText: 'Update',
      preConfirm: () => {
        const quantity = Number(
          (<HTMLInputElement>Swal.getPopup()!.querySelector('#quantity')).value
        );
        const price = Number(
          (<HTMLInputElement>Swal.getPopup()!.querySelector('#price')).value
        );
        if (isNaN(quantity) || isNaN(price)) {
          Swal.showValidationMessage(`Please enter valid numbers.`);
          return;
        }
        return { quantity, unitPrice: price };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        config.totalAccount = result.value.quantity;
        config.price = result.value.unitPrice;
      }
    });
  }

  getApplicationName(roleId: string): string {
    const app = this.applications.find((a) =>
      a.strRoles.some((r) => r.id === roleId)
    );
    return app?.strName ?? 'Unknown';
  }

  getApplicationNameByRoleId(roleId: string): string {
    const app = this.applications.find((app) =>
      app.strRoles.some((r) => r.id === roleId)
    );
    return app?.strName || 'N/A';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files).slice(
      0,
      3 - this.previewImages.length
    );

    for (const file of files) {
      this.imageFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          this.previewImages.push(result);
        }
      };
      reader.readAsDataURL(file);
    }

    input.value = '';

    setTimeout(() => {
      const carousel = document.querySelector('#imageCarousel');
      if (carousel) {
        const bsCarousel =
          bootstrap.Carousel.getInstance(carousel) ||
          new bootstrap.Carousel(carousel);
        bsCarousel.to(0);
      }
    });
  }

  removeImage(index: number): void {
    this.previewImages.splice(index, 1);
    this.imageFiles.splice(index, 1);
  }
}
