import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ApplicationsService } from '../../shared/services/applications/applications.service';
import { CuApplicationComponent } from "./cu-application/cu-application.component";

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CuApplicationComponent],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.css'
})
export class ApplicationsComponent implements OnInit{
  applications: any[] = [];

  constructor(private applicationsService : ApplicationsService){}

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

}
