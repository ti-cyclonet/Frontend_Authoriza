import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customCurrency',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value == null) return '$ 0.oo COP';

    const numericValue = Number(value);

    if (isNaN(numericValue)) return '$ 0.oo COP';

    return `$ ${numericValue.toLocaleString('es-CO')}.oo COP`;
  }
}
