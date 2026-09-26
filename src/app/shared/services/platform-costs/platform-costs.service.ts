import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PlatformRate { platform: string; metric: string; label: string; usdPerUnit: number; }

export interface PlatformCostSettings {
  usdToCop: number;
  rates: PlatformRate[];
  budgets: Record<string, number>;
  awsAllocation: Record<string, number>;
  cloudinaryMonthlyUsd: number;
  cloudinaryUsdPerCredit: number;
}

export interface PlatformCostCard {
  platform: 'AWS' | 'CLOUDINARY' | 'BELVO';
  costUsd: number;
  costCop: number;
  previousUsd: number;
  projectedUsd: number;
  budgetUsd: number;
  budgetPct: number | null;
  alert: boolean;
  estimated: boolean;
  services?: { service: string; usd: number }[];
  credits?: number;
}

export interface PlatformCostsDashboard {
  month: string;
  isCurrent: boolean;
  daysElapsed: number;
  daysInMonth: number;
  usdToCop: number;
  totals: { costUsd: number; costCop: number; previousUsd: number; projectedUsd: number; revenueCop: number };
  platforms: PlatformCostCard[];
  byApplication: {
    application: string; awsUsd: number; sesUsd: number; cloudinaryUsd: number; belvoUsd: number; totalUsd: number;
    costCop: number; revenueCop: number; marginCop: number; marginPct: number | null;
  }[];
  topTenants: { tenantId: string; name: string; costUsd: number; costCop: number; revenueCop: number; marginCop: number }[];
  usage: { emails: number; uploads: number; uploadBytes: number; belvoCalls: number };
  cloudinary: { creditsUsed: number; creditsLimit: number; usedPercent: number; plan: string | null } | null;
  sources: {
    aws: { configured: boolean; lastSync: string | null; error: string | null };
    cloudinary: { lastSync: string | null; error: string | null };
  };
}

@Injectable({ providedIn: 'root' })
export class PlatformCostsService {
  private readonly base = `${environment.apiBaseUrl}/platform-costs`;

  constructor(private http: HttpClient) {}

  dashboard(month?: string): Observable<PlatformCostsDashboard> {
    return this.http.get<PlatformCostsDashboard>(`${this.base}/dashboard`, { params: month ? { month } : {} });
  }

  settings(): Observable<PlatformCostSettings> {
    return this.http.get<PlatformCostSettings>(`${this.base}/settings`);
  }

  saveSettings(dto: Partial<PlatformCostSettings>): Observable<PlatformCostSettings> {
    return this.http.put<PlatformCostSettings>(`${this.base}/settings`, dto);
  }

  sync(): Observable<Record<string, string>> {
    return this.http.post<Record<string, string>>(`${this.base}/sync`, {});
  }
}
