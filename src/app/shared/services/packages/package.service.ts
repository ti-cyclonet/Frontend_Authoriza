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
  private packageUrl = this.baseApiUrl + '/packages';
  private checkNameUrl = this.packageUrl + '/check-name';
  private rolesUrl = this.baseApiUrl + '/roles';
  private applicationUrl = this.baseApiUrl + '/applications';

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
    formData.append('price', String(pkgData.price || 0));
    formData.append('isBillable', String(pkgData.isBillable !== false));
    formData.append('showInLanding', String(pkgData.showInLanding || false));
    if (pkgData.displayName) formData.append('displayName', pkgData.displayName);
    formData.append('displayOrder', String(pkgData.displayOrder || 0));
    formData.append('isHighlighted', String(pkgData.isHighlighted || false));
    if (pkgData.ctaLabel) formData.append('ctaLabel', pkgData.ctaLabel);
    if (pkgData.ctaType) formData.append('ctaType', pkgData.ctaType);
    formData.append('configurations', JSON.stringify(pkgData.configurations));

    // Agregar variables de límite de uso
    if (pkgData.usageLimitVariables) {
      formData.append('usageLimitVariables', JSON.stringify(pkgData.usageLimitVariables));
    }

    return this.http.post(this.packageUrl, formData);
  }

  deletePackage(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.packageUrl}/${id}`);
  }

  updatePackage(id: string, data: any): Observable<Package> {
    return this.http.put<Package>(`${this.packageUrl}/${id}`, data);
  }

  uploadPackageImage(packageId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/images/upload/${packageId}`, formData);
  }
}
