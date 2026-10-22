import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

type Tab = 'ley' | 'roles' | 'servicios' | 'paquetes';
type Horas = [number, number, number];

type Nivel = 'junior' | 'semi' | 'senior';
const NIVELES: Nivel[] = ['junior', 'semi', 'senior'];
interface Rol { id: string; nombre: string; modalidad: 'empleado' | 'contratista'; niveles: Record<Nivel, number>; nivelMinimo?: Nivel; mensual?: number; arl?: string }
interface Servicio { id: string; nombre: string; moneda: 'COP' | 'USD'; precio: number; periodo: 'mensual' | 'anual' | 'unico'; exterior: boolean }
interface Paquete { nombre: string; horas: Record<string, Horas> }

const pct = (v: unknown) => (Number(v) || 0) / 100;

/**
 * Parámetros del cotizador de la landing de CycloNet (solo adminAuthoriza):
 * normativa colombiana, especialidades con su modalidad y salario u
 * honorario, servicios externos y horas por paquete. La landing calcula el
 * precio con estos valores (cotizador/motor.js).
 */
@Component({
  selector: 'app-cotizador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cotizador.component.html',
  styleUrls: ['./cotizador.component.css'],
})
export class CotizadorComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/quoter/config`;

  tab: Tab = 'ley';
  cfg: any = null;
  loading = true;
  saving = false;
  dirty = false;
  errors: string[] = [];
  filtro = '';
  abierto: string | null = null;
  readonly arlClases = ['I', 'II', 'III', 'IV', 'V'];
  readonly niveles = NIVELES;
  readonly nombreNivel: Record<string, string> = { junior: 'Junior', semi: 'Semi senior', senior: 'Senior' };
  readonly isAdmin = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('user_rol') === 'adminAuthoriza';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<any>(this.url).subscribe({
      next: (c) => { this.cfg = this.normalize(c); this.loading = false; this.dirty = false; this.errors = []; },
      error: () => { this.loading = false; Swal.fire({ icon: 'error', title: 'No se pudieron cargar los parámetros' }); },
    });
  }

  touch(): void { this.dirty = true; }

  /** Parámetros anteriores a los niveles: el valor único pasa a los tres niveles. */
  private normalize(c: any): any {
    (c?.roles || []).forEach((r: Rol) => {
      if (!r.niveles) { const m = Number(r.mensual) || 0; r.niveles = { junior: m, semi: m, senior: m }; }
      delete r.mensual;
    });
    c.factores = c.factores || {};
    c.factores.horasNivel = c.factores.horasNivel || { junior: 1, semi: 1, senior: 1 };
    c.empresa.nivelBase = c.empresa.nivelBase || 'junior';
    return c;
  }

  /** Nivel con que se asigna la especialidad: el base, sin bajar de su mínimo. */
  nivelDe(r: Rol): Nivel {
    const base: Nivel = NIVELES.includes(this.cfg?.empresa?.nivelBase) ? this.cfg.empresa.nivelBase : 'junior';
    const min: Nivel = r.nivelMinimo && NIVELES.includes(r.nivelMinimo) ? r.nivelMinimo : 'junior';
    return NIVELES.indexOf(base) >= NIVELES.indexOf(min) ? base : min;
  }

  salario(r: Rol): number { return Number(r.niveles?.[this.nivelDe(r)]) || 0; }

  factorHoras(r: Rol): number { return Number(this.cfg?.factores?.horasNivel?.[this.nivelDe(r)]) || 1; }

  // ─── Costo por hora (misma fórmula que el backend y la landing) ───
  horasMes(): number {
    const l = this.cfg?.ley || {};
    return (Number(l.jornadaSemanal) || 0) * (Number(l.semanasMes) || 0) * pct(l.productividad);
  }

  costoMensual(r: Rol): number {
    const ley = this.cfg?.ley || {}, m = this.salario(r);
    if (r.modalidad !== 'empleado') return m;
    const smmlv = Number(ley.smmlv) || 0;
    const aux = smmlv > 0 && m <= 2 * smmlv ? Number(ley.auxTransporte) || 0 : 0;
    const p = ley.prestaciones || {}, ss = ley.seguridadSocial || {}, pf = ley.parafiscales || {};
    const exon = !!ley.exoneracion114 && smmlv > 0 && m < 10 * smmlv;
    const arl = pct((ley.arl || {})[r.arl || 'I']);
    return m + aux
      + (m + aux) * (pct(p.cesantias) + pct(p.interesesCesantias) + pct(p.prima)) + m * pct(p.vacaciones)
      + m * (pct(ss.pension) + arl + (exon ? 0 : pct(ss.salud)))
      + m * (pct(pf.caja) + (exon ? 0 : pct(pf.icbf) + pct(pf.sena)));
  }

  costoHora(r: Rol): number { const h = this.horasMes(); return h > 0 ? this.costoMensual(r) / h : 0; }

  tarifa(r: Rol): number {
    const e = this.cfg?.empresa || {};
    return this.costoHora(r) * (1 + pct(e.gastosGenerales)) * (1 + pct(e.margen));
  }

  factor(r: Rol): number { const m = this.salario(r); return m ? this.costoMensual(r) / m : 0; }

  // ─── Especialidades ───
  addRol(): void {
    this.cfg.roles.push({ id: 'nuevo' + (this.cfg.roles.length + 1), nombre: 'Nueva especialidad', modalidad: 'contratista', niveles: { junior: 0, semi: 0, senior: 0 }, arl: 'I' });
    this.touch();
  }

  removeRol(i: number): void {
    const id = this.cfg.roles[i].id;
    const usado = Object.values<Paquete>(this.cfg.paquetes).some((p) => p.horas?.[id]);
    if (usado) { Swal.fire({ icon: 'warning', title: 'Está en uso', text: 'Quita primero sus horas de los paquetes que la usan.' }); return; }
    this.cfg.roles.splice(i, 1);
    this.touch();
  }

  nombreRol(id: string): string { return this.cfg?.roles?.find((r: Rol) => r.id === id)?.nombre || id; }

  // ─── Servicios externos ───
  addServicio(): void {
    this.cfg.servicios.push({ id: 'servicio' + (this.cfg.servicios.length + 1), nombre: 'Nuevo servicio', moneda: 'USD', precio: 0, periodo: 'mensual', exterior: true });
    this.touch();
  }

  removeServicio(i: number): void { this.cfg.servicios.splice(i, 1); this.touch(); }

  enPesos(s: Servicio): number {
    const e = this.cfg?.empresa || {};
    return (Number(s.precio) || 0) * (s.moneda === 'USD' ? Number(e.trm) || 0 : 1) * (s.exterior ? 1 + pct(e.iva) : 1) * (1 + pct(e.recargoServicios));
  }

  // ─── Paquetes de horas ───
  get paqueteIds(): string[] {
    const f = this.filtro.trim().toLowerCase();
    return Object.keys(this.cfg?.paquetes || {}).filter((id) => !f || id.toLowerCase().includes(f) || (this.cfg.paquetes[id].nombre || '').toLowerCase().includes(f));
  }

  rolesDe(id: string): string[] { return Object.keys(this.cfg.paquetes[id].horas || {}); }

  rolesDisponibles(id: string): Rol[] { return this.cfg.roles.filter((r: Rol) => !this.cfg.paquetes[id].horas?.[r.id]); }

  addHoras(id: string, rol: string): void {
    if (!rol) return;
    this.cfg.paquetes[id].horas[rol] = [0, 0, 0];
    this.touch();
  }

  removeHoras(id: string, rol: string): void { delete this.cfg.paquetes[id].horas[rol]; this.touch(); }

  /** Valor probable (PERT) del paquete con las tarifas actuales. */
  valorPaquete(id: string): number {
    const p: Paquete = this.cfg.paquetes[id], e = this.cfg.empresa || {};
    let total = 0;
    for (const [rol, h] of Object.entries(p.horas || {})) {
      const r = this.cfg.roles.find((x: Rol) => x.id === rol);
      if (r) total += ((h[0] + 4 * h[1] + h[2]) / 6) * this.factorHoras(r) * this.tarifa(r);
    }
    return total * (1 + pct(e.imprevistos));
  }

  horasPaquete(id: string): number {
    return Object.values<Horas>(this.cfg.paquetes[id].horas || {}).reduce((s, h) => s + (h[0] + 4 * h[1] + h[2]) / 6, 0);
  }

  // ─── Guardar ───
  save(): void {
    this.saving = true;
    this.errors = [];
    this.http.put<any>(this.url, this.cfg).subscribe({
      next: (c) => {
        this.cfg = this.normalize(c); this.saving = false; this.dirty = false;
        Swal.fire({ icon: 'success', title: 'Parámetros guardados', text: 'El cotizador de la landing ya calcula con estos valores.', timer: 2200, showConfirmButton: false });
      },
      error: (err) => {
        this.saving = false;
        this.errors = err?.error?.errors || [err?.error?.message || 'No se pudieron guardar los parámetros.'];
      },
    });
  }

  reset(): void {
    Swal.fire({ icon: 'warning', title: '¿Volver a los valores por defecto?', text: 'Se pierden los cambios guardados del cotizador.', showCancelButton: true, confirmButtonText: 'Sí, restablecer', cancelButtonText: 'Cancelar' })
      .then((r) => {
        if (!r.isConfirmed) return;
        this.http.delete<any>(this.url).subscribe({ next: (c) => { this.cfg = this.normalize(c); this.dirty = false; this.errors = []; } });
      });
  }

  money(v: number): string { return '$' + Math.round(v || 0).toLocaleString('es-CO'); }
}
