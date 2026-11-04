import md from '../../keplettar.md?raw'
import type { Kor } from '../kor.ts'
import { FUGGOSEGEK, type Fuggoseg } from './fuggosegek.ts'
import { parseKepletter, type FelismeroSor, type Formula } from './parse.ts'

export const KT = parseKepletter(md)

export const KEPLETEK: Formula[] = KT.fejezetek.flatMap((f) => f.kepletek)
export const KEPLET_IDK = new Set(KEPLETEK.map((k) => k.id))

export function keplet(id: string): Formula | undefined {
  return KEPLETEK.find((k) => k.id === id)
}

/** Melyik ZH-hoz tartozik: a képlettár rész-fejléce szerint. Ismeretlen fejezet az 1. ZH-é. */
export function fejezetKor(szam: number): Kor {
  return KT.fejezetek.find((f) => f.szam === szam)?.kor ?? 1
}

export function kepletKor(id: string): Kor {
  return fejezetKor(Number(id.split('.')[0]))
}

/** A felismerő sor ZH-ja a lánc utolsó képletéből (a lánc eleje lehet korábbi anyag, pl. CAPM). */
export function felismeroSorKor(s: FelismeroSor): Kor {
  return kepletKor(s.kepletek[s.kepletek.length - 1])
}

export function kellHozza(id: string): Fuggoseg[] {
  return FUGGOSEGEK[id] ?? []
}

/** Fordított élek: mely képletek épülnek erre. */
export function erreEpul(id: string): { id: string; feltetel?: string }[] {
  return Object.entries(FUGGOSEGEK).flatMap(([cel, fs]) =>
    fs.filter((f) => f.id === id).map((f) => ({ id: cel, feltetel: f.feltetel })),
  )
}

/** A felismerő tábla sorai, amelyek láncában a képlet szerepel. */
export function felismeroSorai(id: string) {
  return KT.felismero.sorok.filter((s) => s.kepletek.includes(id))
}
