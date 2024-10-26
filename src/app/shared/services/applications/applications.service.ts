import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators'; // Importa 'map' para transformar la respuesta
import { Application } from '../../model/application.model';

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  private applicationsSubject = new BehaviorSubject<any[]>([]);
  public applications$ = this.applicationsSubject.asObservable();

  private apiUrl = '/api/applications';
  private validateNameUrl = '/api/validateApplicationName'; // URL para verificar nombre
  private createApplicationUrl = '/api/createApplication'; // URL para crear aplicación
  private getApplicationByIdUrl = '/api/getapplicationbyid'; // URL para crear aplicación
  public editMode: boolean = false;
  public idApplication: number = 0;

  constructor(private http: HttpClient) {}

  setEditMode(sw: boolean){
    this.editMode = sw;
  }
  getEditMode(): boolean{
    return this.editMode;
  }
  setIdApplication(n : number){
    this.idApplication = n;
  }
  getIdApplication(): number{
    return this.idApplication;
  }
  
  // Método para obtener las aplicaciones desde el servidor
  getApplications(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Método para obtener una aplicación por ID
  getApplicationById(id: number): Observable<Application> {
    return this.http.get<Application>(`${this.getApplicationByIdUrl}/${id}`);
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
  createApplication(applicationData: FormData): Observable<any> {
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
  deleteApplication(id: number): Observable<any> {
    return this.http.delete(`/api/application/${id}`);
  }

  // Método para actualizar una aplicación dado su ID
  updateApplication(id: number, applicationData: FormData): Observable<any> {
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
