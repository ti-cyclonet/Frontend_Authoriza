import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CreateUserDependencyDto {
  principalUserId: string;
  dependentUserId: string;
  status?: string;
}

export interface UserDependency {
  id: string;
  principalUserId: string;
  dependentUserId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  principalUser?: any;
  dependentUser?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserDependenciesService {
  private apiUrl = `${environment.apiBaseUrl}/user-dependencies`;

  constructor(private http: HttpClient) {}

  createDependency(dto: CreateUserDependencyDto): Observable<UserDependency> {
    return this.http.post<UserDependency>(this.apiUrl, dto);
  }

  getDependentsByPrincipal(principalUserId: string): Observable<UserDependency[]> {
    return this.http.get<UserDependency[]>(`${this.apiUrl}/principal/${principalUserId}`);
  }

  getPrincipalsByDependent(dependentUserId: string): Observable<UserDependency[]> {
    return this.http.get<UserDependency[]>(`${this.apiUrl}/dependent/${dependentUserId}`);
  }

  getAllDependencies(): Observable<UserDependency[]> {
    return this.http.get<UserDependency[]>(this.apiUrl);
  }

  deactivateDependency(id: string): Observable<UserDependency> {
    return this.http.patch<UserDependency>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  deleteDependency(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}