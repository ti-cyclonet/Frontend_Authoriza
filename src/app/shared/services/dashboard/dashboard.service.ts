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

/** Resumen del Dashboard (GET /dashboard/overview), se consulta cada 30 s. */
export interface DashboardOverview {
  generatedAt: string;
  revenue: {
    collectedMonth: number; collectedPrevMonth: number; paymentsMonth: number;
    billedMonth: number; billedPrevMonth: number; invoicesMonth: number;
    collectionRate: number | null; mrr: number;
  };
  receivables: { pendingValue: number; pendingCount: number; overdueValue: number; overdueCount: number; paymentReported: number };
  clients: { active: number; activeContracts: number; newContractsMonth: number; newContractsPrevMonth: number; pendingSignature: number };
  users: { total: number; active: number; unconfirmed: number; newToday: number; newWeek: number; logins24h: number; activeUsers24h: number };
  alerts: {
    expiringContracts: { id: string; code: string; endDate: string; client: string; package: string; daysLeft: number }[];
    overdueInvoices: { id: number; code: string; value: number; expirationDate: string; client: string; daysOverdue: number }[];
  };
  series: {
    months: { key: string; label: string; billed: number; collected: number }[];
    signups: { date: string; count: number }[];
  };
  activity: { id: string; level: string; action: string; message: string; createdAt: string }[];
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

  getOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(`${this.apiUrl}/overview`);
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