import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ApplicationsService } from '../../shared/services/applications/applications.service';
import { CuApplicationComponent } from './cu-application/cu-application.component';
import { NotificationsComponent } from '../../shared/components/notifications/notifications.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CuApplicationComponent, NotificationsComponent, CommonModule],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css'], // Corrige styleUrl a styleUrls
})
export class ApplicationsComponent implements OnInit {
  selectedApplication: any;
  @ViewChild(CuApplicationComponent) appCuApplication!: CuApplicationComponent;
  applications: any[] = [];
  isModalOpen = false; // Controla si el modal está abierto
  toastTitle: string = '';
  toastType: 'success' | 'warning' | 'danger' = 'success';
  isVisible: boolean = true;
  notifications: Array<{
    title: string;
    type: 'success' | 'warning' | 'danger';
  }> = [];
  imagePreview: string | ArrayBuffer | null = null;
  fileName: string = '';
  public selectedApplicationId: number | null = null;

  constructor(
    public applicationsService: ApplicationsService,
    private cdr: ChangeDetectorRef
  ) {
    this.notifications = [];
  }

  // Método para agregar una nueva notificación
  addNotification(title: string, type: 'success' | 'warning' | 'danger') {
    this.notifications.push({ title, type });
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

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result; // Establece la vista previa
        };
        reader.readAsDataURL(file); // Lee el archivo como URL de datos
      }
    }
  }

  clearFile() {
    this.imagePreview = null;
    this.fileName = '';
  }

  // Método para abrir el modal
  openModal(edit: boolean, id?: number) {
    // Establece el modo de edición según el parámetro
    this.applicationsService.setEditMode(edit);
    if (id){
      this.applicationsService.setIdApplication(id);
    }else{
      this.applicationsService.setIdApplication(0);
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
  setSelectedApplication(application: any) {
    this.selectedApplication = application;
  }

  // Método para confirmar la eliminación de la aplicación
  confirmDelete() {
    this.deleteApplication(this.selectedApplication.id);
  }

  // Método para eliminar una aplicación
  deleteApplication(id: number) {
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
}
