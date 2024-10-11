import { Component, OnInit, ViewChild } from '@angular/core';
import { ApplicationsService } from '../../shared/services/applications/applications.service';
import { CuApplicationComponent } from "./cu-application/cu-application.component";

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CuApplicationComponent],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css'], // Corrige styleUrl a styleUrls
})
export class ApplicationsComponent implements OnInit {
  @ViewChild(CuApplicationComponent) appCuApplication!: CuApplicationComponent;
  applications: any[] = [];

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

  // Método para eliminar una aplicación
  deleteApplication(id: number) {
    if (confirm('Are you sure you want to delete this application?')) {
      this.applicationsService.deleteApplication(id).subscribe({
        next: () => {
          alert('Application deleted successfully');
          // Actualiza la lista de aplicaciones después de la eliminación
          this.applicationsService.loadApplications(); // Recargar la lista de aplicaciones
        },
        error: (error) => {
          console.error('Error deleting application', error);
          alert('There was an error deleting the application');
        }
      });
    }
  }
}
