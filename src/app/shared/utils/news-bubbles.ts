/**
 * Burbujas de novedades del panel (contrato, factura, pago o registro nuevo)
 * con un aviso sonoro corto. Funciones puras + el sonido (WebAudio, sin
 * archivos). Mismo criterio que FactoNet (shared/utils/news-bubbles.ts).
 */
export type NewsKind = 'contract' | 'invoice' | 'payment' | 'user';

export interface NewsBubble {
  id: string;
  kind: NewsKind;
  title: string;
  detail: string;
}

/** Claves que llegaron y no estaban antes. La primera carga (previous = null) no avisa. */
export function newKeys<T extends string | number>(previous: Set<T> | null, current: T[]): T[] {
  if (!previous) return [];
  return current.filter((k) => !previous.has(k));
}

const GROUPED: Record<NewsKind, string> = {
  contract: 'contratos nuevos', invoice: 'facturas nuevas', payment: 'pagos nuevos', user: 'registros nuevos',
};

/** Una burbuja por novedad hasta `max`; si son más, una sola que las agrupa. */
export function bubblesFor<T>(kind: NewsKind, items: T[], describe: (item: T) => { title: string; detail: string }, max = 3): NewsBubble[] {
  if (!items.length) return [];
  const stamp = Date.now();
  if (items.length > max) {
    return [{ id: `${kind}-${stamp}`, kind, title: `${items.length} ${GROUPED[kind]}`, detail: 'Llegaron desde la última actualización' }];
  }
  return items.map((item, i) => ({ id: `${kind}-${stamp}-${i}`, kind, ...describe(item) }));
}

const NOTES: Record<NewsKind, number[]> = {
  contract: [784, 1175], // sol → re: lo más importante, más agudo
  payment: [659, 880, 1319], // mi → la → mi: "cha-ching"
  invoice: [659, 988],
  user: [523, 784],
};

let audio: AudioContext | null = null;

/** Notas suaves según el tipo. Si el navegador bloquea el audio, no pasa nada. */
export function playNewsSound(kind: NewsKind): void {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    audio = audio || new Ctx();
    const ctx = audio!;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    NOTES[kind].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch {
    /* sin audio disponible */
  }
}
