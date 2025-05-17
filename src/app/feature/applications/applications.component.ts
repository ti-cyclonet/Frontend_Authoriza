import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ApplicationsService } from '../../shared/services/applications/applications.service';
import { CuApplicationComponent } from './cu-application/cu-application.component';
import { NotificationsComponent } from '../../shared/components/notifications/notifications.component';
import { CommonModule } from '@angular/common';
import { Application } from '../../shared/model/application.model';
import { MenuOption } from '../../shared/model/menu_option';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ImageModalComponent } from '../../shared/components/image-modal/image-modal.component';
import { CuRolComponent } from './cu-rol/cu-rol.component';
import { Subject, takeUntil } from 'rxjs';
import { Rol } from '../../shared/model/rol';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Modal } from 'bootstrap';
import { CuOptionMenuComponent } from './cu-optionmenu/cu-optionmenu.component';
declare var bootstrap: any;

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    CuApplicationComponent,
    NotificationsComponent,
    CommonModule,
    FormsModule,
    ImageModalComponent,
    ReactiveFormsModule,
    CuRolComponent,
    CuOptionMenuComponent,
  ],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css'],
})
export class ApplicationsComponent implements OnInit {
  rolesModal?: BsModalRef;
  private destroy$ = new Subject<void>();
  @Input() applications: Application[] = [];
  @Input() localApplications: Application[] = [];
  @ViewChild(CuApplicationComponent) appCuApplication!: CuApplicationComponent;
  @ViewChild('rolesModal') rolesModalElement!: ElementRef;
  @ViewChild('optionMenuModal') optionMenuModal!: ElementRef;
  @Input() appstrName: string | undefined;

  isModalOpen = false;
  isDTOValid: boolean = false;
  isVisible: boolean = true;

  selectedApplication: Application | null = null;
  selectedMenuOptions: MenuOption[] = [];
  selectedRol: any = null;
  selectedSubmenus: any[] = [];
  selectedMenuOption: any | null = null;
  allMenuOptionsForApp: MenuOption[] = [];
  tempAssignedMenuOptions: MenuOption[] = [];

  isModalRolOpen = false;

  // configuración notificaciones tipo toast
  toastTitle: string = '';
  toastType: 'success' | 'warning' | 'danger' | 'primary' = 'success';
  notifications: Array<{
    title: string;
    type: 'success' | 'warning' | 'danger' | 'primary';
    alertType: 'A' | 'B';
    container: 0 | 1;
    visible: boolean;
  }> = [];
  SWNTF: number = 0;
  // ----------------------------------------------

  imagePreview: string | ArrayBuffer | null = null;
  fileName: string = '';
  isRolesTableVisible = false;
  isMenuTableVisible = false;
  isSubmenuTableVisible: boolean = false;
  public selectedApplicationId: string | null = null;
  deleteConfirmationText: string = '';
  isDeleteConfirmed: boolean = false;

  selectedImageUrl: string = '';
  showModal: boolean = false;
  showSaveButton = false;

  constructor(
    public applicationsService: ApplicationsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    public modalRef: BsModalRef
  ) {
    this.notifications = [];
  }

  handleOptionMenuSave(data: MenuOption): void {
    this.closeOptionMenuModal();

    const assignedRolId = this.applicationsService.addTemporaryOptionMenu(
      data,
      this.selectedRol?.id
    );

    if (!assignedRolId) {
      this.showToast('Could not assign the new menu option.', 'danger', 'A', 1);
      return;
    }

    // 1. Quitar de la lista de disponibles (por si estaba allí)
    this.allMenuOptionsForApp = this.allMenuOptionsForApp.filter(
      (m) => m.id !== data.id
    );

    // 2. Buscar el rol actualizado en el DTO
    const dto = this.applicationsService.getApplicationDTO();
    const updatedRol = dto.strRoles.find((r) => r.id === assignedRolId);

    if (updatedRol) {
      // 3. Marcar el rol y la aplicación como TEMPORARY
      updatedRol.strState = 'TEMPORARY';
      dto.strState = 'TEMPORARY';
      this.applicationsService.addOrUpdateApplicationDTO(dto);

      // Actualizar visualmente la aplicación seleccionada
      if (this.selectedApplication) {
        this.selectedApplication.strState = 'TEMPORARY';

        // También actualizar la app en la lista principal
        const index = this.applications.findIndex(
          (app) => app.id === this.selectedApplication!.id
        );
        if (index !== -1) {
          this.applications[index].strState = 'TEMPORARY';
        }
      }

      // 4. Actualizar las variables visuales
      this.selectedRol = { ...updatedRol };
      this.selectedMenuOptions = [...(updatedRol.menuOptions || [])];
      this.tempAssignedMenuOptions.push({ ...data, strState: 'TEMPORARY' });

      // 5. Mostrar toast
      this.showToast(
        `New menu option "${data.strName}" was added temporarily.`,
        'success',
        'A',
        1
      );

      // 6. Forzar render
      this.cdr.detectChanges();
    } else {
      console.warn('⚠️ Rol no encontrado en DTO tras crear opción');
    }
  }

  syncSelectedRolWithDTO(): void {
    if (!this.selectedRol || !this.selectedApplication?.id) return;

    const dto = this.applicationsService.getApplicationDTO();

    const dtoRol = dto.strRoles.find((r) => r.id === this.selectedRol.id);

    if (dtoRol) {
      this.selectedRol = dtoRol;
      this.selectedMenuOptions = [...(dtoRol.menuOptions || [])];
    } else {
      console.warn('No se encontró el rol en el DTO para sincronizar.');
    }
  }

  closeOptionMenuModal() {
    const modalEl = document.getElementById('optionMenuModal');
    if (modalEl) {
      const bsModal = Modal.getInstance(modalEl) || new Modal(modalEl);
      bsModal.hide();
    }
  }

  get allApplications() {
    return [...this.applications, ...this.localApplications];
  }

  openImageModal(imageUrl: string) {
    this.selectedImageUrl = imageUrl;
    this.showModal = true;
  }

  closeImageModal() {
    this.showModal = false;
  }

  // Funciones para NOTIFICACIONES
  addNotification(
    title: string,
    type: 'success' | 'warning' | 'danger' | 'primary',
    alertType: 'A' | 'B',
    container: 0 | 1
  ) {
    this.notifications.push({
      title,
      type,
      alertType,
      container,
      visible: true,
    });
  }

  removeNotification(index: number) {
    this.notifications.splice(index, 1);
  }

  getIconColor() {
    return 'var(--header-background-color)';
  }

  showToast(
    message: string,
    type: 'success' | 'warning' | 'danger' | 'primary',
    alertType: 'A' | 'B',
    container: 0 | 1
  ) {
    const notification = {
      title: message,
      type,
      alertType,
      container,
      visible: true,
    };
    this.notifications.push(notification);
    this.cdr.detectChanges();

    if (alertType === 'A') {
      setTimeout(() => {
        notification.visible = false;
        this.cdr.detectChanges();
      }, 5000);
    }
  }
  // ----------------------------------------------

  get selectedFile() {
    return this.appCuApplication?.selectedFile;
  }

  ngOnInit(): void {
    this.applicationsService.applications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((apps) => (this.applications = apps));

    this.applicationsService.applications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((apps) => {
        this.localApplications = apps;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showRoles(application: Application) {
    if (this.selectedApplication) {
      const dtoCopy = this.applicationsService.getApplicationDTO();
      this.applicationsService.saveCurrentApplicationState(
        this.selectedApplication.id,
        dtoCopy
      );
    }

    this.setSelectedApplication(application);
    this.isRolesTableVisible = true;
  }

  loadApplicationState(appId: string): void {
    const dto = this.applicationsService.getApplicationDTOFor(appId);

    if (dto) {
      this.applicationsService.setApplicationDTO(dto);
    } else {
      const found = this.applications.find((app) => app.id === appId);
      if (found) {
        const newDTO = structuredClone(found);
        this.applicationsService.setApplicationDTOFor(appId, newDTO);
        this.applicationsService.setApplicationDTO(newDTO);
      }
    }

    this.syncSelectedRolWithDTO();
  }

  get hasApplications(): boolean {
    return this.applicationsService.applicationsDTOMap.size > 0;
  }

  async onSaveAllApplications(): Promise<void> {
    let hasValidationError = false;

    this.applicationsService.applicationsDTOMap.forEach((dto, appId) => {
      console.log('Aplicación seleccionada: ', this.selectedApplication);
      console.log('DTO:', dto);
      const isNewApp =
        dto.id?.startsWith('temp-') || dto.id?.startsWith('TEMP-');

      // Solo requerir imagen si es una aplicación nueva
      if (isNewApp && !dto.imageFile) {
        this.showToast(
          `Application "${dto.strName}" must include an image.`,
          'danger',
          'A',
          1
        );
        hasValidationError = true;
        return; // Skip this application
      }

      // Guardar o actualizar el DTO
      this.applicationsService.addOrUpdateApplicationDTO(dto);
    });

    // No continuar si hubo errores de validación
    if (hasValidationError) return;

    const results = await this.applicationsService.saveAllValidApplications();

    results.forEach((result) => {
      this.showToast(result.message, result.status, 'A', 1);
    });
  }

  toggleRolesTable() {
    this.isRolesTableVisible = !this.isRolesTableVisible;
    if (!this.isRolesTableVisible) {
      this.selectedApplication = null;
    }
  }

  onSelectRol(rol: Rol) {
    this.selectedRol = rol;
    this.syncSelectedRolWithDTO();

    this.isMenuTableVisible = true;
    this.selectedMenuOptions = [...(this.selectedRol.menuOptions || [])];

    if (this.selectedApplication) {
      this.allMenuOptionsForApp = this.getAllMenuOptionsFromApp(
        this.selectedApplication
      );
    }
  }

  clearSelectedRole() {
    this.selectedRol = null;
    this.selectedMenuOptions = [];
    this.isMenuTableVisible = false;
  }

  getAllMenuOptionsFromApp(app: Application): MenuOption[] {
    const allOptions = new Map<string, MenuOption>();
    app.strRoles.forEach((role) => {
      role.menuOptions.forEach((opt) => {
        if (!allOptions.has(opt.id)) {
          allOptions.set(opt.id, opt);
        }
      });
    });
    const assignedIds = new Set(
      this.selectedRol?.menuOptions.map((opt: MenuOption) => opt.id) || []
    );
    return Array.from(allOptions.values()).filter(
      (opt) => !assignedIds.has(opt.id)
    );
  }

  cancelTemporaryChanges(): void {
    if (!this.selectedRol) return;

    const rolId = this.selectedRol.id;

    // 1. Filtrar las opciones temporales
    const removedOptions = this.selectedRol.menuOptions.filter(
      (opt: MenuOption) => opt.strState === 'TEMPORARY'
    );

    const remainingOptions = this.selectedRol.menuOptions.filter(
      (opt: MenuOption) => opt.strState !== 'TEMPORARY'
    );

    this.selectedRol.menuOptions = remainingOptions;

    const dto = this.applicationsService.getApplicationDTO();
    const dtoRol = dto.strRoles.find((r) => r.id === rolId);
    if (dtoRol) {
      dtoRol.menuOptions = [...remainingOptions];
      const isNewRol = (dtoRol as any).isTemporary;
      if (!isNewRol) {
        dtoRol.strState = 'ACTIVE';
      }
    }
    const anyTempRoles = dto.strRoles.some(
      (r) =>
        r.strState === 'TEMPORARY' ||
        r.menuOptions?.some((m) => m.strState === 'TEMPORARY')
    );

    if (!anyTempRoles) {
      dto.strState = 'ACTIVE';
      this.applicationsService.addOrUpdateApplicationDTO(dto);
      if (this.selectedApplication) {
        this.selectedApplication.strState = 'ACTIVE';

        // Actualizar también en la lista principal
        const index = this.applications.findIndex(
          (app) => app.id === this.selectedApplication!.id
        );
        if (index !== -1) {
          this.applications[index].strState = 'ACTIVE';
        }

        dto.strState = 'ACTIVE';
        this.applicationsService.addOrUpdateApplicationDTO(dto);
      }
    }

    this.selectedRol.menuOptions = [...remainingOptions];
    this.selectedMenuOptions = [...remainingOptions];
    this.tempAssignedMenuOptions = [];

    const updatedAvailableOptions = [
      ...this.getAllMenuOptionsFromApp(this.selectedApplication!),
      ...removedOptions,
    ];
    const uniqueOptionsMap = new Map<string, MenuOption>();
    updatedAvailableOptions.forEach((opt) => uniqueOptionsMap.set(opt.id, opt));

    this.allMenuOptionsForApp = Array.from(uniqueOptionsMap.values());

    this.tempAssignedMenuOptions = [];
    this.selectedMenuOptions = [...remainingOptions];

    this.showToast(
      `All temporary menu options for "${this.selectedRol.strName}" were removed.`,
      'warning',
      'A',
      1
    );

    this.cdr.detectChanges();
  }

  hasTemporaryMenuOptions(): boolean {
    return (
      this.selectedRol?.menuOptions?.some(
        (opt: MenuOption) => opt.strState === 'TEMPORARY'
      ) ?? false
    );
  }

  isOptionAlreadyInRol(option: MenuOption): boolean {
    return (
      this.selectedRol?.menuOptions?.some(
        (m: MenuOption) => m.id === option.id
      ) ?? false
    );
  }

  isOptionSelected(option: MenuOption): boolean {
    return (
      this.isOptionAlreadyInRol(option) ||
      this.tempAssignedMenuOptions.some((m: MenuOption) => m.id === option.id)
    );
  }

  isTemporary(option: MenuOption): boolean {
    return this.tempAssignedMenuOptions.some(
      (m: MenuOption) => m.id === option.id
    );
  }

  updateAvailableMenuOptions() {
    if (this.selectedApplication) {
      this.allMenuOptionsForApp = this.getAllMenuOptionsFromApp(
        this.selectedApplication
      );
      this.cdr.detectChanges();
    }
  }

  toggleMenuOption(option: MenuOption): void {
    if (!this.selectedRol) return;

    const isAlreadyAssigned = this.isOptionAlreadyInRol(option);
    const isTemp = this.tempAssignedMenuOptions.some(
      (m: MenuOption) => m.id === option.id
    );

    if (isAlreadyAssigned && !isTemp) {
      // No se puede remover permanente
      return;
    }

    if (isTemp) {
      // 🔄 REMOVER opción temporalmente asignada
      this.tempAssignedMenuOptions = this.tempAssignedMenuOptions.filter(
        (m: MenuOption) => m.id !== option.id
      );

      this.selectedRol.menuOptions = this.selectedRol.menuOptions.filter(
        (m: MenuOption) => m.id !== option.id
      );

      // 🔄 VOLVER a mostrar en lista de disponibles
      this.allMenuOptionsForApp.push(option);

      this.showToast(
        `"${option.strName}" was removed from the role temporarily.`,
        'warning',
        'A',
        1
      );
    } else {
      // ✅ ASIGNAR TEMPORALMENTE
      const tempOption: MenuOption = { ...option, strState: 'TEMPORARY' };

      this.tempAssignedMenuOptions.push(tempOption);
      this.selectedRol.menuOptions.push(tempOption);
      this.selectedRol.strState = 'TEMPORARY';
      this.selectedApplication!.strState = 'TEMPORARY';

      // Actualizar también en el DTO
      const dto = this.applicationsService.getApplicationDTO();
      const dtoRol = dto.strRoles.find((r) => r.id === this.selectedRol.id);
      if (dtoRol) dtoRol.strState = 'TEMPORARY';
      dto.strState = 'TEMPORARY';
      this.applicationsService.addOrUpdateApplicationDTO(dto);

      // ❌ QUITAR de disponibles
      this.allMenuOptionsForApp = this.allMenuOptionsForApp.filter(
        (m: MenuOption) => m.id !== option.id
      );

      this.showToast(
        `"${option.strName}" was added to the role temporarily.`,
        'success',
        'A',
        1
      );
    }

    // 🔁 Refrescar tabla visible
    this.selectedMenuOptions = [...this.selectedRol.menuOptions];
    this.cdr.detectChanges();
  }

  onSelectMenu(menu: any): void {
    if (menu.strSubmenus && menu.strSubmenus.length > 0) {
      this.selectedSubmenus = menu.strSubmenus;
      this.selectedMenuOption = menu;
      this.isSubmenuTableVisible = true;
    }
  }

  clearSelectedMenu(): void {
    this.selectedSubmenus = [];
    this.selectedMenuOption = null;
    this.isSubmenuTableVisible = false;
  }

  trackByApplication(index: number, item: any): number {
    return item.id;
  }

  onFileSelected(event: Event, appId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const dto = this.applicationsService.getApplicationDTOFor(appId);
      if (dto) {
        dto.imageFile = file;
        this.applicationsService.setApplicationDTOFor(appId, dto);
      }
    }
  }

  clearFile() {
    this.imagePreview = null;
    this.fileName = '';
  }

  openModal(edit: boolean, id?: string) {
    // Establece el modo de edición según el parámetro
    this.applicationsService.setEditMode(edit);
    this.applicationsService.setIdApplication(id || '');

    this.selectedApplicationId = edit && id ? id : null;

    // Mostrar el modal manualmente usando Bootstrap
    const modalElement = document.getElementById('crearAplicacion');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  getModalTitle(): string {
    if (this.applicationsService.getEditMode() && this.selectedApplicationId) {
      return `Application <b>ID</b> <span class="badge rounded-pill text-bg-light">${this.selectedApplicationId}</span>`;
    } else {
      return `New <b>Application</b>`;
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onApplicationCreated() {
    this.showSaveButton = true;
    this.showToast(
      `The app has been added <b>temporarily</b>. You must assign at least one role and its menu options before saving it to the backend.`,
      'warning',
      'A',
      1
    );
    this.closeModal();
  }

  setSelectedApplication(application: Application) {
    this.selectedApplication = application;
    this.applicationsService.updateApplicationDTO(application);
  }

  onRolCreado(nuevoRol: Rol): void {
    if (this.selectedApplication) {
      const newRoles = this.applicationsService.getTemporaryRoles();

      newRoles.forEach((role) => {
        const exists = this.selectedApplication!.strRoles.some(
          (r) => r.id === role.id
        );
        if (!exists) {
          this.selectedApplication!.strRoles.push(role);
        }
      });
    }

    this.showSaveButton = true;
    this.showToast(
      `The roles were added temporarily. You must assign at least one menu option before saving to the database.`,
      'warning',
      'A',
      1
    );

    this.closeModalRol();
    this.applicationsService.checkTemporaryStatusForAllApplications();
    this.cdr.detectChanges();
  }

  handleClickNewApp() {
    if (!this.selectedApplication) {
      this.openModal(false);
    }
  }

  confirmDelete(): void {
    if (this.isDeleteConfirmed) {
      console.log('Application deleted!');
    }
    this.deleteConfirmationText = '';
    this.isDeleteConfirmed = false;
  }

  validateDeleteInput(): void {
    this.isDeleteConfirmed =
      this.deleteConfirmationText.trim().toLowerCase() === 'delete';
  }

  // Método para eliminar una aplicación
  deleteApplication(id: string) {
    this.applicationsService.deleteApplication(id).subscribe({
      next: () => {
        this.showToast('Application deleted successfully', 'success', 'A', 0);
        this.applicationsService.loadApplications();
      },
      error: (error) => {
        this.addNotification(
          'There was an error deleting the application',
          'danger',
          'A',
          0
        );
      },
    });
  }

  // Función para obtener las clases del Toast dinámicamente
  getClass() {
    return {
      show: this.isVisible,
      'bg-success': this.toastType === 'success',
      'bg-danger': this.toastType === 'danger',
      'bg-warning': this.toastType === 'warning',
      'bg-primary': this.toastType === 'primary',
    };
  }

  // Función para obtener el ícono del Toast dinámicamente
  getIcon() {
    switch (this.toastType) {
      case 'success':
        return 'check-circle';
      case 'danger':
        return 'x-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'primary':
        return 'exclamation-triangle';
      default:
        return 'info-circle';
    }
  }

  // funcion para abrir y cerrar ventana modal de crear rol
  openModalRol() {
    this.isModalRolOpen = true;
  }

  closeModalRol() {
    this.modalRef.hide();
  }
}
