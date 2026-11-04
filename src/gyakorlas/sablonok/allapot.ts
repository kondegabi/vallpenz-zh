// Állapotos kockázat-hozam (2–3. fejezet): B1 egy részvény, B2 két részvény (cov, k),
// B3 kételemű portfólió megadott σ-val és cov/k-val, B4 a teljes lánc.

import { kockazatiPremium, variancia, varhatoHozam } from '../../calc/kockazat.ts'
import { korrelacio, kovariancia, portfolioHozam, portfolioVarianciaCov, portfolioVarianciaKorr } from '../../calc/portfolio.ts'
import { pct, sz } from '../formaz.ts'
import type { FeladatSzoveg, Getter, Lepes, Rng, Sablon } from '../tipusok.ts'
import { betuNevelovel, nagyKezdet, RESZVENY_BETUK } from './kozos.ts'

const VALOSZINUSEGEK = [
  [0.5, 0.5],
  [0.2, 0.8],
  [0.3, 0.7],
  [0.4, 0.6],
  [0.25, 0.75],
  [0.25, 0.5, 0.25],
  [0.2, 0.5, 0.3],
  [0.3, 0.4, 0.3],
  [0.2, 0.6, 0.2],
] as const

const SULYOK = [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8] as const

const VARIANCIA_TURES = { abs: 0.00005, rel: 0.01 }

/** Célzott üzenetek a tipikus hibás utakra. */
const H = {
  egyszeruAtlag: 'Ez a hozamok egyszerű átlaga; a valószínűségekkel kell súlyozni.',
  nMinusz1: 'Állapotoknál a valószínűségekkel súlyozunk; az N − 1-gyel (vagy N-nel) osztás a múltbeli hozamsoré.',
  kVariancia: 'A kovarianciát a két szórás szorzatával kell osztani, nem a varianciákéval.',
  kereszt2: 'A keresztszorzat kétszer szerepel: 2 × a1 × a2 × cov.',
  sulyNegyzet: 'A súlyok négyzetre emelve szerepelnek (a keresztszorzatban viszont nem).',
  szorasAtlag: 'Ez a szórások súlyozott átlaga; a portfólió szórása a variancia gyöke, és a diverzifikáció miatt általában ennél kisebb.',
  gyokNelkul: 'Ez a variancia; a szórás ennek négyzetgyöke.',
  nemAtlagtol: 'Az eltéréseket a várható hozamtól kell venni: σ² = Σ p × (r − E(r))².',
  kovNemOsztva: 'A kovarianciát még el kell osztani a két szórás szorzatával.',
  kOsszeg: 'A két szórás szorzatával kell osztani, nem az összegükkel.',
  kMintaSzoras: 'A szórásokat itt is a valószínűségekkel súlyozva kell számolni, nem N − 1-gyel.',
  keresztKimaradt: 'A keresztszorzat (2 × a1 × a2 × cov) kimaradt; a két hozam együttmozgása is számít.',
}

/** Σ p × r²: az átlagtól vett eltérés nélkül számolt „variancia”. */
function elteresNelkul(p: readonly number[], r: readonly number[]): number {
  return p.reduce((a, pi, i) => a + pi * r[i] * r[i], 0)
}

/** Állapotok helyett „múltbeli” képlettel számolt variancia (N − 1-gyel és N-nel). */
function nemSulyozottVarianciak(r: readonly number[]): number[] {
  const atlag = r.reduce((a, b) => a + b, 0) / r.length
  const ossz = r.reduce((a, x) => a + (x - atlag) ** 2, 0)
  return [ossz / (r.length - 1), ossz / r.length]
}

function egyszeruAtlag(r: readonly number[]): number {
  return r.reduce((a, b) => a + b, 0) / r.length
}

function allapotNevek(n: number): string[] {
  return n === 2 ? ['recesszió', 'fellendülés'] : ['recesszió', 'normál', 'fellendülés']
}

/** Állapotonkénti hozamok; prociklikusnál recesszióban a legkisebb, fellendülésben a legnagyobb. */
function hozamok(r: Rng, n: number, prociklikus = true): number[] {
  for (;;) {
    const h = Array.from({ length: n }, () => r.egesz(-20, 40) / 100)
    if (new Set(h).size > 1) return prociklikus ? h.sort((a, b) => a - b) : h
  }
}

/** Két részvénynél inkább három állapot: két állapotnál a korreláció mindig ±1. */
function ketReszvenyValoszinusegek(r: Rng): readonly number[] {
  const harmas = VALOSZINUSEGEK.filter((v) => v.length === 3)
  return r.esely(0.7) ? r.valaszt(harmas) : r.valaszt(VALOSZINUSEGEK)
}

/** Zárójel negatív szám köré a levezetésben: 0,5 × (−0,2). */
function z(x: number, tizedes = 4): string {
  return x < 0 ? `(${sz(x, tizedes)})` : sz(x, tizedes)
}

function eLevezetes(p: readonly number[], r: readonly number[], nev = 'E(r)'): string {
  const v = varhatoHozam([...p], [...r])
  return `${nev} = ${p.map((pi, i) => `${sz(pi)} × ${z(r[i])}`).join(' + ')} = ${sz(v)} → ${pct(v)}`
}

function varLevezetes(p: readonly number[], r: readonly number[], E: number): string {
  const v = variancia([...p], [...r])
  return `σ² = ${p.map((pi, i) => `${sz(pi)} × (${sz(r[i])} − ${z(E)})²`).join(' + ')} = ${sz(v, 6)}`
}

function szorasLevezetes(v: number, nev = 'σ'): string {
  return `${nev} = √${sz(v, 6)} = ${sz(Math.sqrt(v))} → ${pct(Math.sqrt(v))}`
}

function tabla(p: readonly number[], oszlopok: { cim: string; r: readonly number[] }[]): FeladatSzoveg['tabla'] {
  const nevek = allapotNevek(p.length)
  return {
    fejlec: ['Állapot', 'Valószínűség', ...oszlopok.map((o) => o.cim)],
    sorok: p.map((pi, i) => [nagyKezdet(nevek[i]), pct(pi), ...oszlopok.map((o) => pct(o.r[i]))]),
  }
}

// ---- közös lépésépítők két részvényre (B2, B4) ----

type KetReszveny = { p: readonly number[]; rA: readonly number[]; rB: readonly number[] }

function ketReszvenyLepesek<P extends KetReszveny>(): Lepes<P>[] {
  const E = (r: readonly number[], p: readonly number[]) => varhatoHozam([...p], [...r])
  const szoras = (r: readonly number[], p: readonly number[]) => Math.sqrt(variancia([...p], [...r]))
  return [
    {
      tipus: 'szam',
      key: 'EA',
      formulaId: '2.1',
      kerdes: 'Mekkora az A részvény várható hozama?',
      egyseg: '%',
      ertek: (p) => E(p.rA, p.p),
      tipikusHibak: (p) => [{ ertek: egyszeruAtlag(p.rA), uzenet: H.egyszeruAtlag }],
      levezetes: (p) => eLevezetes(p.p, p.rA, 'E(rA)'),
    },
    {
      tipus: 'szam',
      key: 'EB',
      formulaId: '2.1',
      kerdes: 'Mekkora a B részvény várható hozama?',
      egyseg: '%',
      ertek: (p) => E(p.rB, p.p),
      tipikusHibak: (p) => [{ ertek: egyszeruAtlag(p.rB), uzenet: H.egyszeruAtlag }],
      levezetes: (p) => eLevezetes(p.p, p.rB, 'E(rB)'),
    },
    {
      tipus: 'szam',
      key: 'sA',
      formulaId: '2.2',
      kerdes: 'Mekkora az A részvény hozamának szórása?',
      egyseg: '%',
      ertek: (p) => szoras(p.rA, p.p),
      tipikusHibak: (p) => nemSulyozottVarianciak(p.rA).map((v) => ({ ertek: Math.sqrt(v), uzenet: H.nMinusz1 })),
      levezetes: (p, e) => `${varLevezetes(p.p, p.rA, e('EA'))}; ${szorasLevezetes(variancia([...p.p], [...p.rA]), 'σA')}`,
    },
    {
      tipus: 'szam',
      key: 'sB',
      formulaId: '2.2',
      kerdes: 'Mekkora a B részvény hozamának szórása?',
      egyseg: '%',
      ertek: (p) => szoras(p.rB, p.p),
      tipikusHibak: (p) => nemSulyozottVarianciak(p.rB).map((v) => ({ ertek: Math.sqrt(v), uzenet: H.nMinusz1 })),
      levezetes: (p, e) => `${varLevezetes(p.p, p.rB, e('EB'))}; ${szorasLevezetes(variancia([...p.p], [...p.rB]), 'σB')}`,
    },
    {
      tipus: 'szam',
      key: 'cov',
      formulaId: '3.2',
      kerdes: 'Mekkora a két hozam kovarianciája?',
      egyseg: 'tizedes',
      tures: VARIANCIA_TURES,
      ertek: (p) => kovariancia([...p.p], [...p.rA], [...p.rB]),
      levezetes: (p, e) => {
        const tagok = p.p.map((pi, i) => `${sz(pi)} × ${z(p.rA[i] - e('EA'))} × ${z(p.rB[i] - e('EB'))}`)
        return `cov = ${tagok.join(' + ')} = ${sz(e('cov'), 6)}`
      },
    },
    {
      tipus: 'szam',
      key: 'k',
      formulaId: '3.3',
      kerdes: 'Mekkora a két hozam korrelációja?',
      egyseg: 'tizedes',
      ertek: (_p, e) => korrelacio(e('cov'), e('sA'), e('sB')),
      tipikusHibak: (p, e) => [
        { ertek: e('cov') / (e('sA') ** 2 * e('sB') ** 2), uzenet: H.kVariancia },
        { ertek: e('cov'), uzenet: H.kovNemOsztva },
        { ertek: e('cov') / (e('sA') + e('sB')), uzenet: H.kOsszeg },
        {
          ertek: e('cov') / Math.sqrt(nemSulyozottVarianciak(p.rA)[0] * nemSulyozottVarianciak(p.rB)[0]),
          uzenet: H.kMintaSzoras,
        },
        {
          ertek: e('cov') / Math.sqrt(nemSulyozottVarianciak(p.rA)[1] * nemSulyozottVarianciak(p.rB)[1]),
          uzenet: H.kMintaSzoras,
        },
        { ertek: e('cov') / e('sA') ** 2, uzenet: 'Ez a béta képlete (cov / σ²); a korrelációhoz a két szórás szorzatával kell osztani.' },
        { ertek: e('cov') / e('sB') ** 2, uzenet: 'Ez a béta képlete (cov / σ²); a korrelációhoz a két szórás szorzatával kell osztani.' },
        { ertek: e('cov') / (e('sA') ** 2 * e('sB')), uzenet: 'A két szórás szorzatával kell osztani; egyiket sem kell négyzetre emelni.' },
      ],
      levezetes: (_p, e) => `k = cov / (σA × σB) = ${sz(e('cov'), 6)} / (${sz(e('sA'))} × ${sz(e('sB'))}) = ${sz(e('k'))}`,
    },
  ]
}

// ---- közös portfóliólépések (B3, B4) ----

type PortfolioAdat = { a1: number }

function portfolioLepesek<P extends PortfolioAdat>(o: {
  EA: (p: P, e: Getter) => number
  EB: (p: P, e: Getter) => number
  sA: (p: P, e: Getter) => number
  sB: (p: P, e: Getter) => number
  cov: (p: P, e: Getter) => number
  k?: (p: P) => number
  korrelacioval?: (p: P) => boolean
}): Lepes<P>[] {
  const kForma = (p: P) => o.korrelacioval?.(p) ?? false
  return [
    {
      tipus: 'szam',
      key: 'EP',
      formulaId: '3.1',
      kerdes: 'Mekkora a portfólió várható hozama?',
      egyseg: '%',
      ertek: (p, e) => portfolioHozam([p.a1, 1 - p.a1], [o.EA(p, e), o.EB(p, e)]),
      levezetes: (p, e) => {
        const v = portfolioHozam([p.a1, 1 - p.a1], [o.EA(p, e), o.EB(p, e)])
        return `E(rP) = ${sz(p.a1)} × ${z(o.EA(p, e))} + ${sz(1 - p.a1)} × ${z(o.EB(p, e))} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'varP',
      formulaId: '3.4',
      latexIdx: 0,
      kerdes: 'Mekkora a portfólió varianciája?',
      egyseg: 'tizedes',
      tures: VARIANCIA_TURES,
      mikor: (p) => !kForma(p),
      ertek: (p, e) => portfolioVarianciaCov(p.a1, 1 - p.a1, o.sA(p, e), o.sB(p, e), o.cov(p, e)),
      tipikusHibak: (p, e) => {
        const [a1, a2, s1, s2, c] = [p.a1, 1 - p.a1, o.sA(p, e), o.sB(p, e), o.cov(p, e)]
        return [
          { ertek: a1 * a1 * s1 * s1 + a2 * a2 * s2 * s2 + a1 * a2 * c, uzenet: H.kereszt2 },
          { ertek: a1 * s1 * s1 + a2 * s2 * s2 + 2 * a1 * a2 * c, uzenet: H.sulyNegyzet },
        ]
      },
      levezetes: (p, e) => {
        const [a1, a2, s1, s2, c] = [p.a1, 1 - p.a1, o.sA(p, e), o.sB(p, e), o.cov(p, e)]
        const v = portfolioVarianciaCov(a1, a2, s1, s2, c)
        return `σ²(rP) = ${sz(a1)}² × ${sz(s1 * s1, 6)} + ${sz(a2)}² × ${sz(s2 * s2, 6)} + 2 × ${sz(a1)} × ${sz(a2)} × ${z(c, 6)} = ${sz(v, 6)}`
      },
    },
    {
      tipus: 'szam',
      key: 'varP',
      formulaId: '3.4',
      latexIdx: 1,
      kerdes: 'Mekkora a portfólió varianciája?',
      egyseg: 'tizedes',
      tures: VARIANCIA_TURES,
      mikor: (p) => kForma(p),
      ertek: (p, e) => portfolioVarianciaKorr(p.a1, 1 - p.a1, o.sA(p, e), o.sB(p, e), o.k!(p)),
      tipikusHibak: (p, e) => {
        const [a1, a2, s1, s2, k] = [p.a1, 1 - p.a1, o.sA(p, e), o.sB(p, e), o.k!(p)]
        return [
          { ertek: a1 * a1 * s1 * s1 + a2 * a2 * s2 * s2 + a1 * a2 * k * s1 * s2, uzenet: H.kereszt2 },
          { ertek: a1 * s1 * s1 + a2 * s2 * s2 + 2 * a1 * a2 * k * s1 * s2, uzenet: H.sulyNegyzet },
        ]
      },
      levezetes: (p, e) => {
        const [a1, a2, s1, s2, k] = [p.a1, 1 - p.a1, o.sA(p, e), o.sB(p, e), o.k!(p)]
        const v = portfolioVarianciaKorr(a1, a2, s1, s2, k)
        return `σ²(rP) = ${sz(a1)}² × ${sz(s1)}² + ${sz(a2)}² × ${sz(s2)}² + 2 × ${sz(a1)} × ${sz(a2)} × ${z(k)} × ${sz(s1)} × ${sz(s2)} = ${sz(v, 6)}`
      },
    },
    {
      tipus: 'szam',
      key: 'sP',
      formulaId: '3.4',
      kerdes: 'Mekkora a portfólió szórása?',
      egyseg: '%',
      ertek: (_p, e) => Math.sqrt(Math.max(0, e('varP'))),
      tipikusHibak: (p, e) => {
        const [a1, a2, s1, s2] = [p.a1, 1 - p.a1, o.sA(p, e), o.sB(p, e)]
        const c = kForma(p) ? o.k!(p) * s1 * s2 : o.cov(p, e)
        const gyok = (v: number) => Math.sqrt(Math.max(0, v))
        return [
          { ertek: a1 * s1 + a2 * s2, uzenet: H.szorasAtlag },
          { ertek: gyok(a1 * a1 * s1 * s1 + a2 * a2 * s2 * s2 + a1 * a2 * c), uzenet: H.kereszt2 },
          { ertek: gyok(a1 * s1 * s1 + a2 * s2 * s2 + 2 * a1 * a2 * c), uzenet: H.sulyNegyzet },
          { ertek: gyok(a1 * a1 * s1 * s1 + a2 * a2 * s2 * s2), uzenet: H.keresztKimaradt },
          { ertek: Math.max(0, e('varP')), uzenet: H.gyokNelkul },
        ]
      },
      levezetes: (_p, e) => szorasLevezetes(Math.max(0, e('varP')), 'σ(rP)'),
    },
  ]
}

// ---------------- B1: egy részvény ----------------

type B1 = { betu: string; p: readonly number[]; r: readonly number[]; premium: boolean; rf: number; zavaroBeta?: number }

export const allapotEgy: Sablon<B1> = {
  id: 'allapot-egy',
  csalad: 'allapot',
  cim: 'Várható hozam és szórás állapotokból',
  felismeresek: [{ elott: '', helyes: 'F03', zavarok: ['F04', 'F02', 'F05'] }],
  general: (r) => {
    const p = r.valaszt(VALOSZINUSEGEK)
    return {
      betu: r.valaszt(RESZVENY_BETUK),
      p,
      r: hozamok(r, p.length),
      premium: r.esely(0.5),
      rf: r.lepeskoz(0.02, 0.08, 0.005),
      zavaroBeta: r.esely(0.35) ? r.lepeskoz(0.5, 1.8, 0.05) : undefined,
    }
  },
  // nulla prémiumnál az előjelhibák egybeesnének a helyes válasszal
  ervenyes: (p) => !p.premium || Math.abs(varhatoHozam([...p.p], [...p.r]) - p.rf) >= 0.005,
  szoveg: (p, r) => {
    const b = betuNevelovel(p.betu)
    const v = r.egesz(0, 3)
    const n = p.p.length
    // a 4. keretben mindig van zavaró adat (a részvény bétája)
    const beta = p.zavaroBeta ?? (v === 3 ? r.lepeskoz(0.5, 1.8, 0.05) : undefined)
    const rf = p.premium ? `A kockázatmentes hozam ${pct(p.rf)}.` : undefined
    const zavaro = beta !== undefined ? `A részvény bétája ${sz(beta)}.` : undefined
    const mondatok = [
      [`${nagyKezdet(b)} részvény hozama a gazdaság állapotától függ, az alábbi táblázat szerint.`, rf, zavaro],
      [`Egy elemző a jövő évre ${n} lehetséges gazdasági állapotot vár; ${b} részvény hozamát állapotonként a táblázat mutatja.`, zavaro, rf],
      [rf, `Egy befektető ${b} részvényt mérlegeli. A jövő évi hozama a konjunktúrától függ; a táblázat az állapotokat, a valószínűségüket és a hozamot mutatja.`, zavaro],
      [`Egy alapkezelő ${n} forgatókönyvet készített ${b} részvényre (táblázat).`, zavaro, rf],
    ][v]
    return {
      valtozat: `k${v}`,
      bekezdesek: [mondatok.filter(Boolean).join(' ')],
      tabla: tabla(p.p, [{ cim: 'Hozam', r: p.r }]),
      kerdesek: ['Mekkora a részvény várható hozama és szórása?', ...(p.premium ? ['Mekkora a részvény kockázati prémiuma?'] : [])],
    }
  },
  // ZH: a várható hozam és a szórás (a prémium csak ha kérdezik)
  zh: (p) => ({ kulcsok: ['E', 'sigma', ...(p.premium ? ['prem'] : [])] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'E',
      formulaId: '2.1',
      kerdes: 'Mekkora a részvény várható hozama?',
      egyseg: '%',
      ertek: (p) => varhatoHozam([...p.p], [...p.r]),
      tipikusHibak: (p) => [{ ertek: egyszeruAtlag(p.r), uzenet: H.egyszeruAtlag }],
      levezetes: (p) => eLevezetes(p.p, p.r),
    },
    {
      tipus: 'szam',
      key: 'var',
      formulaId: '2.2',
      kerdes: 'Mekkora a hozam varianciája?',
      egyseg: 'tizedes',
      tures: VARIANCIA_TURES,
      ertek: (p) => variancia([...p.p], [...p.r]),
      tipikusHibak: (p) => nemSulyozottVarianciak(p.r).map((v) => ({ ertek: v, uzenet: H.nMinusz1 })),
      levezetes: (p, e) => varLevezetes(p.p, p.r, e('E')),
    },
    {
      tipus: 'szam',
      key: 'sigma',
      formulaId: '2.2',
      kerdes: 'Mekkora a hozam szórása?',
      egyseg: '%',
      ertek: (_p, e) => Math.sqrt(e('var')),
      tipikusHibak: (p, e) => [
        ...nemSulyozottVarianciak(p.r).map((v) => ({ ertek: Math.sqrt(v), uzenet: H.nMinusz1 })),
        { ertek: e('var'), uzenet: H.gyokNelkul },
        { ertek: Math.sqrt(elteresNelkul(p.p, p.r)), uzenet: H.nemAtlagtol },
        { ertek: p.p.reduce((a, pi, i) => a + pi * (p.r[i] - e('E')), 0), uzenet: 'Az eltéréseket négyzetre kell emelni (különben az összegük mindig 0), és a végén gyököt vonni.' },
      ],
      levezetes: (_p, e) => szorasLevezetes(e('var')),
    },
    {
      tipus: 'szam',
      key: 'prem',
      formulaId: '2.1',
      kerdes: 'Mekkora a kockázati prémium?',
      egyseg: '%',
      mikor: (p) => p.premium,
      ertek: (p, e) => kockazatiPremium(e('E'), p.rf),
      tipikusHibak: (p, e) => [
        { ertek: e('E'), uzenet: 'Ez a várható hozam; a prémiumhoz le kell vonni a kockázatmentes hozamot.' },
        { ertek: egyszeruAtlag(p.r) - p.rf, uzenet: H.egyszeruAtlag },
        { ertek: e('E') + p.rf, uzenet: 'A kockázatmentes hozamot le kell vonni, nem hozzáadni: E(r) − rf.' },
        { ertek: p.rf - e('E'), uzenet: 'Fordítva vontál ki: a prémium E(r) − rf.' },
      ],
      levezetes: (p, e) => `E(r) − rf = ${sz(e('E'))} − ${sz(p.rf)} = ${sz(e('E') - p.rf)} → ${pct(e('E') - p.rf)}`,
    },
  ],
  diasPeldak: [
    { forras: '2.1 Példa (2. ea), A', p: { p: [0.5, 0.5], r: [0.1, 0.3], premium: true, rf: 0.08 }, vart: { E: '20%', prem: '12%' } },
    { forras: '2.1 Példa (2. ea), B', p: { p: [0.5, 0.5], r: [0.7, -0.2], premium: true, rf: 0.08 }, vart: { E: '25%', prem: '17%' } },
    { forras: '2.2 Példa (2. ea)', p: { p: [0.2, 0.8], r: [0.1, 0.3], premium: false }, vart: { E: '26%', var: '0,0064', sigma: '8%' } },
  ],
}

// ---------------- B2: két részvény, kovariancia és korreláció ----------------

type B2 = KetReszveny & { zavaroRf?: number }

export const allapotKet: Sablon<B2> = {
  id: 'allapot-ket',
  csalad: 'allapot',
  cim: 'Két részvény: kovariancia és korreláció',
  felismeresek: [{ elott: '', helyes: 'F04', zavarok: ['F03', 'F05', 'F02'] }],
  general: (r) => {
    const p = ketReszvenyValoszinusegek(r)
    return { p, rA: hozamok(r, p.length), rB: hozamok(r, p.length, r.esely(0.5)), zavaroRf: r.esely(0.35) ? r.lepeskoz(0.02, 0.06, 0.005) : undefined }
  },
  ervenyes: () => true,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    // a 4. keretben mindig van zavaró adat (a kockázatmentes hozam)
    const rf = p.zavaroRf ?? (v === 3 ? r.lepeskoz(0.02, 0.06, 0.005) : undefined)
    const zavaro = rf !== undefined ? `A kockázatmentes hozam ${pct(rf)}.` : undefined
    const mondatok = [
      ['Az A és a B részvény hozama a gazdaság állapotától függ, az alábbi táblázat szerint.', zavaro],
      [`Egy elemző a jövő évre ${p.p.length} gazdasági állapottal számol; az A és a B részvény állapotonkénti hozamát a táblázat mutatja.`, zavaro],
      [zavaro, 'Egy befektető két részvényt, A-t és B-t figyel. A táblázat a lehetséges gazdasági állapotokat, a valószínűségüket és a két részvény hozamát mutatja.'],
      ['Egy alapkezelő két részvény (A és B) hozamát elemzi forgatókönyvek alapján (táblázat).', zavaro],
    ][v]
    return {
      valtozat: `k${v}`,
      bekezdesek: [mondatok.filter(Boolean).join(' ')],
      tabla: tabla(p.p, [
        { cim: 'A hozama', r: p.rA },
        { cim: 'B hozama', r: p.rB },
      ]),
      kerdesek: ['Mekkora a két részvény várható hozama és szórása?', 'Mekkora a két hozam kovarianciája és korrelációja?'],
    }
  },
  // ZH: csak a kovariancia és a korreláció a kérdés (a várható hozamok és szórások részlépések)
  zh: () => ({ kulcsok: ['cov', 'k'], kerdesek: ['Mekkora a két hozam kovarianciája és korrelációja?'] }),
  lepesek: ketReszvenyLepesek<B2>(),
  diasPeldak: [
    {
      forras: '2.1, 3.3 Példa (2. ea), közös adatsor',
      p: { p: [0.5, 0.5], rA: [0.1, 0.3], rB: [0.7, -0.2] },
      vart: { EA: '20%', EB: '25%', sA: '10%', sB: '45%', cov: '−0,045', k: '−1' },
    },
  ],
}

// ---------------- B3: kételemű portfólió ----------------

type B3 = {
  a1: number
  EA: number
  EB: number
  sA: number
  sB: number
  adat: 'cov' | 'k'
  k: number
  cov: number
  szorasMod: 'szoras' | 'variancia'
  zavaroRf?: number
}

export const portfolioKet: Sablon<B3> = {
  id: 'portfolio-ket',
  csalad: 'allapot',
  cim: 'Kételemű portfólió hozama és szórása',
  felismeresek: [{ elott: '', helyes: 'F05', zavarok: ['F04', 'F06', 'F03'] }],
  general: (r) => {
    const sA = r.lepeskoz(0.05, 0.5, 0.01)
    const sB = r.lepeskoz(0.05, 0.5, 0.01)
    const k = r.lepeskoz(-0.9, 0.9, 0.1)
    return {
      a1: r.valaszt(SULYOK),
      EA: r.lepeskoz(0.04, 0.2, 0.005),
      EB: r.lepeskoz(0.04, 0.2, 0.005),
      sA,
      sB,
      adat: r.esely(0.5) ? 'k' : 'cov',
      k,
      cov: Math.round(k * sA * sB * 1e6) / 1e6,
      szorasMod: r.esely(0.3) ? 'variancia' : 'szoras',
      zavaroRf: r.esely(0.35) ? r.lepeskoz(0.02, 0.06, 0.005) : undefined,
    }
  },
  ervenyes: (p) => p.sA !== p.sB,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const kock = (s: number) => (p.szorasMod === 'szoras' ? `szórása ${pct(s)}` : `varianciája ${sz(s * s, 6)}`)
    const egyutt = p.adat === 'k' ? `A két hozam korrelációja ${sz(p.k)}.` : `A két hozam kovarianciája ${sz(p.cov, 6)}.`
    const adatok = `Az A részvény várható hozama ${pct(p.EA)}, ${kock(p.sA)}; a B részvény várható hozama ${pct(p.EB)}, ${kock(p.sB)}.`
    // a 4. keretben mindig van zavaró adat (a kockázatmentes hozam)
    const rf = p.zavaroRf ?? (v === 3 ? r.lepeskoz(0.02, 0.06, 0.005) : undefined)
    const zavaro = rf !== undefined ? `A kockázatmentes hozam ${pct(rf)}.` : undefined
    const mondatok = [
      [`Egy befektető vagyonának ${pct(p.a1)}-át az A, a többit a B részvénybe fekteti.`, adatok, egyutt, zavaro],
      [`Egy portfólió ${pct(p.a1)}-a A részvény, ${pct(1 - p.a1)}-a B részvény.`, egyutt, adatok, zavaro],
      [adatok, egyutt, zavaro, `Egy alapkezelő a pénz ${pct(p.a1)}-át az A, ${pct(1 - p.a1)}-át a B részvénybe teszi.`],
      [zavaro, `Egy nyugdíjpénztár két részvényt vásárol: ${pct(p.a1)}-ban A-t, ${pct(1 - p.a1)}-ban B-t.`, adatok, egyutt],
    ][v]
    return { valtozat: `k${v}`, bekezdesek: [mondatok.filter(Boolean).join(' ')], kerdesek: ['Mekkora a portfólió várható hozama és szórása?'] }
  },
  zh: () => ({ kulcsok: ['EP', 'sP'] }),
  lepesek: portfolioLepesek<B3>({
    EA: (p) => p.EA,
    EB: (p) => p.EB,
    sA: (p) => p.sA,
    sB: (p) => p.sB,
    cov: (p) => p.cov,
    k: (p) => p.k,
    korrelacioval: (p) => p.adat === 'k',
  }),
  diasPeldak: [
    { forras: '3.1 Példa (2. ea)', p: { a1: 0.6, EA: 0.15, EB: 0.1 }, vart: { EP: '13%' } },
    { forras: '3.4 Példa (2. ea) #1', p: { a1: 0.5, sA: 0.35, sB: 0.5, adat: 'k', k: 0.6 }, vart: { varP: '0,145625', sP: '38,2%' } },
    {
      forras: '3.4 Példa (2. ea) #2',
      p: { a1: 0.6, sA: Math.sqrt(0.0585), sB: Math.sqrt(0.011), adat: 'cov', cov: -0.001 },
      vart: { varP: '0,02234', sP: '14,9%' },
    },
  ],
}

// ---------------- B4: a teljes lánc ----------------

type B4 = KetReszveny & { a1: number }

const b4Eleje = ketReszvenyLepesek<B4>()

export const allapotTeljes: Sablon<B4> = {
  id: 'allapot-teljes',
  csalad: 'allapot',
  cim: 'Teljes lánc: állapotoktól a portfólió szórásáig',
  felismeresek: [
    // a feladat mindkét láncot kéri, ezért egyik felismerésnél sem zavaró a másik lánca;
    // a második felismerésnél az a) és b) kérdés már látszik, a c) még nem
    { elott: '', helyes: 'F04', zavarok: ['F03', 'F02', 'F06'] },
    { elott: 'EP', helyes: 'F05', zavarok: ['F03', 'F06', 'F02'], lathatoKerdes: 2 },
  ],
  general: (r) => {
    const p = ketReszvenyValoszinusegek(r)
    return { p, rA: hozamok(r, p.length), rB: hozamok(r, p.length, r.esely(0.5)), a1: r.valaszt(SULYOK) }
  },
  ervenyes: () => true,
  szoveg: (p) => ({
    bekezdesek: [
      'Az A és a B részvény hozama a gazdaság állapotától függ, az alábbi táblázat szerint.',
      `Egy befektető vagyonának ${pct(p.a1)}-át az A, a többit a B részvénybe fekteti.`,
    ],
    tabla: tabla(p.p, [
      { cim: 'A hozama', r: p.rA },
      { cim: 'B hozama', r: p.rB },
    ]),
    kerdesek: [
      'a) Mekkora a két részvény várható hozama és szórása?',
      'b) Mekkora a két hozam kovarianciája és korrelációja?',
      'c) Mekkora a portfólió várható hozama és szórása?',
    ],
  }),
  lepesek: [
    ...b4Eleje,
    ...portfolioLepesek<B4>({
      EA: (_p, e) => e('EA'),
      EB: (_p, e) => e('EB'),
      sA: (_p, e) => e('sA'),
      sB: (_p, e) => e('sB'),
      cov: (_p, e) => e('cov'),
    }),
  ],
  diasPeldak: [
    {
      // a dián 81,8% / 18,2%: ez a 9/11 súly kerekítve, amelynél a k = −1 miatt σ = 0
      forras: '2.1, 3.3, 3.4 Kockázatmentes portfólió (2. ea)',
      p: { p: [0.5, 0.5], rA: [0.1, 0.3], rB: [0.7, -0.2], a1: 9 / 11 },
      vart: { EA: '20%', EB: '25%', sA: '10%', sB: '45%', cov: '−0,045', k: '−1', EP: '20,9%', sP: '0%' },
    },
  ],
}
