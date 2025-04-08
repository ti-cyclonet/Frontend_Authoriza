import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Application } from '../../model/application.model';
import { isApplicationDTOValid } from '../../utils/validation.utils';


export interface ApplicationDTO {
  id?: string;
  strName: string;
  strDescription: string;
  strUrlImage: string;
  strSlug: string;
  strTags: string[];
  strState: string;
  strRoles: any[]; // Puedes reemplazar 'any' con una interfaz de rol si la tienes
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  private applicationsSubject = new BehaviorSubject<Application[]>([]);
  public applications$ = this.applicationsSubject.asObservable();

  // ✅ DTO inicializado con valores por defecto
  public applicationDTO: ApplicationDTO = {
    id: '',
    strName: '',
    strDescription: '',
    strUrlImage: '',
    strSlug: '',
    strTags: [],
    strState: '',
    strRoles: [],
  };

  private apiUrl = '/api/applications';
  private validateNameUrl = '/api/applications/check-name';
  private createApplicationUrl = '/api/application';
  private getApplicationByIdUrl = '/api/getapplicationbyid';

  public editMode: boolean = false;
  public idApplication: string = '';

  constructor(private http: HttpClient) {}

  // ---------------------------------------
  // Modo edición y control de ID
  // ---------------------------------------

  setEditMode(sw: boolean) {
    this.editMode = sw;
  }

  getEditMode(): boolean {
    return this.editMode;
  }

  setIdApplication(n: string) {
    this.idApplication = n;
  }

  getIdApplication(): string {
    return this.idApplication;
  }


  setApplicationDTO(dto: ApplicationDTO): void {
    this.applicationDTO = dto;
  }

  getApplicationDTO(): ApplicationDTO {
    return this.applicationDTO;
  }

  updateApplicationDTO(fields: Partial<ApplicationDTO>): void {
    this.applicationDTO = {
      ...this.applicationDTO,
      ...fields,
    };
    console.log('DTO actualizado:', this.applicationDTO);

    const isValid = isApplicationDTOValid(this.applicationDTO as any);
    console.log('¿Es válido el ApplicationDTO?', isValid);
  }

  // ---------------------------------------
  // CRUD de Aplicaciones
  // ---------------------------------------

  getApplicationById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.getApplicationByIdUrl}/${id}`);
  }

  getApplications(limit: number = 4, offset: number = 0): Observable<any[]> {
    return this.http.get<Application[]>(`${this.apiUrl}?limit=${limit}&offset=${offset}`);
  }

  addTemporaryApplication(app: Application): void {
    const currentApps = this.applicationsSubject.getValue();
    const updatedApps = [...currentApps, app];
    this.applicationsSubject.next(updatedApps);

    // ✅ Actualizar applicationDTO con los datos recibidos
    this.setApplicationDTO({
      id: app.id || '',
      strName: app.strName || '',
      strDescription: app.strDescription || '',
      strUrlImage: app.strUrlImage || '',
      strSlug: app.strSlug || '',
      strTags: app.strTags || [],
      strState: app.strState || '',
      strRoles: app.strRoles || [],
    });
  }

  updateTemporaryApplication(updatedApp: Application): void {
    const apps = this.applicationsSubject.getValue();
    const updatedApps = apps.map(app => app.id === updatedApp.id ? updatedApp : app);
    this.applicationsSubject.next(updatedApps);
  }

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

  checkApplicationName(strName: string): Observable<boolean> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http
      .post<{ available: boolean }>(this.validateNameUrl, { strName }, { headers })
      .pipe(map((response) => response.available));
  }

  createApplication(applicationData: FormData): Observable<any> {
    console.log('DTO DE LA APLICACION A CREAR:');
    applicationData.forEach((value, key) => {
      console.log(key, value);
    });

    return this.http.post<any>(this.createApplicationUrl, applicationData).pipe(
      map((response) => {
        this.loadApplications();
        return response;
      }),
      catchError((error) => {
        console.error('Error creating application:', error);
        return throwError(error);
      })
    );
  }

  deleteApplication(id: string): Observable<any> {
    return this.http.delete(`/api/application/${id}`);
  }

  updateApplication(id: string, applicationData: FormData): Observable<any> {
    const updateUrl = `/api/updateapplication/${id}`;
    return this.http.put<any>(updateUrl, applicationData).pipe(
      map((response) => {
        this.loadApplications();
        return response;
      }),
      catchError((error) => {
        console.error('Error updating application:', error);
        return throwError(error);
      })
    );
  }

  getApplicationByName(strName: string): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/${strName}`);
  }
}
