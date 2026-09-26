import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import {
  PlatformCostSettings, PlatformCostsDashboard, PlatformCostsService,
} from '../../../shared/services/platform-costs/platform-costs.service';

/** Indicadores de consumo y costos de plataformas externas (solo adminAuthoriza). */
@Component({
  selector: 'app-platform-costs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './platform-costs.component.html',
  styleUrl: './platform-costs.component.css',
})
export class PlatformCostsComponent implements OnInit {
  readonly applications = ['Authoriza', 'Inout', 'FactoNet', 'Shotra', 'Kiri'];
  readonly platformNames = ['AWS', 'CLOUDINARY', 'BELVO'];

  data: PlatformCostsDashboard | null = null;
  settings: PlatformCostSettings | null = null;
  month = new Date().toISOString().slice(0, 7);
  loading = false;
  syncing = false;
  saving = false;
  showSettings = false;
  error: string | null = null;
  message: string | null = null;

  constructor(private service: PlatformCostsService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.service.dashboard(this.month).subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: (e) => { this.error = e?.error?.message || 'No se pudieron cargar los costos de plataformas.'; this.loading = false; },
    });
  }

  sync() {
    this.syncing = true;
    this.message = null;
    this.service.sync().subscribe({
      next: (r) => {
        this.syncing = false;
        this.message = Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' · ');
        this.load();
      },
      error: (e) => { this.syncing = false; this.error = e?.error?.message || 'No se pudo sincronizar.'; },
    });
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
    if (this.showSettings && !this.settings) {
      this.service.settings().subscribe({
        next: (s) => {
          s.budgets = s.budgets || {};
          s.awsAllocation = s.awsAllocation || {};
          this.settings = s;
        },
        error: () => (this.error = 'No se pudo cargar la configuración.'),
      });
    }
  }

  allocationTotal(): number {
    if (!this.settings) return 0;
    return this.applications.reduce((s, a) => s + (Number(this.settings!.awsAllocation[a]) || 0), 0);
  }

  saveSettings() {
    if (!this.settings) return;
    this.saving = true;
    const { usdToCop, rates, budgets, awsAllocation, cloudinaryMonthlyUsd, cloudinaryUsdPerCredit } = this.settings;
    this.service.saveSettings({ usdToCop, rates, budgets, awsAllocation, cloudinaryMonthlyUsd, cloudinaryUsdPerCredit }).subscribe({
      next: (s) => { this.settings = s; this.saving = false; this.message = 'Configuración guardada.'; this.load(); },
      error: (e) => { this.saving = false; this.error = e?.error?.message || 'No se pudo guardar la configuración.'; },
    });
  }

  // ── Formato ──

  usd(v: number | null | undefined, digits = 2): string {
    return 'US$ ' + (Number(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  cop(v: number | null | undefined): string {
    return '$ ' + Math.round(Number(v) || 0).toLocaleString('es-CO');
  }

  int(v: number | null | undefined): string {
    return Math.round(Number(v) || 0).toLocaleString('es-CO');
  }

  mb(bytes: number): string {
    const mb = (Number(bytes) || 0) / 1048576;
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
  }

  variation(current: number, previous: number): number | null {
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  platformLabel(p: string): string {
    return p === 'AWS' ? 'Amazon Web Services' : p === 'CLOUDINARY' ? 'Cloudinary' : p === 'BELVO' ? 'Belvo' : p;
  }

  platformIcon(p: string): string {
    return p === 'AWS' ? 'cloud-fill' : p === 'CLOUDINARY' ? 'images' : 'bank';
  }

  barWidth(pct: number | null | undefined): number {
    return Math.min(100, Math.max(0, Number(pct) || 0));
  }

  appClass(app: string): string {
    return 'app-' + app.toLowerCase();
  }
}
