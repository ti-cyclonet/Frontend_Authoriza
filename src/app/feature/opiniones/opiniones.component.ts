import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

type Filtro = 'PENDIENTE' | 'APROBADO' | 'PRIVADO' | 'RECHAZADO' | '';

const MODULOS: Record<string, string> = {
  inventario: 'Inventario', productos: 'Productos', ventas: 'Ventas', pedidos: 'Pedidos', market: 'Market',
  cartera: 'Cartera', domicilios: 'Domicilios', reportes: 'Reportes', soporte: 'Soporte',
};
const SITIOS = [['inout', 'Landing de InOut'], ['cyclonet', 'Landing de CycloNet']];

/**
 * Opiniones de los usuarios (hoy de InOut): se aprueban aquí antes de salir en
 * las landings. Solo administradores de Authoriza.
 */
@Component({
  selector: 'app-opiniones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="title-container">
      <a routerLink="/setup" class="title-link">
        <svg viewBox="0 0 16 16"><use xlink:href="./assets/icons/bootstrap-icons.svg#chat-quote"/></svg>
        /setup/opiniones
      </a>
    </div>

    <div class="card shadow m-3">
      <div class="card-body">
        <div class="az-page-header">
          <div>
            <h3 class="az-page-title">Opiniones de los clientes</h3>
            <p class="az-page-subtitle">Las envían los usuarios desde la app. Solo salen en las landings las que apruebes y que el cliente autorizó publicar.</p>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm" (click)="load()">Actualizar</button>
        </div>

        <p class="op-muted" *ngIf="!isAdmin">Solo los administradores de Authoriza pueden ver las opiniones.</p>

        <ng-container *ngIf="isAdmin">
          <!-- Indicadores -->
          <div class="op-kpis" *ngIf="stats">
            <div class="op-kpi"><small>Calificación promedio</small><b>{{ stats.average ?? '—' }}<span *ngIf="stats.average"> / 5</span></b><em>{{ stats.count }} opinión(es)</em></div>
            <div class="op-kpi warn"><small>Por aprobar</small><b>{{ stats.pending }}</b><em>con permiso de publicar</em></div>
            <div class="op-kpi bad"><small>Calificación baja (1-3)</small><b>{{ stats.low }}</b><em>solo internas: contáctalos</em></div>
            <div class="op-kpi">
              <small>Distribución</small>
              <div class="op-dist">
                <div *ngFor="let d of stats.distribution.slice().reverse()"><span>{{ d.rating }}★</span><i [style.width.%]="barPct(d.count)"></i><em>{{ d.count }}</em></div>
              </div>
            </div>
          </div>
          <div class="op-row" *ngIf="stats?.byMonth?.length || stats?.byHighlight?.length">
            <div class="op-box" *ngIf="stats.byMonth.length">
              <h6>Por mes</h6>
              <table class="table table-sm mb-0"><tr *ngFor="let m of stats.byMonth"><td>{{ m.month }}</td><td class="text-end">{{ m.count }}</td><td class="text-end">{{ m.average }} ★</td></tr></table>
            </div>
            <div class="op-box" *ngIf="stats.byHighlight.length">
              <h6>Lo que más les ayuda</h6>
              <table class="table table-sm mb-0"><tr *ngFor="let h of stats.byHighlight"><td>{{ modulo(h.highlight) }}</td><td class="text-end">{{ h.count }}</td><td class="text-end">{{ h.average }} ★</td></tr></table>
            </div>
          </div>

          <nav class="op-tabs">
            <button *ngFor="let f of filtros" type="button" [class.on]="filtro === f[0]" (click)="filtro = $any(f[0]); load()">{{ f[1] }}</button>
          </nav>

          <p class="op-muted" *ngIf="loading">Cargando…</p>
          <p class="op-muted" *ngIf="!loading && !items.length">No hay opiniones con este filtro.</p>

          <article class="op-card" *ngFor="let t of items" [class.low]="t.rating < 4">
            <header>
              <img *ngIf="t.logoUrl" [src]="t.logoUrl" alt="">
              <div>
                <b>{{ t.businessName || t.authorName }}</b>
                <small>{{ t.authorName }}<ng-container *ngIf="t.authorEmail"> · {{ t.authorEmail }}</ng-container><ng-container *ngIf="t.city"> · {{ t.city }}</ng-container> · {{ t.application }} · {{ t.createdAt | date:'dd/MM/yyyy' }}</small>
              </div>
              <span class="op-stars">{{ starsOf(t.rating) }}</span>
              <span class="op-st" [ngClass]="'st-' + t.status">{{ estado(t.status) }}</span>
            </header>
            <p class="op-text">{{ t.editedComment || t.comment }}</p>
            <p class="op-orig" *ngIf="t.editedComment">Original: «{{ t.comment }}»</p>
            <div class="op-chips" *ngIf="t.highlights?.length"><span *ngFor="let h of t.highlights">{{ modulo(h) }}</span></div>
            <p class="op-consent">{{ t.consentPublish ? 'Autorizó publicar su opinión' + (t.consentLogo ? ' y su logo' : ' (sin logo)') : 'No autorizó publicarla' }}</p>

            <footer *ngIf="t.consentPublish">
              <label *ngFor="let s of sitios" class="op-check"><input type="checkbox" [checked]="t.showOn?.includes(s[0])" (change)="toggleSite(t, s[0])"> {{ s[1] }}</label>
              <label class="op-check"><input type="checkbox" [checked]="t.featured" (change)="patch(t, { featured: !t.featured })"> Destacada</label>
              <span class="op-sp"></span>
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="edit(t)">Corregir texto</button>
              <button type="button" class="btn btn-success btn-sm" *ngIf="t.status !== 'APROBADO'" (click)="patch(t, { status: 'APROBADO' })">Aprobar</button>
              <button type="button" class="btn btn-outline-warning btn-sm" *ngIf="t.status === 'APROBADO'" (click)="patch(t, { status: 'PENDIENTE' })">Despublicar</button>
              <button type="button" class="btn btn-outline-danger btn-sm" *ngIf="t.status !== 'RECHAZADO'" (click)="patch(t, { status: 'RECHAZADO' })">Rechazar</button>
            </footer>
          </article>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .op-muted { color: #64748b; }
    .op-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0; }
    .op-kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; display: grid; gap: 2px; }
    .op-kpi small { color: #64748b; font-size: .78rem; }
    .op-kpi b { font-size: 1.5rem; color: #0f172a; }
    .op-kpi b span { font-size: .9rem; color: #64748b; font-weight: 500; }
    .op-kpi em { font-style: normal; font-size: .78rem; color: #64748b; }
    .op-kpi.warn b { color: #b45309; } .op-kpi.bad b { color: #b91c1c; }
    .op-dist div { display: grid; grid-template-columns: 26px 1fr 24px; gap: 6px; align-items: center; font-size: .75rem; }
    .op-dist i { height: 6px; border-radius: 3px; background: #f59e0b; display: block; min-width: 2px; }
    .op-dist em { text-align: right; }
    .op-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .op-box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 14px; }
    .op-box h6 { font-size: .85rem; margin: 0 0 6px; }
    .op-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 14px; border-bottom: 1px solid #e5e7eb; }
    .op-tabs button { border: 0; background: none; padding: 8px 12px; font-weight: 600; color: #64748b; border-bottom: 2px solid transparent; }
    .op-tabs button.on { color: #6d28d9; border-bottom-color: #6d28d9; }
    .op-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
    .op-card.low { border-left: 4px solid #dc2626; }
    .op-card header { display: grid; grid-template-columns: auto 1fr auto auto; gap: 12px; align-items: center; }
    .op-card header img { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; border: 1px solid #eee; }
    .op-card header b { display: block; }
    .op-card header small { color: #64748b; font-size: .78rem; }
    .op-stars { color: #f59e0b; font-size: 1.05rem; letter-spacing: 1px; }
    .op-st { font-size: .72rem; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: #f1f5f9; color: #475569; }
    .op-st.st-PENDIENTE { background: #fef3c7; color: #92400e; } .op-st.st-APROBADO { background: #dcfce7; color: #166534; }
    .op-st.st-RECHAZADO { background: #fee2e2; color: #991b1b; }
    .op-text { margin: 10px 0 4px; font-size: .95rem; }
    .op-orig { margin: 0 0 4px; font-size: .8rem; color: #94a3b8; }
    .op-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
    .op-chips span { font-size: .75rem; background: #ede9fe; color: #5b21b6; padding: 2px 8px; border-radius: 999px; }
    .op-consent { font-size: .78rem; color: #64748b; margin: 4px 0 0; }
    .op-card footer { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e5e7eb; }
    .op-check { font-size: .82rem; display: inline-flex; gap: 5px; align-items: center; }
    .op-sp { flex: 1; }
    @media (max-width: 900px) { .op-kpis { grid-template-columns: 1fr 1fr; } .op-row { grid-template-columns: 1fr; } .op-card header { grid-template-columns: auto 1fr; } }
  `],
})
export class OpinionesComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/testimonials`;
  readonly isAdmin = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('user_rol') === 'adminAuthoriza';
  readonly filtros: [Filtro, string][] = [['PENDIENTE', 'Por aprobar'], ['APROBADO', 'Publicadas'], ['PRIVADO', 'Privadas'], ['RECHAZADO', 'Rechazadas'], ['', 'Todas']];
  readonly sitios = SITIOS;
  filtro: Filtro = 'PENDIENTE';
  items: any[] = [];
  stats: any = null;
  loading = false;

  ngOnInit(): void { if (this.isAdmin) this.load(); }

  load(): void {
    this.loading = true;
    const params: any = this.filtro ? { status: this.filtro } : {};
    this.http.get<any[]>(this.url, { params }).subscribe({
      next: (r) => { this.items = r || []; this.loading = false; },
      error: () => { this.loading = false; Swal.fire({ icon: 'error', title: 'No se pudieron cargar las opiniones' }); },
    });
    this.http.get<any>(`${this.url}/stats`).subscribe({ next: (s) => (this.stats = s), error: () => (this.stats = null) });
  }

  patch(t: any, body: any): void {
    this.http.patch<any>(`${this.url}/${t.id}`, body).subscribe({
      next: (r) => {
        Object.assign(t, r);
        // Si cambió de estado y el filtro ya no la incluye, sale de la lista
        if (body.status && this.filtro && r.status !== this.filtro) this.items = this.items.filter((x) => x.id !== t.id);
        if (body.status) this.http.get<any>(`${this.url}/stats`).subscribe((s) => (this.stats = s));
      },
      error: (err) => Swal.fire('No se pudo guardar', err?.error?.message || '', 'error'),
    });
  }

  toggleSite(t: any, site: string): void {
    const set = new Set<string>(t.showOn || []);
    set.has(site) ? set.delete(site) : set.add(site);
    this.patch(t, { showOn: [...set] });
  }

  async edit(t: any): Promise<void> {
    const r = await Swal.fire({
      title: 'Corregir texto', input: 'textarea', inputValue: t.editedComment || t.comment,
      inputLabel: 'Solo ortografía y puntuación, sin cambiar lo que quiso decir el cliente.',
      showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar',
    });
    if (r.isConfirmed) this.patch(t, { editedComment: String(r.value || '') });
  }

  barPct(n: number): number { const max = Math.max(...(this.stats?.distribution || []).map((d: any) => d.count), 1); return (n / max) * 100; }
  starsOf(n: number): string { return '★'.repeat(n) + '☆'.repeat(5 - n); }
  modulo(h: string): string { return MODULOS[h] || h; }
  estado(s: string): string { return ({ PENDIENTE: 'Por aprobar', APROBADO: 'Publicada', PRIVADO: 'Privada', RECHAZADO: 'Rechazada' } as any)[s] || s; }
}
