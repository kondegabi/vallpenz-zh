// 7. lecke: karakterisztikus egyenes és kockázatfelbontás (4.1–4.3). Csak a mag függvényeit hívja.
// A 4.1–4.3-hoz nincs diás számpélda, ezért az alapértékek szemléltetők.

import { betaCov, kockazatFelbontas, korrelacioBetabol } from '../../calc/beta.ts'
import { variancia, varhatoHozam } from '../../calc/kockazat.ts'
import { kovariancia } from '../../calc/portfolio.ts'
import { normalisMinta } from '../../calc/szimulacio.ts'

export type L07 = { beta: number; sM: number; sE: number }

/** Szemléltető alapértékek (a diákon nincs számpélda): β 1,2, σ(r_M) 20%, σ(ε) 25%. */
export const L07_ALAP: L07 = { beta: 1.2, sM: 0.2, sE: 0.25 }

/** A minta: 60 megfigyelés, a piac várható hozama szemléltető 10%; fix seed. */
export const L07_N = 60
export const L07_EM = 0.1
// a seedpárt úgy választottam, hogy a mintában a piaci és az egyedi rész gyakorlatilag korrelálatlan legyen (4.1: k_{M,ε} = 0)
const SEED_M = 710
const SEED_E = 853

export type L07Eredmeny =
  | { hiba: string }
  | {
      hiba: undefined
      rM: number[]
      ri: number[]
      eps: number[]
      /** 4.2: a mintából becsült béta, cov(r_i, r_M) / σ²(r_M), egyenlő súlyokkal */
      becsultBeta: number
      /** 4.3 */
      piaci: number
      egyedi: number
      teljes: number
      szoras: number
      /** 4.2 második alakjából: k_iM = β σ(r_M) / σ(r_i) */
      korrelacio: number
      /** a kiemelt pont indexe (a β r_M és az ε rész szemléltetéséhez) */
      kiemelt: number
      atlagM: number
      atlagI: number
      probak: [boolean, boolean, boolean]
    }

export function l07(s: L07): L07Eredmeny {
  if (!(s.sM > 0)) return { hiba: 'A piac szórása csak pozitív lehet.' }
  if (s.sE < 0) return { hiba: 'Az egyedi rész szórása nem lehet negatív.' }
  const zM = normalisMinta(L07_N, 0, 1, SEED_M)
  const zE = normalisMinta(L07_N, 0, 1, SEED_E)
  const rM = zM.map((z) => L07_EM + s.sM * z)
  const eps = zE.map((z) => s.sE * z)
  // 4.1: r_i = β r_M + ε
  const ri = rM.map((r, t) => s.beta * r + eps[t])
  const p = Array(L07_N).fill(1 / L07_N)
  const f = kockazatFelbontas(s.beta, s.sM * s.sM, s.sE * s.sE)
  const szoras = Math.sqrt(f.teljes)
  // a kiemelt pont: jobbra a piaci átlagtól, nagy pozitív egyedi résszel
  let kiemelt = 0
  zM.forEach((z, t) => {
    if (z > 0.5 && z < 1.6 && zE[t] > zE[kiemelt]) kiemelt = t
  })
  return {
    hiba: undefined,
    rM,
    ri,
    eps,
    becsultBeta: betaCov(kovariancia(p, ri, rM), variancia(p, rM)),
    piaci: f.piaci,
    egyedi: f.egyedi,
    teljes: f.teljes,
    szoras,
    korrelacio: szoras > 0 ? korrelacioBetabol(s.beta, szoras, s.sM) : 0,
    kiemelt,
    atlagM: varhatoHozam(p, rM),
    atlagI: varhatoHozam(p, ri),
    probak: [s.sE >= 0.4 - 1e-9, s.sE < 0.0005, Math.abs(s.beta) < 0.005],
  }
}
