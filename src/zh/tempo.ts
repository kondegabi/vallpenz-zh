// A ZH tempója: mennyi idő ment el szakaszonként és kérdésenként. Az időt az a kérdés kapja, amelyikhez
// utoljára hozzányúltál (kattintás, beírás); ami ez előtt telik el, az „egyéb” (olvasás, görgetés).
// Kérdéskulcsok: ih-0 … ih-7, mc-0 … mc-7, sz-0 … sz-3.

import { SZABALYOK } from './szabalyok.ts'

export type Resz = 'ih' | 'mc' | 'sz'

const RESZEK: { resz: Resz; cim: string }[] = [
  { resz: 'ih', cim: 'I. Igaz-hamis' },
  { resz: 'mc', cim: 'II. Feleletválasztós' },
  { resz: 'sz', cim: 'III. Számítási' },
]

export function kerdesKulcs(resz: Resz, i: number): string {
  return `${resz}-${i}`
}

/** `mp` másodpercet ír jóvá a kérdésnek (null: egyik kérdéshez sem). */
export function idoJovair(ido: Record<string, number>, kulcs: string | null, mp: number): Record<string, number> {
  const k = kulcs ?? 'egyeb'
  return { ...ido, [k]: (ido[k] ?? 0) + mp }
}

/** A kérdés sorszáma a ZH-ban (1-től: igaz-hamis, utána feleletválasztós, végül számítási). */
export function sorszam(kulcs: string): number {
  const [resz, i] = kulcs.split('-') as [Resz, string]
  const eltolas = resz === 'ih' ? 0 : resz === 'mc' ? SZABALYOK.igazHamis.db : SZABALYOK.igazHamis.db + SZABALYOK.valasztos.db
  return eltolas + Number(i) + 1
}

export function tempoOsszesit(ido: Record<string, number>, kuszob = SZABALYOK.lassuKuszobMp) {
  const kerdesek = Object.entries(ido).filter(([k]) => k !== 'egyeb')
  return {
    szakaszok: RESZEK.map(({ resz, cim }) => ({
      resz,
      cim,
      mp: kerdesek.filter(([k]) => k.startsWith(`${resz}-`)).reduce((s, [, mp]) => s + mp, 0),
    })),
    egyeb: ido.egyeb ?? 0,
    /** a küszöbnél tovább tartó kérdések, a leghosszabbal kezdve */
    lassuk: kerdesek
      .filter(([, mp]) => mp > kuszob)
      .sort((a, b) => b[1] - a[1])
      .map(([kulcs, mp]) => ({ kulcs, sorszam: sorszam(kulcs), mp })),
  }
}
