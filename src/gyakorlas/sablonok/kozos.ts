// Közös szövegépítő apróságok a sablonokhoz.

const AZ_BETUK = new Set(['A', 'E', 'F', 'X', 'Y'])

/** Névelő betűnévhez: „az A részvény”, „a B részvény”. */
export function nevelo(betu: string): string {
  return AZ_BETUK.has(betu) ? 'az' : 'a'
}

/** „az A”, „a B” (mondat elején nagybetűvel, ha kell). */
export function betuNevelovel(betu: string, nagy = false): string {
  const n = nevelo(betu)
  return `${nagy ? n[0].toUpperCase() + n.slice(1) : n} ${betu}`
}

export function nagyKezdet(s: string): string {
  return s[0].toUpperCase() + s.slice(1)
}

export const RESZVENY_BETUK = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'K', 'X', 'Y'] as const

export function kerekit4(x: number): number {
  return Math.round(x * 1e4) / 1e4
}

/**
 * Szövegkeret (v = 0…3): a 0. a mondatok eredeti sorrendje bevezető nélkül; az 1–3. más szereplős
 * bevezetővel és más mondatsorrenddel. A mondatoknak önállóan érthetőnek kell lenniük.
 */
export function keretbe(v: number, bevezetok: readonly [string, string, string], mondatok: (string | undefined)[]): string {
  const m = mondatok.filter((x): x is string => !!x)
  const sorrend = v === 1 ? [...m].reverse() : v === 2 ? [...m.slice(1), m[0]] : m
  return [v === 0 ? undefined : bevezetok[v - 1], ...sorrend].filter(Boolean).join(' ')
}

/** A CAPM-feladatok közös bevezetői (ugyanazok minden CAPM-sablonban, hogy a szereplő ne árulja el a típust). */
export const CAPM_BEVEZETOK = [
  'Egy befektető egy részvényt elemez.',
  'Egy elemző a piaci adatokból dolgozik.',
  'Egy alapkezelő a portfóliója egyik részvényét vizsgálja.',
] as const
