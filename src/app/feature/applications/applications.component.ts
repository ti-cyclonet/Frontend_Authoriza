import { Component, OnInit, ViewChild } from '@angular/core';
import { ApplicationsService } from '../../shared/services/applications/applications.service';
import { CuApplicationComponent } from "./cu-application/cu-application.component";
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
  isModalOpen = false;  // Controla si el modal está abierto
  toastTitle: string = '';
  toastType: 'success' | 'warning' | 'danger' = 'success';
  isVisible: boolean = false;

  constructor(private applicationsService: ApplicationsService) {}

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

  // Método para abrir el modal
  openModal() {
    this.isModalOpen = true;
  }

  // Método para cerrar el modal
  closeModal() {
    this.isModalOpen = false;
  }

  // Método que se ejecuta cuando se crea una aplicación exitosamente
  onApplicationCreated() {
    this.showToast('Application created successfully', 'success');  // Mostrar el toast
    this.closeModal();  // Cerrar el modal
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
        this.showToast('There was an error deleting the application', 'danger');
      }
    });
  }
  // Función para obtener las clases del Toast dinámicamente
  getClass() {
    return {
      'show': this.isVisible,
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
    this.toastTitle = message;
    this.toastType = type;
    this.isVisible = true;
  
    // Ocultar el toast después de 3 segundos
    setTimeout(() => {
      this.isVisible = false;
    }, 5000);
  }
  
}