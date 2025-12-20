import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { DashboardService, DashboardStats } from '../../shared/services/dashboard/dashboard.service';

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

  constructor(private dashboardService: DashboardService) {
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
        this.error = 'Error al cargar las estadísticas';
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO');
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

    // Invoice Status Chart
    this.invoiceStatusChartData = {
      labels: this.stats.invoices.byStatus.map(status => status.status),
      datasets: [{
        data: this.stats.invoices.byStatus.map(status => status.count),
        backgroundColor: [
          '#10b981',
          '#3b82f6',
          '#ef4444',
          '#f59e0b',
          '#8b5cf6'
        ],
        borderWidth: 0
      }]
    };

    // Monthly Revenue Chart
    if (this.stats.invoices.monthlyRevenue.length > 0) {
      this.monthlyRevenueChartData = {
        labels: this.stats.invoices.monthlyRevenue.map(item => item.month),
        datasets: [{
          label: 'Ingresos',
          data: this.stats.invoices.monthlyRevenue.map(item => item.revenue),
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderColor: '#667eea',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      };
    }
  }
}
