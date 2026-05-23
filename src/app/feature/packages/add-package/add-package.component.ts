import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
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
  UsageLimitVariableDTO,
} from '../../../shared/model/new-package-dto';
import { Package } from '../../../shared/model/package.model';
import { ApplicationsService } from '../../../shared/services/applications/applications.service';
import { Application } from '../../../shared/model/application.model';
import { forkJoin } from 'rxjs';
import * as bootstrap from 'bootstrap';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-add-package',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './add-package.component.html',
  styleUrl: './add-package.component.css',
})
export class AddPackageComponent implements OnInit {
  @Input() packageToEdit: Package | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() close2 = new EventEmitter<void>();
  basicPackageForm: FormGroup;
  limitsForm: FormGroup;
  checkingName = false;
  nameExists = false;
  disabled = true;
  showConfigurationRecord = false;

  step1: boolean = true;
  step2: boolean = false;
  step3: boolean = false;
  step4: boolean = false;

  showStp1: boolean = false;
  showStp2: boolean = false;
  showStp3: boolean = false;
  showStp4: boolean = false;

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

  // Variables de límite dinámicas
  limitVariables: { variableName: string; displayName: string; maxValue: number; targetApplication: string }[] = [];
  showAddLimitRecord: boolean = false;
  showConfiguredLimits: boolean = true;
  showAvailableLimits: boolean = false;
  limitSearchText: string = '';
  limitCurrentPage: number = 0;
  readonly LIMIT_PAGE_SIZE = 5;
  configuredLimitsPage: number = 0;
  readonly CONFIGURED_LIMITS_PAGE_SIZE = 5;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private packageService: PackageService,
    private translationService: TranslationService
  ) {
    this.basicPackageForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      isBillable: [true],
    });

    this.limitsForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadApplicationsAndRoles();
    this.preloadPackageData();
  }

  /** Precarga los datos del paquete en modo edición */
  private preloadPackageData(): void {
    if (!this.packageToEdit) return;

    // Precargar datos básicos
    this.basicPackageForm.patchValue({
      name: this.packageToEdit.name,
      description: this.packageToEdit.description,
      price: (this.packageToEdit as any).price || 0,
      isBillable: (this.packageToEdit as any).isBillable !== false,
    });

    // Precargar variables de límite de uso (dinámicas)
    if (this.packageToEdit.usageLimitVariables?.length) {
      this.limitVariables = this.packageToEdit.usageLimitVariables.map((v: any) => ({
        variableName: v.variableName,
        displayName: v.displayName,
        maxValue: v.maxValue,
        targetApplication: v.targetApplication,
      }));
    }

    // Precargar configuraciones de roles
    if (this.packageToEdit.configurations?.length) {
      this.roleConfigs = this.packageToEdit.configurations.map((config) => ({
        rolId: config.rol?.id ?? '',
        roleName: config.rol?.strName ?? '',
        totalAccount: config.totalAccount,
        price: parseFloat(config.price),
      }));
      this.updateHasRoleConfigs();
    }
  }

  showStepIcons(stp1: boolean, stp2: boolean, stp3: boolean, stp4: boolean = false): void {
    this.showStp1 = stp1;
    this.showStp2 = stp2;
    this.showStp3 = stp3;
    this.showStp4 = stp4;
  }

  formOneValid(): void {
    const name = this.basicPackageForm.value.name?.trim();

    if (!name) return;

    // En modo edición, saltar la validación de nombre
    if (this.packageToEdit) {
      if (this.basicPackageForm.valid) {
        this.showStepIcons(true, false, false, false);
        this.step1 = false;
        this.step2 = true;
        this.step3 = false;
        this.step4 = false;
      }
      return;
    }

    this.checkingName = true;
    this.packageService.checkPackageName(name).subscribe({
      next: (res) => {
        this.nameExists = res.exists;
        this.checkingName = false;

        if (!res.exists && this.basicPackageForm.valid) {
          this.showStepIcons(true, false, false, false);
          this.step1 = false;
          this.step2 = true;
          this.step3 = false;
          this.step4 = false;
        }
      },
      error: (err) => {
        this.checkingName = false;
        console.error('Error checking name:', err);
      },
    });
  }

  formTwoValid(): void {
    this.showStepIcons(true, true, false, false);
    this.step1 = false;
    this.step2 = false;
    this.step3 = true;
    this.step4 = false;
  }

  formThreeValid(): void {
    this.showStepIcons(true, true, true, false);
    this.step1 = false;
    this.step2 = false;
    this.step3 = false;
    this.step4 = true;
  }

  private updateHasRoleConfigs(): void {
    this.hasRoleConfigs = this.roleConfigs.length > 0;
  }

  async onAddRole(rol: Rol) {
    const { value: formValues } = await Swal.fire({
      title: this.translationService.translate('packages.createPackage.addRoleConfig').replace('{roleName}', `<b>${rol.strName}</b>`),
      html: `
      <input id="swal-quantity" type="number" min="1" class="swal2-input" placeholder="${this.translationService.translate('packages.createPackage.quantity')}">
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: this.translationService.translate('packages.createPackage.add'),
      cancelButtonText: this.translationService.translate('common.cancel'),
      preConfirm: () => {
        const quantity = parseInt(
          (document.getElementById('swal-quantity') as HTMLInputElement)?.value
        );

        if (!quantity || quantity <= 0) {
          Swal.showValidationMessage(this.translationService.translate('packages.createPackage.enterValidValues'));
          return;
        }

        return { quantity };
      },
    });

    if (formValues) {
      const newConfig: RoleConfigurationDTO = {
        rolId: rol.id,
        roleName: rol.strName,
        totalAccount: formValues.quantity,
        price: 0,
      };

      this.roleConfigs.push(newConfig);
      this.updateHasRoleConfigs();
      this.showConfigurationRecord = true;

      Swal.fire({
        icon: 'success',
        title: this.translationService.translate('packages.createPackage.roleAdded'),
        text: this.translationService.translate('packages.createPackage.roleAddedSuccess'),
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
      this.step4 = false;
      this.showStepIcons(false, false, false, false);
      this.showConfigurationRecord = false;
    } else if (this.step3) {
      this.step1 = false;
      this.step2 = true;
      this.step3 = false;
      this.step4 = false;
      this.showStepIcons(true, false, false, false);
      this.showConfigurationRecord = false;
    } else if (this.step4) {
      this.step1 = false;
      this.step2 = false;
      this.step3 = true;
      this.step4 = false;
      this.showStepIcons(true, true, false, false);
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
    this.limitsForm.reset({
      nAdmin: 0,
      nMateriales: 0,
      nMaterialesT: 0,
      nProductos: 0,
      nLotes: 0,
      nClientes: 0,
      nVentas: 0,
      nSesionesCap: 0,
    });
    this.showStepIcons(false, false, false, false);
    this.step1 = true;
    this.step2 = false;
    this.step3 = false;
    this.step4 = false;
    this.showConfigurationRecord = false;
    this.searchText = '';
    this.updateHasRoleConfigs();
    this.filterRoles();
  }

  /** Mapeo de variables disponibles para sugerir */
  readonly availableLimitVariables: { variableName: string; displayName: string; targetApplication: string }[] = [
    { variableName: 'nMateriales', displayName: 'Materiales', targetApplication: 'Inout' },
    { variableName: 'nMaterialesT', displayName: 'Materiales Compuestos', targetApplication: 'Inout' },
    { variableName: 'nProductos', displayName: 'Productos', targetApplication: 'Inout' },
    { variableName: 'nLotes', displayName: 'Lotes de Producción', targetApplication: 'Inout' },
    { variableName: 'nClientes', displayName: 'Clientes', targetApplication: 'Inout' },
    { variableName: 'nVentas', displayName: 'Ventas', targetApplication: 'Inout' },
    { variableName: 'nSesionesCap', displayName: 'Sesiones de Capacitación', targetApplication: 'Inout' },
    { variableName: 'nDiasUso', displayName: 'Límite Temporal de Uso (días)', targetApplication: 'Inout' },
  ];

  get filteredLimitVariables() {
    const added = this.limitVariables.map(v => v.variableName);
    let available = this.availableLimitVariables.filter(v => !added.includes(v.variableName));
    if (this.limitSearchText.trim()) {
      const term = this.limitSearchText.toLowerCase();
      available = available.filter(v => 
        v.displayName.toLowerCase().includes(term) || 
        v.variableName.toLowerCase().includes(term) ||
        v.targetApplication.toLowerCase().includes(term)
      );
    }
    return available;
  }

  get pagedLimitVariables() {
    const start = this.limitCurrentPage * this.LIMIT_PAGE_SIZE;
    return this.filteredLimitVariables.slice(start, start + this.LIMIT_PAGE_SIZE);
  }

  get totalLimitPages(): number {
    return Math.ceil(this.filteredLimitVariables.length / this.LIMIT_PAGE_SIZE);
  }

  limitNextPage() {
    if ((this.limitCurrentPage + 1) * this.LIMIT_PAGE_SIZE < this.filteredLimitVariables.length) {
      this.limitCurrentPage++;
    }
  }

  limitPreviousPage() {
    if (this.limitCurrentPage > 0) {
      this.limitCurrentPage--;
    }
  }

  isLimitAdded(variableName: string): boolean {
    return this.limitVariables.some(v => v.variableName === variableName);
  }

  async addLimitVariable(variable: { variableName: string; displayName: string; targetApplication: string }) {
    const placeholder = variable.variableName === 'nDiasUso' ? 'Número de días (0 = ilimitado)' : 'Cantidad máxima';

    const { value: maxValue } = await Swal.fire({
      title: `Configurar: <b>${variable.displayName}</b>`,
      html: `<p style="font-size:0.85rem;color:#666">Aplicación: ${variable.targetApplication}</p>
             <input id="swal-limit-value" type="number" min="0" class="swal2-input" placeholder="${placeholder}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const val = parseInt((document.getElementById('swal-limit-value') as HTMLInputElement)?.value);
        if (isNaN(val) || val < 0) {
          Swal.showValidationMessage('Ingrese un valor entero ≥ 0');
          return;
        }
        return val;
      }
    });

    if (maxValue !== undefined) {
      this.limitVariables.push({
        variableName: variable.variableName,
        displayName: variable.displayName,
        maxValue: maxValue,
        targetApplication: variable.targetApplication
      });
      this.cdr.detectChanges();
    }
  }

  removeLimitVariable(variableName: string) {
    this.limitVariables = this.limitVariables.filter(v => v.variableName !== variableName);
    // Reset page if needed
    if (this.configuredLimitsPage > 0 && this.pagedConfiguredLimits.length === 0) {
      this.configuredLimitsPage--;
    }
  }

  get pagedConfiguredLimits() {
    const start = this.configuredLimitsPage * this.CONFIGURED_LIMITS_PAGE_SIZE;
    return this.limitVariables.slice(start, start + this.CONFIGURED_LIMITS_PAGE_SIZE);
  }

  get totalConfiguredLimitsPages(): number {
    return Math.ceil(this.limitVariables.length / this.CONFIGURED_LIMITS_PAGE_SIZE);
  }

  configuredLimitsNextPage() {
    if ((this.configuredLimitsPage + 1) * this.CONFIGURED_LIMITS_PAGE_SIZE < this.limitVariables.length) {
      this.configuredLimitsPage++;
    }
  }

  configuredLimitsPreviousPage() {
    if (this.configuredLimitsPage > 0) {
      this.configuredLimitsPage--;
    }
  }

  async editLimitVariable(limit: { variableName: string; displayName: string; maxValue: number; targetApplication: string }) {
    const placeholder = limit.variableName === 'nDiasUso' ? 'Número de días (0 = ilimitado)' : 'Cantidad máxima';

    const { value: newValue } = await Swal.fire({
      title: `Editar: <b>${limit.displayName}</b>`,
      input: 'number',
      inputValue: limit.maxValue,
      inputAttributes: { min: '0', placeholder },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (value === '' || parseInt(value) < 0) {
          return 'Ingrese un valor entero ≥ 0';
        }
        return null;
      }
    });

    if (newValue !== undefined) {
      const idx = this.limitVariables.findIndex(v => v.variableName === limit.variableName);
      if (idx >= 0) {
        this.limitVariables[idx].maxValue = parseInt(newValue);
        this.cdr.detectChanges();
      }
    }
  }

  async addCustomLimitVariable() {
    const { value: formValues } = await Swal.fire({
      title: 'Agregar Variable Personalizada',
      html: `
        <input id="swal-var-name" type="text" class="swal2-input" placeholder="Nombre de variable (ej: nAlmacenes)">
        <input id="swal-var-display" type="text" class="swal2-input" placeholder="Nombre visible (ej: Almacenes)">
        <input id="swal-var-app" type="text" class="swal2-input" placeholder="Aplicación (ej: Inout)" value="Inout">
        <input id="swal-var-value" type="number" min="0" class="swal2-input" placeholder="Cantidad máxima">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const variableName = (document.getElementById('swal-var-name') as HTMLInputElement)?.value.trim();
        const displayName = (document.getElementById('swal-var-display') as HTMLInputElement)?.value.trim();
        const targetApplication = (document.getElementById('swal-var-app') as HTMLInputElement)?.value.trim();
        const maxValue = parseInt((document.getElementById('swal-var-value') as HTMLInputElement)?.value);

        if (!variableName || !displayName || !targetApplication) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return;
        }
        if (isNaN(maxValue) || maxValue < 0) {
          Swal.showValidationMessage('Ingrese un valor entero ≥ 0');
          return;
        }
        if (this.limitVariables.some(v => v.variableName === variableName)) {
          Swal.showValidationMessage('Ya existe una variable con ese nombre');
          return;
        }

        return { variableName, displayName, targetApplication, maxValue };
      }
    });

    if (formValues) {
      this.limitVariables.push(formValues);
      this.cdr.detectChanges();
    }
  }

  /** Transforma las variables dinámicas al formato UsageLimitVariableDTO[] */
  buildUsageLimitVariables(): UsageLimitVariableDTO[] {
    return this.limitVariables.map(v => ({
      variableName: v.variableName,
      displayName: v.displayName,
      maxValue: v.maxValue,
      targetApplication: v.targetApplication,
    }));
  }

  submitPackage(): void {
    const dto: NewPackageDTO = {
      name: this.basicPackageForm.value.name,
      description: this.basicPackageForm.value.description,
      price: this.basicPackageForm.value.price || 0,
      isBillable: this.basicPackageForm.value.isBillable ?? true,
      configurations: this.roleConfigs,
      images: this.images,
      usageLimitVariables: this.buildUsageLimitVariables(),
    };

    if (this.packageToEdit) {
      // Modo edición
      this.packageService.updatePackage(this.packageToEdit.id, {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        isBillable: dto.isBillable,
        usageLimitVariables: dto.usageLimitVariables,
      }).subscribe({
        next: () => {
          this.showStepIcons(true, true, true, true);
          this.onSuccess();
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar',
            text: error?.error?.message || 'No se pudo actualizar el paquete.',
            confirmButtonText: 'OK',
          });
          console.error('Error updating package:', error);
        },
      });
    } else {
      // Modo creación
      this.packageService.createPackage(dto, this.imageFiles).subscribe({
        next: () => {
          this.showStepIcons(true, true, true, true);
          this.onSuccess();
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: this.translationService.translate('packages.createPackage.errorCreating'),
            text: this.translationService.translate('packages.createPackage.errorSaving'),
            confirmButtonText: this.translationService.translate('common.ok'),
          });
          console.error('Error creating package:', error);
        },
      });
    }
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
      title: this.translationService.translate('packages.createPackage.roleInfo'),
      html: `
      <strong>${this.translationService.translate('packages.createPackage.application')}:</strong> ${this.getApplicationName(config.rolId)}<br>
      <strong>${this.translationService.translate('packages.createPackage.roleName')}:</strong> ${config.roleName}<br>
      <strong>${this.translationService.translate('packages.createPackage.quantity')}:</strong> ${config.totalAccount}<br>
      <strong>${this.translationService.translate('packages.createPackage.unitPrice')}:</strong> $${config.price} COP
    `,
      icon: 'info',
    });
  }

  editRole(config: RoleConfigurationDTO): void {
    Swal.fire({
      title: this.translationService.translate('packages.createPackage.editRole'),
      html: `
      <input id="quantity" class="swal2-input" placeholder="${this.translationService.translate('packages.createPackage.quantity')}" value="${config.totalAccount}" />
      <input id="price" class="swal2-input" placeholder="${this.translationService.translate('packages.createPackage.unitPrice')} (COP)" value="${config.price}" />
    `,
      showCancelButton: true,
      confirmButtonText: this.translationService.translate('packages.createPackage.update'),
      cancelButtonText: this.translationService.translate('common.cancel'),
      preConfirm: () => {
        const quantity = Number(
          (<HTMLInputElement>Swal.getPopup()!.querySelector('#quantity')).value
        );
        const price = Number(
          (<HTMLInputElement>Swal.getPopup()!.querySelector('#price')).value
        );
        if (isNaN(quantity) || isNaN(price)) {
          Swal.showValidationMessage(this.translationService.translate('packages.createPackage.enterValidNumbers'));
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
