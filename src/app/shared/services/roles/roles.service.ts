import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private rolesSubject = new BehaviorSubject<any[]>([]);
  public roles$ = this.rolesSubject.asObservable();

  constructor(private http: HttpClient) {}
  private apiUrl = '/api/roles';

  // Método para obtener los roles desde el servidor
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Método para cargar roles y actualizar el BehaviorSubject
  loadRoles(): void {
    this.getRoles().subscribe({
      next: (roles) => {
        this.rolesSubject.next(roles);
      },
      error: (error) => {
        console.error('Error loading roles.', error);
      }
    });
  }

  // Método para acceder a los roles actuales
  getCurrentRoles(): any[] {
    return this.rolesSubject.getValue();
  }
}
