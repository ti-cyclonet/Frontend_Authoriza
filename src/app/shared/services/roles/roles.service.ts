// src/app/services/roles.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private rolesSubject = new BehaviorSubject<any[]>([]);
  public roles$ = this.rolesSubject.asObservable();
  private apiUrl = '/api/roles';

  constructor(private http: HttpClient) {}

  checkRoleName(strName: string): Observable<boolean> {
    const params = { strName };
    return this.http
      .get<{ available: boolean }>(`${this.apiUrl}/check-name`, { params })
      .pipe(map((res) => res.available));
  }
}
