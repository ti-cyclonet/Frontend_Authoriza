import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Application } from '../../model/application.model';
import { isApplicationDTOValid } from '../../utils/validation.utils';
import { Rol } from '../../model/rol';
import { MenuOption } from '../../model/menu_option';

export interface ApplicationDTO {
  id?: string;
  strName: string;
  strDescription: string;
  strUrlImage: string;
  strSlug: string;
  strTags: string[];
  strState: string;
  strRoles: Rol[];
  imageFile?: File;
}

export interface TempRol extends Rol {
  isTemporary?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  private applicationsSubject = new BehaviorSubject<Application[]>([]);
  public applications$ = this.applicationsSubject.asObservable();

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
  private temporaryRoles: TempRol[] = [];

  constructor(private http: HttpClient) {}

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

  // ===================
  // Aplicaciones
  // ===================

  getApplicationById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.getApplicationByIdUrl}/${id}`);
  }

  getApplications(limit: number = 4, offset: number = 0): Observable<any[]> {
    return this.http.get<Application[]>(`${this.apiUrl}?limit=${limit}&offset=${offset}`);
  }

  addTemporaryApplication(app: Application): void {
    if (!app.id) {
      app.id = `TEMP-${Date.now()}`;
    }
    const currentApps = this.applicationsSubject.getValue();
    const updatedApps = [...currentApps, app];
    this.applicationsSubject.next(updatedApps);

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
    const updatedApps = apps.map(app =>
      app.id === updatedApp.id ? updatedApp : app
    );
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
        return throwError(() => error);
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
        return throwError(() => error);
      })
    );
  }

  getApplicationByName(strName: string): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/${strName}`);
  }

  // ===================
  // Roles Temporales
  // ===================

  updateApplicationRoles(appId: string, newRole: TempRol): void {
    const apps = this.applicationsSubject.getValue();
  
    const updatedApps = apps.map(app => {
      if (app.id === appId) {
        const existingRoles = app.strRoles || [];
        const roleExists = existingRoles.some(r => r.id === newRole.id);
        if (!roleExists) {
          return {
            ...app,
            strRoles: [...existingRoles, newRole],
          };
        }
      }
      return app;
    });
  
    this.applicationsSubject.next(updatedApps);
  }
  

  addTemporaryRole(role: Rol): void {
    const tempRole: TempRol = { ...role, isTemporary: true };
    this.temporaryRoles.push(tempRole);
    this.applicationDTO.strRoles.push(tempRole);
  
    this.updateTemporaryApplicationsAfterRoleChange();
  
    this.temporaryRoles = [];
  
    console.log('DTO actualizado:', this.applicationDTO);
    const isValid = isApplicationDTOValid(this.applicationDTO as any);
    console.log('¿Es válido el ApplicationDTO?', isValid);
  }
  

  getTemporaryRoles(): TempRol[] {
    return this.temporaryRoles;
  }

  hasTemporaryChanges(application: ApplicationDTO): boolean {
    // Verifica si algún rol tiene estado TEMPORARY
    const hasTempRole = application.strRoles.some(role => role.strState === 'TEMPORARY' || (role as TempRol).isTemporary);
  
    // Verifica si alguna opción de menú tiene estado TEMPORARY
    const hasTempMenuOption = application.strRoles.some(role =>
      role.menuOptions?.some(menu =>
        menu.strState === 'TEMPORARY' || 
        menu.strSubmenus?.some(sub => sub.strState === 'TEMPORARY')
      )
    );
  
    return hasTempRole || hasTempMenuOption;
  }
  

  clearTemporaryRoles(): void {
    this.temporaryRoles = [];
    this.applicationDTO.strRoles = this.applicationDTO.strRoles.filter((r: TempRol) => !r.isTemporary);
  }
  
  checkTemporaryStatusForAllApplications(): void {
    const updatedApps = this.applicationsSubject.getValue().map(app => {
      if (app.strState === 'TEMPORARY') {
        return app; // No tocar si ya es TEMPORARY
      }
  
      const hasTemporaryRole = app.strRoles?.some(role =>
        role.strState === 'TEMPORARY' || (role as TempRol).isTemporary
      );
  
      return {
        ...app,
        strState: hasTemporaryRole ? 'TEMPORARY' : 'ACTIVE',
      };
    });
  
    this.applicationsSubject.next(updatedApps);
  }
  
  updateTemporaryApplicationsAfterRoleChange(): void {
    const apps = this.applicationsSubject.getValue();
    const updatedApps = apps.map(app => {
      if (app.id === this.idApplication) {
        const existingRoles = app.strRoles || [];
        const exists = existingRoles.some(r => r.id === this.temporaryRoles[0]?.id);
        if (!exists) {
          const updatedRoles = [...existingRoles, ...this.temporaryRoles];
  
          // Actualizamos el estado a 'TEMPORARY'
          return {
            ...app,
            strRoles: updatedRoles,
            strState: 'TEMPORARY',
          };
        }
      }
      return app;
    });
  
    this.applicationsSubject.next(updatedApps);
  }

  // OPCIONES DE MENU
  addTemporaryOptionMenu(optionMenu: MenuOption): void {
  
    // Agregar a todas las opciones disponibles de la aplicación
    const currentApp = this.getApplicationDTO();
    const alreadyExistsGlobally = currentApp.strRoles
      .flatMap(r => r.menuOptions || [])
      .some(m => m.id === optionMenu.id);
  
    if (!alreadyExistsGlobally) {
      // Agregarlo al primer rol temporal (puede cambiarse por lógica específica)
      const tempRole = currentApp.strRoles.find(r => r.strState === 'TEMPORARY' || (r as TempRol).isTemporary);
      if (tempRole) {
        tempRole.menuOptions = tempRole.menuOptions || [];
        tempRole.menuOptions.push(optionMenu);
      }
    }
  
    this.updateTemporaryApplicationsAfterRoleChange();
  
    console.log('DTO actualizado con opción de menú:', this.applicationDTO);
  }
  
}
