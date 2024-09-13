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
  private apiUrl = 'http://localhost:3000/roles';

  // Método para obtener los roles desde el servidor
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl); // Ajusta la URL según tu API
  }

  // Método para cargar roles y actualizar el BehaviorSubject
  loadRoles(): void {
    this.getRoles().subscribe({
      next: (roles) => {
        this.rolesSubject.next(roles); // Actualiza los roles en el BehaviorSubject
      },
      error: (error) => {
        console.error('Error al cargar roles', error);
      }
    });
  }

  // Método para acceder a los roles actuales
  getCurrentRoles(): any[] {
    return this.rolesSubject.getValue();
  }
}
