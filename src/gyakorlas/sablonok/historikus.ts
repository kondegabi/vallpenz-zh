// Historikus (múltbeli) szórás (2.3): átlaghozam (1.2) → eltérésnégyzetek összege → variancia
// N − 1-gyel osztva → szórás. A fő csapda az N − 1.

import { szamtaniAtlag } from '../../calc/hozam.ts'
import { historikusLevezetes } from '../../calc/kockazat.ts'
import { pct, sz } from '../formaz.ts'
import type { Sablon } from '../tipusok.ts'
import { betuNevelovel, nagyKezdet, RESZVENY_BETUK } from './kozos.ts'

type Hi = {
  betu: string
  r: number[]
  utolsoEv: number
  tablaval: boolean
  zavaro?: 'rf' | 'piac'
  zavaroErtek: number
}

const VARIANCIA_TURES = { abs: 0.00005, rel: 0.01 }

function z(x: number): string {
  return x < 0 ? `(${sz(x)})` : sz(x)
}

const N_HIBA = 'Ez N-nel osztva jön ki; a múltbeli hozamsornál N − 1-gyel kell osztani.'

export const historikusSzoras: Sablon<Hi> = {
  id: 'historikus-szoras',
  csalad: 'hozam',
  cim: 'Historikus szórás múltbeli hozamsorból',
  felismeresek: [{ elott: '', helyes: 'F02', zavarok: ['F03', 'F01', 'F04'] }],
  general: (r) => {
    const n = r.valaszt([4, 5, 5, 6, 8] as const)
    // egész százalékos átlag, mint a dián: az utolsó évet úgy választjuk, hogy az átlag kerek legyen
    const atlag = r.egesz(-2, 12)
    const elso = Array.from({ length: n - 1 }, () => r.egesz(-25, 35))
    const utolso = n * atlag - elso.reduce((a, b) => a + b, 0)
    return {
      betu: r.valaszt(RESZVENY_BETUK),
      r: [...elso, utolso].map((x) => x / 100),
      utolsoEv: 2025,
      tablaval: r.esely(0.5),
      zavaro: r.esely(0.35) ? r.valaszt(['rf', 'piac'] as const) : undefined,
      zavaroErtek: r.lepeskoz(0.02, 0.06, 0.005),
    }
  },
  ervenyes: (p) => {
    const utolso = p.r[p.r.length - 1]
    return utolso >= -0.3 && utolso <= 0.4 && new Set(p.r).size > 1
  },
  szoveg: (p, r) => {
    const n = p.r.length
    const b = betuNevelovel(p.betu)
    const v = r.egesz(0, 3)
    // a 4. keretben mindig van zavaró adat
    const zavaroTipus = p.zavaro ?? (v === 3 ? 'rf' : undefined)
    const zavaro =
      zavaroTipus === 'rf'
        ? `A kockázatmentes hozam jelenleg ${pct(p.zavaroErtek)}.`
        : zavaroTipus === 'piac'
          ? `A piaci index átlagos hozama ugyanebben az időszakban ${pct(p.zavaroErtek * 2)} volt.`
          : undefined
    const kerdesek = ['Mekkora az átlaghozam?', 'Mekkora a hozamok (historikus) szórása?']
    const valtozat = `k${v}`
    if (p.tablaval) {
      const bevezeto = [
        `${nagyKezdet(b)} részvény elmúlt ${n} évének hozamait a táblázat mutatja.`,
        `Egy befektető ${n} éve tartja ${b} részvényt; az évenkénti hozamokat a táblázat mutatja.`,
        `Egy elemző ${b} részvény múltbeli teljesítményét vizsgálja: az utolsó ${n} év hozamai a táblázatban.`,
        `Egy alapkezelő ${b} részvény ${p.utolsoEv - n + 1} és ${p.utolsoEv} közötti éves hozamait gyűjtötte ki (táblázat).`,
      ][v]
      return {
        valtozat,
        bekezdesek: [(v === 2 ? [zavaro, bevezeto] : [bevezeto, zavaro]).filter(Boolean).join(' ')],
        tabla: { fejlec: ['Év', 'Hozam'], sorok: p.r.map((x, i) => [String(p.utolsoEv - n + 1 + i), pct(x)]) },
        kerdesek,
      }
    }
    const hozamok = p.r.map((x) => pct(x))
    const lista = `${hozamok.slice(0, -1).join(', ')} és ${hozamok[n - 1]}`
    const mondatok = [
      [`${nagyKezdet(b)} részvény hozama az elmúlt ${n} évben rendre ${lista} volt.`, zavaro],
      [`Egy befektető ${n} éve tartja ${b} részvényt.`, zavaro, `Az évenkénti hozamok: ${lista}.`],
      [zavaro, `Egy elemző ${b} részvény múltbeli teljesítményét vizsgálja; az utolsó ${n} év hozamai rendre ${lista}.`],
      [`Egy alapkezelő ${b} részvény ${p.utolsoEv - n + 1} és ${p.utolsoEv} közötti éves hozamait gyűjtötte ki: ${lista}.`, zavaro],
    ][v]
    return { valtozat, bekezdesek: [mondatok.filter(Boolean).join(' ')], kerdesek }
  },
  zh: () => ({ kulcsok: ['atlag', 'sigma'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'atlag',
      formulaId: '1.2',
      kerdes: 'Mekkora az átlaghozam?',
      egyseg: '%',
      ertek: (p) => szamtaniAtlag(p.r),
      levezetes: (p) => {
        const v = szamtaniAtlag(p.r)
        return `(${p.r.map(z).join(' + ')}) / ${p.r.length} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'negyzetosszeg',
      formulaId: '2.3',
      kerdes: 'Mekkora az átlagtól vett eltérések négyzetösszege?',
      egyseg: 'tizedes',
      tures: VARIANCIA_TURES,
      ertek: (p) => historikusLevezetes(p.r).negyzetosszeg,
      levezetes: (p) => {
        const a = szamtaniAtlag(p.r)
        return `${p.r.map((x) => `(${sz(x)} − ${z(a)})²`).join(' + ')} = ${sz(historikusLevezetes(p.r).negyzetosszeg, 6)}`
      },
    },
    {
      tipus: 'szam',
      key: 'var',
      formulaId: '2.3',
      kerdes: 'Mekkora a variancia?',
      egyseg: 'tizedes',
      tures: VARIANCIA_TURES,
      ertek: (p) => historikusLevezetes(p.r).variancia,
      tipikusHibak: (p, e) => [{ ertek: e('negyzetosszeg') / p.r.length, uzenet: N_HIBA }],
      levezetes: (p, e) => `σ² = ${sz(e('negyzetosszeg'), 6)} / (${p.r.length} − 1) = ${sz(e('var'), 6)}`,
    },
    {
      tipus: 'szam',
      key: 'sigma',
      formulaId: '2.3',
      kerdes: 'Mekkora a szórás?',
      egyseg: '%',
      ertek: (_p, e) => Math.sqrt(e('var')),
      tipikusHibak: (p, e) => [
        { ertek: Math.sqrt(e('negyzetosszeg') / p.r.length), uzenet: N_HIBA },
        { ertek: e('var'), uzenet: 'Ez a variancia; a szórás ennek négyzetgyöke.' },
        { ertek: Math.sqrt(e('negyzetosszeg')), uzenet: 'A négyzetösszeget gyökvonás előtt el kell osztani (N − 1)-gyel.' },
        { ertek: Math.sqrt(e('negyzetosszeg')) / (p.r.length - 1), uzenet: 'Előbb kell (N − 1)-gyel osztani, és csak utána gyököt vonni.' },
        {
          ertek: Math.sqrt(p.r.reduce((a, x) => a + x * x, 0) / (p.r.length - 1)),
          uzenet: 'Az eltéréseket az átlaghozamtól kell venni: σ² = Σ (r − átlag)² / (N − 1).',
        },
      ],
      levezetes: (_p, e) => `σ = √${sz(e('var'), 6)} = ${sz(Math.sqrt(e('var')))} → ${pct(Math.sqrt(e('var')))}`,
    },
  ],
  diasPeldak: [
    {
      forras: '2.3 Példa (1. ea)',
      p: { r: [0.1, 0.12, 0.03, -0.09] },
      vart: { atlag: '4%', negyzetosszeg: '0,027', var: '0,009', sigma: '9,49%' },
    },
  ],
}
