import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Acciones rápidas del menú inferior (móvil): la vista llega con ?nuevo=1 y
 * abre su formulario de creación. Se llama en un inicializador de campo
 * (contexto de inyección); quita el parámetro para que recargar no lo repita.
 */
export function onQuickCreate(open: () => void): void {
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
    if (!params.get('nuevo')) return;
    router.navigate([], { relativeTo: route, queryParams: { nuevo: null }, queryParamsHandling: 'merge', replaceUrl: true });
    setTimeout(open);
  });
}
