// 12. lecke: WACC vagy projekt-CAPM (7.5). Csak a mag függvényeit hívja.

import { capm } from '../../calc/capm.ts'
import { hozamDontes, type Dontes } from '../../calc/npv.ts'

export type Projekt = { nev: string; beta: number; E: number }
export type L12 = { rf: number; MRP: number; betaCeg: number; projektek: Projekt[] }

/**
 * 7.5 példa (5. ea): tisztán saját tőkés cég, β = 1, r_f = 7%, MRP = 8% → WACC = 15%.
 * A: 14%, β 0,6 → CAPM 11,8%; B: 16%, β 1,2 → CAPM 16,6%.
 */
export const L12_ALAP: L12 = {
  rf: 0.07,
  MRP: 0.08,
  betaCeg: 1,
  projektek: [
    { nev: 'A', beta: 0.6, E: 0.14 },
    { nev: 'B', beta: 1.2, E: 0.16 },
  ],
}

export type Tipus = 'helyes elfogadás' | 'helyes elutasítás' | 'téves elutasítás' | 'téves elfogadás'

export function l12(s: L12) {
  // tisztán saját tőkés cégnél a WACC a saját tőke CAPM szerinti költsége (7.5)
  const WACC = capm(s.rf, s.betaCeg, s.MRP)
  const projektek = s.projektek.map((p) => {
    const elvart = capm(s.rf, p.beta, s.MRP)
    const waccDontes: Dontes = hozamDontes(p.E, WACC)
    const capmDontes: Dontes = hozamDontes(p.E, elvart)
    const tipus: Tipus =
      waccDontes === capmDontes
        ? capmDontes === 'elfogadjuk'
          ? 'helyes elfogadás'
          : 'helyes elutasítás'
        : waccDontes === 'elutasítjuk'
          ? 'téves elutasítás'
          : 'téves elfogadás'
    return { ...p, elvart, waccDontes, capmDontes, tipus, teves: waccDontes !== capmDontes }
  })
  const [A, B] = projektek
  return {
    WACC,
    projektek,
    tevesek: projektek.filter((p) => p.teves).length,
    probak: [
      !!A && !A.teves,
      !!B && B.tipus === 'téves elutasítás',
      projektek.some((p) => Math.abs(p.beta - s.betaCeg) < 0.005 && Math.abs(p.E - WACC) > 1e-9),
    ],
  }
}
