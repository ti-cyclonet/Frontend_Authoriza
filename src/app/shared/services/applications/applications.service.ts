import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Application } from '../../model/application.model';
import { Rol } from '../../model/rol';
import { MenuOption } from '../../model/menu_option';
import { validateApplicationDTO } from '../../utils/validation.utils';
import { EnvironmentService } from '../environment.service';
import { environment } from '../../../../environments/environment';
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

  private baseApiUrl = environment.apiBaseUrl;

  private applicationUrl = this.baseApiUrl + '/api/applications';
  private validateNameUrl = this.baseApiUrl + '/api/applications/check-name';

  public editMode: boolean = false;
  public idApplication: string = '';
  private temporaryRoles: TempRol[] = [];

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService
  ) {}

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
    const existingApp = this.applicationsDTOMap.get(fields.id!);

    // Preservar imagen si no se envió una nueva
    if (existingApp && !fields.imageFile && existingApp.imageFile) {
      fields.imageFile = existingApp.imageFile;
    }

    const updated: ApplicationDTO = {
      ...this.applicationDTO,
      ...fields,
      imageFile: fields.imageFile ?? this.applicationDTO.imageFile,
      id: fields.id || 'temp-' + Math.random().toString(36).substr(2, 9),
    };

    this.applicationDTO = updated;
    this.applicationsDTOMap.set(updated.id!, updated);
  }

  public markApplicationAsNotNew(id: string): void {
    const currentApps = this.applicationsSubject.getValue();
    const index = currentApps.findIndex((app) => app.id === id);
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
    if (!app?.id) return;

    const existingApp = this.applicationsDTOMap.get(app.id);

    // 🔒 Preservar imagen si no viene
    if (existingApp?.imageFile && !app.imageFile) {
      app.imageFile = existingApp.imageFile;
    }

    // 🔒 Evitar sobreescribir un UUID con ID temporal
    if (
      existingApp?.id &&
      !existingApp.id.startsWith('temp-') &&
      app.id.startsWith('temp-')
    ) {
      app.id = existingApp.id;
    }

    if (app.strState === 'TEMPORARY') {
      this.applicationsDTOMap.set(app.id, app);
    } else if (app.strState === 'ACTIVE') {
      this.applicationsDTOMap.delete(app.id);
    }
  }

  saveCurrentApplicationState(appId: string, dto: ApplicationDTO): void {
    this.applicationsDTOMap.set(appId, structuredClone(dto));
  }

  async saveAllValidApplications(
    validApplications: ApplicationDTO[]
  ): Promise<SaveApplicationResult[]> {
    const appsToSend = validApplications;
    const results: SaveApplicationResult[] = [];
    const operations: Promise<void>[] = [];

    for (const app of appsToSend) {
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
      const isNewApp = app.id?.toLowerCase().startsWith('temp-');

      if (isNewApp) {
        const op = new Promise<void>((resolve) => {
          this.createApplication(formData).subscribe({
            next: () => {
              results.push({
                id: app.id!,
                name: app.strName,
                status: 'success',
                message: `Application "${app.strName}" <b>created</b> successfully!`,
              });
              this.removeApplicationDTO(app.id!);
              resolve();
            },
            error: () => {
              results.push({
                id: app.id!,
                name: app.strName,
                status: 'danger',
                message: `Error creating application "${app.strName}".`,
              });
              resolve();
            },
          });
        });
        operations.push(op);
      } else {
        const op = new Promise<void>((resolve) => {
          this.updateApplication(app.id!, formData).subscribe({
            next: () => {
              results.push({
                id: app.id!,
                name: app.strName,
                status: 'success',
                message: `Application "${app.strName}" <b>updated</b> successfully!`,
              });
              this.removeApplicationDTO(app.id!);
              resolve();
            },
            error: () => {
              results.push({
                id: app.id!,
                name: app.strName,
                status: 'danger',
                message: `Error updating application "${app.strName}".`,
              });
              resolve();
            },
          });
        });
        operations.push(op);
      }
    }

    await Promise.all(operations);
    return results;
  }

  buildFormDataFromApp(app: ApplicationDTO): FormData {
    const formData = new FormData();

    if (app.id) {
      formData.append('id', app.id);
    }

    formData.append('strName', app.strName);
    formData.append('strDescription', app.strDescription);
    formData.append('strSlug', app.strSlug);
    formData.append('strTags', JSON.stringify(app.strTags));
    formData.append('strState', app.strState);
    formData.append(
      'strRoles',
      JSON.stringify(this.cleanRolesForFormData(app.strRoles))
    );

    // Enviamos el archivo si existe (nuevo archivo a subir)
    if (app.imageFile) {
      formData.append('file', app.imageFile);
    }

    // Enviamos la URL antigua de la imagen (para que backend sepa cuál es la actual y pueda eliminarla si hay un cambio)
    if (app.strUrlImage) {
      formData.append('strUrlImage', app.strUrlImage);
    }

    return formData;
  }

  // ===================
  // Aplicaciones
  // ===================

  getApplicationById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.applicationUrl}/${id}`);
  }

  getApplications(
    limit: number = 4,
    offset: number = 0
  ): Observable<Application[]> {
    return this.http.get<Application[]>(
      `${this.applicationUrl}?limit=${limit}&offset=${offset}`
    );
  }

  addTemporaryApplication(app: Application): void {
    // Solo genera un ID temporal si no tiene ID del todo
    if (!app.id) {
      app.id = `temp-${Date.now()}`;
    }

    const currentApps = this.applicationsSubject.getValue();
    const updatedApps = [...currentApps, app];
    this.applicationsSubject.next(updatedApps);

    this.setApplicationDTO({
      id: app.id,
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

  loadApplications(): Observable<Application[]> {
    return this.getApplications(10, 0).pipe(
      tap((apps) => this.applicationsSubject.next(apps)),
      catchError((error) => {
        console.error('Error loading applications.', error);
        return throwError(() => error);
      })
    );
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
    return this.http.post<any>(this.applicationUrl, applicationData).pipe(
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

  cleanRolesForFormData(strRoles: Rol[]): any[] {
    return strRoles.map((role) => ({
      strName: role.strName,
      strDescription1: role.strDescription1,
      strDescription2: role.strDescription2,
      menuOptions: (role.menuOptions || []).map((menu) => ({
        strName: menu.strName,
        strDescription: menu.strDescription,
        strUrl: menu.strUrl,
        strIcon: menu.strIcon,
        strType: menu.strType,
        ingOrder: Number(menu.ingOrder),
        strSubmenus: (menu.strSubmenus || []).map((sub) => ({
          strName: sub.strName,
          strDescription: sub.strDescription,
          strUrl: sub.strUrl,
          strIcon: sub.strIcon,
          strType: sub.strType,
          ingOrder: Number(sub.ingOrder),
        })),
      })),
    }));
  }

  deleteApplication(id: string): Observable<any> {
    return this.http.delete(`${this.applicationUrl}/${id}`);
  }

  updateApplication(id: string, applicationData: FormData): Observable<any> {
    const updateUrl = `${this.applicationUrl}/${id}`;
    return this.http.patch<any>(updateUrl, applicationData).pipe(
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
    return this.http.get<Application>(`${this.applicationUrl}/${strName}`);
  }

  // Obtener una aplicación y sus opciones de menú por nombre de aplicación y nombre de rol
  getApplicationByNameAndRol(
    applicationName: string,
    rolName: string
  ): Observable<Application> {
    const url = `${this.applicationUrl}/${applicationName}/rol/${rolName}`;
    return this.http.get<Application>(url);
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
