// WACC teljes lánc (7. fejezet): r_E CAPM-mel vagy osztalékmodellel (D_0 → D_1 csapdával),
// YTM megadva vagy a kötvényből számolva, adózás utáni r_D, piaci értékű súlyok, WACC.

import { capm, mrp } from '../../calc/capm.ts'
import { capmRE, d1, gordonRE, rdAdozasUtan, wacc, ytm } from '../../calc/toke.ts'
import { pct, sz } from '../formaz.ts'
import type { Getter, Sablon } from '../tipusok.ts'
import { nagyKezdet } from './kozos.ts'

const CEGEK = [
  'a Tisza Energia Nyrt.',
  'a Mátra Gépgyár Nyrt.',
  'a Kőrös Logisztika Nyrt.',
  'a Bakony Vegyipar Nyrt.',
  'a Hernád Malom Nyrt.',
  'az Ipoly Pharma Nyrt.',
  'az Alföldi Agrár Nyrt.',
  'a Zala Építő Nyrt.',
] as const

const ADOKULCSOK = [0.09, 0.15, 0.19, 0.2, 0.21, 0.25, 0.3] as const

type ReMod = 'capm' | 'gordonD0' | 'gordonD1'

/** Célzott üzenetek a 7. fejezet csapdáihoz. */
const H = {
  d0: 'Ez a tavaly fizetett osztalékkal (D0) számolt érték; előbb fel kell szorozni (1 + g)-vel: D1 = D0 × (1 + g).',
  kupon: 'A kupon kamatlábával számoltál; a hitel költsége a mai hozam, a lejáratig számított hozam (YTM).',
  nevertek: 'Ez a névértékkel számolt érték; az adósság piaci értéke a névérték × jegyzési arány.',
}

type W = {
  ceg: string
  N: number // millió db részvény
  P: number // USD
  reMod: ReMod
  rf: number
  beta: number
  MRP: number
  ErM: number
  piacMod: 'ErM' | 'MRP'
  D0: number
  D1: number
  g: number
  F: number // millió USD névérték
  q: number // jegyzési arány
  ytmMod: 'adott' | 'szamolt'
  ytm: number
  kupon: number
  n: number
  Tc: number
  zavaroKupon: boolean
  zavaroKonyv?: number
}

function aYTM(p: W, e: Getter): number {
  return p.ytmMod === 'szamolt' ? e('ytm') : p.ytm
}

function aD1(p: W, e: Getter): number {
  return p.reMod === 'gordonD0' ? e('D1') : p.D1
}

export const waccLanc: Sablon<W> = {
  id: 'wacc',
  csalad: 'wacc',
  cim: 'WACC teljes lánc',
  felismeresek: [{ elott: '', helyes: 'F13', zavarok: ['F12', 'F07', 'F14'] }],
  general: (r) => {
    const rf = r.lepeskoz(0.02, 0.06, 0.005)
    const MRP = r.lepeskoz(0.04, 0.08, 0.005)
    const P = r.lepeskoz(8, 60, 0.5)
    const g = r.lepeskoz(0.02, 0.07, 0.005)
    const hozam = r.lepeskoz(0.02, 0.07, 0.005)
    const reMod = r.valaszt(['capm', 'capm', 'gordonD0', 'gordonD0', 'gordonD1'] as const)
    const N = r.lepeskoz(0.5, 5, 0.1)
    return {
      ceg: r.valaszt(CEGEK),
      N,
      P,
      reMod,
      rf,
      beta: r.lepeskoz(0.6, 1.6, 0.05),
      MRP,
      ErM: Math.round((rf + MRP) * 1e4) / 1e4,
      piacMod: r.esely(0.4) ? 'ErM' : 'MRP',
      // osztalék 5 centre kerekítve, hogy a számok kézzel is számolhatók legyenek
      D0: Math.max(0.05, Math.round(((P * hozam) / (1 + g)) * 20) / 20),
      D1: Math.max(0.05, Math.round(P * hozam * 20) / 20),
      g,
      F: r.lepeskoz(2, 20, 0.5),
      q: r.lepeskoz(0.85, 1.08, 0.01),
      ytmMod: r.esely(0.35) ? 'szamolt' : 'adott',
      ytm: r.lepeskoz(0.04, 0.12, 0.0025),
      kupon: r.lepeskoz(0.03, 0.1, 0.005),
      n: r.egesz(5, 25),
      Tc: r.valaszt(ADOKULCSOK),
      zavaroKupon: r.esely(0.6),
      zavaroKonyv: r.esely(0.35) ? Math.round(N * P * r.lepeskoz(0.4, 1.5, 0.1) * 10) / 10 : undefined,
    }
  },
  ervenyes: (p) => {
    const rE = p.reMod === 'capm' ? capm(p.rf, p.beta, p.MRP) : gordonRE(p.reMod === 'gordonD0' ? d1(p.D0, p.g) : p.D1, p.P, p.g)
    const E = p.N * p.P
    const D = p.F * p.q
    const y = p.ytmMod === 'szamolt' ? ytm(p.q * 1000, p.kupon * 1000, p.n) : p.ytm
    // a hitel olcsóbb a saját tőkénél (különben a feladat nem valószerű)
    return rE > 0.05 && rE < 0.25 && E / (E + D) > 0.3 && E / (E + D) < 0.95 && y > 0.01 && y < rE - 0.005
  },
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const ceg = p.ceg
    // a cég neve az első mondatban szerepel, utána „a vállalat”
    const alany = (elso: boolean) => (elso ? nagyKezdet(ceg) : 'A vállalat')
    const reszveny = `${alany(v === 0)} ${sz(p.N)} millió darab törzsrészvényt bocsátott ki, ezek árfolyama ${sz(p.P)} USD.`
    const piac =
      p.piacMod === 'ErM' ? `a piaci portfólió várható hozama ${pct(p.ErM)}` : `a piaci kockázati prémium ${pct(p.MRP)}`
    const sajatToke =
      p.reMod === 'capm'
        ? `A részvények bétája ${sz(p.beta)}. A kockázatmentes hozam ${pct(p.rf)}, ${piac}.`
        : p.reMod === 'gordonD0'
          ? r.valaszt([
              `A vállalat tavaly részvényenként ${sz(p.D0, 2)} USD osztalékot fizetett, és az osztalék várhatóan tartósan évi ${pct(p.g)} ütemben nő.`,
              `Az utoljára kifizetett osztalék részvényenként ${sz(p.D0, 2)} USD volt; az osztalék növekedési üteme tartósan évi ${pct(p.g)}.`,
            ])
          : `A jövő évben részvényenként ${sz(p.D1, 2)} USD osztalék várható, az osztalék növekedési üteme tartósan évi ${pct(p.g)}.`
    const adossagAlany = v === 1 ? `${nagyKezdet(ceg)} adósságát` : 'Az adósságot'
    const adossag =
      p.ytmMod === 'adott'
        ? `${adossagAlany} ${sz(p.F)} millió USD névértékű kötvény teszi ki, amely a névérték ${sz(p.q * 100)}%-án forog; a kötvény lejáratig számított hozama ${pct(p.ytm)}.${p.zavaroKupon ? ` A kötvény kuponja ${pct(p.kupon)}.` : ''}`
        : `${adossagAlany} ${sz(p.F)} millió USD névértékű kötvény teszi ki, amely évente ${pct(p.kupon)} kupont fizet, lejáratáig ${p.n} év van hátra, és a névérték ${sz(p.q * 100)}%-án forog (1000 USD névértékű kötvényenként ${sz(p.q * 1000, 2)} USD).`
    const ado = `A társasági adó kulcsa ${pct(p.Tc)}.`
    const konyv = p.zavaroKonyv !== undefined ? `A saját tőke könyv szerinti értéke ${sz(p.zavaroKonyv)} millió USD.` : undefined
    // a 4. keretben mindig van zavaró adat
    const multHozam = v === 3 ? `A részvények múlt évi hozama ${pct(r.lepeskoz(-0.1, 0.3, 0.01))} volt.` : undefined
    const sorrend = [
      [reszveny, sajatToke, konyv, adossag, ado],
      [adossag, reszveny, konyv, sajatToke, ado],
      [ado, reszveny, sajatToke, adossag, konyv],
      [sajatToke, multHozam, ado, reszveny, adossag, konyv],
    ][v].filter((s): s is string => !!s)
    const nev = ceg.replace(/ Nyrt\.$/, '')
    const bevezeto = v === 2 ? `Egy elemző ${nev} adatait gyűjtötte össze.` : v === 3 ? `Egy hitelminősítő ${nev} pénzügyi adatait vizsgálja.` : undefined
    return {
      valtozat: `k${v}`,
      bekezdesek: bevezeto ? [bevezeto, sorrend.join(' ')] : [sorrend.join(' ')],
      kerdesek: ['Mekkora a vállalat súlyozott átlagos tőkeköltsége (WACC)?'],
    }
  },
  zh: () => ({ kulcsok: ['wacc'] }),
  // a kötvényből iterációval számolt YTM kézzel nem fér bele egy ZH-feladat idejébe
  halado: (p) => p.ytmMod === 'szamolt',
  lepesek: [
    {
      tipus: 'szam',
      key: 'mrp',
      formulaId: '7.2',
      kerdes: 'Mekkora a piaci kockázati prémium (MRP)?',
      egyseg: '%',
      mikor: (p) => p.reMod === 'capm' && p.piacMod === 'ErM',
      ertek: (p) => mrp(p.ErM, p.rf),
      levezetes: (p) => `MRP = E(rM) − rf = ${sz(p.ErM)} − ${sz(p.rf)} = ${sz(p.ErM - p.rf)} → ${pct(p.ErM - p.rf)}`,
    },
    {
      tipus: 'szam',
      key: 'rE',
      formulaId: '7.2',
      kerdes: 'Mekkora a saját tőke költsége?',
      egyseg: '%',
      mikor: (p) => p.reMod === 'capm',
      ertek: (p, e) => capmRE(p.rf, p.beta, p.piacMod === 'ErM' ? e('mrp') : p.MRP),
      tipikusHibak: (p) =>
        p.piacMod === 'ErM'
          ? [{ ertek: p.rf + p.beta * p.ErM, uzenet: 'A piac hozamával (E(rM)) számoltál a prémium helyett; az MRP = E(rM) − rf.' }]
          : [],
      levezetes: (p, e) => {
        const m = p.piacMod === 'ErM' ? e('mrp') : p.MRP
        const v = capmRE(p.rf, p.beta, m)
        return `rE = rf + β × MRP = ${sz(p.rf)} + ${sz(p.beta)} × ${sz(m)} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'D1',
      formulaId: '7.1',
      kerdes: 'Mekkora a következő évi osztalék (D1)?',
      egyseg: 'USD',
      mikor: (p) => p.reMod === 'gordonD0',
      ertek: (p) => d1(p.D0, p.g),
      tipikusHibak: (p) => [{ ertek: p.D0, uzenet: 'Ez a tavaly fizetett osztalék (D0); a következő évi D1 = D0 × (1 + g).' }],
      levezetes: (p) => `D1 = D0 × (1 + g) = ${sz(p.D0)} × ${sz(1 + p.g)} = ${sz(d1(p.D0, p.g))} USD`,
    },
    {
      tipus: 'szam',
      key: 'rE',
      formulaId: '7.1',
      kerdes: 'Mekkora a saját tőke költsége?',
      egyseg: '%',
      mikor: (p) => p.reMod !== 'capm',
      ertek: (p, e) => gordonRE(aD1(p, e), p.P, p.g),
      tipikusHibak: (p) => (p.reMod === 'gordonD0' ? [{ ertek: gordonRE(p.D0, p.P, p.g), uzenet: H.d0 }] : []),
      levezetes: (p, e) => {
        const D1 = aD1(p, e)
        const v = gordonRE(D1, p.P, p.g)
        return `rE = D1 / P0 + g = ${sz(D1)} / ${sz(p.P)} + ${sz(p.g)} = ${sz(D1 / p.P)} + ${sz(p.g)} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'ytm',
      formulaId: '7.3',
      latexIdx: 1,
      kerdes: 'Mekkora a kötvény lejáratig számított hozama (YTM)?',
      egyseg: '%',
      mikor: (p) => p.ytmMod === 'szamolt',
      ertek: (p) => ytm(p.q * 1000, p.kupon * 1000, p.n),
      levezetes: (p) => {
        const y = ytm(p.q * 1000, p.kupon * 1000, p.n)
        return `${sz(p.q * 1000, 2)} = Σ ${sz(p.kupon * 1000, 2)} / (1 + YTM)^t + 1000 / (1 + YTM)^${p.n}, t = 1…${p.n}; iterációval YTM = ${sz(y)} → ${pct(y)}`
      },
    },
    {
      tipus: 'szam',
      key: 'rDu',
      formulaId: '7.3',
      kerdes: 'Mekkora az adózás utáni hitelköltség?',
      egyseg: '%',
      ertek: (p, e) => rdAdozasUtan(aYTM(p, e), p.Tc),
      tipikusHibak: (p, e) => [
        { ertek: rdAdozasUtan(p.kupon, p.Tc), uzenet: H.kupon },
        { ertek: aYTM(p, e), uzenet: 'Ez az adózás előtti hitelköltség; szorozd meg (1 − TC)-vel.' },
      ],
      levezetes: (p, e) => {
        const y = aYTM(p, e)
        return `rD × (1 − TC) = ${sz(y)} × ${sz(1 - p.Tc)} = ${sz(rdAdozasUtan(y, p.Tc))} → ${pct(rdAdozasUtan(y, p.Tc))}`
      },
    },
    {
      tipus: 'szam',
      key: 'E',
      formulaId: '7.4',
      kerdes: 'Mekkora a saját tőke piaci értéke (E)?',
      egyseg: 'M USD',
      ertek: (p) => p.N * p.P,
      levezetes: (p) => `E = ${sz(p.N)} M db × ${sz(p.P)} USD = ${sz(p.N * p.P)} M USD`,
    },
    {
      tipus: 'szam',
      key: 'D',
      formulaId: '7.4',
      kerdes: 'Mekkora az adósság piaci értéke (D)?',
      egyseg: 'M USD',
      ertek: (p) => p.F * p.q,
      tipikusHibak: (p) => [{ ertek: p.F, uzenet: H.nevertek }],
      levezetes: (p) => `D = ${sz(p.F)} M USD × ${sz(p.q)} = ${sz(p.F * p.q)} M USD`,
    },
    {
      tipus: 'szam',
      key: 'V',
      formulaId: '7.4',
      kerdes: 'Mekkora a vállalat teljes értéke (V)?',
      egyseg: 'M USD',
      ertek: (_p, e) => e('E') + e('D'),
      tipikusHibak: (p, e) => [{ ertek: e('E') + p.F, uzenet: H.nevertek }],
      levezetes: (_p, e) => `V = E + D = ${sz(e('E'))} + ${sz(e('D'))} = ${sz(e('E') + e('D'))} M USD`,
    },
    {
      tipus: 'szam',
      key: 'wE',
      formulaId: '7.4',
      kerdes: 'Mekkora a saját tőke súlya (E/V)?',
      egyseg: 'tizedes',
      tures: { abs: 0.0005 },
      ertek: (_p, e) => e('E') / e('V'),
      tipikusHibak: (p, e) => [{ ertek: e('E') / (e('E') + p.F), uzenet: H.nevertek }],
      levezetes: (_p, e) => `E/V = ${sz(e('E'))} / ${sz(e('V'))} = ${sz(e('E') / e('V'))}`,
    },
    {
      tipus: 'szam',
      key: 'wD',
      formulaId: '7.4',
      kerdes: 'Mekkora az adósság súlya (D/V)?',
      egyseg: 'tizedes',
      tures: { abs: 0.0005 },
      ertek: (_p, e) => e('D') / e('V'),
      tipikusHibak: (p, e) => [{ ertek: p.F / (e('E') + p.F), uzenet: H.nevertek }],
      levezetes: (_p, e) => `D/V = ${sz(e('D'))} / ${sz(e('V'))} = ${sz(e('D') / e('V'))}`,
    },
    {
      tipus: 'szam',
      key: 'wacc',
      formulaId: '7.4',
      kerdes: 'Mekkora a WACC?',
      egyseg: '%',
      ertek: (p, e) => wacc(e('wE'), e('rE'), e('wD'), aYTM(p, e), p.Tc),
      tipikusHibak: (p, e) => {
        const [wE, rE, wD, rD] = [e('wE'), e('rE'), e('wD'), aYTM(p, e)]
        const E = e('E')
        const hibak = [
          { ertek: wacc(wE, rE, wD, rD, 0), uzenet: 'Az adózás előtti hitelköltséggel számoltál; a WACC-ban rD × (1 − TC) szerepel.' },
          { ertek: wacc(E / (E + p.F), rE, p.F / (E + p.F), rD, p.Tc), uzenet: H.nevertek },
          { ertek: (rE + rdAdozasUtan(rD, p.Tc)) / 2, uzenet: 'A súlyok a piaci értékek arányai, nem 50–50%: E/V és D/V.' },
          { ertek: wacc(wD, rE, wE, rD, p.Tc), uzenet: 'A súlyokat felcserélted: a saját tőke súlya E/V, az adósságé D/V.' },
          { ertek: rE, uzenet: 'Ez a saját tőke költsége; a WACC-ban az adósság (adózás utáni) költsége is szerepel, piaci értékkel súlyozva.' },
        ]
        // a kupon csak akkor tipikus hiba, ha a szöveg megadja
        if (p.zavaroKupon || p.ytmMod === 'szamolt') hibak.push({ ertek: wacc(wE, rE, wD, p.kupon, p.Tc), uzenet: H.kupon })
        if (p.zavaroKonyv !== undefined) {
          hibak.push({
            ertek: wacc(p.zavaroKonyv / (p.zavaroKonyv + e('D')), rE, e('D') / (p.zavaroKonyv + e('D')), rD, p.Tc),
            uzenet: 'A saját tőke piaci értékével kell súlyozni (részvényszám × árfolyam), nem a könyv szerinti értékével.',
          })
        }
        if (p.reMod === 'gordonD0') hibak.push({ ertek: wacc(wE, gordonRE(p.D0, p.P, p.g), wD, rD, p.Tc), uzenet: H.d0 })
        if (p.reMod === 'capm' && p.piacMod === 'ErM') {
          hibak.push({ ertek: wacc(wE, p.rf + p.beta * p.ErM, wD, rD, p.Tc), uzenet: 'A piac hozamával (E(rM)) számoltál a prémium helyett; az MRP = E(rM) − rf.' })
        }
        return hibak
      },
      levezetes: (p, e) => {
        const v = wacc(e('wE'), e('rE'), e('wD'), aYTM(p, e), p.Tc)
        return `WACC = E/V × rE + D/V × rD × (1 − TC) = ${sz(e('wE'))} × ${sz(e('rE'))} + ${sz(e('wD'))} × ${sz(e('rDu'))} = ${sz(v)} → ${pct(v)}`
      },
    },
  ],
  diasPeldak: [
    {
      forras: '7.4 Példa (5. ea), teljes lánc',
      p: { reMod: 'capm', piacMod: 'MRP', rf: 0.08, MRP: 0.07, beta: 0.74, N: 1.4, P: 20, F: 5, q: 0.93, ytmMod: 'adott', ytm: 0.11, Tc: 0.21 },
      vart: { rE: '13,18%', rDu: '8,69%', E: '28', D: '4,65', V: '32,65', wE: '0,8576', wD: '0,1424', wacc: '12,54%' },
    },
    {
      forras: '7.4 Példa (videó)',
      p: { reMod: 'capm', piacMod: 'MRP', rf: 0.04, MRP: 0.07, beta: 1.2, N: 2, P: 10, F: 6, q: 0.9, ytmMod: 'adott', ytm: 0.08, Tc: 0.2 },
      vart: { rE: '12,4%', wE: '0,7874', wacc: '11,1%' },
    },
    { forras: '7.1 Példa (4. ea)', p: { reMod: 'gordonD0', D0: 4, P: 60, g: 0.06 }, vart: { D1: '4,24', rE: '13,07%' } },
    { forras: '7.1 Példa (videó)', p: { reMod: 'gordonD0', D0: 5, P: 70, g: 0.04 }, vart: { D1: '5,2', rE: '11,43%' } },
    { forras: '7.3 Példa (5. ea)', p: { ytmMod: 'adott', ytm: 0.09, Tc: 0.21 }, vart: { rDu: '7,11%' } },
    { forras: '7.3 YTM kiszámítása (kiegészítés), 4. ea', p: { ytmMod: 'szamolt', q: 0.96, kupon: 0.07, n: 22 }, vart: { ytm: '7,37%' } },
    { forras: 'Hibák a diákon: 4. ea, 29. dia (r_f = 3%)', p: { reMod: 'capm', piacMod: 'MRP', rf: 0.03, MRP: 0.06, beta: 1.3 }, vart: { rE: '10,8%' } },
  ],
}
