import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { DashboardService, DashboardStats } from '../../shared/services/dashboard/dashboard.service';
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
  loading = true;
  error: string | null = null;
  
  // Chart data
  userRoleChartData: any;
  invoiceStatusChartData: any;
  monthlyRevenueChartData: any;
  chartOptions: any;

  constructor(
    private dashboardService: DashboardService,
    private translationService: TranslationService
  ) {
    this.initChartOptions();
  }

  ngOnInit() {
    this.loadDashboardData();
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
              family: 'Ubuntu'
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
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
  }
}
