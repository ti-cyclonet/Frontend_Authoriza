import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiBaseUrl + '/api/auth/login';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http
      .post<{
        access_token: string;
        email: string;
        name: string;
        rol: string;
        image: string;
      }>(this.apiUrl, credentials)
      .pipe(
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
      sessionStorage.setItem(
        'user_rolDescription',
        userData.user.rolDescription
      );
      sessionStorage.setItem('user_image', userData.user.image);

      if (userData.user.firstName)
        sessionStorage.setItem('user_firstName', userData.user.firstName);
      if (userData.user.secondName)
        sessionStorage.setItem('user_secondName', userData.user.secondName);
      if (userData.user.businessName)
        sessionStorage.setItem('user_businessName', userData.user.businessName);
    }
  }

  logout() {
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('imagePreview');
    sessionStorage.clear();
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
}
