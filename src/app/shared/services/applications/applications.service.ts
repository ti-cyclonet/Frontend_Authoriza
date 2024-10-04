import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {private applicationsSubject = new BehaviorSubject<any[]>([]);
  public applications$ = this.applicationsSubject.asObservable();

  constructor(private http: HttpClient) {}
  private apiUrl = 'http://localhost:3000/applications';

  // Método para obtener los roles desde el servidor
  getApplications(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Método para cargar las aplicaciones y actualizar el BehaviorSubject
  loadApplications(): void {
    this.getApplications().subscribe({
      next: (applications) => {
        this.applicationsSubject.next(applications);
      },
      error: (error) => {
        console.error('Error loading applications.', error);
      }
    });
  }

}
