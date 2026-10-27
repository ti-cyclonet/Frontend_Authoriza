import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

const CATEGORIAS: Record<string, string> = {
  facturacion: 'Facturación electrónica', contabilidad: 'Contabilidad', pagos: 'Pagos y datáfonos', hardware: 'Equipos (impresoras, lectores)',
  mensajeria: 'Mensajería y WhatsApp', domicilios: 'Domicilios', web: 'Dominio y web', otros: 'Otros',
};
const PANTALLAS: Record<string, string> = {
  inicio: 'Inicio', ventas: 'Comercial (panel)', cartera: 'Cartera',
};

interface Oferta {
  id?: string; name: string; category: string; description: string; benefit: string | null; url: string; logoUrl: string | null;
  applications: string[]; placements: string[]; isAffiliate: boolean; active: boolean; sortOrder: number;
  clicks?: { total: number; last30: number; tenants: number };
}

const vacia = (): Oferta => ({
  name: '', category: 'facturacion', description: '', benefit: '', url: '', logoUrl: '', applications: ['inout'], placements: [],
  isAffiliate: true, active: true, sortOrder: 100,
});

/**
 * Servicios recomendados (aliados) que salen en InOut. Si el enlace es de
 * referido, CycloNet gana una comisión cuando el negocio contrata. Solo
 * administradores de Authoriza.
 */
@Component({
  selector: 'app-aliados',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="title-container">
      <a routerLink="/setup" class="title-link">
        <svg viewBox="0 0 16 16"><use xlink:href="./assets/icons/bootstrap-icons.svg#stars"/></svg>
        /setup/aliados
      </a>
    </div>

    <div class="card shadow m-3">
      <div class="card-body">
        <div class="az-page-header">
          <div>
            <h3 class="az-page-title">Servicios recomendados</h3>
            <p class="az-page-subtitle">Servicios de aliados que se recomiendan a los negocios dentro de InOut. Usa tu enlace de referido: cada clic queda registrado con el negocio que lo hizo.</p>
          </div>
          <div class="al-actions">
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="load()">Actualizar</button>
            <button type="button" class="btn btn-primary btn-sm" *ngIf="isAdmin && !form" (click)="nuevo()">Nuevo servicio</button>
          </div>
        </div>

        <p class="al-muted" *ngIf="!isAdmin">Solo los administradores de Authoriza pueden administrar los servicios recomendados.</p>

        <ng-container *ngIf="isAdmin">
          <!-- Formulario -->
          <form class="al-form" *ngIf="form" (ngSubmit)="guardar()">
            <h5>{{ form.id ? 'Editar servicio' : 'Nuevo servicio' }}</h5>
            <div class="al-grid">
              <label>Nombre<input class="form-control form-control-sm" name="name" [(ngModel)]="form.name" maxlength="80" required></label>
              <label>Categoría
                <select class="form-select form-select-sm" name="category" [(ngModel)]="form.category">
                  <option *ngFor="let c of categoriaKeys" [value]="c">{{ categorias[c] }}</option>
                </select>
              </label>
              <label class="al-wide">Descripción (lo que le resuelve al negocio)
                <textarea class="form-control form-control-sm" rows="2" name="description" [(ngModel)]="form.description" maxlength="600"></textarea>
              </label>
              <label>Beneficio para el negocio <small>(opcional)</small>
                <input class="form-control form-control-sm" name="benefit" [(ngModel)]="form.benefit" maxlength="160" placeholder="1 mes gratis, 15 % de descuento…">
              </label>
              <label>Orden<input class="form-control form-control-sm" type="number" name="sortOrder" [(ngModel)]="form.sortOrder" min="0" max="9999"></label>
              <label class="al-wide">Enlace (tu enlace de referido, https)
                <input class="form-control form-control-sm" name="url" [(ngModel)]="form.url" maxlength="1000" placeholder="https://…">
              </label>
              <label class="al-wide">Logo <small>(URL https, opcional)</small>
                <input class="form-control form-control-sm" name="logoUrl" [(ngModel)]="form.logoUrl" maxlength="500" placeholder="https://…">
              </label>
            </div>
            <p class="al-label">Además del catálogo, sugerirlo en:</p>
            <div class="al-chips">
              <button type="button" *ngFor="let p of pantallaKeys" [class.on]="form.placements.includes(p)" (click)="togglePantalla(p)">{{ pantallas[p] }}</button>
            </div>
            <label class="al-check"><input type="checkbox" name="isAffiliate" [(ngModel)]="form.isAffiliate"> Es enlace de referido (InOut muestra: «CycloNet puede recibir una comisión»)</label>
            <label class="al-check"><input type="checkbox" name="active" [(ngModel)]="form.active"> Activo (visible en InOut)</label>
            <div class="al-actions mt-2">
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="saving">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="form = null">Cancelar</button>
            </div>
          </form>

          <div class="al-kpis" *ngIf="items.length">
            <div class="al-kpi"><small>Servicios activos</small><b>{{ activos }}</b><em>de {{ items.length }}</em></div>
            <div class="al-kpi"><small>Clics (30 días)</small><b>{{ clics30 }}</b><em>{{ clicsTotal }} en total</em></div>
          </div>

          <p class="al-muted" *ngIf="loading">Cargando…</p>
          <p class="al-muted" *ngIf="!loading && !items.length && !form">Aún no hay servicios. Inscríbete en los programas de referidos de tus aliados y agrega aquí sus enlaces.</p>

          <article class="al-card" *ngFor="let o of items" [class.off]="!o.active">
            <img *ngIf="o.logoUrl" [src]="o.logoUrl" alt="">
            <span class="al-ini" *ngIf="!o.logoUrl">{{ o.name.charAt(0) }}</span>
            <div class="al-body">
              <b>{{ o.name }}</b> <span class="al-cat">{{ categorias[o.category] || o.category }}</span>
              <span class="al-st" *ngIf="!o.active">Pausado</span>
              <p>{{ o.description }}</p>
              <small class="al-benefit" *ngIf="o.benefit">🎁 {{ o.benefit }}</small>
              <small class="al-meta">
                {{ o.isAffiliate ? 'Referido' : 'Recomendación' }} · Orden {{ o.sortOrder }}
                <ng-container *ngIf="o.placements.length"> · También en: {{ nombresPantallas(o.placements) }}</ng-container>
              </small>
              <small class="al-url">{{ o.url }}</small>
            </div>
            <div class="al-stats">
              <b>{{ o.clicks?.last30 || 0 }}</b><small>clics 30 días</small>
              <button type="button" class="btn btn-link btn-sm p-0" (click)="verClics(o)" [disabled]="!o.clicks?.total">{{ o.clicks?.tenants || 0 }} negocio(s)</button>
            </div>
            <div class="al-btns">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="editar(o)">Editar</button>
              <button type="button" class="btn btn-outline-warning btn-sm" (click)="patch(o, { active: !o.active })">{{ o.active ? 'Pausar' : 'Activar' }}</button>
              <button type="button" class="btn btn-outline-danger btn-sm" (click)="borrar(o)">Borrar</button>
            </div>
          </article>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .al-muted { color: #64748b; }
    .al-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .al-form { border: 1px solid #c7d2fe; background: #f8faff; border-radius: 12px; padding: 14px 16px; margin: 10px 0 16px; }
    .al-form h5 { font-size: 1rem; margin: 0 0 10px; }
    .al-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; }
    .al-grid label, .al-label { display: grid; gap: 4px; font-size: .82rem; font-weight: 600; color: #334155; margin: 0; }
    .al-grid small { font-weight: 400; color: #94a3b8; }
    .al-wide { grid-column: 1 / -1; }
    .al-label { margin: 12px 0 6px; }
    .al-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .al-chips button { border: 1px solid #cbd5e1; background: #fff; border-radius: 999px; padding: 3px 11px; font-size: .8rem; }
    .al-chips button.on { background: #ede9fe; border-color: #8b5cf6; color: #5b21b6; }
    .al-check { display: flex; gap: 8px; align-items: center; font-size: .82rem; color: #334155; margin: 4px 0; }
    .al-kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 220px)); gap: 12px; margin: 8px 0 14px; }
    .al-kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 14px; display: grid; gap: 2px; }
    .al-kpi small, .al-kpi em { color: #64748b; font-size: .78rem; font-style: normal; }
    .al-kpi b { font-size: 1.4rem; color: #0f172a; }
    .al-card { display: grid; grid-template-columns: 48px 1fr auto auto; gap: 14px; align-items: center; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
    .al-card.off { opacity: .6; }
    .al-card img, .al-ini { width: 48px; height: 48px; border-radius: 10px; object-fit: contain; border: 1px solid #eee; }
    .al-ini { display: grid; place-items: center; font-weight: 800; color: #fff; background: #6d28d9; border: 0; }
    .al-body { display: grid; gap: 2px; min-width: 0; }
    .al-body p { margin: 2px 0; font-size: .88rem; color: #334155; }
    .al-cat { font-size: .72rem; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 999px; }
    .al-st { font-size: .72rem; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 999px; margin-left: 4px; }
    .al-benefit { color: #166534; font-size: .8rem; }
    .al-cat, .al-st, .al-benefit { justify-self: start; }
    .al-meta { color: #64748b; font-size: .76rem; }
    .al-url { color: #94a3b8; font-size: .72rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .al-stats { display: grid; justify-items: center; text-align: center; min-width: 90px; }
    .al-stats b { font-size: 1.3rem; } .al-stats small { color: #64748b; font-size: .72rem; }
    .al-btns { display: flex; flex-direction: column; gap: 6px; }
    @media (max-width: 900px) { .al-grid { grid-template-columns: 1fr; } .al-card { grid-template-columns: 48px 1fr; } .al-btns { flex-direction: row; grid-column: 1 / -1; } }
  `],
})
export class AliadosComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/partners`;
  readonly isAdmin = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('user_rol') === 'adminAuthoriza';
  readonly categorias = CATEGORIAS;
  readonly categoriaKeys = Object.keys(CATEGORIAS);
  readonly pantallas = PANTALLAS;
  readonly pantallaKeys = Object.keys(PANTALLAS);
  items: Oferta[] = [];
  form: Oferta | null = null;
  loading = false;
  saving = false;

  ngOnInit(): void { if (this.isAdmin) this.load(); }

  get activos(): number { return this.items.filter((o) => o.active).length; }
  get clics30(): number { return this.items.reduce((s, o) => s + (o.clicks?.last30 || 0), 0); }
  get clicsTotal(): number { return this.items.reduce((s, o) => s + (o.clicks?.total || 0), 0); }

  load(): void {
    this.loading = true;
    this.http.get<Oferta[]>(this.url).subscribe({
      next: (r) => { this.items = r || []; this.loading = false; },
      error: () => { this.loading = false; Swal.fire({ icon: 'error', title: 'No se pudieron cargar los servicios' }); },
    });
  }

  nuevo(): void { this.form = vacia(); }
  editar(o: Oferta): void { this.form = { ...o, placements: [...(o.placements || [])], benefit: o.benefit || '', logoUrl: o.logoUrl || '' }; }

  togglePantalla(p: string): void {
    if (!this.form) return;
    const set = new Set(this.form.placements);
    set.has(p) ? set.delete(p) : set.add(p);
    this.form.placements = [...set];
  }

  guardar(): void {
    if (!this.form) return;
    const { id, clicks, ...body } = this.form;
    this.saving = true;
    const req = id ? this.http.patch<Oferta>(`${this.url}/${id}`, body) : this.http.post<Oferta>(this.url, body);
    req.subscribe({
      next: () => { this.saving = false; this.form = null; this.load(); },
      error: (err) => { this.saving = false; Swal.fire('No se pudo guardar', err?.error?.message || '', 'error'); },
    });
  }

  patch(o: Oferta, body: Partial<Oferta>): void {
    this.http.patch<Oferta>(`${this.url}/${o.id}`, body).subscribe({
      next: (r) => Object.assign(o, r),
      error: (err) => Swal.fire('No se pudo guardar', err?.error?.message || '', 'error'),
    });
  }

  async borrar(o: Oferta): Promise<void> {
    const r = await Swal.fire({
      icon: 'warning', title: `¿Borrar «${o.name}»?`, text: 'También se borra su historial de clics. Si solo quieres ocultarlo, usa «Pausar».',
      showCancelButton: true, confirmButtonText: 'Borrar', cancelButtonText: 'Cancelar', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.http.delete(`${this.url}/${o.id}`).subscribe({
      next: () => (this.items = this.items.filter((x) => x.id !== o.id)),
      error: (err) => Swal.fire('No se pudo borrar', err?.error?.message || '', 'error'),
    });
  }

  verClics(o: Oferta): void {
    this.http.get<any[]>(`${this.url}/${o.id}/clicks`).subscribe({
      next: (rows) => {
        const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
        const html = rows.length
          ? '<table class="table table-sm text-start"><tr><th>Negocio (tenant)</th><th>Clics</th><th>Último</th><th>Desde</th></tr>' +
            rows.map((r) => `<tr><td><code>${esc(r.tenantId || 'sin sesión')}</code></td><td>${r.clicks}</td><td>${new Date(r.lastAt).toLocaleDateString('es-CO')}</td><td>${esc(r.placements)}</td></tr>`).join('') +
            '</table>'
          : 'Sin clics todavía.';
        Swal.fire({ title: `Clics en ${o.name}`, html, width: 720, footer: 'Úsalo para confirmar con el aliado qué negocios llegaron por tu enlace.' });
      },
      error: () => Swal.fire({ icon: 'error', title: 'No se pudieron cargar los clics' }),
    });
  }

  nombresPantallas(ps: string[]): string { return ps.map((p) => PANTALLAS[p] || p).join(', '); }
}
