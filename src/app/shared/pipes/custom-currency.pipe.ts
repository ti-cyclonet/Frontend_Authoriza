import { Pipe, PipeTransform } from '@angular/core';

/** Pesos colombianos: "$ 149.000 COP" (punto de miles, sin decimales). */
@Pipe({
  name: 'customCurrency',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    const safe = Number.isFinite(n) ? Math.round(n) : 0;
    return `$ ${safe.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP`;
  }
}
