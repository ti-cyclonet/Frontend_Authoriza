import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiBaseUrl + '/auth/login';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials).pipe(
      tap((response) => {
        if (isPlatformBrowser(this.platformId)) {
          this.setUserSession(response);
        }
      })
    );
  }

  setUserSession(userData: any): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('authToken', userData.access_token);
      sessionStorage.setItem('user_id', userData.user.id);
      sessionStorage.setItem('user_email', userData.user.email);
      sessionStorage.setItem('user_name', userData.user.name);
      sessionStorage.setItem('user_rol', userData.user.rol);
      sessionStorage.setItem('user_rolDescription',userData.user.rolDescription);
      sessionStorage.setItem('user_image', userData.user.image);

      // Nuevos campos
      sessionStorage.setItem('mustChangePassword', String(userData.user.mustChangePassword));
      sessionStorage.setItem('passwordLastChanged',userData.user.passwordLastChanged);

      if (userData.user.firstName) sessionStorage.setItem('user_firstName', userData.user.firstName);
      if (userData.user.secondName) sessionStorage.setItem('user_secondName', userData.user.secondName);
      if (userData.user.businessName) sessionStorage.setItem('user_businessName', userData.user.businessName);
    }
  }

  isPasswordExpired(passwordLastChanged: string): boolean {
    if (!passwordLastChanged) return true;
    const lastChanged = new Date(passwordLastChanged);
    const now = new Date();
    const diffInMs = now.getTime() - lastChanged.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays > 90;
  }

  logout(): void {
    sessionStorage.clear();
    localStorage.removeItem('user');
    localStorage.removeItem('imagePreview');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!sessionStorage.getItem('authToken');
    }
    return false;
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('authToken');
    }
    return null;
  }

  /** Segundos que le quedan al token actual (0 si no hay token o no se puede leer). */
  tokenSecondsLeft(): number {
    const token = this.getToken();
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
    } catch {
      return 0;
    }
  }

  /**
   * Renueva el token si le quedan menos de `thresholdSeconds` (pantallas que
   * quedan abiertas, como el Dashboard). El backend revalida al usuario y su rol,
   * y la sesión tiene una duración máxima desde el login.
   */
  renewSessionIfNeeded(thresholdSeconds = 15 * 60): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId) || !this.getToken() || this.tokenSecondsLeft() > thresholdSeconds) {
      return of(true);
    }
    return this.http.post<{ access_token: string }>(environment.apiBaseUrl + '/auth/renew', {}).pipe(
      tap((r) => { if (r?.access_token) sessionStorage.setItem('authToken', r.access_token); }),
      map(() => true),
      // Falla de red: se reintenta en el siguiente ciclo. 401: la sesión terminó
      // (duración máxima o usuario desactivado) y no se puede renovar.
      catchError(() => of(false)),
    );
  }

  /** El token ya venció y no se pudo renovar. */
  sessionExpired(): boolean {
    return !!this.getToken() && this.tokenSecondsLeft() === 0;
  }
}
