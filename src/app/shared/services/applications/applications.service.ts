import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators'; // Importa 'map' para transformar la respuesta
import { Application } from '../../model/application.model';

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  private applicationsSubject = new BehaviorSubject<Application[]>([]);
  public applications$ = this.applicationsSubject.asObservable();

  private apiUrl = '/api/applications';
  private validateNameUrl = '/api/applications/check-name'; // URL para verificar nombre
  private createApplicationUrl = '/api/application'; // URL para crear aplicación
  private getApplicationByIdUrl = '/api/getapplicationbyid'; // URL para crear aplicación
  public editMode: boolean = false;
  public idApplication: string = '';

  constructor(private http: HttpClient) {}

  setEditMode(sw: boolean){
    this.editMode = sw;
  }
  getEditMode(): boolean{
    return this.editMode;
  }
  setIdApplication(n : string){
    this.idApplication = n;
  }
  getIdApplication(): string{
    return this.idApplication;
  }

  // Método para obtener una aplicación por ID
  getApplicationById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.getApplicationByIdUrl}/${id}`);
  }

  // Método para obtener aplicaciones con paginación
getApplications(limit: number = 4, offset: number = 0): Observable<any[]> {
  return this.http.get<Application[]>(`${this.apiUrl}?limit=${limit}&offset=${offset}`);
}

// Método para cargar las aplicaciones con paginación y actualizar el BehaviorSubject
loadApplications(): void {
  this.getApplications(4, 0).subscribe({
    next: (applications) => {
      this.applicationsSubject.next(applications);
    },
    error: (error) => {
      console.error('Error loading applications.', error);
    },
  });
}

  // Método para verificar la disponibilidad del nombre de la aplicación (POST request)
  checkApplicationName(strName: string): Observable<boolean> {    
    const headers = { 'Content-Type': 'application/json' };
    return this.http
      .post<{ available: boolean }>(this.validateNameUrl, { strName }, { headers })
      .pipe(map((response) => response.available));
  }

  // Método para crear una nueva aplicación
  createApplication(applicationData: FormData): Observable<any> {
    console.log('DTO DE LA APLICACION A CREAR:');
  applicationData.forEach((value, key) => {
    console.log(key, value); // Muestra las claves y valores del FormData
  });
    return this.http.post<any>(this.createApplicationUrl, applicationData).pipe(
      map((response) => {
        this.loadApplications(); // Recargar la lista de aplicaciones
        return response;
      }),
      catchError((error) => {
        console.error('Error creating application:', error);
        return throwError(error); // Re-lanzar el error para que lo maneje el componente
      })
    );
  }
  // Método para eliminar una aplicación
  deleteApplication(id: string): Observable<any> {
    return this.http.delete(`/api/application/${id}`);
  }

  // Método para actualizar una aplicación dado su ID
  updateApplication(id: string, applicationData: FormData): Observable<any> {
    const updateUrl = `/api/updateapplication/${id}`;
    return this.http.put<any>(updateUrl, applicationData).pipe(
      map((response) => {
        this.loadApplications(); // Opcional: recargar la lista de aplicaciones
        return response;
      }),
      catchError((error) => {
        console.error('Error updating application:', error);
        return throwError(error); // Re-lanzar el error para que lo maneje el componente
      })
    );
  }
}
