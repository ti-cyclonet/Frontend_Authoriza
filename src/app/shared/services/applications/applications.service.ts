import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Application } from '../../model/application.model';
import { Rol } from '../../model/rol';
import { MenuOption } from '../../model/menu_option';
import { validateApplicationDTO } from '../../utils/validation.utils';
import { EnvironmentService } from '../environment.service';
export interface ApplicationDTO {
  id?: string | undefined;
  strName: string;
  strDescription: string;
  strUrlImage: string;
  strSlug: string;
  strTags: string[];
  strState: string;
  strRoles: Rol[];
  imageFile?: File;
  isNew?: boolean;
}
export interface SaveApplicationResult {
  id: string;
  name: string;
  status: 'success' | 'warning' | 'danger';
  message: string;
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

  applicationsDTOMap: Map<string, ApplicationDTO> = new Map();

  private apiUrl = '/api/applications';
  private validateNameUrl = '/api/applications/check-name';
  private createApplicationUrl = '/api/applications';
  private getApplicationByIdUrl = '/api/getapplicationbyid';

  public editMode: boolean = false;
  public idApplication: string = '';
  private temporaryRoles: TempRol[] = [];

  constructor(private http: HttpClient, private envService: EnvironmentService) {}

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
      id:
        this.applicationDTO.id ||
        'temp-' + Math.random().toString(36).substr(2, 9),
    };
  }

  public markApplicationAsNotNew(id: string): void {
    const currentApps = this.applicationsSubject.getValue();
    const index = currentApps.findIndex(app => app.id === id);
    if (index !== -1) {
      const updatedApp = { ...currentApps[index] };
      delete (updatedApp as any).isNew;
      const updatedApps = [...currentApps];
      updatedApps[index] = updatedApp;
      this.applicationsSubject.next(updatedApps);
    }
  }
  
  setApplicationDTOFor(appId: string, dto: ApplicationDTO): void {
    this.applicationsDTOMap.set(appId, dto);
  }

  getApplicationDTOFor(appId: string): ApplicationDTO | undefined {
    return this.applicationsDTOMap.get(appId);
  }

  getAllApplicationDTOs(): ApplicationDTO[] {
    return Array.from(this.applicationsDTOMap.values());
  }

  removeApplicationDTO(id: string): void {
    this.applicationsDTOMap.delete(id);
  }  

  clearAllTemporaryDTOs(): void {
    this.applicationsDTOMap.clear();
  }

  addOrUpdateApplicationDTO(app: ApplicationDTO): void {
    if (app.strState === 'TEMPORARY') {
      // Verificamos si ya hay una app con ese ID
      const existingApp = this.applicationsDTOMap.get(app.id!);
  
      // Si ya existe, preservamos su archivo de imagen si no viene uno nuevo
      if (existingApp && !app.imageFile && existingApp.imageFile) {
        app.imageFile = existingApp.imageFile;
      }
  
      this.applicationsDTOMap.set(app.id!, app);
    } else if (app.strState === 'ACTIVE') {
      this.applicationsDTOMap.delete(app.id!);
    }
  }

  saveCurrentApplicationState(appId: string, dto: ApplicationDTO): void {
    this.applicationsDTOMap.set(appId, structuredClone(dto));
  }

  saveAllValidApplications(): SaveApplicationResult[] {
    const appsToSend = Array.from(this.applicationsDTOMap.values());
    const results: SaveApplicationResult[] = [];

    for (const app of appsToSend) {
      console.log('DTO DE LA APLICACION ', app.strName,' A GUARDAR:');
      const validationErrors = validateApplicationDTO(app);

      if (validationErrors.length > 0) {
        results.push({
          id: app.id!,
          name: app.strName,
          status: 'danger',
          message: `Application "${
            app.strName
          }" has the following errors: <br>${validationErrors.join('<br>')}`,
        });
        continue;
      }

      const formData = this.buildFormDataFromApp(app);
      const isNewApp = app.id?.startsWith('temp-');

      if (isNewApp) {
        // Crear nueva aplicación
        this.createApplication(formData).subscribe({
          next: () => {
            results.push({
              id: app.id!,
              name: app.strName,
              status: 'success',
              message: `Application "${app.strName}" <b>created</b> successfully!`,
            });
            this.removeApplicationDTO(app.id!);
          },
          error: () => {
            results.push({
              id: app.id!,
              name: app.strName,
              status: 'danger',
              message: `Error creating application "${app.strName}".`,
            });
          },
        });
      } else {
        // Actualizar aplicación existente
        this.updateApplication(app.id!, formData).subscribe({
          next: () => {
            results.push({
              id: app.id!,
              name: app.strName,
              status: 'success',
              message: `Application "${app.strName}" <b>updated</b> successfully!`,
            });
            this.removeApplicationDTO(app.id!);
          },
          error: () => {
            results.push({
              id: app.id!,
              name: app.strName,
              status: 'danger',
              message: `Error updating application "${app.strName}".`,
            });
          },
        });
      }
    }

    return results;
  }

  buildFormDataFromApp(app: ApplicationDTO): FormData {
    const formData = new FormData();

    // ✅ Siempre agregamos el id
    if (app.id) {
      formData.append('id', app.id);
    }

    formData.append('strName', app.strName);
    formData.append('strDescription', app.strDescription);
    formData.append('strSlug', app.strSlug);
    formData.append('strTags', JSON.stringify(app.strTags));
    formData.append('strState', app.strState);
    formData.append('strRoles', JSON.stringify(app.strRoles));

    if (app.imageFile) {
      formData.append('file', app.imageFile);
    }

    return formData;
  }

  // ===================
  // Aplicaciones
  // ===================

  getApplicationById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.getApplicationByIdUrl}/${id}`);
  }

  getApplications(limit: number = 4, offset: number = 0): Observable<Application[]> {
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
    const updatedApps = apps.map((app) =>
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
      .post<{ available: boolean }>(
        this.validateNameUrl,
        { strName },
        { headers }
      )
      .pipe(map((response) => response.available));
  }

  createApplication(applicationData: FormData): Observable<any> {
    const parsedData: any = {};
    const formData = new FormData();
  
    applicationData.forEach((value, key) => {
      try {
        parsedData[key] = typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))
          ? JSON.parse(value)
          : value;
      } catch {
        parsedData[key] = value;
      }
    });
  
    console.dir(parsedData, { depth: null });

    // Agrega el objeto como JSON string
    formData.append('applicationData', JSON.stringify(applicationData));
    // Agrega el archivo de imagen
    formData.append('file', applicationData.get('file') as File);
  
    return this.http.post<any>(this.createApplicationUrl, parsedData, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      map(response => {
        this.loadApplications();
        return response;
      }),
      catchError(error => {
        console.error('Error creating application:', error);
        return throwError(() => error);
      })
    );
  }
  
  

  deleteApplication(id: string): Observable<any> {
    return this.http.delete(`${this.envService.apiBaseUrl}/applications/${id}`);
  }

  updateApplication(id: string, applicationData: FormData): Observable<any> {
    const updateUrl = `${this.envService.apiBaseUrl}/aplications/${id}`;
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

    const updatedApps = apps.map((app) => {
      if (app.id === appId) {
        const existingRoles = app.strRoles || [];
        const roleExists = existingRoles.some((r) => r.id === newRole.id);
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
  }

  getTemporaryRoles(): TempRol[] {
    return this.temporaryRoles;
  }

  hasTemporaryChanges(application: ApplicationDTO): boolean {
    const hasTempRole = application.strRoles.some(
      (role) => role.strState === 'TEMPORARY' || (role as TempRol).isTemporary
    );

    const hasTempMenuOption = application.strRoles.some((role) =>
      role.menuOptions?.some(
        (menu) =>
          menu.strState === 'TEMPORARY' ||
          menu.strSubmenus?.some((sub) => sub.strState === 'TEMPORARY')
      )
    );

    return hasTempRole || hasTempMenuOption;
  }

  clearTemporaryRoles(): void {
    this.temporaryRoles = [];
    this.applicationDTO.strRoles = this.applicationDTO.strRoles.filter(
      (r: TempRol) => !r.isTemporary
    );
  }

  checkTemporaryStatusForAllApplications(): void {
    const updatedApps = this.applicationsSubject.getValue().map((app) => {
      if (app.strState === 'TEMPORARY') {
        return app;
      }

      const hasTemporaryRole = app.strRoles?.some(
        (role) => role.strState === 'TEMPORARY' || (role as TempRol).isTemporary
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
    const updatedApps = apps.map((app) => {
      if (app.id === this.idApplication) {
        const existingRoles = app.strRoles || [];
        const exists = existingRoles.some(
          (r) => r.id === this.temporaryRoles[0]?.id
        );
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
  addTemporaryOptionMenu(
    optionMenu: MenuOption,
    targetRolId?: string
  ): string | null {
    const currentApp = this.getApplicationDTO();

    const alreadyExistsGlobally = currentApp.strRoles
      .flatMap((r) => r.menuOptions || [])
      .some((m) => m.id === optionMenu.id);

    if (!alreadyExistsGlobally) {
      let targetRole = currentApp.strRoles.find((r) => r.id === targetRolId);

      // Fallback si no se pasó ID
      if (!targetRole) {
        targetRole = currentApp.strRoles.find(
          (r) => r.strState === 'TEMPORARY' || (r as TempRol).isTemporary
        );
      }

      if (targetRole) {
        targetRole.menuOptions = targetRole.menuOptions || [];
        targetRole.menuOptions.push(optionMenu);

        this.updateTemporaryApplicationsAfterRoleChange();
        return targetRole.id;
      }
    }
    return null;
  }
}
