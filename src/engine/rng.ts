/**
 * Mulberry32 — fast, high-quality 32-bit seeded PRNG.
 * Returns a factory that produces a seeded sequence of floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

/**
 * Convert a date string (YYYY-MM-DD) to a numeric seed.
 * Uses a simple polynomial hash so different dates produce different seeds.
 */
export function dateSeed(dateStr: string): number {
  let h = 0xdeadbeef;
  for (let i = 0; i < dateStr.length; i++) {
    h = Math.imul(h ^ dateStr.charCodeAt(i), 0x9e3779b9);
  }
  return (h >>> 0);
}
