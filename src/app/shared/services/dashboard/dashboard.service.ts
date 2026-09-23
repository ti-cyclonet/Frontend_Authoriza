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
  principalUsers: {
    total: number;
    unconfirmed: number;
    active: number;
    suspended: number;
    expiring: number;
    delinquent: number;
  };
  applications: {
    total: number;
    byApplication: { name: string; userCount: number; roleCount: number }[];
  };
  packages: {
    total: number;
    byPackage: { name: string; contractCount: number; roleCount: number }[];
  };
  contracts: {
    total: number;
    active: number;
    expired: number;
    pendingSignature: number;
    byStatus: { status: string; count: number }[];
  };
  lastUpdated: Date;
}

export interface InvoiceStats {
  total: number;
  totalValue: number;
  paid: number;
  pending: number;
  overdue: number;
  byStatus: { status: string; count: number; value: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiBaseUrl + '/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getRecentActivity(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/recent-activity`);
  }

  getEntityCodes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/entity-codes`);
  }

  /** Estadísticas de facturas en un rango de fechas (ambos opcionales: sin
   * fechas trae el histórico completo). */
  getInvoiceStats(startDate?: string, endDate?: string): Observable<InvoiceStats> {
    let params = '';
    if (startDate && endDate) {
      params = `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<InvoiceStats>(`${this.apiUrl}/invoices/stats${params}`);
  }
}