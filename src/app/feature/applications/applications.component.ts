import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ApplicationsService } from '../../shared/services/applications/applications.service';
import { CuApplicationComponent } from './cu-application/cu-application.component';
import { NotificationsComponent } from '../../shared/components/notifications/notifications.component';
import { CommonModule } from '@angular/common';
import { Application } from '../../shared/model/application.model';
import { MenuOption } from '../../shared/model/menu_option';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { ImageModalComponent } from '../../shared/components/image-modal/image-modal.component';
import { CuRolComponent } from "./cu-rol/cu-rol.component";
declare var bootstrap: any;


@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CuApplicationComponent, NotificationsComponent, CommonModule, FormsModule, ImageModalComponent, ReactiveFormsModule, CuRolComponent],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css'],
})
export class ApplicationsComponent implements OnInit {
  @ViewChild(CuApplicationComponent) appCuApplication!: CuApplicationComponent;
  applications: Application[] = [];
  isModalOpen = false;
  toastTitle: string = '';
  roleForm: FormGroup;
  toastType: 'success' | 'warning' | 'danger' = 'success';
  isVisible: boolean = true;
  selectedApplication: Application | null = null;
  isModalRolOpen = false;
  notifications: Array<{
    title: string;
    type: 'success' | 'warning' | 'danger';
  }> = [];
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
      console.log('Rol guardado:', this.roleForm.value);
      this.roleForm.reset(); // Resetear el formulario después de guardar
      this.closeModal();
    }
  }
  openImageModal(imageUrl: string) {
    this.selectedImageUrl = imageUrl;
    this.showModal = true;
  }

  closeImageModal() {
    this.showModal = false;
  }

  // Método para agregar una nueva notificación
  addNotification(title: string, type: 'success' | 'warning' | 'danger') {
    this.notifications.push({ title, type });
  }

  get selectedFile() {
    return this.appCuApplication?.selectedFile;
  }

  ngOnInit(): void {
    // Suscribirse a las aplicaciones cargadas en el servicio
    this.applicationsService.applications$.subscribe({
      next: (applications) => {
        this.applications = applications;
      },
      error: (e) => {
        console.log(e);
      },
    });
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
      this.selectedSubmenus = menu.strSubmenus; // Guarda los submenús
      this.selectedMenuOption = menu; // Guarda la opción de menú seleccionada
      this.isSubmenuTableVisible = true; // Muestra la tabla de submenús
    }
  }
  
  clearSelectedMenu(): void {
    this.selectedSubmenus = [];
    this.selectedMenuOption = null;
    this.isSubmenuTableVisible = false; // Oculta la tabla de submenús
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

  // Método para abrir el modal
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

  // Método que retorna el título del modal
  getModalTitle(): string {
    if (this.applicationsService.getEditMode() && this.selectedApplicationId) {
      return `Application <b>ID</b> <span class="badge rounded-pill text-bg-light">${this.selectedApplicationId}</span>`;
    } else {
      return `New <b>Application</b>`;
    }
  }

  // Método para cerrar el modal
  closeModal() {
    this.isModalOpen = false;
  }

  // Método que se ejecuta cuando se crea una aplicación exitosamente
  onApplicationCreated() {
    this.showToast('Application created successfully', 'success');
    this.closeModal();
  }

  // Método para abrir el modal y establecer la aplicación seleccionada
  setSelectedApplication(application: Application) {
    this.selectedApplication = application;
  }

  // Método para confirmar la eliminación de la aplicación
  confirmDelete(): void {
    if (this.isDeleteConfirmed) {
      console.log("Application deleted!"); // Aquí puedes llamar al servicio de eliminación
      // Lógica para eliminar la aplicación
    }
    // Reiniciar el input después de cerrar el modal
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
        this.showToast('Application deleted successfully', 'success');
        this.applicationsService.loadApplications();
      },
      error: (error) => {
        this.addNotification(
          'There was an error deleting the application',
          'danger'
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
    };
  }
  // Función para obtener el ícono del Toast dinámicamente
  getIcon() {
    switch (this.toastType) {
      case 'success':
        return 'bi-check-circle';
      case 'danger':
        return 'bi-exclamation-circle';
      default:
        return 'bi-info-circle';
    }
  }
  // Función para mostrar el toast con el mensaje y tipo correctos
  showToast(message: string, type: 'success' | 'warning' | 'danger') {
    this.addNotification(message, type);
    this.cdr.detectChanges();

    // Ocultar el toast después de 3 segundos
    setTimeout(() => {
      this.isVisible = false;
    }, 5000);
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

