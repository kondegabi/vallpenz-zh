// 2. ZH, 10. fejezet: osztalékpolitika. Az árfolyamos feladat a 10.1 és 10.3 képletét köti össze (a diasoron
// nincs rá számpélda); a részvényműveletes a 17. és a 22. dia példáinak mintájára készült.

import { exDividendAr, felaprozottAr, fenntarthatoNovekedes, kibocsatandoDarab, kifizetesiRata, osztalekModellAr, tulajdoniHanyadVisszavasarlasUtan } from '../../calc/osztalek.ts'
import { pct, sz } from '../formaz.ts'
import type { Rng, Sablon, TipikusHiba } from '../tipusok.ts'
import { keretbe } from './kozos.ts'

const CEGEK = [
  'a Balaton Pharma Nyrt.',
  'a Somló Borászat Nyrt.',
  'a Gemenc Energia Nyrt.',
  'a Pilis Informatika Nyrt.',
  'az Őrség Bútor Nyrt.',
  'a Zemplén Ásvány Nyrt.',
  'a Bükk Textil Nyrt.',
  'a Tisza Közlekedés Nyrt.',
] as const

function bevezetok(ceg: string): [string, string, string] {
  return [`Egy elemző ${ceg} osztalékpolitikáját vizsgálja.`, `Egy befektető ${ceg} részvényét elemzi.`, `Az igazgatóság ${ceg} kifizetési döntését készíti elő.`]
}

function zavaroAdat(r: Rng): string {
  return r.valaszt([
    `A vállalat részvényeinek múlt évi hozama ${pct(r.lepeskoz(-0.1, 0.3, 0.01))} volt.`,
    `A piaci portfólió várható hozama ${pct(r.lepeskoz(0.06, 0.12, 0.005))}.`,
    `A vállalat tavaly részvényenként ${sz(r.lepeskoz(0.5, 4, 0.1))} USD osztalékot fizetett.`,
  ])
}

// ---------- 10.3 → 10.1 ----------

/** `most`: a most kifizetett osztalék adott (DIV_0 = dp × EPS_0, itt az EPS1 mező a most lezárt év EPS-e) */
type Novekedes = { ceg: string; mod: 'rata' | 'osztalek' | 'most'; ROE: number; dp: number; r: number; EPS1: number; kerdes: 'g' | 'P0' }

function g(p: Novekedes): number {
  return fenntarthatoNovekedes(p.ROE, p.dp)
}

function div0(p: Novekedes): number {
  return p.dp * p.EPS1
}

function div1(p: Novekedes): number {
  return p.mod === 'most' ? div0(p) * (1 + g(p)) : p.dp * p.EPS1
}

export const osztalekNovekedes: Sablon<Novekedes> = {
  id: 'osztalek-novekedes',
  csalad: 'osztalek',
  cim: 'Fenntartható növekedés és árfolyam',
  felismeresek: [{ elott: '', helyes: 'F25', zavarok: ['F26', 'F23', 'F21'] }],
  general: (r) => ({
    ceg: r.valaszt(CEGEK),
    mod: r.valaszt(['rata', 'osztalek', 'most'] as const),
    ROE: r.lepeskoz(0.08, 0.25, 0.01),
    dp: r.lepeskoz(0.2, 0.8, 0.05),
    r: r.lepeskoz(0.08, 0.16, 0.005),
    EPS1: r.lepeskoz(1, 10, 0.5),
    kerdes: r.esely(0.6) ? 'P0' : 'g',
  }),
  // a modellnek véges ára legyen, és a ROE × dp tipikus hiba is értelmes maradjon
  ervenyes: (p) => g(p) < p.r - 0.015 && p.ROE * p.dp < p.r - 0.005 && Math.abs(p.dp - 0.5) > 0.01,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const kifizetes =
      p.mod === 'rata'
        ? `A vállalat nyereségének ${pct(p.dp)}-át fizeti ki osztalékként, a többit újra befekteti.`
        : p.mod === 'most'
          ? `A vállalat most fizette ki nyereségének ${pct(p.dp)}-át, ami részvényenként ${sz(div0(p), 3)} USD osztalékot jelentett; osztalékpolitikáján nem kíván változtatni.`
          : `A jövő évben részvényenként ${sz(div1(p), 3)} USD osztalék várható, a többit a vállalat újra befekteti.`
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          `A vállalat sajáttőke-arányos nyeresége tartósan évi ${pct(p.ROE)}.`,
          kifizetes,
          p.mod === 'most' ? undefined : `A jövő évi egy részvényre jutó nyereség ${sz(p.EPS1)} USD.`,
          `A befektetők elvárt hozama ${pct(p.r)}, a vállalat csak saját tőkéből finanszíroz.`,
          v === 3 ? zavaroAdat(r) : undefined,
        ]),
      ],
      kerdesek: ['Mekkora a fenntartható növekedési ütem?', 'Mekkora a részvény értéke ma (P0)?'],
    }
  },
  zh: (p) => (p.kerdes === 'P0' ? { kulcsok: ['P0'] } : { kulcsok: ['g'], kerdesek: ['Mekkora a fenntartható növekedési ütem?'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'dp',
      formulaId: '10.2',
      latexIdx: 1,
      kerdes: 'Mekkora az osztalék-kifizetési ráta (dp)?',
      egyseg: 'tizedes',
      tures: { abs: 0.005 },
      mikor: (p) => p.mod === 'osztalek',
      ertek: (p) => kifizetesiRata(div1(p), p.EPS1),
      tipikusHibak: (p) => [{ ertek: 1 - p.dp, uzenet: 'Ez az újrabefektetési hányad (1 − dp); a kifizetési ráta DIV / EPS.' }],
      levezetes: (p) => `dp = DIV1 / EPS1 = ${sz(div1(p), 3)} / ${sz(p.EPS1)} = ${sz(p.dp)}`,
    },
    {
      tipus: 'szam',
      key: 'g',
      formulaId: '10.3',
      kerdes: 'Mekkora a fenntartható növekedési ütem (g)?',
      egyseg: '%',
      ertek: g,
      tipikusHibak: (p) => [
        { ertek: p.ROE * p.dp, uzenet: 'A kifizetett hányaddal szoroztál; a növekedéshez a visszaforgatott kell: ROE × (1 − dp).' },
        { ertek: p.ROE, uzenet: 'Ez a ROE; csak a visszaforgatott hányad növeli a vállalatot: ROE × (1 − dp).' },
        { ertek: p.r * (1 - p.dp), uzenet: 'Az elvárt hozammal szoroztál; a képletben a ROE áll.' },
        { ertek: p.ROE * (1 + p.dp), uzenet: 'A szorzó (1 − dp), nem (1 + dp).' },
      ],
      levezetes: (p) => `g = ROE × (1 − dp) = ${pct(p.ROE)} × ${sz(1 - p.dp)} = ${pct(g(p))}`,
    },
    {
      tipus: 'szam',
      key: 'DIV1',
      formulaId: '10.2',
      latexIdx: 1,
      kerdes: 'Mekkora a jövő évi osztalék (DIV1)?',
      egyseg: 'USD',
      mikor: (p) => p.mod === 'rata' || p.mod === 'most',
      ertek: div1,
      tipikusHibak: (p) =>
        p.mod === 'most'
          ? [{ ertek: div0(p), uzenet: 'Ez a most kifizetett osztalék (DIV0); a következő évi DIV1 = DIV0 × (1 + g).' }]
          : [{ ertek: (1 - p.dp) * p.EPS1, uzenet: 'Ez a visszaforgatott rész; az osztalék dp × EPS.' }],
      levezetes: (p) =>
        p.mod === 'most'
          ? `DIV1 = DIV0 × (1 + g) = ${sz(div0(p), 3)} × ${sz(1 + g(p))} = ${sz(div1(p), 3)} USD`
          : `DIV1 = dp × EPS1 = ${sz(p.dp)} × ${sz(p.EPS1)} = ${sz(div1(p), 3)} USD`,
    },
    {
      tipus: 'szam',
      key: 'P0',
      formulaId: '10.1',
      latexIdx: 1,
      kerdes: 'Mekkora a részvény értéke ma (P0)?',
      egyseg: 'USD',
      ertek: (p) => osztalekModellAr(div1(p), p.r, g(p)),
      tipikusHibak: (p) => {
        const D = div1(p)
        return [
          { ertek: osztalekModellAr(D, p.r, p.ROE * p.dp), uzenet: 'A növekedési ütemben a visszaforgatott hányad kell: g = ROE × (1 − dp).' },
          { ertek: osztalekModellAr(p.EPS1, p.r, g(p)), uzenet: 'A teljes EPS-sel számoltál; a számlálóban csak a kifizetett osztalék áll: DIV1 = dp × EPS1.' },
          { ertek: D / p.r, uzenet: 'A növekedés kimaradt: P0 = DIV1 / (r − g).' },
          { ertek: D / (p.r + g(p)), uzenet: 'A nevező r − g, nem r + g.' },
          { ertek: (D * (1 + g(p))) / (p.r - g(p)), uzenet: 'A DIV1 már a jövő évi osztalék, nem kell még egyszer (1 + g)-vel szorozni.' },
          ...(p.mod === 'most' ? [{ ertek: div0(p) / (p.r - g(p)), uzenet: 'A most kifizetett osztalékkal (DIV0) számoltál; a számlálóban DIV1 = DIV0 × (1 + g) áll.' }] : []),
        ] satisfies TipikusHiba[]
      },
      levezetes: (p) => `P0 = DIV1 / (r − g) = ${sz(div1(p), 3)} / (${sz(p.r)} − ${sz(g(p))}) = ${sz(osztalekModellAr(div1(p), p.r, g(p)), 2)} USD`,
    },
  ],
  diasPeldak: [
    // a diasoron nincs számpélda; a 7.1 4. ea-s példája (D1 = 4,24, P0 = 60, g = 6%) a 10.1 alakjával, a g = 6%
    // ROE = 12% és dp = 50% bontásban
    { forras: '10.3 Példa (szem. osztalék 1)', p: { mod: 'most', ROE: 0.15, dp: 0.8, r: 0.12, EPS1: 5, kerdes: 'P0' }, vart: { g: '3%', DIV1: '4,12', P0: '45,7778' } },
    { forras: '7.1 Példa (4. ea), a 10.1 és 10.3 alakjával', p: { mod: 'rata', ROE: 0.12, dp: 0.5, r: 4.24 / 60 + 0.06, EPS1: 8.48, kerdes: 'P0' }, vart: { g: '6%', DIV1: '4,24', P0: '60' } },
  ],
}

// ---------- 10.4 ----------

type Muvelet =
  | { ceg: string; mod: 'visszavasarlas'; N: number; NA: number; NB: number; Nv: number; P: number; k: number }
  | { ceg: string; mod: 'felaprozas'; N: number; NA: number; NB: number; Nv: number; P: number; k: number }

export const reszvenyMuveletek: Sablon<Muvelet> = {
  id: 'reszveny-muveletek',
  csalad: 'osztalek',
  cim: 'Visszavásárlás és felaprózás',
  felismeresek: [{ elott: '', helyes: 'F26', zavarok: ['F25', 'F24', 'F22'] }],
  general: (r) => {
    const N = r.valaszt([100, 200, 400, 500, 1000])
    const NA = Math.round(N * r.lepeskoz(0.2, 0.6, 0.05))
    const NB = Math.round(N * r.lepeskoz(0.1, 0.35, 0.05))
    return {
      ceg: r.valaszt(CEGEK),
      mod: r.esely(0.55) ? 'visszavasarlas' : 'felaprozas',
      N,
      NA,
      NB,
      Nv: Math.max(1, Math.round(NB * r.lepeskoz(0.2, 0.8, 0.1))),
      P: r.lepeskoz(40, 600, 0.5),
      k: r.valaszt([2, 3, 4, 5, 10, 20]),
    }
  },
  ervenyes: (p) => p.NA + p.NB < p.N && p.Nv <= p.NB,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const NC = p.N - p.NA - p.NB
    const mondatok =
      p.mod === 'visszavasarlas'
        ? [
            `A vállalatnak ${p.N} részvénye van forgalomban: A ${p.NA}, B ${p.NB}, C ${NC} darabot birtokol.`,
            `A vállalat B-től ${p.Nv} részvényt vásárol vissza, A és C megtartja a részvényeit.`,
          ]
        : [`A vállalat részvényének árfolyama ${sz(p.P, 2)} USD.`, `A közgyűlés ${p.k}:1 arányú részvényfelaprózást (split) hagy jóvá.`]
    return {
      valtozat: `k${v}`,
      bekezdesek: [keretbe(v, bevezetok(p.ceg), [...mondatok, v === 3 ? zavaroAdat(r) : undefined])],
      kerdesek: [p.mod === 'visszavasarlas' ? 'Mekkora lesz A tulajdoni hányada a visszavásárlás után?' : 'Mekkora lesz az árfolyam a felaprózás után?'],
    }
  },
  zh: (p) => ({ kulcsok: [p.mod === 'visszavasarlas' ? 'wA' : 'Puj'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'maradek',
      formulaId: '10.4',
      kerdes: 'Hány részvény marad forgalomban?',
      egyseg: 'tizedes',
      mikor: (p) => p.mod === 'visszavasarlas',
      ertek: (p) => p.N - p.Nv,
      tipikusHibak: (p) => [{ ertek: p.N, uzenet: 'A visszavásárolt részvényeket le kell vonni: N − Nv.' }],
      levezetes: (p) => `${p.N} − ${p.Nv} = ${p.N - p.Nv}`,
    },
    {
      tipus: 'szam',
      key: 'wA',
      formulaId: '10.4',
      kerdes: 'Mekkora lesz A tulajdoni hányada?',
      egyseg: '%',
      mikor: (p) => p.mod === 'visszavasarlas',
      ertek: (p) => tulajdoniHanyadVisszavasarlasUtan(p.NA, p.N, p.Nv),
      tipikusHibak: (p) => [
        { ertek: p.NA / p.N, uzenet: 'Ez a visszavásárlás előtti hányad; a visszavásárolt részvényeket le kell vonni a darabszámból.' },
        { ertek: p.NA / (p.N + p.Nv), uzenet: 'A visszavásárolt részvények kikerülnek a forgalomból: N − Nv, nem N + Nv.' },
        { ertek: (p.NB - p.Nv) / (p.N - p.Nv), uzenet: 'Ez B hányada; a kérdés A-é.' },
        { ertek: (p.NA - p.Nv) / (p.N - p.Nv), uzenet: 'A visszavásárolt részvények B-től jönnek, A darabszáma nem változik: NA / (N − Nv).' },
        { ertek: p.NA / (p.N - p.NB), uzenet: 'Csak a visszavásárolt részvényeket kell levonni (Nv), nem B összes részvényét.' },
        { ertek: (p.NA + p.Nv) / p.N, uzenet: 'A visszavásárolt részvények nem A-hoz kerülnek, hanem kivonják őket a forgalomból: NA / (N − Nv).' },
      ],
      levezetes: (p) => `wA = ${p.NA} / (${p.N} − ${p.Nv}) = ${pct(tulajdoniHanyadVisszavasarlasUtan(p.NA, p.N, p.Nv))}`,
    },
    {
      tipus: 'szam',
      key: 'Puj',
      formulaId: '10.4',
      latexIdx: 1,
      kerdes: 'Mekkora lesz az árfolyam a felaprózás után?',
      egyseg: 'USD',
      mikor: (p) => p.mod === 'felaprozas',
      ertek: (p) => felaprozottAr(p.P, p.k),
      tipikusHibak: (p) => [
        { ertek: p.P * p.k, uzenet: 'Felaprózásnál a részvények száma nő, az árfolyam a k-ad részére csökken: P / k.' },
        { ertek: p.P, uzenet: 'A felaprózás után ugyanaz a vagyon több részvényen oszlik meg, ezért az árfolyam P / k.' },
        { ertek: p.P / (p.k + 1), uzenet: 'k:1 arányban egy régi részvényből k új lesz: P / k.' },
        { ertek: p.P - p.P / p.k, uzenet: 'Az új árfolyam P / k, nem az árfolyam csökkenése.' },
      ],
      levezetes: (p) => `P / k = ${sz(p.P, 2)} / ${p.k} = ${sz(felaprozottAr(p.P, p.k), 2)} USD`,
    },
  ],
  diasPeldak: [
    { forras: '10.4 Példa (17. dia)', p: { mod: 'visszavasarlas', N: 100, NA: 50, NB: 30, Nv: 10 }, vart: { maradek: '90', wA: '55,6%' } },
    { forras: '10.4 Példa (22. dia)', p: { mod: 'felaprozas', P: 175.56, k: 3 }, vart: { Puj: '58,52' } },
  ],
}

// ---------- 10.1 szakaszonként (szem. osztalék 2) ----------

type Szakaszos = { ceg: string; EPS0: number; ROE: number; k: number; dp: number; r: number }

function epsK(p: Szakaszos): number {
  return p.EPS0 * Math.pow(1 + p.ROE, p.k)
}

function g2(p: Szakaszos): number {
  return fenntarthatoNovekedes(p.ROE, p.dp)
}

function pKm1(p: Szakaszos): number {
  return osztalekModellAr(p.dp * epsK(p), p.r, g2(p))
}

export const osztalekSzakaszos: Sablon<Szakaszos> = {
  id: 'osztalek-szakaszos',
  csalad: 'osztalek',
  cim: 'Későbbi osztalékkezdés: árfolyam szakaszonként',
  felismeresek: [{ elott: '', helyes: 'F27', zavarok: ['F25', 'F28', 'F23'] }],
  general: (r) => ({
    ceg: r.valaszt(CEGEK),
    EPS0: r.lepeskoz(20, 200, 10),
    ROE: r.lepeskoz(0.06, 0.15, 0.01),
    k: r.egesz(2, 5),
    dp: r.lepeskoz(0.5, 0.9, 0.1),
    r: r.lepeskoz(0.06, 0.14, 0.005),
  }),
  ervenyes: (p) => g2(p) < p.r - 0.01 && p.ROE * p.dp < p.r - 0.005,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          `A vállalat sajáttőke-arányos nyeresége tartósan évi ${pct(p.ROE)}.`,
          `Az egy részvényre jutó nyeresége az éppen lezárt évben ${sz(p.EPS0)} USD volt.`,
          `Idén és a következő ${p.k - 1} évben nem fizet osztalékot, minden nyereséget visszaforgat.`,
          `${p.k} év múlva visszatér az osztalékfizetéshez, és onnan minden évben a nyereség ${pct(p.dp)}-át fizeti ki.`,
          `A részvény kockázatának megfelelő elvárt hozam évi ${pct(p.r)}.`,
          v === 3 ? zavaroAdat(r) : undefined,
        ]),
      ],
      kerdesek: ['Mekkora a részvény értéke ma (P0)?'],
    }
  },
  zh: () => ({ kulcsok: ['P0'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'EPSk',
      formulaId: '10.3',
      kerdes: 'Mekkora az EPS az első osztalék évében (EPSk)?',
      egyseg: 'USD',
      ertek: epsK,
      tipikusHibak: (p) => [
        { ertek: p.EPS0 * Math.pow(1 + p.ROE, p.k - 1), uzenet: 'Eggyel kevesebb évvel növelted: a most lezárt év nyereségét is visszaforgatják, k év növekedés kell.' },
        { ertek: p.EPS0 * (1 + p.ROE * p.k), uzenet: 'A növekedés kamatos: EPS0 × (1 + ROE)^k.' },
        { ertek: p.EPS0, uzenet: 'Teljes visszaforgatásnál az EPS évente ROE-val nő (g = ROE × (1 − 0)).' },
      ],
      levezetes: (p) => `EPS${p.k} = ${sz(p.EPS0)} × ${sz(1 + p.ROE)}^${p.k} = ${sz(epsK(p), 2)} USD`,
    },
    {
      tipus: 'szam',
      key: 'DIVk',
      formulaId: '10.2',
      latexIdx: 1,
      kerdes: 'Mekkora az első osztalék (DIVk)?',
      egyseg: 'USD',
      ertek: (p) => p.dp * epsK(p),
      tipikusHibak: (p) => [{ ertek: (1 - p.dp) * epsK(p), uzenet: 'Ez a visszaforgatott rész; az osztalék dp × EPS.' }],
      levezetes: (p) => `DIV${p.k} = ${sz(p.dp)} × ${sz(epsK(p), 2)} = ${sz(p.dp * epsK(p), 2)} USD`,
    },
    {
      tipus: 'szam',
      key: 'g',
      formulaId: '10.3',
      kerdes: 'Mekkora a növekedési ütem az osztalékfizetés kezdete után?',
      egyseg: '%',
      ertek: g2,
      tipikusHibak: (p) => [
        { ertek: p.ROE, uzenet: 'Ez a teljes visszaforgatás időszakának növekedése; utána g = ROE × (1 − dp).' },
        { ertek: p.ROE * p.dp, uzenet: 'A visszaforgatott hányaddal kell szorozni: ROE × (1 − dp).' },
      ],
      levezetes: (p) => `g = ${pct(p.ROE)} × ${sz(1 - p.dp)} = ${pct(g2(p))}`,
    },
    {
      tipus: 'szam',
      key: 'Pkm1',
      formulaId: '10.1',
      latexIdx: 1,
      kerdes: 'Mekkora az árfolyam egy évvel az első osztalék előtt?',
      egyseg: 'USD',
      ertek: pKm1,
      levezetes: (p) => `P${p.k - 1} = DIV${p.k} / (r − g) = ${sz(p.dp * epsK(p), 2)} / (${sz(p.r)} − ${sz(g2(p))}) = ${sz(pKm1(p), 2)} USD`,
    },
    {
      tipus: 'szam',
      key: 'P0',
      formulaId: '10.1',
      kerdes: 'Mekkora a részvény értéke ma (P0)?',
      egyseg: 'USD',
      ertek: (p) => pKm1(p) / Math.pow(1 + p.r, p.k - 1),
      tipikusHibak: (p) => [
        { ertek: pKm1(p) / Math.pow(1 + p.r, p.k), uzenet: 'Egy évvel többet diszkontáltál: a DIVk / (r − g) már a k − 1. év végi árat adja.' },
        { ertek: pKm1(p), uzenet: 'Ez a k − 1. év végi ár; mára még diszkontálni kell.' },
        { ertek: osztalekModellAr(p.dp * p.EPS0, p.r, g2(p)) / Math.pow(1 + p.r, p.k - 1), uzenet: 'Az első osztalékhoz a megnőtt EPS kell: a visszaforgatás évei alatt az EPS ROE-val nő.' },
        { ertek: osztalekModellAr(p.dp * epsK(p), p.r, p.ROE * p.dp) / Math.pow(1 + p.r, p.k - 1), uzenet: 'A növekedési ütemben a visszaforgatott hányad kell: g = ROE × (1 − dp).' },
      ],
      levezetes: (p) => `P0 = ${sz(pKm1(p), 2)} / ${sz(1 + p.r)}^${p.k - 1} = ${sz(pKm1(p) / Math.pow(1 + p.r, p.k - 1), 2)} USD`,
    },
  ],
  diasPeldak: [
    { forras: '10.1 Példa (szem. osztalék 2)', p: { EPS0: 100, ROE: 0.1, k: 4, dp: 0.8, r: 0.08 }, vart: { EPSk: '146,41', DIVk: '117,128', g: '2%', Pkm1: '1952,1333', P0: '1549,6664' } },
  ],
}

// ---------- 10.5 (szem. osztalék 3–6) ----------

/** osztalekReszveny: P, DIV, k (és reszvenyosztalek); kibocsatas: N, P, DIV, I, B. A nem használt mezők 0 / false. */
type TokeletesPiac = { ceg: string; mod: 'osztalekReszveny' | 'kibocsatas'; P: number; DIV: number; k: number; reszvenyosztalek: boolean; N: number; I: number; B: number }

function igeny(p: TokeletesPiac): number {
  return p.N * p.DIV + p.I + p.B
}

export const tokeletesPiaciMuveletek: Sablon<TokeletesPiac> = {
  id: 'tokeletes-piaci-muveletek',
  csalad: 'osztalek',
  cim: 'Osztalék és tőkeemelés tökéletes piacon',
  felismeresek: [{ elott: '', helyes: 'F28', zavarok: ['F26', 'F27', 'F25'] }],
  general: (r) => {
    const ceg = r.valaszt(CEGEK)
    if (r.esely(0.45)) {
      const reszvenyosztalek = r.esely(0.5)
      const P = r.lepeskoz(200, 4000, 50)
      return { ceg, mod: 'osztalekReszveny', P, DIV: Math.round((P * r.lepeskoz(0.05, 0.25, 0.01)) / 10) * 10, k: reszvenyosztalek ? r.valaszt([2, 3]) : r.valaszt([2, 4, 5, 10]), reszvenyosztalek, N: 0, I: 0, B: 0 }
    }
    // a kibocsátott darabszám egész legyen: előbb a darabszám, ebből a beruházás
    const N = r.lepeskoz(20000, 200000, 10000)
    const Pex = r.lepeskoz(500, 4000, 100)
    const DIV = r.lepeskoz(50, 400, 50)
    const B = r.esely(0.5) ? r.lepeskoz(5, 60, 5) * 1e6 : 0
    const n = r.lepeskoz(5000, 80000, 1000)
    return { ceg, mod: 'kibocsatas', N, P: Pex + DIV, DIV, B, I: n * Pex - N * DIV - B, k: 1, reszvenyosztalek: false }
  },
  ervenyes: (p) => {
    if (p.mod === 'osztalekReszveny') return p.DIV > 0 && p.DIV < p.P / 2
    const ig = igeny(p)
    return p.I > 0.05 * ig && p.I < 0.6 * ig && p.I % 100000 === 0
  },
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const mondatok =
      p.mod === 'osztalekReszveny'
        ? [
            `A vállalat tökéletes piacon működik, részvényeinek árfolyama ${sz(p.P)} USD.`,
            `A vezetés bejelenti, hogy részvényenként ${sz(p.DIV)} USD osztalékot fizet.`,
            p.reszvenyosztalek
              ? `Az osztalékfizetés után minden részvény mellé ${p.k - 1} ingyenes osztalékrészvény jár.`
              : `Az osztalékfizetés után a részvényeket 1:${p.k} arányban felaprózzák.`,
          ]
        : [
            `A vállalat tökéletes piacon működik, ${sz(p.N)} részvénye van, az árfolyam a jelen helyzetben ${sz(p.P)} USD.`,
            `A részvényesek részvényenként ${sz(p.DIV)} USD osztalékot várnak, emellett egy ${sz(p.I / 1e6, 1)} millió USD-s beruházást is végre kell hajtani.`,
            ...(p.B > 0 ? [`A vállalatnak ${sz(p.B / 1e6)} millió USD hitelt most egy összegben kell törlesztenie.`] : []),
            `Pénzeszköze nincs, ezért mindezt új részvények kibocsátásából fedezi: előbb a kibocsátás történik, utána ${p.B > 0 ? 'a törlesztés és ' : ''}az osztalékfizetés; az új részvényekre osztalék nem jár.`,
          ]
    return {
      valtozat: `k${v}`,
      bekezdesek: [keretbe(v, bevezetok(p.ceg), [...mondatok, v === 3 ? zavaroAdat(r) : undefined])],
      kerdesek:
        p.mod === 'osztalekReszveny'
          ? ['Mekkora lesz az árfolyam az osztalékfizetés után?', `Mekkora lesz az árfolyam a ${p.reszvenyosztalek ? 'részvényosztalék' : 'felaprózás'} után?`]
          : ['Mekkora a forrásigény?', 'Milyen áron kell az új részvényeket kibocsátani?', 'Hány darab részvényt kell kibocsátani?'],
    }
  },
  zh: (p) =>
    p.mod === 'osztalekReszveny'
      ? { kulcsok: ['Pveg'], kerdesek: [`Mekkora lesz az árfolyam az osztalékfizetés és a ${p.reszvenyosztalek ? 'részvényosztalék' : 'felaprózás'} után?`] }
      : { kulcsok: ['n'], kerdesek: ['Hány darab részvényt kell kibocsátani?'] },
  lepesek: [
    {
      tipus: 'szam',
      key: 'Pex',
      formulaId: '10.5',
      kerdes: 'Mekkora az árfolyam az osztalékfizetés után?',
      egyseg: 'USD',
      mikor: (p) => p.mod === 'osztalekReszveny',
      ertek: (p) => exDividendAr(p.P, p.DIV),
      tipikusHibak: (p) => [{ ertek: p.P, uzenet: 'Az osztalék kifizetésekor az árfolyam az osztalékkal esik: P − DIV.' }],
      levezetes: (p) => `${sz(p.P)} − ${sz(p.DIV)} = ${sz(exDividendAr(p.P, p.DIV))} USD`,
    },
    {
      tipus: 'szam',
      key: 'Pveg',
      formulaId: '10.4',
      latexIdx: 1,
      kerdes: 'Mekkora a végső árfolyam?',
      egyseg: 'USD',
      mikor: (p) => p.mod === 'osztalekReszveny',
      ertek: (p) => felaprozottAr(exDividendAr(p.P, p.DIV), p.k),
      tipikusHibak: (p) => {
        if (p.mod !== 'osztalekReszveny') return []
        return [
          { ertek: p.P / p.k, uzenet: 'Az osztalék kifizetése kimaradt: előbb P − DIV, utána osztunk.' },
          { ertek: exDividendAr(p.P, p.DIV), uzenet: `Ez az osztalék utáni ár; a ${p.reszvenyosztalek ? 'részvényosztalék' : 'felaprózás'} után a darabszám ${p.k}-szeres, az ár a ${p.k}-ad része.` },
          { ertek: p.P / p.k - p.DIV, uzenet: 'Az osztalék a régi részvényekre jár: előbb vonjuk le, utána osztunk.' },
          ...(p.reszvenyosztalek ? [{ ertek: exDividendAr(p.P, p.DIV) / (p.k - 1), uzenet: `Részvényenként ${p.k - 1} új részvény jár, így egy régiből ${p.k} lesz: (P − DIV) / ${p.k}.` }] : []),
        ]
      },
      levezetes: (p) => `(${sz(p.P)} − ${sz(p.DIV)}) / ${p.k} = ${sz(felaprozottAr(exDividendAr(p.P, p.DIV), p.k), 2)} USD`,
    },
    {
      tipus: 'szam',
      key: 'igeny',
      formulaId: '10.5',
      latexIdx: 1,
      kerdes: 'Mekkora a forrásigény?',
      egyseg: 'USD',
      mikor: (p) => p.mod === 'kibocsatas',
      ertek: (p) => (p.mod === 'kibocsatas' ? igeny(p) : 0),
      tipikusHibak: (p) => (p.mod === 'kibocsatas' ? [{ ertek: p.I + p.B, uzenet: 'Az osztalék is a kibocsátásból jön: N × DIV is kell.' }] : []),
      levezetes: (p) => (p.mod === 'kibocsatas' ? `${sz(p.N)} × ${sz(p.DIV)} + ${sz(p.I)}${p.B > 0 ? ` + ${sz(p.B)}` : ''} = ${sz(igeny(p))} USD` : ''),
    },
    {
      tipus: 'szam',
      key: 'Pkib',
      formulaId: '10.5',
      kerdes: 'Milyen áron kell kibocsátani?',
      egyseg: 'USD',
      mikor: (p) => p.mod === 'kibocsatas',
      ertek: (p) => exDividendAr(p.P, p.DIV),
      tipikusHibak: (p) => [{ ertek: p.P, uzenet: 'Az új részvényekre nem jár osztalék, ezért az osztalék utáni áron bocsátjuk ki őket: P − DIV.' }],
      levezetes: (p) => `${sz(p.P)} − ${sz(p.DIV)} = ${sz(exDividendAr(p.P, p.DIV))} USD`,
    },
    {
      tipus: 'szam',
      key: 'n',
      formulaId: '10.5',
      latexIdx: 1,
      kerdes: 'Hány darab részvényt kell kibocsátani?',
      egyseg: 'tizedes',
      tures: { abs: 0.5 },
      mikor: (p) => p.mod === 'kibocsatas',
      ertek: (p) => (p.mod === 'kibocsatas' ? kibocsatandoDarab(igeny(p), exDividendAr(p.P, p.DIV)) : 0),
      tipikusHibak: (p) => {
        if (p.mod !== 'kibocsatas') return []
        const ex = exDividendAr(p.P, p.DIV)
        return [
          { ertek: igeny(p) / p.P, uzenet: 'Az új részvényekre nem jár osztalék, ezért az osztalék utáni áron (P − DIV) bocsátjuk ki őket.' },
          { ertek: (p.I + p.B) / ex, uzenet: 'Az osztalékot is a kibocsátásból kell fedezni: N × DIV is a forrásigény része.' },
          { ertek: (p.N * p.DIV + p.B) / ex, uzenet: 'A beruházás is a forrásigény része.' },
          ...(p.B > 0 ? [{ ertek: (p.N * p.DIV + p.I) / ex, uzenet: 'A hitel törlesztése is a forrásigény része.' }] : []),
        ]
      },
      levezetes: (p) => (p.mod === 'kibocsatas' ? `${sz(igeny(p))} / ${sz(exDividendAr(p.P, p.DIV))} = ${sz(kibocsatandoDarab(igeny(p), exDividendAr(p.P, p.DIV)), 1)} db` : ''),
    },
  ],
  diasPeldak: [
    { forras: '10.5 Példa (szem. osztalék 3)', p: { mod: 'osztalekReszveny', P: 300, DIV: 60, k: 2, reszvenyosztalek: true }, vart: { Pex: '240', Pveg: '120' } },
    { forras: '10.5 Példa (szem. osztalék 4)', p: { mod: 'osztalekReszveny', P: 15000, DIV: 3000, k: 4, reszvenyosztalek: false }, vart: { Pex: '12000', Pveg: '3000' } },
    { forras: '10.5 Példa (szem. osztalék 5)', p: { mod: 'kibocsatas', N: 100000, P: 1300, DIV: 300, I: 20e6, B: 0 }, vart: { igeny: '50000000', Pkib: '1000', n: '50000' } },
    { forras: '10.5 Példa (szem. osztalék 6)', p: { mod: 'kibocsatas', N: 30000, P: 3200, DIV: 200, I: 10e6, B: 50e6 }, vart: { igeny: '66000000', Pkib: '3000', n: '22000' } },
  ],
}
