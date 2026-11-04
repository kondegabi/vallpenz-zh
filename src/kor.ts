import { useSyncExternalStore } from 'react'

// Melyik ZH anyagát nézzük: a fejléc választója és a szűrés. Ez a fájl a fő chunkban van, ezért sem a
// képlettárat, sem a feladatsablonokat nem tölti be; az, hogy egy elem melyik ZH-é, a tartalomból jön
// (a képlettár „# N. ZH” rész-fejlécéből).

export type Kor = 1 | 2
export type KorValasztas = Kor | 'mind'

export const KOR_OPCIOK: { ertek: KorValasztas; cim: string }[] = [
  { ertek: 1, cim: '1. ZH' },
  { ertek: 2, cim: '2. ZH' },
  { ertek: 'mind', cim: 'Összes anyag' },
]

export const KOR_CIM: Record<Kor, string> = { 1: '1. ZH anyaga', 2: '2. ZH anyaga' }

export function korbaTartozik(valasztas: KorValasztas, kor: Kor): boolean {
  return valasztas === 'mind' || valasztas === kor
}

/** A megjelenítendő csoportok sorrendben. */
export function korCsoportok(valasztas: KorValasztas): Kor[] {
  return valasztas === 'mind' ? [1, 2] : [valasztas]
}

/** A ZH-eredmények a választás szerint. A korábbi, kor nélküli eredmények az 1. ZH-éi. */
export function korEredmenyei<E extends { kor?: KorValasztas }>(lista: E[], valasztas: KorValasztas): E[] {
  return valasztas === 'mind' ? lista : lista.filter((e) => (e.kor ?? 1) === valasztas)
}

/** A választó értéke szövegből. */
export function korBeolvas(s: string): KorValasztas {
  return s === '1' ? 1 : s === '2' ? 2 : 'mind'
}

// ---- tároló (localStorage nélkül a munkamenet végéig memóriában) ----

const KULCS = 'vp2zh.kor.v1'
/** Alapból az aktuális ZH anyaga látszik. */
const ALAP: KorValasztas = 2

function betolt(): KorValasztas {
  try {
    const nyers = localStorage.getItem(KULCS)
    if (nyers === '1' || nyers === '2') return Number(nyers) as Kor
    if (nyers === 'mind') return 'mind'
  } catch {
    // nincs localStorage
  }
  return ALAP
}

let allapot: KorValasztas | null = null
const figyelok = new Set<() => void>()

export function korValasztas(): KorValasztas {
  allapot ??= betolt()
  return allapot
}

export function korBeallit(v: KorValasztas): void {
  allapot = v
  try {
    localStorage.setItem(KULCS, String(v))
  } catch {
    // mentés nélkül is megy tovább
  }
  figyelok.forEach((l) => l())
}

export function useKor(): KorValasztas {
  return useSyncExternalStore(
    (l) => {
      figyelok.add(l)
      return () => figyelok.delete(l)
    },
    korValasztas,
  )
}
