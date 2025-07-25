import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../model/user';
import { environment } from '../../../../environments/environment';
import { CreateFullUser } from '../../model/createfulluser';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseApiUrl = environment.apiBaseUrl;

  private userUrl = this.baseApiUrl + '/api/users';
  private usersSubject = new BehaviorSubject<any[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Crear nuevo usuario
  createUser(user: any): Observable<any> {
    return this.http.post<any>(`${this.userUrl}`, user);
  }

  createFullUser(data: CreateFullUser): Observable<any> {
    return this.http.post(`${this.userUrl}/full`, data);
  }

  checkUserNameAvailability(
    userName: string
  ): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(
      `${this.userUrl}/check-username/${encodeURIComponent(userName)}`
    );
  }

  // Crear datos básicos asociados a un usuario
  createBasicData(userId: string, basicData: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseApiUrl}/api/basic-data/${userId}`,
      basicData
    );
  }

  // Crear datos de persona natural
  createNaturalPersonData(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseApiUrl}/api/natural-person-data`,
      data
    );
  }

  // Crear datos de persona jurídica
  createLegalEntityData(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseApiUrl}/api/legal-entity-data`,
      data
    );
  }

  // Obtener todos los usuarios
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.userUrl);
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
  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Observable<any> {
    return this.http.post(`${this.userUrl}/${userId}/change-password`, {
      oldPassword,
      newPassword,
    });
  }

  // Obtener usuarios con paginación
  getAllPaginated(limit: number, offset: number) {
    return this.http.get(`${this.userUrl}?limit=${limit}&offset=${offset}`);
  }

  // Buscar usuarios con parámetros
  searchUsers(params: { limit: number; offset: number; search?: string }) {
    const { limit, offset, search } = params;
    let url = `${this.userUrl}?limit=${limit}&offset=${offset}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get(url);
  }

  // Alternar estado de usuario (activo/inactivo)
  toggleUserStatus(id: string, status: string): Observable<User> {
    return this.http.patch<User>(`${this.userUrl}/${id}/toggle-status/status`, {
      status,
    });
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.userUrl}/${userId}`);
  }

  updateUserStatus(userId: string, status: string): Observable<User> {
    return this.http.patch<User>(`${this.userUrl}/${userId}/status-with-dependents`, {
      status,
    });
  }

  // Actualizar usuario
  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.userUrl}/${user.id}`, user);
  }

  getUsersByDependentOnId(dependentOnId: string): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.userUrl}?dependentOnId=${dependentOnId}`
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.userUrl}`);
  }

  getUsersExcludingDependency(): Observable<User[]> {
    const userId = sessionStorage.getItem('user_id');
    return this.http.get<User[]>(
      `${this.userUrl}/without-dependency/${userId}`
    );
  }

  assignRoleToUser(userId: string, roleId: string): Observable<any> {
    return this.http.post(`${this.userUrl}/${userId}/assign-role`, { roleId });
  }

  assignDependency(userId: string, dependentOnId: string): Observable<any> {
    return this.http.put(`${this.userUrl}/${userId}`, {
      dependentOnId,
    });
  }

  removeAllRoles(userId: string): Observable<any> {
    return this.http.delete(`${this.userUrl}/${userId}/roles`);
  }

  removeDependency(userId: string): Observable<any> {
    return this.http.patch(`${this.userUrl}/${userId}/remove-dependency`, {});
  }
}
