import { Component, HostListener, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { forkJoin, of, Subscription, catchError, switchMap } from 'rxjs';
import { DashboardOverview, DashboardService, DashboardStats } from '../../shared/services/dashboard/dashboard.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { PlatformCostsComponent } from './platform-costs/platform-costs.component';

/** Cada cuánto se refrescan los indicadores (solo con la pestaña visible). */
const REFRESH_MS = 30_000;
/** Cada cuánto se revisa el token, aunque la pestaña esté oculta. */
const KEEPALIVE_MS = 60_000;

interface AttentionItem {
  icon: string;
  tone: 'danger' | 'warning' | 'info';
  count: number;
  label: string;
  detail: string;
  link: string;
}

/**
 * Dashboard de Authoriza: indicadores del ecosistema en tiempo real (se
 * refresca cada 30 s y al volver a la pestaña). La pantalla puede quedar
 * abierta: no cierra sesión por inactividad (ver IdleTimeoutService) y renueva
 * su token antes de que venza.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ChartModule, PlatformCostsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  overview: DashboardOverview | null = null;
  stats: DashboardStats | null = null;
  loading = true;
  refreshing = false;
  error: string | null = null;
  /** La última actualización falló (se conservan los datos anteriores). */
  stale = false;
  /** La sesión llegó a su duración máxima (o el usuario fue desactivado). */
  sessionEnded = false;
  lastUpdated: Date | null = null;
  now = Date.now();
  /** Ids de eventos que llegaron en la última actualización (se resaltan). */
  freshActivity = new Set<string>();

  revenueChart: any;
  signupsChart: any;
  appsChart: any;
  contractsChart: any;
  barOptions: any;
  lineOptions: any;
  hbarOptions: any;
  vbarOptions: any;

  readonly isPlatformAdmin = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('user_rol') === 'adminAuthoriza';
  readonly userName = typeof sessionStorage !== 'undefined'
    ? (sessionStorage.getItem('user_firstName') || sessionStorage.getItem('user_name') || '').split(' ')[0]
    : '';

  private refreshTimer: any;
  private keepAliveTimer: any;
  private clockTimer: any;
  private sub?: Subscription;
  private seenActivity = new Set<string>();
  private readonly isBrowser: boolean;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initChartOptions();
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.refresh(true);
    this.refreshTimer = setInterval(() => { if (!document.hidden) this.refresh(); }, REFRESH_MS);
    // El token se renueva también con la pestaña en segundo plano: antes solo
    // se renovaba al actualizar los indicadores (que se pausan si la pestaña
    // está oculta) y al volver después de 1 h el token ya había vencido.
    this.keepAliveTimer = setInterval(() => this.keepAlive(), KEEPALIVE_MS);
    // "Actualizado hace N s": reloj de la vista, fuera de Angular salvo el tic
    this.zone.runOutsideAngular(() => {
      this.clockTimer = setInterval(() => this.zone.run(() => (this.now = Date.now())), 5_000);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshTimer);
    clearInterval(this.keepAliveTimer);
    clearInterval(this.clockTimer);
    this.sub?.unsubscribe();
  }

  /** Al volver a la pestaña se actualiza enseguida. */
  @HostListener('document:visibilitychange')
  onVisibility(): void {
    if (this.isBrowser && !document.hidden && this.lastUpdated && Date.now() - this.lastUpdated.getTime() > 10_000) this.refresh();
  }

  private keepAlive(): void {
    if (this.sessionEnded) return;
    this.authService.renewSessionIfNeeded().subscribe(() => {
      if (this.authService.sessionExpired()) this.endSession();
    });
  }

  private endSession(): void {
    this.sessionEnded = true;
    clearInterval(this.refreshTimer);
    clearInterval(this.keepAliveTimer);
  }

  goToLogin(): void {
    sessionStorage.clear();
    window.location.href = '/login';
  }

  refresh(first = false): void {
    if (this.refreshing || this.sessionEnded) return;
    this.refreshing = true;
    this.sub?.unsubscribe();
    this.sub = this.authService.renewSessionIfNeeded().pipe(
      switchMap(() => forkJoin({
        overview: this.dashboardService.getOverview(),
        stats: this.dashboardService.getStats().pipe(catchError(() => of(this.stats))),
      })),
    ).subscribe({
      next: ({ overview, stats }) => {
        this.markFreshActivity(overview, first);
        this.overview = overview;
        this.stats = stats;
        this.buildCharts();
        this.attention = this.buildAttention();
        this.topApps = this.buildTopApps();
        this.lastUpdated = new Date();
        this.now = Date.now();
        this.loading = false;
        this.refreshing = false;
        this.error = null;
        this.stale = false;
      },
      error: () => {
        this.refreshing = false;
        this.loading = false;
        if (this.authService.sessionExpired()) { this.endSession(); return; }
        if (this.overview) this.stale = true;
        else this.error = 'No se pudieron cargar los indicadores. Se reintentará automáticamente.';
      },
    });
  }

  // ─── Indicadores ────────────────────────────────────────────────────────

  /** Variación porcentual contra el mes anterior (null si no hay base). */
  delta(current: number, previous: number): number | null {
    if (!previous) return current ? null : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  get updatedLabel(): string {
    if (!this.lastUpdated) return '';
    const s = Math.max(0, Math.round((this.now - this.lastUpdated.getTime()) / 1000));
    if (s < 10) return 'justo ahora';
    if (s < 60) return `hace ${s} s`;
    return `hace ${Math.floor(s / 60)} min`;
  }

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  }

  get monthLabel(): string {
    return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date());
  }

  /** Lo que requiere acción, de lo más urgente a lo informativo (se calcula
   * al actualizar, no en cada detección de cambios: así el *ngFor no recrea
   * la lista cada vez que corre el reloj de la vista). */
  attention: AttentionItem[] = [];
  topApps: { name: string; userCount: number; share: number }[] = [];

  private buildAttention(): AttentionItem[] {
    const o = this.overview;
    if (!o) return [];
    const items: AttentionItem[] = [];
    if (o.receivables.paymentReported) items.push({ icon: 'cash-stack', tone: 'warning', count: o.receivables.paymentReported, label: 'Pagos reportados por verificar', detail: 'Clientes que ya enviaron su comprobante', link: '/contracts' });
    if (o.receivables.overdueCount) items.push({ icon: 'exclamation-octagon-fill', tone: 'danger', count: o.receivables.overdueCount, label: 'Facturas vencidas', detail: `${this.money(o.receivables.overdueValue)} en mora`, link: '/contracts' });
    if (o.alerts.expiringContracts.length) items.push({ icon: 'hourglass-split', tone: 'warning', count: o.alerts.expiringContracts.length, label: 'Contratos por vencer (30 días)', detail: `El más próximo en ${o.alerts.expiringContracts[0].daysLeft} día(s)`, link: '/contracts' });
    if (o.clients.pendingSignature) items.push({ icon: 'pen-fill', tone: 'info', count: o.clients.pendingSignature, label: 'Contratos pendientes de firma', detail: 'Falta la firma del cliente o del administrador', link: '/contracts' });
    if (o.users.unconfirmed) items.push({ icon: 'person-exclamation', tone: 'info', count: o.users.unconfirmed, label: 'Usuarios sin confirmar', detail: 'No han verificado su correo', link: '/users' });
    return items;
  }

  trackByLabel = (_: number, a: AttentionItem) => a.label;
  trackByName = (_: number, a: { name: string }) => a.name;
  trackById = (_: number, a: { id: string | number }) => a.id;

  // ─── Formato ────────────────────────────────────────────────────────────

  money(value: number): string {
    return '$' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(value || 0));
  }

  /** $1,2 M / $850 mil para las tarjetas. */
  compactMoney(value: number): string {
    const v = Math.round(value || 0);
    if (Math.abs(v) >= 1_000_000) return '$' + (v / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M';
    if (Math.abs(v) >= 10_000) return '$' + Math.round(v / 1000).toLocaleString('es-CO') + ' mil';
    return this.money(v);
  }

  relativeTime(iso: string): string {
    const s = Math.max(0, Math.round((this.now - new Date(iso).getTime()) / 1000));
    if (s < 60) return 'hace un momento';
    if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
    if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
    return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }

  private readonly logMeta: Record<string, { icon: string; label: string }> = {
    USER_CREATED: { icon: 'person-plus-fill', label: 'Usuario creado' },
    USER_ACTIVATED: { icon: 'person-check-fill', label: 'Usuario activado' },
    USER_DEACTIVATED: { icon: 'person-x-fill', label: 'Usuario desactivado' },
    USER_DELETED: { icon: 'person-dash-fill', label: 'Usuario eliminado' },
    CONTRACT_ACTIVATED: { icon: 'file-earmark-check-fill', label: 'Contrato activado' },
    CONTRACT_DEACTIVATED: { icon: 'file-earmark-x-fill', label: 'Contrato desactivado' },
    CONTRACT_UPGRADED: { icon: 'arrow-up-circle-fill', label: 'Cambio de plan' },
    LOGIN: { icon: 'box-arrow-in-right', label: 'Inicio de sesión' },
    LOGOUT: { icon: 'box-arrow-right', label: 'Cierre de sesión' },
    PDF_GENERATED: { icon: 'file-pdf-fill', label: 'PDF generado' },
  };

  logIcon(action: string): string { return this.logMeta[action]?.icon || 'info-circle-fill'; }
  logLabel(action: string): string { return this.logMeta[action]?.label || action; }

  private readonly appVisuals: { match: string; icon: string; color: string }[] = [
    { match: 'authoriza', icon: 'shield-lock-fill', color: '#7c3aed' },
    { match: 'inout', icon: 'truck', color: '#f2994a' },
    { match: 'facto', icon: 'cash-coin', color: '#2563eb' },
    { match: 'shotra', icon: 'bicycle', color: '#991b1b' },
    { match: 'kiri', icon: 'wallet2', color: '#166534' },
    { match: 'aidcash', icon: 'wallet2', color: '#166534' },
  ];

  appIcon(name: string): string { return this.appVisuals.find((v) => name?.toLowerCase().includes(v.match))?.icon || 'grid-3x3-gap-fill'; }
  appColor(name: string): string { return this.appVisuals.find((v) => name?.toLowerCase().includes(v.match))?.color || '#636e72'; }

  private buildTopApps(): { name: string; userCount: number; share: number }[] {
    const apps = [...(this.stats?.applications?.byApplication || [])].sort((a, b) => b.userCount - a.userCount);
    const max = Math.max(1, ...apps.map((a) => a.userCount));
    return apps.map((a) => ({ name: a.name, userCount: a.userCount, share: Math.round((a.userCount / max) * 100) }));
  }

  private readonly contractStatusLabels: Record<string, string> = {
    DRAFT: 'Borrador', PENDING: 'Pendiente', ACTIVE: 'Activo', SUSPENDED: 'Suspendido', CANCELLED: 'Cancelado',
    EXPIRED: 'Expirado', TERMINATED: 'Terminado', RENEWED: 'Renovado', DELETED: 'Eliminado',
  };

  // ─── Gráficas ───────────────────────────────────────────────────────────

  private markFreshActivity(o: DashboardOverview, first: boolean): void {
    this.freshActivity = new Set(first ? [] : o.activity.filter((a) => !this.seenActivity.has(a.id)).map((a) => a.id));
    o.activity.forEach((a) => this.seenActivity.add(a.id));
  }

  /** Solo se reemplaza la gráfica si cambiaron sus datos (evita parpadeos cada 30 s). */
  private keep(current: any, next: any): any {
    return current && JSON.stringify(current) === JSON.stringify(next) ? current : next;
  }

  private buildCharts(): void {
    const o = this.overview!;
    this.revenueChart = this.keep(this.revenueChart, {
      labels: o.series.months.map((m) => m.label),
      datasets: [
        { label: 'Facturado', data: o.series.months.map((m) => m.billed), backgroundColor: 'rgba(102, 126, 234, 0.35)', borderRadius: 6, barPercentage: 0.7 },
        { label: 'Recaudado', data: o.series.months.map((m) => m.collected), backgroundColor: '#4338ca', borderRadius: 6, barPercentage: 0.7 },
      ],
    });
    this.signupsChart = this.keep(this.signupsChart, {
      labels: o.series.signups.map((d) => new Date(d.date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })),
      datasets: [{
        label: 'Registros', data: o.series.signups.map((d) => d.count), fill: true, tension: 0.35,
        borderColor: '#4facfe', backgroundColor: 'rgba(79, 172, 254, 0.15)', pointRadius: 0, pointHoverRadius: 4, borderWidth: 2,
      }],
    });
    const byStatus = [...(this.stats?.contracts?.byStatus || [])].sort((a, b) => b.count - a.count);
    const palette: Record<string, string> = {
      ACTIVE: '#43e97b', PENDING: '#f6d55c', DRAFT: '#9ca3af', EXPIRED: '#ff6b6b', SUSPENDED: '#f093fb',
      CANCELLED: '#4b5563', TERMINATED: '#ef4444', RENEWED: '#4facfe', DELETED: '#374151',
    };
    this.contractsChart = this.keep(this.contractsChart, byStatus.length ? {
      labels: byStatus.map((c) => this.contractStatusLabels[c.status] || c.status),
      datasets: [{ data: byStatus.map((c) => c.count), backgroundColor: byStatus.map((c) => palette[c.status] || '#9ca3af'), borderWidth: 0 }],
    } : null);
  }

  private initChartOptions(): void {
    const font = { family: 'Ubuntu, system-ui, sans-serif', size: 11 };
    const grid = { color: 'rgba(15, 23, 42, 0.06)' };
    const money = (v: any) => this.compactMoney(Number(v));
    this.barOptions = {
      responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
      plugins: {
        legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, font } },
        tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: ${this.money(c.parsed.y)}` } },
      },
      scales: { x: { grid: { display: false }, ticks: { font } }, y: { beginAtZero: true, grid, ticks: { font, callback: money } } },
    };
    this.lineOptions = {
      responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false }, ticks: { font, maxTicksLimit: 7 } }, y: { beginAtZero: true, grid, ticks: { font, precision: 0 } } },
    };
    this.vbarOptions = {
      responsive: true, maintainAspectRatio: false, cutout: '70%', animation: { duration: 400 },
      plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font } } },
    };
  }
}
