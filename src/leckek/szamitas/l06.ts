// 6. lecke: tőkeallokációs és tőkepiaci egyenes (3.5, 5.4). Csak a mag függvényeit hívja.

import { kevertPortfolio, kevertSzoras } from '../../calc/capm.ts'
import { normalisMinta } from '../../calc/szimulacio.ts'
import { erintesiPortfolio, portfolioGorbe } from '../../calc/portfolio.ts'
import { L04_ALAP } from './l04.ts'

export type Eset = '3ea' | '5ea'
export type L06 = {
  eset: Eset
  w: number
  rf: number
  EA: number
  betaA: number
  /** σ(r_A): a képlettárban nincs, szemléltető érték */
  sA: number
  /** a tőkepiaci egyenes szakaszának korrelációja (a 4. lecke két eszköze között) */
  k: number
}

/** 5.4 példa (3. ea): E(rA) = 20%, β = 1,6, r_f = 8%, w = 25% → 11%, βP = 0,4. σ(rA) szemléltető 25%. */
export const L06_3EA: L06 = { eset: '3ea', w: 0.25, rf: 0.08, EA: 0.2, betaA: 1.6, sA: 0.25, k: 0 }
/** 5.4 példa (5. ea): D: 12%, β 1,2, r_f 4%; cél 9% → w = 0,625, βP = 0,75. σ szemléltető 25%. */
export const L06_5EA: L06 = { eset: '5ea', w: 1, rf: 0.04, EA: 0.12, betaA: 1.2, sA: 0.25, k: 0 }
export const L06_ALAP = L06_3EA

/** A kockázatos eszköz neve a dián: a 3. ea példájában A, az 5. ea példájában D. */
export function l06Nev(eset: Eset): 'A' | 'D' {
  return eset === '3ea' ? 'A' : 'D'
}

export type L06Eredmeny =
  | { hiba: 'A szórás csak pozitív lehet.' }
  | {
      hiba: undefined
      E: number
      beta: number
      szoras: number
      /** a CAL meredeksége: (E(r_A) − r_f) / σ(r_A) */
      meredekseg: number
      hitel: boolean
      probak: [boolean, boolean, boolean]
    }

export function l06(s: L06): L06Eredmeny {
  if (!(s.sA > 0)) return { hiba: 'A szórás csak pozitív lehet.' }
  const p = kevertPortfolio(s.w, s.EA, s.betaA, s.rf)
  const egy = kevertPortfolio(1, s.EA, s.betaA, s.rf)
  return {
    hiba: undefined,
    E: p.Er,
    beta: p.beta,
    szoras: kevertSzoras(s.w, s.sA),
    meredekseg: (egy.Er - s.rf) / kevertSzoras(1, s.sA),
    hitel: s.w > 1,
    probak: [
      s.eset === '3ea' && Math.abs(s.w - 1.5) < 0.005,
      s.eset === '5ea' && Math.abs(p.Er - 0.09) < 0.0005,
      s.eset === '3ea' && Math.abs(p.beta - 1) < 0.005,
    ],
  }
}

/** A tőkepiaci egyenes szakasza: a 4. lecke két eszközének görbéje és az érintési pont. */
export function l06Cml(s: L06) {
  const { E1, E2, s1, s2 } = L04_ALAP
  const gorbe = portfolioGorbe(E1, E2, s1, s2, s.k, 200)
  const M = erintesiPortfolio(E1, E2, s1, s2, s.k, s.rf)
  return { gorbe, M, eszkozok: [{ E: E1, szoras: s1 }, { E: E2, szoras: s2 }] }
}

/**
 * Szemléltető pontfelhő a 15. diához (fix seed): körök a görbe belső oldalán, közel hozzá, × jelek
 * beljebb. Mind a hatékony görbe alatt van, mert fölötte nem lehet eszköz.
 */
export function l06Felho(gorbe: { E: number; szoras: number }[]): { korok: [number, number][]; xek: [number, number][] } {
  const minS = Math.min(...gorbe.map((g) => g.szoras))
  // a görbe felső ágának E-je adott σ-nál (lineáris interpoláció; több metszésnél a legnagyobb)
  const hatar = (s: number) => {
    let best = -Infinity
    for (let i = 1; i < gorbe.length; i++) {
      const [p, q] = [gorbe[i - 1], gorbe[i]]
      const [lo, hi] = p.szoras < q.szoras ? [p, q] : [q, p]
      if (s >= lo.szoras && s <= hi.szoras && hi.szoras > lo.szoras) best = Math.max(best, lo.E + ((s - lo.szoras) / (hi.szoras - lo.szoras)) * (hi.E - lo.E))
    }
    return best
  }
  const u = normalisMinta(60, 0, 1, 615)
  const v = normalisMinta(60, 0, 1, 616)
  const korok = u.slice(0, 26).map((z, i) => {
    const s = minS + 0.035 + (i / 26) * 0.2 + Math.abs(v[i]) * 0.008
    return [s, hatar(s) - 0.002 - Math.abs(z) * 0.006] as [number, number]
  })
  const xek = u.slice(26, 56).map((z, i) => {
    const s = minS + 0.06 + ((i * 7) % 30) / 30 * 0.32 + Math.abs(v[26 + i]) * 0.01
    return [s, hatar(s) - 0.012 - Math.abs(z) * 0.02] as [number, number]
  })
  return { korok: korok.filter(([, E]) => Number.isFinite(E)), xek: xek.filter(([, E]) => Number.isFinite(E)) }
}
