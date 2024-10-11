import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Importa 'map' para transformar la respuesta

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  private applicationsSubject = new BehaviorSubject<any[]>([]);
  public applications$ = this.applicationsSubject.asObservable();

  private apiUrl = '/api/applications';
  private validateNameUrl = '/api/validateApplicationName'; // URL para verificar nombre
  private createApplicationUrl = '/api/createApplication'; // URL para crear aplicación

  constructor(private http: HttpClient) {}

  // Método para obtener las aplicaciones desde el servidor
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
      },
    });
  }

  // Método para verificar la disponibilidad del nombre de la aplicación (POST request)
  checkApplicationName(name: string): Observable<boolean> {
    const headers = { 'Content-Type': 'application/json' }; // Encabezado correcto
    return this.http
      .post<{ available: boolean }>(this.validateNameUrl, { name }, { headers })
      .pipe(map((response) => response.available));
  }

  // Método para crear una nueva aplicación
  createApplication(applicationData: {
    strName: string;
    strDescription: string;
    strLogo: string;
  }): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Referer': 'http://localhost:4200'
    };
    return this.http.post<any>(this.createApplicationUrl, applicationData, { headers })
      .pipe(map(response => {
        this.loadApplications(); // Recargar la lista de aplicaciones
        return response;
      }));
  }

   // Método para eliminar una aplicación
   deleteApplication(id: number): Observable<any> {
    return this.http.delete(`/api/application/${id}`);
  }
}
