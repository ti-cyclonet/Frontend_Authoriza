import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CreateUserRoleDto {
  userId: string;
  roleId: string;
  contractId?: string;
  status?: string;
}

export interface RoleAvailability {
  role: any;
  total: number;
  assigned: number;
  available: number;
  price: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserRolesService {
  private apiUrl = `${environment.apiBaseUrl}/user-roles`;

  constructor(private http: HttpClient) {}

  assignRole(dto: CreateUserRoleDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign`, dto);
  }

  getUserRoles(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  getAllUserRoles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  removeRole(userId: string, roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/${roleId}`);
  }

  getRoleAvailability(contractId: string): Observable<RoleAvailability[]> {
    return this.http.get<RoleAvailability[]>(`${this.apiUrl}/availability/${contractId}`);
  }

  getAssignedCount(contractId: string, roleId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/assigned-count/${contractId}/${roleId}`);
  }
}
