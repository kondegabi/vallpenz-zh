// 15. lecke: célzott pénzállomány: Baumol–Allais–Tobin (9.1) és Miller–Orr (9.2). Csak a mag függvényeit hívja.

import { atlagosPenzallomanyBaumol, atlagosPenzallomanyMillerOrr, baumolC, baumolL, millerOrrC, millerOrrU } from '../../calc/likviditas.ts'
import { rng } from '../../lib/rng.ts'

// ---------- Baumol–Allais–Tobin (diás nézet, 11–13. dia) ----------

export type Baumol = {
  /** d, a napi pénzkiáramlás (USD / nap); T = 365 · d */
  d: number
  /** r, az éves hozam (az értékpapírokon elérhető) */
  r: number
  /** F, egy pénzfelvétel (értékpapír-eladás) fix költsége (USD) */
  F: number
  /** C, egy felvétel összege: a csúszkával állítható, az optimum a C_opt */
  C: number
}

/** 13. dia (Vulcan Corporation): d = 100 USD/nap, r = 5%, F = 10 USD → T = 36 500, C_opt = 3821 USD, L_opt = 0,1047 év = 38,2 nap. */
export const BAUMOL_ALAP: Baumol = { d: 100, r: 0.05, F: 10, C: 3821 }

/** Ennyi felvételi ciklust rajzol a fűrészfog. */
export const CIKLUSOK = 3

export type PontKoltseg = { C: number; nyito: number; kereskedesi: number; ossz: number }

export type BaumolEredmeny =
  | { hiba: string }
  | {
      hiba: undefined
      /** T = 365 · d, az éves pénzkiáramlás */
      T: number
      /** C_opt (9.1) */
      Copt: number
      /** L_opt (9.1), évben és napban */
      Lev: number
      Lnap: number
      /** a felvétel ideje napban az aktuális C-nél: C / d */
      LnapC: number
      /** átlagos pénzállomány az aktuális C-nél: C / 2 */
      atlag: number
      /** éves költségek az aktuális C-nél */
      nyito: number
      kereskedesi: number
      ossz: number
      /** a legkisebb éves összköltség (C_opt-nál) */
      osszOpt: number
      /** a pénzállomány fűrészfoga: [nap, egyenleg] CIKLUSOK cikluson át, a felvételnél függőleges ugrással */
      fureszfog: [number, number][]
      /** a költséggörbék a C függvényében (a C_opt körül) */
      koltseg: PontKoltseg[]
      cMax: number
      yMax: number
      probak: [boolean, boolean, boolean]
    }

/**
 * SZEMLÉLTETŐ költségek (a 11. dián csak a görbék vannak, képlet nincs): a 9.1 modellből következnek.
 * Az átlagos pénzállomány C/2, ezért az elmaradt hozam (alternatív költség) r · C/2; T/C felvétel kell évente,
 * ezért a tranzakciós költség F · T/C. Az összegük minimuma éppen √(2·T·F / r) = C_opt (9.1).
 */
export function nyitoKoltseg(C: number, r: number): number {
  return (r * C) / 2
}
export function kereskedesiKoltseg(C: number, T: number, F: number): number {
  return (F * T) / C
}

export function baumol(s: Baumol): BaumolEredmeny {
  if (!(s.d > 0)) return { hiba: 'A napi pénzkiáramlás (d) pozitív szám.' }
  if (!(s.r > 0)) return { hiba: 'A hozam (r) pozitív szám: 0% hozam mellett nem érdemes értékpapírban tartani a pénzt.' }
  if (!(s.F > 0)) return { hiba: 'A pénzfelvétel fix költsége (F) pozitív szám: költség nélkül a pénzt folyamatosan felvennénk.' }
  if (!(s.C > 0)) return { hiba: 'Egy felvétel összege (C) pozitív szám.' }

  const T = 365 * s.d
  const Copt = baumolC(T, s.F, s.r)
  const Lev = baumolL(T, s.F, s.r)
  const nyito = nyitoKoltseg(s.C, s.r)
  const kereskedesi = kereskedesiKoltseg(s.C, T, s.F)
  const osszOpt = nyitoKoltseg(Copt, s.r) + kereskedesiKoltseg(Copt, T, s.F)

  // fűrészfog: C-ről 0-ra csökken (napi d kiáramlás), majd újra C
  const ciklusNap = s.C / s.d
  const fureszfog: [number, number][] = [[0, s.C]]
  for (let k = 1; k <= CIKLUSOK; k++) {
    fureszfog.push([k * ciklusNap, 0])
    if (k < CIKLUSOK) fureszfog.push([k * ciklusNap, s.C])
  }

  const cMax = Math.max(2.4 * Copt, 1.15 * s.C)
  const N = 240
  const koltseg = Array.from({ length: N }, (_, i) => {
    const C = ((i + 1) / N) * cMax
    const ny = nyitoKoltseg(C, s.r)
    const ke = kereskedesiKoltseg(C, T, s.F)
    return { C, nyito: ny, kereskedesi: ke, ossz: ny + ke }
  })

  return {
    hiba: undefined,
    T,
    Copt,
    Lev,
    Lnap: Lev * 365,
    LnapC: ciklusNap,
    atlag: atlagosPenzallomanyBaumol(s.C),
    nyito,
    kereskedesi,
    ossz: nyito + kereskedesi,
    osszOpt,
    fureszfog,
    koltseg,
    cMax,
    yMax: 2.6 * osszOpt,
    probak: [
      // F négyszerese (d és r az alapérték): a gyök miatt C_opt csak kétszeres
      Math.abs(s.F - 4 * BAUMOL_ALAP.F) < 0.5 && s.d === BAUMOL_ALAP.d && s.r === BAUMOL_ALAP.r,
      // r legalább kétszeres: C_opt csökken
      s.r >= 2 * BAUMOL_ALAP.r - 1e-9 && Copt < baumolC(365 * BAUMOL_ALAP.d, BAUMOL_ALAP.F, BAUMOL_ALAP.r),
      // C az optimum duplájánál nagyobb: az összköltség nagyobb a minimumnál
      s.C >= 1.8 * Copt && ossz(s.C, s.r, T, s.F) > osszOpt,
    ],
  }
}

function ossz(C: number, r: number, T: number, F: number): number {
  return nyitoKoltseg(C, r) + kereskedesiKoltseg(C, T, F)
}

// ---------- Miller–Orr (bővített nézet, 14–17. dia) ----------

export type MillerOrr = {
  /** L, az alsó korlát (a vezetés által előírt minimum) */
  L: number
  /** F, egy értékpapír-ügylet fix költsége */
  F: number
  /** σ, a napi (időszaki) pénzáramlás szórása */
  sigma: number
  /** r, a hozam ugyanarra az időszakra, mint σ */
  r: number
  /** a szemléltető pálya álvéletlen magja */
  seed: number
}

/** 17. dia (vizsgafeladat, havi adatok): L = 100, F = 10, σ = 200, r = 1% → C* = 411 (410,7), U* = 1032, átlag 514. */
export const MO_ALAP: MillerOrr = { L: 100, F: 10, sigma: 200, r: 0.01, seed: 7 }

/** 16. dia (EMPEC, lengyel távfűtő, napi adatok): σ = 357 697 PLN, F = 10, r = (1,0225)^(1/365) − 1 = 0,0060962%, L = 350 000 → C* = 600 616,6 (a dia: 600 616), U* = 3 × 600 616 − 2L = 1 101 848. */
export const MO_EMPEC: MillerOrr = { L: 350000, F: 10, sigma: 357697, r: Math.pow(1.0225, 1 / 365) - 1, seed: 7 }

/** A szemléltető pálya hossza (időszak). */
export const MO_IDOSZAKOK = 60

export type Esemeny = { t: number; fajta: 'vetel' | 'eladas' }

export type MillerOrrEredmeny =
  | { hiba: string }
  | {
      hiba: undefined
      /** C* (9.2) */
      C: number
      /** U* = 3·C* − 2·L, az unrounded C*-ból */
      U: number
      /** átlagos pénzállomány: (4·C* − L) / 3 */
      atlag: number
      /** a szemléltető pálya pontjai: [időszak, egyenleg]; a korlát elérésekor függőleges ugrás C*-ra */
      ut: [number, number][]
      esemenyek: Esemeny[]
      /** y tengely */
      yMin: number
      yMax: number
      probak: [boolean, boolean, boolean]
    }

/** Egy normál eloszlású szám (Box–Muller) a seedelt generátorból. */
function normalis(next: () => number): number {
  const u = 1 - next()
  const v = next()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/**
 * SZEMLÉLTETŐ pálya (a 14–17. dia is szemléltetésnek mondja): a pénzállomány C*-ról indul, minden időszakban
 * σ szórású normális változás éri. Ha eléri U*-ot, értékpapírt vesznek (vissza C*-ra), ha L-t, eladnak (vissza C*-ra).
 * Az értékek sosem lépik át a korlátokat: az áthágás helyett a korlátra vágjuk, majd C*-ra ugrik.
 * A változások (z-pontszámok) csak a seedtől függnek, a σ csak skáláz, így a csúszkák mozgatásakor a pálya alakja marad.
 */
export function millerOrrUt(C: number, L: number, U: number, sigma: number, seed: number, n = MO_IDOSZAKOK): { ut: [number, number][]; esemenyek: Esemeny[] } {
  const g = rng(seed)
  const ut: [number, number][] = [[0, C]]
  const esemenyek: Esemeny[] = []
  let x = C
  for (let t = 1; t <= n; t++) {
    x += sigma * normalis(g.next)
    if (x >= U) {
      ut.push([t, U], [t, C])
      esemenyek.push({ t, fajta: 'vetel' })
      x = C
    } else if (x <= L) {
      ut.push([t, L], [t, C])
      esemenyek.push({ t, fajta: 'eladas' })
      x = C
    } else {
      ut.push([t, x])
    }
  }
  return { ut, esemenyek }
}

export function millerOrr(s: MillerOrr): MillerOrrEredmeny {
  if (!(s.L >= 0)) return { hiba: 'Az alsó korlát (L) nem lehet negatív.' }
  if (!(s.F > 0)) return { hiba: 'A fix költség (F) pozitív szám.' }
  if (!(s.sigma > 0)) return { hiba: 'A szórás (σ) pozitív szám: ingadozás nélkül nincs mit szabályozni.' }
  if (!(s.r > 0)) return { hiba: 'A hozam (r) pozitív szám.' }

  const C = millerOrrC(s.L, s.F, s.sigma, s.r)
  const U = millerOrrU(C, s.L)
  const { ut, esemenyek } = millerOrrUt(C, s.L, U, s.sigma, s.seed)
  const hezag = U - s.L
  const alap = millerOrr0(MO_ALAP)
  return {
    hiba: undefined,
    C,
    U,
    atlag: atlagosPenzallomanyMillerOrr(C, s.L),
    ut,
    esemenyek,
    yMin: s.L - 0.1 * hezag,
    yMax: U + 0.1 * hezag,
    probak: [
      // σ kétszerese (a többi az alapérték): C* − L ∛4-szeresére nő
      Math.abs(s.sigma - 2 * MO_ALAP.sigma) < 0.5 && s.L === MO_ALAP.L && s.F === MO_ALAP.F && s.r === MO_ALAP.r && Math.abs((C - s.L) / (alap.C - MO_ALAP.L) - Math.cbrt(4)) < 1e-9,
      // a lengyel példa (16. dia)
      Math.abs(s.L - MO_EMPEC.L) < 0.5 && Math.abs(s.sigma - MO_EMPEC.sigma) < 0.5 && Math.abs(s.F - MO_EMPEC.F) < 1e-9 && Math.abs(s.r - MO_EMPEC.r) < 1e-9,
      // F legalább kétszerese: szélesebb sáv (kevesebb ügylet)
      s.F >= 2 * MO_ALAP.F - 1e-9 && U - s.L > alap.U - MO_ALAP.L,
    ],
  }
}

/** Az alapérték C* és U* értéke (a próbák összehasonlításához). */
function millerOrr0(s: MillerOrr): { C: number; U: number } {
  const C = millerOrrC(s.L, s.F, s.sigma, s.r)
  return { C, U: millerOrrU(C, s.L) }
}
