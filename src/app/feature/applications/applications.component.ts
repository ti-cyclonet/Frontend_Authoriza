
import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ApplicationsService } from '../../shared/services/applications/applications.service';
import { CuApplicationComponent } from './cu-application/cu-application.component';
import { NotificationsComponent } from '../../shared/components/notifications/notifications.component';
import { CommonModule } from '@angular/common';
import { Application } from '../../shared/model/application.model';
import { MenuOption } from '../../shared/model/menu_option';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { ImageModalComponent } from '../../shared/components/image-modal/image-modal.component';
import { CuRolComponent } from "./cu-rol/cu-rol.component";
import { Subject, takeUntil } from 'rxjs';
import { isApplicationDTOValid } from '../../shared/utils/validation.utils';
declare var bootstrap: any;


@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CuApplicationComponent, NotificationsComponent, CommonModule, FormsModule, ImageModalComponent, ReactiveFormsModule, CuRolComponent],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css'],
})
export class ApplicationsComponent implements OnInit {
  private destroy$ = new Subject<void>();
  @Input() applications: Application[] = [];
  @Input() localApplications: Application[] = [];
  @ViewChild(CuApplicationComponent) appCuApplication!: CuApplicationComponent;
  
  isModalOpen = false;
  isDTOValid: boolean = false;
  roleForm: FormGroup;
  isVisible: boolean = true;
  selectedApplication: Application | null = null;
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
  selectedMenuOptions: MenuOption[] = [];
  selectedRol: any = null;
  selectedSubmenus: any[] = []; 
  selectedMenuOption: any | null = null; 
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
    private fb: FormBuilder
  ) {
    this.notifications = [];
    this.roleForm = this.fb.group({
      roleName: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.roleForm.valid) {      
      this.roleForm.reset();
      this.closeModal();
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
    addNotification(title: string, type: 'success' | 'warning' | 'danger' | 'primary', alertType: 'A' | 'B', container: 0 | 1) {
      this.notifications.push({ title, type, alertType, container, visible: true });
    }

    removeNotification(index: number) {
      this.notifications.splice(index, 1);
    }
  
    showToast(message: string, type: 'success' | 'warning' | 'danger' | 'primary', alertType: 'A' | 'B',  container: 0 | 1 ) {
      const notification = {
        title: message,
        type,
        alertType,
        container,
        visible: true
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
      .subscribe(apps => this.applications = apps);

    this.applicationsService.applications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(apps => { this.localApplications = apps;});
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  showRoles(application: Application) {
    this.selectedApplication = application;
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
    this.selectedRol = rol;
    this.selectedMenuOptions = rol.menuOptions || [];
    this.isMenuTableVisible = true;
  }

  clearSelectedRole() {
    this.selectedRol = null; 
    this.selectedMenuOptions = [];
    this.isMenuTableVisible = false;
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
    if (id){
      this.applicationsService.setIdApplication(id);
    }else{
      this.applicationsService.setIdApplication('');
    }

    if (edit && id) {
      // Si está en modo edición, guarda el ID de la aplicación
      this.selectedApplicationId = id;
    } else {
      // Si es modo creación, resetea el ID
      this.selectedApplicationId = null;
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
    // this.showToast('Application was created successfully.', 'success', 'A', 0);
    this.showSaveButton = true;
    this.showToast(`The app has been added <b>temporarily</b>. You must assign at least one role and its menu options before saving it to the backend.`, 'warning', 'B', 1);
    this.closeModal();
    
    // Validar DTO
    const dto = this.applicationsService.getApplicationDTO(); // o como lo estés accediendo
    this.isDTOValid = isApplicationDTOValid(dto as any); // puedes adaptar validación para ApplicationDTO si lo prefieres
  }

  setSelectedApplication(application: Application) {
    this.selectedApplication = application;
  }

  confirmDelete(): void {
    if (this.isDeleteConfirmed) {
      console.log("Application deleted!");
      
    }    
    this.deleteConfirmationText = '';
    this.isDeleteConfirmed = false;
  }

  validateDeleteInput(): void {
    this.isDeleteConfirmed = this.deleteConfirmationText.trim().toLowerCase() === 'delete';
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
          'danger', "A",
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
    const modalElement = document.getElementById('roleModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
  }
}

