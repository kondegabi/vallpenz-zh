// 10. lecke: NPV-profil és IRR (6.1–6.2). Csak a mag függvényeit hívja.

import { irrHaVan, npv, npvDontes, npvProfil } from '../../calc/npv.ts'

export type L10 = { cf: number[]; r: number }

/** 6.1 / 6.2 példa (4. ea 19–21. dia). */
export const L10_ALAP: L10 = { cf: [-165000, 63120, 70800, 91080], r: 0.12 }

export function l10(s: L10) {
  const IRR = irrHaVan(s.cf)
  const rMax = Math.min(1, Math.max(0.4, IRR !== null ? IRR * 1.6 : 0.4))
  const NPV = npv(s.r, s.cf)
  const vanElojelvaltas = s.cf.some((c) => c < 0) && s.cf.some((c) => c > 0)
  return {
    NPV,
    IRR,
    rMax,
    profil: npvProfil(s.cf, 0, rMax, 240),
    dontes: npvDontes(NPV),
    uzenet: !vanElojelvaltas || IRR === null ? 'Nincs IRR: a pénzáramlások előjele nem vált, így az NPV sehol sem nulla.' : undefined,
    probak: [
      IRR !== null && Math.abs(s.r - IRR) < 0.0015,
      s.cf[0] !== L10_ALAP.cf[0] && Math.abs(npv(0.12, s.cf)) < 100,
      NPV < 0,
    ],
  }
}
