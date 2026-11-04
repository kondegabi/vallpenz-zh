// 1. lecke: számtani, mértani és folytonos átlag (1.2–1.4). Csak a mag függvényeit hívja.

import {
  diszkretTokesites,
  folytonosErtek,
  folytonosHozam,
  folytonosHozamok,
  hozamokArfolyamokbol,
  indexPalya,
  mertaniAtlag,
  szamtaniAtlag,
  teljesHozam,
} from '../../calc/hozam.ts'
import { formatSzam } from '../../lib/szam.ts'

/** 1.3 példa (1. ea): 100 → 200 → 100. */
export const L01_NAGY = [100, 200, 100]
/** 1.4 példa #1 (2. ea): 100 → 110 → 105. */
export const L01_KIS = [100, 110, 105]

/** Az 1. ea 30. diájának sora: tőkésítési gyakoriság, és ahány tizedesjeggyel a dia mutatja. */
export const M_SOR = [
  { m: 1, nev: 'évente', jegy: 0 },
  { m: 2, nev: 'félévente', jegy: 2 },
  { m: 4, nev: 'negyedévente', jegy: 4 },
  { m: 12, nev: 'havonta', jegy: 3 },
  { m: 52, nev: 'hetente', jegy: 4 },
  { m: 365, nev: 'naponta', jegy: 4 },
  { m: 8760, nev: 'óránként', jegy: 4 },
  { m: 525600, nev: 'percenként', jegy: 6 },
  { m: 31536000, nev: 'másodpercenként', jegy: 6 },
]

export type L01 = {
  /** a két pálya: [nagy ingadozás, kis ingadozás] */
  palyak: [number[], number[]]
  aktiv: 0 | 1
  /** index az M_SOR-ba */
  mIdx: number
  /** a 31. dia középső görbéjének folytonos hozama */
  rc: number
}

export const L01_ALAP: L01 = { palyak: [L01_NAGY, L01_KIS], aktiv: 0, mIdx: 0, rc: 0.2 }
/** a 31. dia három görbéje: r_c − PT_KOZ, r_c, r_c + PT_KOZ */
export const PT_KOZ = 0.1

/** A 31. dia P–T ábrája: P_0 = 100, a görbék T_MAX évig futnak. */
export const PT_P0 = 100
export const PT_TMAX = 2.5
export const PT_LEPES = 0.05

const HIBA_KEVES = 'Legalább két árfolyam kell.'
const HIBA_NEM_POZITIV = 'Az árfolyam csak pozitív lehet (ln és osztás miatt).'

export type PalyaEredmeny =
  | { hiba: typeof HIBA_KEVES | typeof HIBA_NEM_POZITIV }
  | {
      hiba: undefined
      arak: number[]
      n: number
      r: number[]
      rc: number[]
      szamtani: number
      mertani: number
      folytonos: number
      index: number[]
      /** P_0 (1 + r̄_a)^t: a számtani átlaggal kamatoztatott pálya */
      szamtaniPalya: [number, number][]
      /** P_0 e^(r_c t) = P_0 (1 + r̄_g)^t: a mértani és a folytonos átlag ugyanazt a pályát adja */
      mertaniPalya: [number, number][]
      /** a számtani átlaggal kamatoztatott végérték */
      szamtaniVeg: number
    }

export function palya(arak: number[]): PalyaEredmeny {
  if (arak.length < 2) return { hiba: HIBA_KEVES }
  if (arak.some((p) => !(p > 0) || !Number.isFinite(p))) return { hiba: HIBA_NEM_POZITIV }
  const r = hozamokArfolyamokbol(arak)
  const n = r.length
  const szamtani = szamtaniAtlag(r)
  const folytonos = folytonosHozam(arak[0], arak[n], n)
  const lepes = 24
  const t = Array.from({ length: n * lepes + 1 }, (_, k) => k / lepes)
  return {
    hiba: undefined,
    arak,
    n,
    r,
    rc: folytonosHozamok(arak),
    szamtani,
    mertani: mertaniAtlag(r),
    folytonos,
    index: indexPalya(arak),
    szamtaniPalya: t.map((x) => [x, arak[0] * diszkretTokesites(szamtani, 1, x)]),
    mertaniPalya: t.map((x) => [x, folytonosErtek(arak[0], folytonos, x)]),
    szamtaniVeg: arak[0] * diszkretTokesites(szamtani, 1, n),
  }
}

export function l01(s: L01) {
  const palyak = s.palyak.map(palya) as [PalyaEredmeny, PalyaEredmeny]
  const a = palyak[s.aktiv]
  const mSor = M_SOR.map((x) => ({ ...x, ertek: diszkretTokesites(1, x.m) }))
  const valasztottM = mSor[s.mIdx]
  const ptGorbek = [s.rc - PT_KOZ, s.rc, s.rc + PT_KOZ].map((rc) => ({
    rc,
    pontok: Array.from({ length: Math.round(PT_TMAX / PT_LEPES) + 1 }, (_, k) => {
      const T = k * PT_LEPES
      return [T, folytonosErtek(PT_P0, rc, T)] as [number, number]
    }),
  }))
  const P1 = folytonosErtek(PT_P0, s.rc, 1)
  return {
    palyak,
    aktiv: a,
    mSor,
    valasztottM,
    ptGorbek,
    /** a középső görbe értéke T = 1-nél, és az ennek megfelelő egyéves (1.1 szerinti) hozam */
    P1,
    egyevesHozam: teljesHozam(PT_P0, P1).teljes,
    probak: [
      !a.hiba && a.szamtani > 0 && a.mertani < 0,
      !a.hiba && a.n >= 2 && Math.max(...a.r) - Math.min(...a.r) < 1e-6,
      formatSzam(valasztottM.ertek, 4) === formatSzam(Math.E, 4),
    ],
  }
}
