// Hozamszámítás és átlagok (1. fejezet): egy időszak teljes hozama osztalékkal (1.1), illetve
// árfolyamsorból éves hozamok (1.1), számtani (1.2), mértani (1.3) és folytonos (1.4) átlag.

import { folytonosHozam, mertaniAtlag, szamtaniAtlag, teljesHozam } from '../../calc/hozam.ts'
import { pct, sz } from '../formaz.ts'
import type { Lepes, Sablon } from '../tipusok.ts'

type H = {
  tipus: 'egy' | 'sor'
  arak: number[] // P0, P1, … (USD)
  D: number // osztalék az 'egy' változatban
  kSz: boolean
  kM: boolean
  kF: boolean
  tablaval: boolean
  zavaro?: 'index' | 'beta'
  zavaroErtek: number
}

const P0_OPCIOK = [40, 50, 80, 100, 100, 120, 150, 200] as const

function evesHozamok(p: H): number[] {
  return p.arak.slice(1).map((P, i) => teljesHozam(p.arak[i], P).teljes)
}

/** A teljes időszak (diszkrét) hozama: P_T / P_0 − 1. Több tipikus hiba ebből indul. */
function idoszakHozam(p: H): number {
  return p.arak[p.arak.length - 1] / p.arak[0] - 1
}

/** Zárójel negatív szám köré: 0,1 + (−0,05). */
function z(x: number): string {
  return x < 0 ? `(${sz(x)})` : sz(x)
}

const MAX_EV = 4
const EVEK = ['az első', 'a második', 'a harmadik', 'a negyedik'] as const

const evLepesek: Lepes<H>[] = Array.from({ length: MAX_EV }, (_, k) => ({
  tipus: 'szam' as const,
  key: `r${k + 1}`,
  formulaId: '1.1',
  kerdes: `Mekkora a hozam ${EVEK[k]} évben?`,
  egyseg: '%' as const,
  mikor: (p: H) => p.tipus === 'sor' && p.arak.length - 1 > k,
  ertek: (p: H) => evesHozamok(p)[k],
  levezetes: (p: H) => {
    const [a, b] = [p.arak[k], p.arak[k + 1]]
    const v = (b - a) / a
    return `r${k + 1} = (${sz(b)} − ${sz(a)}) / ${sz(a)} = ${sz(v)} → ${pct(v)}`
  },
}))

export const atlaghozamok: Sablon<H> = {
  id: 'atlaghozamok',
  csalad: 'hozam',
  cim: 'Hozam, számtani, mértani és folytonos átlag',
  felismeresek: [{ elott: '', helyes: 'F01', zavarok: ['F02', 'F03', 'F11'] }],
  general: (r) => {
    const tipus = r.esely(0.3) ? 'egy' : 'sor'
    const P0 = r.valaszt(P0_OPCIOK)
    const evek = tipus === 'egy' ? 1 : r.egesz(2, 4)
    const arak: number[] = [P0]
    for (let t = 0; t < evek; t++) {
      const elozo = arak[t]
      // egész USD-re kerekített árfolyam, −30% és +40% közötti változással
      arak.push(Math.max(5, Math.round(elozo * (1 + r.lepeskoz(-0.3, 0.4, 0.05)))))
    }
    const kerdesek = r.valaszt([
      [true, true, false],
      [true, true, true],
      [false, true, true],
      [true, false, true],
      [true, true, true],
    ] as const)
    return {
      tipus,
      arak,
      // osztalékhozam 1–6% között, 0,5 USD-re kerekítve
      D: Math.max(0.5, Math.round(P0 * r.lepeskoz(0.01, 0.06, 0.005) * 2) / 2),
      kSz: kerdesek[0],
      kM: kerdesek[1],
      kF: kerdesek[2],
      tablaval: r.esely(0.4),
      zavaro: r.esely(0.35) ? r.valaszt(['index', 'beta'] as const) : undefined,
      zavaroErtek: r.lepeskoz(0.6, 1.6, 0.05),
    }
  },
  ervenyes: (p) => p.arak.slice(1).some((P, i) => P !== p.arak[i]),
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    // a 4. keretben mindig van zavaró adat (ha a feladatban nincs, a részvény bétája)
    const zavaroTipus = p.zavaro ?? (v === 3 ? 'beta' : undefined)
    const zavaro =
      zavaroTipus === 'index'
        ? `A piaci index ugyanebben az időszakban ${pct(Math.round((p.zavaroErtek - 0.9) * 20) / 100)} hozamot ért el.`
        : zavaroTipus === 'beta'
          ? `A részvény bétája ${sz(p.zavaroErtek)}.`
          : undefined
    const valtozat = `k${v}`
    const [P0, P1] = [sz(p.arak[0]), sz(p.arak[1])]
    if (p.tipus === 'egy') {
      const D = sz(p.D, 2)
      const mondatok = [
        [`Egy részvényt az év elején ${P0} USD-ért vásároltunk.`, `Az év során részvényenként ${D} USD osztalékot kaptunk, és az év végén ${P1} USD-ért adtuk el.`, zavaro],
        [`Egy befektető az év végén ${P1} USD-ért adta el a részvényét, amelyet az év elején ${P0} USD-ért vett.`, zavaro, `Közben részvényenként ${D} USD osztalékot kapott.`],
        [zavaro, `Egy alapkezelő egy évig tartott egy részvényt: a vételár ${P0} USD, az eladási ár ${P1} USD, a kapott osztalék részvényenként ${D} USD volt.`],
        [`Egy hallgató az egyéves befektetését értékeli.`, zavaro, `A részvény árfolyama az év elején ${P0} USD, az év végén ${P1} USD volt, és az év során ${D} USD osztalékot fizetett.`],
      ][v]
      return {
        valtozat,
        bekezdesek: [mondatok.filter(Boolean).join(' ')],
        kerdesek: ['Mekkora az osztalékhozam és az árfolyamváltozás hozama?', 'Mekkora a teljes hozam?'],
      }
    }
    const kerdesek = ['Mekkora a részvény hozama az egyes években?']
    const atlagok = [p.kSz && 'számtani', p.kM && 'mértani'].filter(Boolean)
    if (atlagok.length) kerdesek.push(`Mekkora a ${atlagok.join(' és a ')} átlaghozam?`)
    if (p.kF) kerdesek.push('Mekkora az átlagos folytonos (logaritmikus) hozam?')
    const n = p.arak.length - 1
    if (p.tablaval) {
      const bevezeto = [
        `Egy részvény árfolyamát ${n} éven át figyeltük; az év végi árfolyamokat a táblázat mutatja (a 0. év a kezdő árfolyam). Osztalékot nem fizetett.`,
        `Egy befektető ${n} éve tart egy osztalékot nem fizető részvényt. Az árfolyamokat a táblázat mutatja; a 0. év a vásárlás napja.`,
        `Egy elemző egy osztalékot nem fizető részvény ${n} éves árfolyampályáját vizsgálja (táblázat, a 0. év a kiindulás).`,
        `Egy alap ${n} évvel ezelőtt vett egy részvényt, amely azóta sem fizetett osztalékot. Az év végi árfolyamok a táblázatban (0. év: vételár).`,
      ][v]
      return {
        valtozat,
        bekezdesek: [(v === 2 ? [zavaro, bevezeto] : [bevezeto, zavaro]).filter(Boolean).join(' ')],
        tabla: { fejlec: ['Év', 'Árfolyam (USD)'], sorok: p.arak.map((P, t) => [String(t), sz(P)]) },
        kerdesek,
      }
    }
    const reszek = p.arak.slice(1).map((P, t) => `${EVEK[t]} év végén ${sz(P)} USD`)
    const felsorolas = `${reszek.slice(0, -1).join(', ')}${reszek.length > 1 ? ', végül ' : ''}${reszek[reszek.length - 1]}`
    const mondatok = [
      [`Egy osztalékot nem fizető részvény árfolyama a vizsgált időszak elején ${P0} USD volt, ${felsorolas}.`, zavaro],
      [`Egy befektető ${P0} USD-ért vett egy osztalékot nem fizető részvényt.`, `Az árfolyam ${felsorolas} volt.`, zavaro],
      [zavaro, `Egy elemző egy osztalékot nem fizető részvény ${n} éves árfolyamát vizsgálja: a kiinduló árfolyam ${P0} USD, ${felsorolas}.`],
      [`Egy alap ${n} évvel ezelőtt ${P0} USD-ért vett egy részvényt, amely azóta sem fizetett osztalékot.`, zavaro, `Az árfolyam ${felsorolas} volt.`],
    ][v]
    return { valtozat, bekezdesek: [mondatok.filter(Boolean).join(' ')], kerdesek }
  },
  // ZH: egy évnél a teljes hozam; árfolyamsornál csak az átlagok (az évenkénti hozamok részlépések), legfeljebb kettő
  zh: (p) => {
    if (p.tipus === 'egy') return { kulcsok: ['r'], kerdesek: ['Mekkora a teljes hozam?'] }
    const kulcsok = [p.kSz && 'szamtani', p.kM && 'mertani', p.kF && 'folyt'].filter((k): k is string => !!k).slice(0, 2)
    const kerdes: Record<string, string> = {
      szamtani: 'Mekkora a számtani átlaghozam?',
      mertani: 'Mekkora a mértani átlaghozam?',
      folyt: 'Mekkora az átlagos folytonos (logaritmikus) hozam?',
    }
    return { kulcsok, kerdesek: kulcsok.map((k) => kerdes[k]) }
  },
  lepesek: [
    {
      tipus: 'szam',
      key: 'osztHozam',
      formulaId: '1.1',
      kerdes: 'Mekkora az osztalékhozam?',
      egyseg: '%',
      mikor: (p) => p.tipus === 'egy',
      ertek: (p) => teljesHozam(p.arak[0], p.arak[1], p.D).osztalekHozam,
      levezetes: (p) => `D / P0 = ${sz(p.D)} / ${sz(p.arak[0])} = ${sz(p.D / p.arak[0])} → ${pct(p.D / p.arak[0])}`,
    },
    {
      tipus: 'szam',
      key: 'arfHozam',
      formulaId: '1.1',
      kerdes: 'Mekkora az árfolyamváltozás hozama?',
      egyseg: '%',
      mikor: (p) => p.tipus === 'egy',
      ertek: (p) => teljesHozam(p.arak[0], p.arak[1], p.D).arfolyamHozam,
      levezetes: (p) => {
        const v = (p.arak[1] - p.arak[0]) / p.arak[0]
        return `(P1 − P0) / P0 = (${sz(p.arak[1])} − ${sz(p.arak[0])}) / ${sz(p.arak[0])} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'r',
      formulaId: '1.1',
      kerdes: 'Mekkora a teljes hozam?',
      egyseg: '%',
      mikor: (p) => p.tipus === 'egy',
      ertek: (p) => teljesHozam(p.arak[0], p.arak[1], p.D).teljes,
      tipikusHibak: (p) => [
        { ertek: (p.arak[1] - p.arak[0]) / p.arak[0], uzenet: 'Ez csak az árfolyamváltozás hozama; az osztalékhozamot is hozzá kell adni.' },
        { ertek: p.D / p.arak[0], uzenet: 'Ez csak az osztalékhozam; az árfolyamváltozás hozamát is hozzá kell adni.' },
        { ertek: (p.arak[1] + p.D - p.arak[0]) / p.arak[1], uzenet: 'A záró árfolyammal osztottál; a hozamot a kezdő árfolyamhoz mérjük: (P1 + D) / P0 − 1.' },
        { ertek: (p.arak[1] - p.D - p.arak[0]) / p.arak[0], uzenet: 'Az osztalék a hozam része: hozzá kell adni, nem levonni.' },
        { ertek: (p.arak[1] + p.D - p.arak[0]) / (p.arak[0] - p.D), uzenet: 'Az osztalékot nem kell a kezdő árfolyamból levonni: a hozam (P1 + D) / P0 − 1.' },
        { ertek: (p.arak[1] + 2 * p.D - p.arak[0]) / p.arak[0], uzenet: 'Az osztalékot kétszer számoltad: (P1 + D) / P0 − 1 már tartalmazza az osztalékhozamot.' },
      ],
      levezetes: (p, e) => {
        const v = teljesHozam(p.arak[0], p.arak[1], p.D).teljes
        return `r = ${sz(e('osztHozam'))} + ${z(e('arfHozam'))} = ${sz(v)} → ${pct(v)}  (vagy (${sz(p.arak[1])} + ${sz(p.D)}) / ${sz(p.arak[0])} − 1)`
      },
    },
    ...evLepesek,
    {
      tipus: 'szam',
      key: 'szamtani',
      formulaId: '1.2',
      kerdes: 'Mekkora a számtani átlaghozam?',
      egyseg: '%',
      mikor: (p) => p.tipus === 'sor' && p.kSz,
      ertek: (p) => szamtaniAtlag(evesHozamok(p)),
      tipikusHibak: (p) => [
        { ertek: mertaniAtlag(evesHozamok(p)), uzenet: 'Ez a mértani átlag; a számtani a hozamok összege osztva az évek számával.' },
        { ertek: idoszakHozam(p), uzenet: 'Ez a teljes időszak hozama; a számtani átlaghoz az évenkénti hozamokat kell átlagolni.' },
        { ertek: idoszakHozam(p) / (p.arak.length - 1), uzenet: 'A teljes időszak hozamát osztottad az évek számával; a számtani átlag az évenkénti hozamok átlaga.' },
        {
          ertek: evesHozamok(p).reduce((a, b) => a + b, 0) / (p.arak.length - 2),
          uzenet: 'Az évek számával kell osztani, nem eggyel kevesebbel (az N − 1 a historikus szórásé).',
        },
      ],
      levezetes: (p) => {
        const r = evesHozamok(p)
        const v = szamtaniAtlag(r)
        return `(${r.map(z).join(' + ')}) / ${r.length} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'mertani',
      formulaId: '1.3',
      kerdes: 'Mekkora a mértani átlaghozam?',
      egyseg: '%',
      mikor: (p) => p.tipus === 'sor' && p.kM,
      ertek: (p) => mertaniAtlag(evesHozamok(p)),
      tipikusHibak: (p) => [
        { ertek: szamtaniAtlag(evesHozamok(p)), uzenet: 'Ez a számtani átlag; a mértaninál az (1 + r) szorzók szorzatából n-edik gyököt vonunk, és kivonunk egyet.' },
        { ertek: idoszakHozam(p), uzenet: 'Ez a teljes időszak hozama; ebből még n-edik gyököt kell vonni: (P_T / P_0)^(1/n) − 1.' },
        { ertek: idoszakHozam(p) / (p.arak.length - 1), uzenet: 'A teljes időszak hozamát elosztottad az évek számával; a mértani átlaghoz gyököt kell vonni, nem osztani.' },
        {
          ertek: folytonosHozam(p.arak[0], p.arak[p.arak.length - 1], p.arak.length - 1),
          uzenet: 'Ez a folytonos (logaritmikus) átlaghozam; a mértani átlag (P_T / P_0)^(1/n) − 1.',
        },
        {
          ertek: Math.pow(idoszakHozam(p) + 1, 1 / p.arak.length) - 1,
          uzenet: 'Az évek (hozamok) számával kell gyököt vonni, nem az árfolyamokéval: n = ' + (p.arak.length - 1) + '.',
        },
      ],
      levezetes: (p) => {
        const r = evesHozamok(p)
        const v = mertaniAtlag(r)
        return `(${r.map((x) => sz(1 + x)).join(' × ')})^(1/${r.length}) − 1 = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'folyt',
      formulaId: '1.4',
      kerdes: 'Mekkora az átlagos folytonos hozam?',
      egyseg: '%',
      mikor: (p) => p.tipus === 'sor' && p.kF,
      ertek: (p) => folytonosHozam(p.arak[0], p.arak[p.arak.length - 1], p.arak.length - 1),
      tipikusHibak: (p) => [
        { ertek: mertaniAtlag(evesHozamok(p)), uzenet: 'Ez a mértani átlag; a folytonos hozam (1/T) × ln(PT / P0).' },
        { ertek: Math.log(p.arak[p.arak.length - 1] / p.arak[0]), uzenet: 'Ez a teljes időszak folytonos hozama; el kell osztani az évek számával.' },
        { ertek: szamtaniAtlag(evesHozamok(p)), uzenet: 'Ez a diszkrét hozamok számtani átlaga; a folytonos hozam (1/T) × ln(P_T / P_0).' },
        {
          ertek: Math.log10(p.arak[p.arak.length - 1] / p.arak[0]) / (p.arak.length - 1),
          uzenet: 'Tízes alapú logaritmussal számoltál; a folytonos hozamhoz természetes logaritmus (ln) kell.',
        },
        {
          ertek: Math.log(p.arak[p.arak.length - 1] / p.arak[0]) / p.arak.length,
          uzenet: 'Az évek számával kell osztani, nem az árfolyamokéval: T = ' + (p.arak.length - 1) + '.',
        },
        {
          ertek: Math.log(p.arak[0] / p.arak[p.arak.length - 1]) / (p.arak.length - 1),
          uzenet: 'Fordítva vetted a hányadost: a záró árfolyamot osztjuk a kezdővel, ln(P_T / P_0).',
        },
      ],
      levezetes: (p) => {
        const T = p.arak.length - 1
        const PT = p.arak[T]
        const v = folytonosHozam(p.arak[0], PT, T)
        return `(1/${T}) × ln(${sz(PT)} / ${sz(p.arak[0])}) = ${sz(v)} → ${pct(v)}`
      },
    },
  ],
  diasPeldak: [
    { forras: '1.1 Példa (1. ea)', p: { tipus: 'egy', arak: [50, 53], D: 2 }, vart: { osztHozam: '4%', arfHozam: '6%', r: '10%' } },
    {
      forras: '1.3 Példa (1. ea)',
      p: { tipus: 'sor', arak: [100, 200, 100], kSz: true, kM: true },
      vart: { r1: '100%', r2: '−50%', szamtani: '25%', mertani: '0%' },
    },
    {
      forras: '1.4 Példa (2. ea) #1',
      p: { tipus: 'sor', arak: [100, 110, 105], kSz: true, kM: true, kF: true },
      vart: { szamtani: '2,73%', mertani: '2,47%', folyt: '2,44%' },
    },
    {
      forras: '1.4 Példa (2. ea) #2',
      p: { tipus: 'sor', arak: [100, 50, 75, 37.5, 56.25], kSz: true, kM: true, kF: true },
      vart: { szamtani: '0%', mertani: '−13,4%', folyt: '−14,4%' },
    },
  ],
}
