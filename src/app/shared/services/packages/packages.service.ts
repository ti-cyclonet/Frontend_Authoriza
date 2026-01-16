import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  roles: any[];
  contractDate?: Date;
  expirationDate?: Date;
  status: string;
}

export interface PackageContract {
  userId: string;
  packageId: string;
  contractDate: Date;
  expirationDate?: Date;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class PackagesService {
  private apiUrl = `${environment.apiBaseUrl}/api/packages`;

  constructor(private http: HttpClient) {}

  // Obtener todos los paquetes disponibles
  getPackages(): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}`);
  }

  // Obtener paquete por ID
  getPackageById(id: string): Observable<Package> {
    return this.http.get<Package>(`${this.apiUrl}/${id}`);
  }

  // Obtener paquetes contratados por usuario
  getContractedPackagesByUser(userId: string): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/contracted/${userId}`);
  }

  // Contratar un paquete
  contractPackage(contract: PackageContract): Observable<any> {
    return this.http.post(`${this.apiUrl}/contract`, contract);
  }

  // Renovar un paquete
  renewPackage(userId: string, packageId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/renew`, { userId, packageId });
  }

  // Cancelar un paquete
  cancelPackage(userId: string, packageId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/cancel`, { userId, packageId });
  }

  // Obtener roles disponibles para un usuario basado en sus paquetes contratados
  getAvailableRolesForUser(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/available-roles/${userId}`);
  }

  // Verificar si un usuario puede acceder a un rol específico
  canUserAccessRole(userId: string, roleId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/can-access-role/${userId}/${roleId}`);
  }
}