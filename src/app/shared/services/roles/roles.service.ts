import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Rol } from '../../model/rol';
import { ApplicationWithRoles } from '../../model/application-with-roles';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private rolesSubject = new BehaviorSubject<any[]>([]);
  public roles$ = this.rolesSubject.asObservable();

  private baseApiUrl = environment.apiBaseUrl;
  private validateNameUrl = this.baseApiUrl + '/api/roles/check-name';
  private searchRolesUrl = this.baseApiUrl + '/api/roles';
  private searchRolesUrlApp = this.baseApiUrl + '/api/applications';


  constructor(private http: HttpClient) {}

  checkRoleName(strName: string): Observable<boolean> {
    const params = { strName };
    return this.http
      .get<{ available: boolean }>(`${this.validateNameUrl}`, { params })
      .pipe(map((res) => res.available));
  }

  searchRoles(appName: string, roleName: string): Observable<Rol[]> {
    if (appName && roleName) {
      return this.http
        .get<any>(
          `${this.searchRolesUrlApp}/${appName}/rol/${roleName}`
        )
        .pipe(map((res) => res.strRoles as Rol[]));
    }

    if (appName) {
      return this.http
        .get<any>(`${this.searchRolesUrlApp}/${appName}`)
        .pipe(
          map((res) => {
            // construimos un Rol[] falso con solo el nombre para llenar la tabla
            return res.strRoles.map((roleName: string) => ({
              id: '',
              strName: roleName,
              strDescription1: '',
              strDescription2: '',
              menuOptions: [],
            })) as Rol[];
          })
        );
    }

    return of([]);
  }

  getRoleByApplicationAndName(appName: string, roleName: string) {
    return this.http.get<any>(
      `${this.searchRolesUrlApp}/${appName}/rol/${roleName}`
    );
  }

  getRolesByApplicationName(appName: string) {
    return this.http.get<string[]>(`${this.searchRolesUrlApp}/${appName}/rol`);
  }

  getAllApplicationsWithRoles() {
    return this.http.get<ApplicationWithRoles[]>(`${this.searchRolesUrlApp}`);
  }
}
