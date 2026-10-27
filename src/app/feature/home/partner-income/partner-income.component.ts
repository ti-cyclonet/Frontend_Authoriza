import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';

interface Summary {
  month: string; total: number; prevTotal: number; yearTotal: number; count: number; clicks: number;
  byMonth: { month: string; total: number }[];
  byPartner: { offerId: string | null; name: string; total: number; count: number; clicks: number }[];
  bySource: { source: string; total: number }[];
}

const ORIGEN: Record<string, string> = { referido: 'Referidos', pasarela: 'Pagos en línea', otro: 'Otros' };
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * «Ingresos por aliados» en el dashboard (solo adminAuthoriza): comisiones de
 * los servicios recomendados en InOut y, más adelante, de los pagos en línea.
 * Los aliados pagan por su cuenta, así que cada pago se registra aquí.
 */
@Component({
  selector: 'app-partner-income',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="pinc">
      <header class="pinc-head">
        <div>
          <h3>
            <svg viewBox="0 0 16 16"><use xlink:href="./assets/icons/bootstrap-icons.svg#stars"/></svg>
            Ingresos por aliados
          </h3>
          <p>Comisiones de los servicios recomendados en InOut. Registra cada pago cuando el aliado te lo consigne.</p>
        </div>
        <div class="pinc-actions">
          <input type="month" class="form-control form-control-sm" [(ngModel)]="month" (change)="load()" aria-label="Mes">
          <button type="button" class="btn btn-sm btn-primary" (click)="showForm = !showForm">{{ showForm ? 'Cerrar' : 'Registrar ingreso' }}</button>
          <a routerLink="/aliados" class="btn btn-sm btn-outline-secondary">Servicios</a>
        </div>
      </header>

      <form class="pinc-form" *ngIf="showForm" (ngSubmit)="save()">
        <label>Aliado
          <select class="form-select form-select-sm" name="offerId" [(ngModel)]="form.offerId">
            <option *ngFor="let o of offers" [value]="o.id">{{ o.name }}</option>
            <option value="">Otro (escribir nombre)</option>
          </select>
        </label>
        <label *ngIf="!form.offerId">Nombre del aliado<input class="form-control form-control-sm" name="partnerName" [(ngModel)]="form.partnerName" maxlength="80"></label>
        <label>Origen
          <select class="form-select form-select-sm" name="source" [(ngModel)]="form.source">
            <option value="referido">Referido</option><option value="pasarela">Pagos en línea</option><option value="otro">Otro</option>
          </select>
        </label>
        <label>Valor recibido (COP)<input class="form-control form-control-sm" type="number" min="1" step="1" name="amount" [(ngModel)]="form.amount"></label>
        <label>Fecha<input class="form-control form-control-sm" type="date" name="receivedAt" [(ngModel)]="form.receivedAt" [max]="today"></label>
        <label>Referencia <small>(opcional)</small><input class="form-control form-control-sm" name="reference" [(ngModel)]="form.reference" maxlength="120"></label>
        <label class="pinc-wide">Nota <small>(opcional: negocio que contrató, pago en USD…)</small><input class="form-control form-control-sm" name="note" [(ngModel)]="form.note" maxlength="500"></label>
        <div class="pinc-wide"><button type="submit" class="btn btn-sm btn-primary" [disabled]="saving">{{ saving ? 'Guardando…' : 'Guardar ingreso' }}</button></div>
      </form>

      <p class="pinc-muted" *ngIf="loading && !data">Cargando…</p>
      <p class="pinc-error" *ngIf="error">{{ error }}</p>

      <ng-container *ngIf="data as d">
        <div class="pinc-kpis">
          <div class="pinc-kpi">
            <small>Recibido en {{ monthName(d.month) }}</small>
            <b [title]="money(d.total)">{{ compact(d.total) }}</b>
            <em>
              <span class="pinc-chip" *ngIf="delta(d.total, d.prevTotal) as dl" [class.up]="dl > 0" [class.down]="dl < 0">{{ dl > 0 ? '▲ +' : dl < 0 ? '▼ ' : '' }}{{ dl }}%</span>
              <span class="pinc-chip" *ngIf="delta(d.total, d.prevTotal) === null && d.total">Nuevo</span>
              {{ d.count }} pago(s)
            </em>
          </div>
          <div class="pinc-kpi"><small>Mes anterior</small><b [title]="money(d.prevTotal)">{{ compact(d.prevTotal) }}</b><em>&nbsp;</em></div>
          <div class="pinc-kpi"><small>En {{ d.month.slice(0, 4) }}</small><b [title]="money(d.yearTotal)">{{ compact(d.yearTotal) }}</b><em>acumulado del año</em></div>
          <div class="pinc-kpi"><small>Clics en servicios</small><b>{{ d.clicks }}</b><em>en {{ monthName(d.month) }}, desde InOut</em></div>
        </div>

        <div class="pinc-row">
          <div class="pinc-box">
            <h6>Últimos 6 meses</h6>
            <div class="pinc-bars">
              <div class="pinc-bar" *ngFor="let m of d.byMonth" [title]="monthName(m.month) + ': ' + money(m.total)">
                <i [style.height.%]="barPct(m.total)"></i>
                <span>{{ monthShort(m.month) }}</span>
              </div>
            </div>
          </div>
          <div class="pinc-box">
            <h6>Por aliado · {{ monthName(d.month) }}</h6>
            <table class="table table-sm mb-0" *ngIf="d.byPartner.length; else sinIngresos">
              <tr><th>Aliado</th><th class="text-end">Recibido</th><th class="text-end">Clics</th></tr>
              <tr *ngFor="let p of d.byPartner"><td>{{ p.name }}</td><td class="text-end">{{ money(p.total) }}</td><td class="text-end">{{ p.offerId ? p.clicks : '—' }}</td></tr>
            </table>
            <ng-template #sinIngresos>
              <p class="pinc-muted mb-0">Sin ingresos registrados este mes. {{ d.clicks ? 'Hubo ' + d.clicks + ' clic(s): revisa los paneles de tus aliados.' : '' }}</p>
            </ng-template>
            <p class="pinc-src" *ngIf="d.bySource.length > 1"><span *ngFor="let s of d.bySource">{{ origen(s.source) }}: {{ money(s.total) }}</span></p>
          </div>
        </div>

        <details class="pinc-list" *ngIf="items.length">
          <summary>Pagos registrados en {{ monthName(d.month) }} ({{ items.length }})</summary>
          <table class="table table-sm mb-0">
            <tr><th>Fecha</th><th>Aliado</th><th>Origen</th><th class="text-end">Valor</th><th>Referencia</th><th></th></tr>
            <tr *ngFor="let e of items">
              <td>{{ e.receivedAt | date:'dd/MM/yyyy':'UTC' }}</td><td>{{ e.partnerName }}</td><td>{{ origen(e.source) }}</td>
              <td class="text-end">{{ money(+e.amount) }}</td><td>{{ e.reference || '' }}<small class="pinc-muted" *ngIf="e.note"> · {{ e.note }}</small></td>
              <td class="text-end"><button type="button" class="btn btn-link btn-sm text-danger p-0" (click)="remove(e)">Quitar</button></td>
            </tr>
          </table>
        </details>
      </ng-container>
    </section>
  `,
  styles: [`
    .pinc { margin-top: 2rem; padding: 1.5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
    .pinc-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
    .pinc-head h3 { display: flex; align-items: center; gap: .5rem; font-size: 1.25rem; font-weight: 600; margin: 0; }
    .pinc-head h3 svg { width: 20px; height: 20px; fill: #059669; }
    .pinc-head p { color: #6b7280; font-size: .85rem; margin: .25rem 0 0; }
    .pinc-actions { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
    .pinc-actions input { width: 150px; }
    .pinc-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 14px; border: 1px solid #a7f3d0; background: #f0fdf4; border-radius: 12px; padding: 14px 16px; margin-bottom: 1rem; }
    .pinc-form label { display: grid; gap: 4px; font-size: .82rem; font-weight: 600; color: #334155; margin: 0; }
    .pinc-form small { font-weight: 400; color: #94a3b8; }
    .pinc-wide { grid-column: 1 / -1; }
    .pinc-muted { color: #6b7280; font-size: .85rem; }
    .pinc-error { color: #b91c1c; font-size: .85rem; }
    .pinc-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .pinc-kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; display: grid; gap: 2px; }
    .pinc-kpi small { color: #64748b; font-size: .78rem; }
    .pinc-kpi b { font-size: 1.5rem; color: #0f172a; }
    .pinc-kpi em { font-style: normal; font-size: .78rem; color: #64748b; display: flex; gap: 6px; align-items: center; }
    .pinc-chip { font-size: .72rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: #f1f5f9; color: #475569; }
    .pinc-chip.up { background: #dcfce7; color: #166534; } .pinc-chip.down { background: #fee2e2; color: #991b1b; }
    .pinc-row { display: grid; grid-template-columns: 1fr 1.4fr; gap: 1rem; }
    .pinc-box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; }
    .pinc-box h6 { font-size: .85rem; margin: 0 0 8px; }
    .pinc-bars { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; height: 140px; align-items: end; }
    .pinc-bar { display: grid; grid-template-rows: 1fr auto; height: 100%; align-items: end; justify-items: center; gap: 4px; }
    .pinc-bar i { width: 70%; min-height: 2px; background: linear-gradient(180deg, #34d399, #059669); border-radius: 6px 6px 2px 2px; display: block; }
    .pinc-bar span { font-size: .72rem; color: #64748b; }
    .pinc-src { display: flex; gap: 12px; font-size: .78rem; color: #64748b; margin: 8px 0 0; }
    .pinc-list { margin-top: 1rem; }
    .pinc-list summary { cursor: pointer; font-size: .85rem; font-weight: 600; color: #334155; margin-bottom: 6px; }
    @media (max-width: 900px) { .pinc-row, .pinc-form { grid-template-columns: 1fr; } }
  `],
})
export class PartnerIncomeComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/partners`;
  readonly today = new Date().toISOString().slice(0, 10);
  month = this.today.slice(0, 7);
  data: Summary | null = null;
  items: any[] = [];
  offers: { id: string; name: string }[] = [];
  loading = false;
  saving = false;
  showForm = false;
  error: string | null = null;
  form = this.emptyForm();

  ngOnInit(): void {
    this.load();
    this.http.get<any[]>(this.url).subscribe({
      next: (r) => { this.offers = (r || []).map((o) => ({ id: o.id, name: o.name })); if (!this.form.offerId && this.offers[0]) this.form.offerId = this.offers[0].id; },
      error: () => (this.offers = []),
    });
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.http.get<Summary>(`${this.url}/earnings/summary`, { params: { month: this.month } }).subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: (e) => { this.loading = false; this.error = e?.error?.message || 'No se pudieron cargar los ingresos por aliados.'; },
    });
    this.http.get<any[]>(`${this.url}/earnings`, { params: { month: this.month } }).subscribe({ next: (r) => (this.items = r || []), error: () => (this.items = []) });
  }

  save(): void {
    const f = this.form;
    const body: any = { source: f.source, amount: Number(f.amount), receivedAt: f.receivedAt, reference: f.reference, note: f.note };
    if (f.offerId) body.offerId = f.offerId; else body.partnerName = f.partnerName;
    this.saving = true;
    this.http.post(`${this.url}/earnings`, body).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.month = f.receivedAt.slice(0, 7);
        this.form = this.emptyForm(f.offerId);
        this.load();
      },
      error: (e) => { this.saving = false; Swal.fire('No se pudo guardar', e?.error?.message || '', 'error'); },
    });
  }

  async remove(e: any): Promise<void> {
    const r = await Swal.fire({ icon: 'warning', title: '¿Quitar este ingreso?', text: `${e.partnerName} · ${this.money(+e.amount)}`, showCancelButton: true, confirmButtonText: 'Quitar', cancelButtonText: 'Cancelar', confirmButtonColor: '#dc2626' });
    if (!r.isConfirmed) return;
    this.http.delete(`${this.url}/earnings/${e.id}`).subscribe({ next: () => this.load(), error: (err) => Swal.fire('No se pudo quitar', err?.error?.message || '', 'error') });
  }

  private emptyForm(offerId = '') {
    return { offerId, partnerName: '', source: 'referido', amount: null as number | null, receivedAt: this.today, reference: '', note: '' };
  }

  delta(cur: number, prev: number): number | null {
    if (!prev) return null;
    return Math.round(((cur - prev) / prev) * 100);
  }

  barPct(v: number): number {
    const max = Math.max(...(this.data?.byMonth || []).map((m) => m.total), 1);
    return (v / max) * 100;
  }

  monthName(m: string): string { const [y, mm] = m.split('-').map(Number); return `${MESES[mm - 1]} ${y}`; }
  monthShort(m: string): string { return MESES[Number(m.slice(5, 7)) - 1]; }
  origen(s: string): string { return ORIGEN[s] || s; }
  money(v: number): string { return '$' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(v || 0)); }
  compact(v: number): string {
    const n = Math.round(v || 0);
    if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M';
    if (Math.abs(n) >= 10_000) return '$' + Math.round(n / 1000).toLocaleString('es-CO') + ' mil';
    return this.money(n);
  }
}
