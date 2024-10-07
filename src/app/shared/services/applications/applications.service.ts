import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Importa 'map' para transformar la respuesta

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {
  private applicationsSubject = new BehaviorSubject<any[]>([]);
  public applications$ = this.applicationsSubject.asObservable();

  private apiUrl = 'http://localhost:3000/applications';
  private validateNameUrl = 'http://localhost:3000/validateApplicationName'; // URL para verificar nombre

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
      }
    });
  }

  // Método para verificar la disponibilidad del nombre de la aplicación (POST request)
  checkApplicationName(name: string): Observable<boolean> {
    const headers = { 'Content-Type': 'application/json' }; // Encabezado correcto
    return this.http.post<{ available: boolean }>(
      this.validateNameUrl, 
      { name },
      { headers }
    ).pipe(
      map(response => response.available)
    );
  }
}
