import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Income {
  available: boolean;
  month: string;
  billed: number; collected: number; plans: number; extraDocs: number; prevBilled: number; yearBilled: number;
  byMonth: { month: string; billed: number; collected: number }[];
  byClient: { client: string; billed: number }[];
  activePlans: number; requested: number; mrr: number; documents: number;
  providerUnitCost: number | null; providerCost: number | null; margin: number | null;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * «Ingresos por facturación electrónica» en el dashboard (solo adminAuthoriza):
 * lo que CycloNet cobra a los negocios por el complemento (planes y
 * documentos adicionales, sin IVA). Mientras el servicio no esté activo
 * muestra cuántos negocios lo solicitaron.
 */
@Component({
  selector: 'app-einvoicing-income',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="einc">
      <header class="einc-head">
        <div>
          <h3>
            <svg viewBox="0 0 16 16"><use xlink:href="./assets/icons/bootstrap-icons.svg#receipt"/></svg>
            Ingresos por facturación electrónica
            <span class="einc-chip" *ngIf="data && !data.available">En configuración</span>
          </h3>
          <p>Lo que cobras a los negocios por el complemento: planes y documentos adicionales, sin IVA.</p>
        </div>
        <input type="month" class="form-control form-control-sm einc-month" [(ngModel)]="month" (change)="load()" aria-label="Mes">
      </header>

      <p class="einc-muted" *ngIf="loading && !data">Cargando…</p>
      <p class="einc-error" *ngIf="error">{{ error }}</p>

      <ng-container *ngIf="data as d">
        <div class="einc-empty" *ngIf="!d.activePlans && !d.yearBilled">
          <strong>Aún no hay ingresos: la facturación electrónica {{ d.available ? 'no tiene planes activos' : 'está en configuración' }}.</strong>
          <span>{{ d.requested }} {{ d.requested === 1 ? 'negocio la solicitó' : 'negocios la solicitaron' }} y espera{{ d.requested === 1 ? '' : 'n' }} la activación.
            Cuando se active, aquí verás lo facturado y pagado cada mes, el ingreso recurrente, los documentos emitidos y el margen frente al proveedor.</span>
        </div>

        <div class="einc-kpis">
          <div class="einc-kpi">
            <small>Facturado en {{ monthName(d.month) }}</small>
            <b [title]="money(d.billed)">{{ compact(d.billed) }}</b>
            <em>
              <span class="einc-pill" *ngIf="delta(d.billed, d.prevBilled) as dl" [class.up]="dl > 0" [class.down]="dl < 0">{{ dl > 0 ? '▲ +' : dl < 0 ? '▼ ' : '' }}{{ dl }}%</span>
              {{ money(d.collected) }} pagado
            </em>
          </div>
          <div class="einc-kpi"><small>Ingreso mensual recurrente</small><b [title]="money(d.mrr)">{{ compact(d.mrr) }}</b><em>{{ d.activePlans }} plan(es) activo(s) · {{ d.requested }} solicitud(es)</em></div>
          <div class="einc-kpi"><small>Documentos emitidos</small><b>{{ d.documents }}</b><em>por los negocios en {{ monthName(d.month) }}</em></div>
          <div class="einc-kpi">
            <small>Margen estimado</small>
            <b *ngIf="d.margin !== null; else sinCosto" [title]="money(d.margin)">{{ compact(d.margin) }}</b>
            <ng-template #sinCosto><b>—</b></ng-template>
            <em *ngIf="d.providerCost !== null">costo del proveedor {{ money(d.providerCost) }}</em>
            <em *ngIf="d.providerCost === null">sin costo por documento configurado</em>
          </div>
        </div>

        <div class="einc-row">
          <div class="einc-box">
            <h6>Últimos 6 meses <small>facturado · pagado</small></h6>
            <div class="einc-bars">
              <div class="einc-bar" *ngFor="let m of d.byMonth; trackBy: trackMonth" [title]="monthName(m.month) + ': ' + money(m.billed) + ' facturado, ' + money(m.collected) + ' pagado'">
                <div class="einc-bar-pair">
                  <i class="b" [style.height.%]="barPct(m.billed)"></i>
                  <i class="c" [style.height.%]="barPct(m.collected)"></i>
                </div>
                <span>{{ monthShort(m.month) }}</span>
              </div>
            </div>
          </div>
          <div class="einc-box">
            <h6>Por negocio · {{ monthName(d.month) }}</h6>
            <table class="table table-sm mb-0" *ngIf="d.byClient.length; else sinClientes">
              <tr><th>Negocio</th><th class="text-end">Facturado</th></tr>
              <tr *ngFor="let c of d.byClient"><td>{{ c.client }}</td><td class="text-end">{{ money(c.billed) }}</td></tr>
            </table>
            <ng-template #sinClientes><p class="einc-muted mb-0">Sin cobros del complemento este mes.</p></ng-template>
            <p class="einc-split" *ngIf="d.billed">Planes {{ money(d.plans) }} · Documentos adicionales {{ money(d.extraDocs) }} · Año {{ money(d.yearBilled) }}</p>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    .einc { margin-top: 2rem; padding: 1.5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
    .einc-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
    .einc-head h3 { display: flex; align-items: center; gap: .5rem; font-size: 1.25rem; font-weight: 600; margin: 0; flex-wrap: wrap; }
    .einc-head h3 svg { width: 20px; height: 20px; fill: #4f46e5; }
    .einc-head p { color: #6b7280; font-size: .85rem; margin: .25rem 0 0; }
    .einc-month { width: 150px; height: fit-content; }
    .einc-chip { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 2px 8px; border-radius: 999px; background: #fef3c7; color: #92400e; }
    .einc-empty { display: grid; gap: 4px; padding: 12px 14px; border: 1px dashed #c7d2fe; background: #f5f7ff; border-radius: 12px; margin-bottom: 1rem; font-size: .85rem; color: #374151; }
    .einc-muted { color: #6b7280; font-size: .85rem; }
    .einc-error { color: #b91c1c; font-size: .85rem; }
    .einc-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .einc-kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; display: grid; gap: 2px; }
    .einc-kpi small { color: #64748b; font-size: .78rem; }
    .einc-kpi b { font-size: 1.5rem; color: #0f172a; }
    .einc-kpi em { font-style: normal; font-size: .78rem; color: #64748b; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .einc-pill { font-size: .72rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: #f1f5f9; color: #475569; }
    .einc-pill.up { background: #dcfce7; color: #166534; } .einc-pill.down { background: #fee2e2; color: #991b1b; }
    .einc-row { display: grid; grid-template-columns: 1fr 1.4fr; gap: 1rem; }
    .einc-box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; min-width: 0; }
    .einc-box h6 { font-size: .85rem; margin: 0 0 8px; }
    .einc-box h6 small { color: #94a3b8; font-weight: 400; }
    .einc-bars { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; height: 140px; align-items: end; }
    .einc-bar { display: grid; grid-template-rows: 1fr auto; height: 100%; justify-items: center; gap: 4px; }
    .einc-bar-pair { display: flex; align-items: flex-end; gap: 3px; height: 100%; width: 80%; }
    .einc-bar-pair i { flex: 1; min-height: 2px; border-radius: 5px 5px 2px 2px; display: block; }
    .einc-bar-pair i.b { background: #c7d2fe; } .einc-bar-pair i.c { background: #4f46e5; }
    .einc-bar span { font-size: .72rem; color: #64748b; }
    .einc-split { font-size: .78rem; color: #64748b; margin: 8px 0 0; }
    @media (max-width: 900px) { .einc-row { grid-template-columns: 1fr; } }
  `],
})
export class EinvoicingIncomeComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/einvoicing/income/summary`;
  month = new Date().toISOString().slice(0, 7);
  data: Income | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.http.get<Income>(this.url, { params: { month: this.month } }).subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: (e) => { this.loading = false; this.error = e?.error?.message || 'No se pudieron cargar los ingresos por facturación electrónica.'; },
    });
  }

  trackMonth = (_: number, m: { month: string }) => m.month;

  delta(cur: number, prev: number): number | null {
    return prev ? Math.round(((cur - prev) / prev) * 100) : null;
  }

  barPct(v: number): number {
    const max = Math.max(...(this.data?.byMonth || []).map((m) => m.billed), 1);
    return (v / max) * 100;
  }

  monthName(m: string): string { const [y, mm] = m.split('-').map(Number); return `${MESES[mm - 1]} ${y}`; }
  monthShort(m: string): string { return MESES[Number(m.slice(5, 7)) - 1]; }
  money(v: number): string { return '$' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(v || 0)); }
  compact(v: number): string {
    const n = Math.round(v || 0);
    if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M';
    if (Math.abs(n) >= 10_000) return '$' + Math.round(n / 1000).toLocaleString('es-CO') + ' mil';
    return this.money(n);
  }
}
