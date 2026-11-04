// WACC vagy projekt-CAPM (7.5): eltérő kockázatú projekteknél a mérce a projekt bétájával
// számolt CAPM-hozam, nem a céges WACC.

import { capm } from '../../calc/capm.ts'
import { capmHibak } from './capm.ts'
import { hozamDontes } from '../../calc/npv.ts'
import { pct, sz } from '../formaz.ts'
import type { Lepes, Sablon } from '../tipusok.ts'
import { kerekit4, nagyKezdet } from './kozos.ts'

const CEGEK = ['a Kőrös Logisztika Nyrt.', 'a Tisza Energia Nyrt.', 'a Mátra Gépgyár Nyrt.', 'az Ipoly Pharma Nyrt.', 'a Zala Építő Nyrt.'] as const
const PROJEKT_NEVEK = ['A', 'B', 'C'] as const

type Projekt = { E: number; beta: number }

type PR = {
  valtozat: 'sajatToke' | 'adott'
  ceg: string
  rf: number
  MRP: number
  ErM: number
  piacMod: 'ErM' | 'MRP'
  betaCeg: number
  waccAdott: number
  projektek: Projekt[]
  tablaval: boolean
}

function aMRP(p: PR): number {
  return p.piacMod === 'ErM' ? p.ErM - p.rf : p.MRP
}

function aWACC(p: PR): number {
  return p.valtozat === 'sajatToke' ? capm(p.rf, p.betaCeg, aMRP(p)) : p.waccAdott
}

function elvart(p: PR, i: number): number {
  return capm(p.rf, p.projektek[i].beta, aMRP(p))
}

const WACC_UZENET = 'Ez a céges WACC; eltérő kockázatú projektnél a projekt bétájával számolt CAPM-hozam a mérce.'

function projektLepesek(i: number): Lepes<PR>[] {
  const nev = PROJEKT_NEVEK[i]
  return [
    {
      tipus: 'szam',
      key: `elvart${nev}`,
      formulaId: '5.1',
      kerdes: `Mekkora ${nev === 'A' ? 'az' : 'a'} ${nev} projekt CAPM szerinti elvárt hozama?`,
      egyseg: '%',
      mikor: (p) => p.projektek.length > i,
      ertek: (p) => elvart(p, i),
      tipikusHibak: (p) => [
        { ertek: aWACC(p), uzenet: WACC_UZENET },
        ...(p.piacMod === 'ErM'
          ? [{ ertek: p.rf + p.projektek[i].beta * p.ErM, uzenet: 'A piac hozamával (E(rM)) számoltál a prémium helyett; az MRP = E(rM) − rf.' }]
          : []),
      ],
      levezetes: (p) => {
        const v = elvart(p, i)
        return `rf + β × MRP = ${sz(p.rf)} + ${sz(p.projektek[i].beta)} × ${sz(aMRP(p))} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'valasztas',
      key: `dontes${nev}`,
      formulaId: '7.5',
      kerdes: `Elfogadjuk ${nev === 'A' ? 'az' : 'a'} ${nev} projektet?`,
      opciok: ['elfogadjuk', 'elutasítjuk'],
      mikor: (p) => p.projektek.length > i,
      ertek: (p) => hozamDontes(p.projektek[i].E, elvart(p, i)),
      tipikusValaszok: (p) => [
        {
          valasz: hozamDontes(p.projektek[i].E, aWACC(p)),
          uzenet: 'A céges WACC-hoz hasonlítottál; eltérő kockázatú projektnél a projekt saját CAPM-hozama a mérce.',
        },
      ],
      levezetes: (p) => {
        const E = p.projektek[i].E
        const el = elvart(p, i)
        const d = hozamDontes(E, el)
        const w = hozamDontes(E, aWACC(p))
        const waccMegj = w === d ? '' : ` (a WACC-szabály szerint ${w === 'elfogadjuk' ? 'elfogadnánk' : 'elutasítanánk'}, mert ${pct(E)} ${E > aWACC(p) ? '>' : '<'} ${pct(aWACC(p))})`
        return `${pct(E)} ${E > el ? '>' : '<'} ${pct(el)}, ezért ${d}${waccMegj}.`
      },
    },
  ]
}

export const waccVagyCapm: Sablon<PR> = {
  id: 'wacc-vagy-capm',
  csalad: 'wacc',
  cim: 'WACC vagy projekt-CAPM: melyik projekt jó?',
  felismeresek: [{ elott: '', helyes: 'F14', zavarok: ['F13', 'F09', 'F11'] }],
  general: (r) => {
    const rf = r.lepeskoz(0.02, 0.07, 0.005)
    const MRP = r.lepeskoz(0.04, 0.09, 0.005)
    const n = r.esely(0.6) ? 2 : 3
    const projektek = Array.from({ length: n }, () => {
      const beta = r.lepeskoz(0.4, 2, 0.1)
      // a várható hozam 0,5–3 százalékponttal tér el a projekt CAPM-hozamától, bármelyik irányba
      const elteres = r.lepeskoz(0.005, 0.03, 0.005) * (r.esely(0.5) ? 1 : -1)
      return { beta, E: kerekit4(rf + beta * MRP + elteres) }
    })
    return {
      valtozat: r.esely(0.6) ? 'sajatToke' : 'adott',
      ceg: r.valaszt(CEGEK),
      rf,
      MRP,
      ErM: kerekit4(rf + MRP),
      piacMod: r.esely(0.35) ? 'ErM' : 'MRP',
      betaCeg: r.lepeskoz(0.8, 1.3, 0.05),
      waccAdott: r.lepeskoz(0.08, 0.14, 0.005),
      projektek,
      tablaval: r.esely(0.5),
    }
  },
  ervenyes: (p) => {
    // 1-es bétájú cégnél a WACC a piaci hozam lenne, a tipikus hibák egybeesnének a helyessel
    if (p.valtozat === 'sajatToke' && Math.abs(p.betaCeg - 1) < 0.05) return false
    const wacc = aWACC(p)
    // legalább egy projektnél a WACC-szabály rossz döntést hozna: erről szól a feladat
    const tanulsagos = p.projektek.some((pr, i) => hozamDontes(pr.E, wacc) !== hozamDontes(pr.E, elvart(p, i)))
    const nemHatareset = p.projektek.every((pr) => Math.abs(pr.E - wacc) >= 0.003 && pr.E > p.rf)
    return tanulsagos && nemHatareset
  },
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const piac = p.piacMod === 'ErM' ? `a piaci portfólió várható hozama ${pct(p.ErM)}` : `a piaci kockázati prémium ${pct(p.MRP)}`
    const ceg =
      p.valtozat === 'sajatToke'
        ? `${nagyKezdet(p.ceg)} tisztán saját tőkéből finanszírozott, részvényeinek bétája ${sz(p.betaCeg)}.`
        : `${nagyKezdet(p.ceg)} súlyozott átlagos tőkeköltsége (WACC) ${pct(p.waccAdott)}.`
    const piacMondat = `A kockázatmentes hozam ${pct(p.rf)}, ${piac}.`
    const nevek = p.projektek.map((_, i) => PROJEKT_NEVEK[i])
    const kerdesek = [
      ...(p.valtozat === 'sajatToke' ? ['Mekkora a vállalat WACC-ja?'] : []),
      'Melyik projektet érdemes elfogadni?',
    ]
    const leirasok = p.projektek.map((pr, i) => `${nevek[i] === 'A' ? 'az' : 'a'} ${nevek[i]} projekt várható hozama ${pct(pr.E)}, bétája ${sz(pr.beta)}`)
    const projektMondat = p.tablaval
      ? `A vállalat ${p.projektek.length} projektet mérlegel, ezek adatait a táblázat mutatja.`
      : `A vállalat ${p.projektek.length} projektet mérlegel: ${leirasok.join('; ')}.`
    // a 4. keretben mindig van zavaró adat
    const zavaro = v === 3 ? `A vállalat részvényeinek árfolyama ${sz(r.lepeskoz(15, 80, 0.5))} USD.` : undefined
    const mondatok = [
      [ceg, piacMondat, projektMondat],
      [piacMondat, ceg, projektMondat],
      [`Egy elemző ${p.ceg.replace(/ Nyrt\.$/, '')} beruházási terveit vizsgálja.`, ceg, projektMondat, piacMondat],
      [ceg, zavaro, projektMondat, piacMondat],
    ][v]
    return {
      valtozat: `k${v}`,
      bekezdesek: [mondatok.filter(Boolean).join(' ')],
      ...(p.tablaval
        ? {
            tabla: {
              fejlec: ['Projekt', 'Várható hozam', 'Béta'],
              sorok: p.projektek.map((pr, i) => [nevek[i], pct(pr.E), sz(pr.beta)]),
            },
          }
        : {}),
      kerdesek,
    }
  },
  zh: (p) => ({ kulcsok: [...(p.valtozat === 'sajatToke' ? ['wacc'] : []), ...p.projektek.map((_, i) => `dontes${PROJEKT_NEVEK[i]}`)] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'wacc',
      formulaId: '7.2',
      kerdes: 'Mekkora a vállalat WACC-ja (tisztán saját tőkés cégnél ez a saját tőke költsége)?',
      egyseg: '%',
      mikor: (p) => p.valtozat === 'sajatToke',
      ertek: (p) => aWACC(p),
      // tisztán saját tőkés cégnél a WACC a saját tőke CAPM-költsége: ugyanazok a csapdák, mint a CAPM-nél
      tipikusHibak: (p) => capmHibak({ mod: p.piacMod, rf: p.rf, beta: p.betaCeg, ErM: p.ErM, MRP: p.MRP }),
      levezetes: (p) => {
        const v = aWACC(p)
        return `WACC = rE = rf + β × MRP = ${sz(p.rf)} + ${sz(p.betaCeg)} × ${sz(aMRP(p))} = ${sz(v)} → ${pct(v)}`
      },
    },
    ...projektLepesek(0),
    ...projektLepesek(1),
    ...projektLepesek(2),
  ],
  diasPeldak: [
    {
      forras: '7.5 Példa (5. ea)',
      p: { valtozat: 'sajatToke', rf: 0.07, MRP: 0.08, piacMod: 'MRP', betaCeg: 1, projektek: [{ E: 0.14, beta: 0.6 }, { E: 0.16, beta: 1.2 }] },
      vart: { wacc: '15%', elvartA: '11,8%', dontesA: 'elfogadjuk', elvartB: '16,6%', dontesB: 'elutasítjuk' },
    },
  ],
}
