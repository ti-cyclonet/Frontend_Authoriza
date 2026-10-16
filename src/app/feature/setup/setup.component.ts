import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface SetupItem {
  title: string;
  description: string;
  icon: string;
  url: string;
  tint: string;
}

/** Configuración: accesos a lo que se administra en Authoriza (textos = claves de traducción). */
@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css',
})
export class SetupComponent {
  readonly groups: { title: string; items: SetupItem[] }[] = [
    {
      title: 'setup.group.ecosystem',
      items: [
        { title: 'setup.apps.title', description: 'setup.apps.desc', icon: 'grid', url: '/applications', tint: 'linear-gradient(135deg, #8b5cf6, #6600cc)' },
        { title: 'setup.packages.title', description: 'setup.packages.desc', icon: 'box-seam', url: '/packages', tint: 'linear-gradient(135deg, #f59e0b, #ea580c)' },
        { title: 'setup.contracts.title', description: 'setup.contracts.desc', icon: 'file-earmark-text', url: '/contracts', tint: 'linear-gradient(135deg, #38bdf8, #2563eb)' },
      ],
    },
    {
      title: 'setup.group.people',
      items: [
        { title: 'setup.users.title', description: 'setup.users.desc', icon: 'people', url: '/users', tint: 'linear-gradient(135deg, #34d399, #059669)' },
        { title: 'setup.dependencies.title', description: 'setup.dependencies.desc', icon: 'diagram-3', url: '/user-dependencies', tint: 'linear-gradient(135deg, #f472b6, #db2777)' },
      ],
    },
    {
      title: 'setup.group.account',
      items: [
        { title: 'setup.password.title', description: 'setup.password.desc', icon: 'shield-lock', url: '/change-password', tint: 'linear-gradient(135deg, #64748b, #334155)' },
        { title: 'setup.dashboard.title', description: 'setup.dashboard.desc', icon: 'speedometer2', url: '/home', tint: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
      ],
    },
  ];
}
