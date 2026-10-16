import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface SetupItem {
  title: string;
  description: string;
  icon: string;
  url: string;
  tint: string;
}

/** Configuración: accesos a lo que se administra en Authoriza. */
@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css',
})
export class SetupComponent {
  readonly groups: { title: string; items: SetupItem[] }[] = [
    {
      title: 'Ecosistema',
      items: [
        { title: 'Aplicaciones y roles', description: 'Apps, roles y opciones de menú de cada rol', icon: 'grid', url: '/applications', tint: 'linear-gradient(135deg, #8b5cf6, #6600cc)' },
        { title: 'Paquetes', description: 'Planes, precios y límites de uso', icon: 'box-seam', url: '/packages', tint: 'linear-gradient(135deg, #f59e0b, #ea580c)' },
        { title: 'Contratos', description: 'Contratos de los clientes y su estado', icon: 'file-earmark-text', url: '/contracts', tint: 'linear-gradient(135deg, #38bdf8, #2563eb)' },
      ],
    },
    {
      title: 'Personas',
      items: [
        { title: 'Usuarios', description: 'Cuentas, roles asignados y estado', icon: 'people', url: '/users', tint: 'linear-gradient(135deg, #34d399, #059669)' },
        { title: 'Dependencias', description: 'Quién depende de quién y firmantes autorizados', icon: 'diagram-3', url: '/user-dependencies', tint: 'linear-gradient(135deg, #f472b6, #db2777)' },
      ],
    },
    {
      title: 'Tu cuenta',
      items: [
        { title: 'Cambiar contraseña', description: 'Actualiza la contraseña de tu usuario', icon: 'shield-lock', url: '/change-password', tint: 'linear-gradient(135deg, #64748b, #334155)' },
        { title: 'Panel e indicadores', description: 'Recaudo, cartera y costos de plataformas', icon: 'speedometer2', url: '/home', tint: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
      ],
    },
  ];
}
