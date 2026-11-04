import type { Kor } from '../kor.ts'
import { KT } from './kepletter.ts'

// A „Hibák a diákon” táblázat sorai státusszal. A státusz a cella eleje (utána kettőspont után
// jöhet az igazoló számítás).

export const STATUSZOK = ['számítással igazolva', 'nyitott – kérdezd meg az oktatót'] as const
export type Statusz = (typeof STATUSZOK)[number]

export type Diahiba = { hol: string; dian: string; helyesen: string; statusz: Statusz | string; indok?: string; kor: Kor }

function sorok(): Diahiba[] {
  const t = KT.hibak.blokkok.find((b) => b.tipus === 'tabla' && b.fejlec[0] === 'Hol')
  if (!t || t.tipus !== 'tabla') return []
  const si = t.fejlec.indexOf('Státusz')
  const zi = t.fejlec.indexOf('ZH')
  return t.sorok.map((s) => {
    const cella = si >= 0 ? s[si] : ''
    const [statusz, ...indok] = cella.split(':')
    return { hol: s[0], dian: s[1], helyesen: s[2], statusz: statusz.trim(), indok: indok.join(':').trim() || undefined, kor: s[zi] === '2' ? 2 : 1 }
  })
}

export const DIAHIBAK: Diahiba[] = sorok()

export function diahibaKor(h: Diahiba): Kor {
  return h.kor
}

export function nyitott(h: Diahiba): boolean {
  return h.statusz === 'nyitott – kérdezd meg az oktatót'
}
