import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    unconfirmed: number;
    byRole: { role: string; count: number }[];
  };
  invoices: {
    total: number;
    totalValue: number;
    paid: number;
    pending: number;
    overdue: number;
    byStatus: { status: string; count: number; value: number }[];
    monthlyRevenue: { month: string; revenue: number }[];
  };
  contracts: {
    total: number;
    active: number;
    expired: number;
    byStatus: { status: string; count: number }[];
  };
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiBaseUrl + '/api/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getRecentActivity(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/recent-activity`);
  }
}