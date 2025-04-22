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
import { isApplicationDTOValid } from '../../shared/utils/validation.utils';
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

  handleOptionMenuSave(data: any) {
    console.log('Guardado:', data);
    this.closeOptionMenuModal();
  
    // 🔄 Actualizar la lista visual
    this.updateAvailableMenuOptions();
  
    this.showToast(
      `New menu option "${data.strName}" was added temporarily.`,
      'primary', 'A', 1
    );
  }
  

  closeOptionMenuModal() {
    const modalEl = document.getElementById('optionMenuModal');
    if (modalEl) {
      const bsModal = Modal.getInstance(modalEl) || new Modal(modalEl);
      bsModal.hide();
    }
  }

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
    this.setSelectedApplication(application);
    this.isRolesTableVisible = true;
    // console.log('APLICACION SELECCIONADA: ', this.selectedApplication);
  }

  toggleRolesTable() {
    this.isRolesTableVisible = !this.isRolesTableVisible;
    if (!this.isRolesTableVisible) {
      this.selectedApplication = null;
    }
  }

  onSelectRol(rol: any) {
    this.isMenuTableVisible = true;
    this.selectedRol = rol;
    this.selectedMenuOptions = rol.menuOptions || [];
    if (this.selectedApplication) {
      this.allMenuOptionsForApp = this.getAllMenuOptionsFromApp(
        this.selectedApplication
      );
    }

    this.isMenuTableVisible = true;
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
    return Array.from(allOptions.values());
  }

  cancelTemporaryChanges() {
    if (!this.selectedRol) return;

    // Remover del rol todas las opciones marcadas como TEMPORARY
    this.selectedRol.menuOptions = this.selectedRol.menuOptions.filter(
      (opt: MenuOption) => opt.strState !== 'TEMPORARY'
    );

    this.tempAssignedMenuOptions = [];
    this.selectedRol = { ...this.selectedRol };

    this.showToast(
      `All temporary menu options for "${this.selectedRol.strName}" were removed.`,
      'warning',
      'A',
      1
    );
    this.cdr.detectChanges();
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
      this.allMenuOptionsForApp = this.getAllMenuOptionsFromApp(this.selectedApplication);
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
      // No permitir remover opciones ya asignadas permanentemente
      return;
    }

    if (isTemp) {
      // Si es temporal y ya está asignada, eliminarla de ambas listas
      this.tempAssignedMenuOptions = this.tempAssignedMenuOptions.filter(
        (m: MenuOption) => m.id !== option.id
      );

      this.selectedRol.menuOptions = this.selectedRol.menuOptions.filter(
        (m: MenuOption) => m.id !== option.id
      );

      this.showToast(
        `"${option.strName}" was removed from the role temporarily.`,
        'warning',
        'A',
        1
      );
    } else {
      // Si no está, agregar como temporal
      const tempOption: MenuOption = { ...option, strState: 'TEMPORARY' };

      this.tempAssignedMenuOptions.push(tempOption);
      this.selectedRol.menuOptions.push(tempOption);

      this.showToast(
        `"${option.strName}" was added to the role temporarily.`,
        'primary',
        'A',
        1
      );
    }

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

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.fileName = file.name;

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result;
        };
        reader.readAsDataURL(file);
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
      'B',
      1
    );
    this.closeModal();

    // Validar DTO
    const dto = this.applicationsService.getApplicationDTO();
    this.isDTOValid = isApplicationDTOValid(dto as any);
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
      'B',
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
    console.log('Modal closed!');
    this.modalRef.hide();
  }
}
