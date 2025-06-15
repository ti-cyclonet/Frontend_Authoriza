import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../model/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = '/api/users';
  private usersSubject = new BehaviorSubject<any[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Cargar usuarios y actualizar el BehaviorSubject
  loadUsers(): void {
    this.getUsers().subscribe({
      next: (users) => this.usersSubject.next(users),
      error: (error) => console.error('Error al cargar usuarios', error),
    });
  }

  // Obtener usuarios actuales del BehaviorSubject
  getCurrentUsers(): any[] {
    return this.usersSubject.getValue();
  }

  // Cambiar contraseña del usuario
  changePassword(userId: string, oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`/api/users/${userId}/change-password`, {
      oldPassword,
      newPassword,
    });
  }

  // Obtener usuarios con paginación
  getAllPaginated(limit: number, offset: number) {
    return this.http.get(`${this.apiUrl}?limit=${limit}&offset=${offset}`);
  }

  // Buscar usuarios con parámetros
  searchUsers(params: { limit: number; offset: number; search?: string }) {
    const { limit, offset, search } = params;
    let url = `${this.apiUrl}?limit=${limit}&offset=${offset}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get(url);
  }

  // Alternar estado de usuario (activo/inactivo)
  toggleUserStatus(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Actualizar usuario
  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${user.id}`, user);
  }
}
