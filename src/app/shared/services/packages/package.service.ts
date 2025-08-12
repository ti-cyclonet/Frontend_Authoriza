import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { Package } from '../../model/package.model';
import { environment } from '../../../../environments/environment';
import { Application } from '../../model/application.model';
import { Rol } from '../../model/rol';
import { NewPackageDTO } from '../../model/new-package-dto';

@Injectable({
  providedIn: 'root',
})
export class PackageService {
  private baseApiUrl = environment.apiBaseUrl;
  private packageUrl = this.baseApiUrl + '/api/packages';
  private checkNameUrl = this.packageUrl + '/check-name';
  private rolesUrl = this.baseApiUrl + '/api/roles';
  private applicationUrl = this.baseApiUrl + '/api/applications';

  constructor(private http: HttpClient) {}

  getAllPackages(): Observable<Package[]> {
    return this.http.get<Package[]>(this.packageUrl);
  }

  checkPackageName(name: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(
      `${this.checkNameUrl}?name=${encodeURIComponent(name)}`
    );
  }

  getRolesByFilter(
    filter: string,
    page: number,
    size: number = 5
  ): Observable<{ content: Rol[]; total: number }> {
    const params = {
      filter,
      page,
      size,
    };
    return this.http.get<{ content: Rol[]; total: number }>(
      `${this.rolesUrl}`,
      { params }
    );
  }

  getApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.applicationUrl}`);
  }

  getRolesByApplication(appName: string): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.applicationUrl}/${appName}/full-roles`);
  }

  createPackage(pkgData: any, imageFiles: File[]) {
    const formData = new FormData();

    // Agregar todas las imágenes
    imageFiles.forEach((file) => {
      formData.append('files', file);
    });

    // Agregar otros campos
    formData.append('name', pkgData.name);
    formData.append('description', pkgData.description);
    formData.append('configurations', JSON.stringify(pkgData.configurations));

    return this.http.post(this.packageUrl, formData);
  }
}
