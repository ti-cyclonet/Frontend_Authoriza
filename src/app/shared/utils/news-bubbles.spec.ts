import { bubblesFor, newKeys } from './news-bubbles';

describe('burbujas de novedades', () => {
  it('la primera carga no avisa; después, solo lo que no estaba', () => {
    expect(newKeys(null, ['a', 'b'])).toEqual([]);
    expect(newKeys(new Set(['a', 'b']), ['c', 'a', 'b'])).toEqual(['c']);
  });

  it('una burbuja por novedad con su detalle', () => {
    const b = bubblesFor('payment', [{ code: 'FV-1' }], (p) => ({ title: 'Pago recibido', detail: p.code }));
    expect(b.map((x) => [x.kind, x.title, x.detail])).toEqual([['payment', 'Pago recibido', 'FV-1']]);
  });

  it('más de 3 novedades del mismo tipo se agrupan', () => {
    const b = bubblesFor('user', [1, 2, 3, 4], () => ({ title: 'x', detail: 'y' }));
    expect(b.length).toBe(1);
    expect(b[0].title).toBe('4 registros nuevos');
  });
});
