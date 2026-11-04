import type { Kor } from '../../kor.ts'
import type { AnySablon, Csalad } from '../tipusok.ts'
import { allapotEgy, allapotKet, allapotTeljes, portfolioKet } from './allapot.ts'
import { historikusSzoras } from './historikus.ts'
import { atlaghozamok } from './hozam.ts'
import { kevertPortfolioSablon, portfolioBetaSablon } from './beta.ts'
import { capmArazas, capmElvart, capmKetEszkoz, capmVisszafejtes } from './capm.ts'
import { npvIrr } from './npv.ts'
import { waccVagyCapm } from './projekt.ts'
import { adopajzsOrok, adopajzsVeges, adosTokekoltseg, mmEszkozBeta, mmSajatToke, mmTokekoltseg, mmUjrafinanszirozas, modositottTokekoltseg } from './tokeszerkezet.ts'
import { waccLanc } from './wacc.ts'

export const SABLONOK: AnySablon[] = [
  atlaghozamok,
  historikusSzoras,
  capmElvart,
  capmVisszafejtes,
  capmArazas,
  capmKetEszkoz,
  allapotEgy,
  allapotKet,
  portfolioKet,
  allapotTeljes,
  portfolioBetaSablon,
  kevertPortfolioSablon,
  npvIrr,
  waccLanc,
  waccVagyCapm,
  mmTokekoltseg,
  mmSajatToke,
  mmUjrafinanszirozas,
  mmEszkozBeta,
  adopajzsOrok,
  adopajzsVeges,
  adosTokekoltseg,
  modositottTokekoltseg,
]

// fejezetsorrendben
export const CSALADOK: { id: Csalad; cim: string; fejezet: string; kor: Kor }[] = [
  { id: 'hozam', cim: 'Hozamok, átlagok, historikus szórás', fejezet: '1. és 2.3', kor: 1 },
  { id: 'allapot', cim: 'Állapotos kockázat-hozam', fejezet: '2-3. fejezet', kor: 1 },
  { id: 'beta', cim: 'Portfólió béta', fejezet: '4.4 és 5.4', kor: 1 },
  { id: 'capm', cim: 'CAPM család', fejezet: '5. fejezet', kor: 1 },
  { id: 'npv', cim: 'NPV és IRR', fejezet: '6. fejezet', kor: 1 },
  { id: 'wacc', cim: 'Tőkeköltség és WACC', fejezet: '7. fejezet', kor: 1 },
  { id: 'mm', cim: 'Tőkeszerkezet tökéletes piacon (MM)', fejezet: '8.1–8.3', kor: 2 },
  { id: 'ado', cim: 'Tőkeszerkezet adóval', fejezet: '8.4–8.8', kor: 2 },
]

export function sablonKor(s: AnySablon): Kor {
  return CSALADOK.find((c) => c.id === s.csalad)?.kor ?? 1
}

export function sablon(id: string): AnySablon | undefined {
  return SABLONOK.find((s) => s.id === id)
}

export function csaladSablonjai(c: Csalad): AnySablon[] {
  return SABLONOK.filter((s) => s.csalad === c)
}
