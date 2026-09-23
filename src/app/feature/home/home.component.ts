import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { DashboardService, DashboardStats, InvoiceStats } from '../../shared/services/dashboard/dashboard.service';
import { TranslationService } from '../../shared/services/translation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ChartModule, CardModule, ProgressBarModule, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentActivity: any = null;
  entityCodes: any = null;
  invoiceStats: InvoiceStats | null = null;
  loading = true;
  error: string | null = null;

  // Chart data
  userRoleChartData: any;
  invoiceStatusChartData: any;
  monthlyRevenueChartData: any;
  appsByUsersChartData: any;
  contractsByStatusChartData: any;
  paidRateChartData: any;
  barChartOptions: any;
  gaugeChartOptions: any;
  smallBarChartOptions: any;
  chartOptions: any;
  chartSize: string = '300px';

  constructor(
    private dashboardService: DashboardService,
    private translationService: TranslationService
  ) {
    this.initChartOptions();
    this.updateChartSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateChartSize();
    this.initChartOptions();
  }

  updateChartSize() {
    this.chartSize = window.innerWidth <= 576 ? '220px' : '300px';
  }

  ngOnInit() {
    this.loadDashboardData();
    this.loadInvoiceStats();
  }

  /** Facturas del mes en curso (para el KPI "Monto facturado" y el donut
   * "Facturas por estado"). Independiente de loadDashboardData(): si falla,
   * simplemente no se muestran esos widgets, sin bloquear el resto. */
  loadInvoiceStats() {
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = now.toISOString().slice(0, 10);

    this.dashboardService.getInvoiceStats(startDate, endDate).subscribe({
      next: (data) => {
        this.invoiceStats = data;
        this.prepareInvoiceChartData();
      },
      error: () => {
        this.invoiceStats = null;
      }
    });
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.prepareChartData();
        this.loadRecentActivity();
      },
      error: (err) => {
        this.error = this.translationService.translate('dashboard.errorLoading');
        this.loading = false;
      }
    });
  }

  loadRecentActivity() {
    this.dashboardService.getRecentActivity().subscribe({
      next: (data) => {
        this.recentActivity = data;
        this.loadEntityCodes();
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }

  loadEntityCodes() {
    this.dashboardService.getEntityCodes().subscribe({
      next: (data) => {
        this.entityCodes = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'badge-success',
      'INACTIVE': 'badge-secondary',
      'UNCONFIRMED': 'badge-warning',
      'Paid': 'badge-success',
      'Issued': 'badge-primary',
      'In arrears': 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  }

  translateInvoiceStatus(status: string): string {
    return this.translationService.translate(`dashboard.invoiceStatuses.${status}`) || status;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getLogIcon(action: string): string {
    const iconMap: { [key: string]: string } = {
      'USER_CREATED': 'person-plus-fill',
      'USER_ACTIVATED': 'person-check-fill',
      'USER_DEACTIVATED': 'person-x-fill',
      'USER_DELETED': 'person-dash-fill',
      'CONTRACT_ACTIVATED': 'file-earmark-check-fill',
      'CONTRACT_DEACTIVATED': 'file-earmark-x-fill',
      'LOGIN': 'box-arrow-in-right',
      'LOGOUT': 'box-arrow-right',
      'PDF_GENERATED': 'file-pdf-fill'
    };
    return iconMap[action] || 'info-circle-fill';
  }

  getLogActionLabel(action: string): string {
    const labelMap: { [key: string]: string } = {
      'USER_CREATED': 'Usuario creado',
      'USER_ACTIVATED': 'Usuario activado',
      'USER_DEACTIVATED': 'Usuario desactivado',
      'USER_DELETED': 'Usuario eliminado',
      'CONTRACT_ACTIVATED': 'Contrato activado',
      'CONTRACT_DEACTIVATED': 'Contrato desactivado',
      'LOGIN': 'Inicio de sesión',
      'LOGOUT': 'Cierre de sesión',
      'PDF_GENERATED': 'PDF generado'
    };
    return labelMap[action] || action;
  }

  initChartOptions() {
    this.chartOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            font: {
              family: 'Ubuntu',
              size: window.innerWidth <= 576 ? 10 : 12
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: true
    };

    // Barra horizontal (aplicaciones por usuarios)
    this.barChartOptions = {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { grid: { display: false } }
      },
      responsive: true,
      maintainAspectRatio: false,
    };

    // Gauge de tasa de pago: sin leyenda, sin tooltip, casi un anillo completo
    this.gaugeChartOptions = {
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      cutout: '78%',
      responsive: true,
      maintainAspectRatio: true,
    };

    // Barra vertical compacta (contratos por estado)
    this.smallBarChartOptions = {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: { beginAtZero: true, ticks: { precision: 0 } }
      },
      responsive: true,
      maintainAspectRatio: false,
    };
  }

  /**
   * Ícono + color por aplicación del ecosistema, para las tarjetas de "Uso
   * por aplicación". Se empareja por substring del nombre (case-insensitive)
   * porque el nombre exacto en la tabla `application` puede variar
   * ligeramente (ej. "AidCash" vs "Kiri Finance"); cualquier app nueva que no
   * matchee cae al ícono/color genérico en vez de romper la vista.
   */
  private readonly appVisuals: { match: string; icon: string; colorClass: string }[] = [
    { match: 'authoriza', icon: 'shield-lock-fill', colorClass: 'app-authoriza' },
    { match: 'inout', icon: 'truck', colorClass: 'app-inout' },
    { match: 'facto', icon: 'cash-coin', colorClass: 'app-factonet' },
    { match: 'shotra', icon: 'bicycle', colorClass: 'app-shotra' },
    { match: 'kiri', icon: 'wallet2', colorClass: 'app-kiri' },
    { match: 'aidcash', icon: 'wallet2', colorClass: 'app-kiri' },
  ];

  getAppIcon(appName: string): string {
    const found = this.appVisuals.find(v => appName?.toLowerCase().includes(v.match));
    return found?.icon || 'grid-3x3-gap-fill';
  }

  getAppColorClass(appName: string): string {
    const found = this.appVisuals.find(v => appName?.toLowerCase().includes(v.match));
    return found?.colorClass || 'app-generic';
  }

  prepareChartData() {
    if (!this.stats) return;

    // User Role Chart
    this.userRoleChartData = {
      labels: this.stats.users.byRole.map(role => role.role),
      datasets: [{
        data: this.stats.users.byRole.map(role => role.count),
        backgroundColor: [
          '#667eea',
          '#f093fb',
          '#4facfe',
          '#43e97b',
          '#f6d55c',
          '#ff6b6b'
        ],
        borderWidth: 0
      }]
    };

    // Aplicaciones por usuarios: barra horizontal (como "Monto facturado por
    // proveedor" del diseño de referencia).
    if (this.stats.applications?.byApplication?.length) {
      const sorted = [...this.stats.applications.byApplication].sort((a, b) => b.userCount - a.userCount);
      this.appsByUsersChartData = {
        labels: sorted.map(app => app.name),
        datasets: [{
          label: 'Usuarios',
          data: sorted.map(app => app.userCount),
          backgroundColor: '#4facfe',
          borderRadius: 4,
          barThickness: 16,
        }]
      };
    }

    // Contratos por estado: barra vertical compacta.
    if (this.stats.contracts?.byStatus?.length) {
      const sorted = [...this.stats.contracts.byStatus].sort((a, b) => b.count - a.count);
      const palette: { [key: string]: string } = {
        ACTIVE: '#43e97b',
        PENDING: '#f6d55c',
        DRAFT: '#9ca3af',
        EXPIRED: '#ff6b6b',
        SUSPENDED: '#f093fb',
        CANCELLED: '#4b5563',
        TERMINATED: '#ef4444',
        RENEWED: '#4facfe',
        DELETED: '#374151',
      };
      this.contractsByStatusChartData = {
        labels: sorted.map(c => this.getContractStatusLabel(c.status)),
        datasets: [{
          data: sorted.map(c => c.count),
          backgroundColor: sorted.map(c => palette[c.status] || '#9ca3af'),
          borderRadius: 4,
        }]
      };
    }
  }

  /** Facturas por estado (donut) + tasa de pago (gauge), a partir de las
   * facturas del mes en curso. */
  prepareInvoiceChartData() {
    if (!this.invoiceStats) return;

    const statusColors: { [key: string]: string } = {
      'Paid': '#43e97b',
      'Issued': '#4facfe',
      'Unconfirmed': '#f6d55c',
      'In arrears': '#ff6b6b',
      'Notification1': '#f093fb',
      'Notification2': '#ef4444',
      'Suspended': '#9ca3af',
      'Payment Reported': '#764ba2',
    };

    this.invoiceStatusChartData = {
      labels: this.invoiceStats.byStatus.map(s => this.translateInvoiceStatus(s.status)),
      datasets: [{
        data: this.invoiceStats.byStatus.map(s => s.count),
        backgroundColor: this.invoiceStats.byStatus.map(s => statusColors[s.status] || '#9ca3af'),
        borderWidth: 0
      }]
    };

    const paidPercent = this.paidRatePercent;
    this.paidRateChartData = {
      labels: ['Pagadas', 'Resto'],
      datasets: [{
        data: [paidPercent, 100 - paidPercent],
        backgroundColor: ['#43e97b', '#eef0f2'],
        borderWidth: 0
      }]
    };
  }

  get paidRatePercent(): number {
    if (!this.invoiceStats || this.invoiceStats.total === 0) return 0;
    return Math.round((this.invoiceStats.paid / this.invoiceStats.total) * 100);
  }

  private readonly contractStatusLabels: { [key: string]: string } = {
    DRAFT: 'Borrador',
    PENDING: 'Pendiente',
    ACTIVE: 'Activo',
    SUSPENDED: 'Suspendido',
    CANCELLED: 'Cancelado',
    EXPIRED: 'Expirado',
    TERMINATED: 'Terminado',
    RENEWED: 'Renovado',
    DELETED: 'Eliminado',
  };

  getContractStatusLabel(status: string): string {
    return this.contractStatusLabels[status] || status;
  }
}
