// 2. ZH, 8. fejezet: tőkeszerkezet. A feladatok a szemináriumi példák mintájára készültek
// (forras/zh2/, „szem. N” és „szem. adó N”); a számok véletlenek, a képletek a képlettárból jönnek.

import { capm } from '../../calc/capm.ts'
import {
  adomegtakaritasEves,
  adomegtakaritasPvOrok,
  adomegtakaritasPvVeges,
  adosRE,
  egyenloTorlesztesKamatai,
  eszkozBeta,
  hitelBeta,
  mmIIRE,
  modositottWacc,
  tokeSzerkezetHozam,
} from '../../calc/tokeszerkezet.ts'
import { pct, sz } from '../formaz.ts'
import type { Rng, Sablon, TipikusHiba } from '../tipusok.ts'
import { keretbe } from './kozos.ts'

const CEGEK = [
  'a Duna Közmű Nyrt.',
  'a Rába Acél Nyrt.',
  'a Sajó Vegyipar Nyrt.',
  'a Balaton Vendéglátó Nyrt.',
  'az Őrség Faipar Nyrt.',
  'a Velence Média Nyrt.',
  'a Tokaj Borászat Nyrt.',
  'az Avas Elektronika Nyrt.',
] as const

const ADOKULCSOK = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4] as const

/** Közös bevezetők: a szereplő ne árulja el a feladat típusát. */
function bevezetok(ceg: string): [string, string, string] {
  return [`Egy elemző ${ceg} finanszírozását vizsgálja.`, `A pénzügyi vezető ${ceg} forrásoldalát tekinti át.`, `Egy befektető ${ceg} adatait gyűjtötte össze.`]
}

const TOKELETES = 'A tőkepiac tökéletes.'

/** A 4. keret zavaró adata. */
function zavaroAdat(r: Rng): string {
  return r.valaszt([
    `A vállalat részvényeinek múlt évi hozama ${pct(r.lepeskoz(-0.1, 0.3, 0.01))} volt.`,
    `A vállalat tavaly ${sz(r.lepeskoz(20, 200, 5))} millió adózott eredményt ért el.`,
    `A vállalat eszközeinek könyv szerinti értéke ${sz(r.lepeskoz(200, 900, 50))} millió.`,
  ])
}

// ---------- 8.1 Tőkeköltség tökéletes piacon ----------

type Forras = { nev: string; w: number; r: number }
type RA = { ceg: string; mod: 'arany' | 'ertek' | 'negy'; f: Forras[]; V: number }

const H = {
  felcserelt: 'A súlyokat felcserélted: a saját tőke hozama a saját tőke súlyával, a hitelé a hitel súlyával szorzódik.',
  atlag: 'A súlyok a piaci értékek arányai, nem egyenlők: súlyozott átlagot kell számolni.',
  deDv: 'A képletben D/E áll, nem D/V: az adósságot a saját tőkéhez kell viszonyítani.',
  ed: 'Az arányt megfordítottad: a képletben D/E áll, nem E/D.',
  felar: 'A felár az eszközök és a hitel hozamának különbségéből jön: (rA − rD), nem rA egésze.',
}

export const mmTokekoltseg: Sablon<RA> = {
  id: 'mm-tokekoltseg',
  csalad: 'mm',
  cim: 'Tőkeköltség tökéletes piacon',
  felismeresek: [{ elott: '', helyes: 'F15', zavarok: ['F16', 'F18', 'F22'] }],
  general: (r) => {
    const mod = r.valaszt(['arany', 'arany', 'ertek', 'ertek', 'negy'] as const)
    const ceg = r.valaszt(CEGEK)
    if (mod === 'negy') {
      const w1 = r.lepeskoz(0.1, 0.3, 0.05)
      const w2 = r.lepeskoz(0.1, 0.25, 0.05)
      const w3 = r.lepeskoz(0.1, 0.25, 0.05)
      const r1 = r.lepeskoz(0.04, 0.07, 0.005)
      const r3 = r.lepeskoz(0.1, 0.15, 0.005)
      return {
        ceg,
        mod,
        V: 100,
        f: [
          { nev: 'banki hitel', w: w1, r: r1 },
          { nev: 'vállalati kötvény', w: w2, r: r1 + r.lepeskoz(0.005, 0.02, 0.005) },
          { nev: 'elsőbbségi részvény', w: w3, r: r3 },
          { nev: 'törzsrészvény', w: Math.round((1 - w1 - w2 - w3) * 100) / 100, r: r3 + r.lepeskoz(0.02, 0.06, 0.005) },
        ],
      }
    }
    const wD = r.lepeskoz(0.15, 0.7, 0.05)
    return {
      ceg,
      mod,
      V: r.valaszt([1000, 1500, 2000, 2500, 3000, 4000]),
      f: [
        { nev: 'hitel', w: wD, r: r.lepeskoz(0.04, 0.1, 0.005) },
        { nev: 'saját tőke', w: Math.round((1 - wD) * 100) / 100, r: r.lepeskoz(0.13, 0.24, 0.005) },
      ],
    }
  },
  ervenyes: (p) => {
    const v = tokeSzerkezetHozam(p.f.map((x) => [x.w, x.r]))
    const atlag = p.f.reduce((s, x) => s + x.r, 0) / p.f.length
    const forditott = tokeSzerkezetHozam(p.f.map((x, i) => [p.f[p.f.length - 1 - i].w, x.r]))
    return Math.abs(v - atlag) > 0.006 && Math.abs(v - forditott) > 0.006
  },
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const [els, ut] = [p.f[0], p.f[p.f.length - 1]]
    const mondatok =
      p.mod === 'negy'
        ? [
            `A vállalatot ${p.f.map((x) => `${pct(x.w)}-ban ${x.nev}`).join(', ')} formájában finanszírozzák.`,
            `Az éves hozamok ugyanebben a sorrendben: ${p.f.map((x) => pct(x.r)).join(', ')}.`,
          ]
        : p.mod === 'arany'
          ? [`A vállalat piaci értékének ${pct(els.w)}-át idegen forrásból, ${pct(ut.w)}-át saját tőkéből finanszírozzák.`, `Az idegen források éves hozama ${pct(els.r)}.`, `A saját tőkétől évi ${pct(ut.r)} hozamot vár el a piac.`]
          : [`A vállalat részvényeinek piaci értéke ${sz(p.V * ut.w)} millió Ft.`, `A vállalat ${sz(p.V * els.w)} millió Ft hitelt vett fel, évi ${pct(els.r)} hozam mellett.`, `A részvények hozama ${pct(ut.r)}.`]
    return {
      valtozat: `k${v}`,
      bekezdesek: [keretbe(v, bevezetok(p.ceg), [...mondatok, TOKELETES, v === 3 ? zavaroAdat(r) : undefined])],
      kerdesek: ['Mekkora a vállalat tőkeköltsége (az eszközök várható hozama)?'],
    }
  },
  zh: () => ({ kulcsok: ['rA'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'wD',
      formulaId: '8.1',
      kerdes: 'Mekkora az adósság súlya (D/V)?',
      egyseg: 'tizedes',
      mikor: (p) => p.mod === 'ertek',
      ertek: (p) => p.f[0].w,
      tipikusHibak: (p) => [{ ertek: p.f[0].w / p.f[1].w, uzenet: 'Ez a D/E arány; a súlyhoz a teljes értékkel osztunk: D/V, ahol V = E + D.' }],
      levezetes: (p) => `D/V = ${sz(p.V * p.f[0].w)} / (${sz(p.V * p.f[1].w)} + ${sz(p.V * p.f[0].w)}) = ${sz(p.f[0].w)}`,
    },
    {
      tipus: 'szam',
      key: 'rA',
      formulaId: '8.1',
      kerdes: 'Mekkora a vállalat tőkeköltsége (rA)?',
      egyseg: '%',
      ertek: (p) => tokeSzerkezetHozam(p.f.map((x) => [x.w, x.r])),
      tipikusHibak: (p) => {
        const utolso = p.f[p.f.length - 1]
        const hibak: TipikusHiba[] = [
          { ertek: p.f.reduce((s, x) => s + x.r, 0) / p.f.length, uzenet: H.atlag },
          { ertek: tokeSzerkezetHozam(p.f.map((x, i) => [p.f[p.f.length - 1 - i].w, x.r])), uzenet: H.felcserelt },
          { ertek: utolso.r, uzenet: 'Ez a részvények hozama; a tőkeköltségben a többi forrás hozama is szerepel, súlyozva.' },
          { ertek: p.f[0].r, uzenet: 'Ez a hitel hozama; a tőkeköltségben a saját tőke hozama is szerepel, súlyozva.' },
          { ertek: utolso.w * utolso.r, uzenet: 'Csak a saját tőke tagját számoltad ki; a többi forrás tagja hiányzik.' },
        ]
        return hibak
      },
      levezetes: (p) => {
        const v = tokeSzerkezetHozam(p.f.map((x) => [x.w, x.r]))
        return `rA = ${p.f.map((x) => `${sz(x.w)} × ${pct(x.r)}`).join(' + ')} = ${pct(v)}`
      },
    },
  ],
  diasPeldak: [
    {
      forras: '8.1 Példa (szem. 1)',
      p: { mod: 'arany', f: [{ nev: 'hitel', w: 0.6, r: 0.07 }, { nev: 'saját tőke', w: 0.4, r: 0.2 }] },
      vart: { rA: '12,2%' },
    },
    {
      forras: '8.1 Példa (szem. 4)',
      p: {
        mod: 'negy',
        f: [
          { nev: 'banki hitel', w: 0.2, r: 0.05 },
          { nev: 'vállalati kötvény', w: 0.15, r: 0.06 },
          { nev: 'elsőbbségi részvény', w: 0.25, r: 0.15 },
          { nev: 'törzsrészvény', w: 0.4, r: 0.2 },
        ],
      },
      vart: { rA: '13,65%' },
    },
    {
      forras: '8.1 Példa (szem. 5)',
      p: { mod: 'ertek', V: 2000, f: [{ nev: 'hitel', w: 0.2, r: 0.07 }, { nev: 'saját tőke', w: 0.8, r: 0.17 }] },
      vart: { wD: '0,2', rA: '15%' },
    },
  ],
}

// ---------- 8.3 MM II. ----------

type RE = { ceg: string; rA: number; rD: number; wD: number; adat: 'wacc' | 'eszkoz' }

/** Az rE-re vonatkozó tipikus hibák adott rA, rD, D/V mellett. */
function mmIIHibak(rA: number, rD: number, wD: number): TipikusHiba[] {
  const de = wD / (1 - wD)
  return [
    { ertek: mmIIRE(rA, rD, wD), uzenet: H.deDv },
    { ertek: rA, uzenet: 'Ez az eszközök hozama; a saját tőke hozama ennél a tőkeáttétel miatt magasabb.' },
    { ertek: rA + de * rA, uzenet: H.felar },
    { ertek: rA - de * (rA - rD), uzenet: 'Az előjel rossz: a tőkeáttétel növeli a saját tőke hozamát.' },
    { ertek: rA - wD * rD, uzenet: 'Az rA = D/V × rD + E/V × rE rendezésénél még E/V-vel is osztani kell.' },
  ]
}

export const mmSajatToke: Sablon<RE> = {
  id: 'mm-sajat-toke',
  csalad: 'mm',
  cim: 'Saját tőke hozama (MM II.)',
  felismeresek: [{ elott: '', helyes: 'F16', zavarok: ['F15', 'F17', 'F21'] }],
  general: (r) => ({
    ceg: r.valaszt(CEGEK),
    rA: r.lepeskoz(0.09, 0.2, 0.005),
    rD: r.lepeskoz(0.04, 0.09, 0.005),
    wD: r.lepeskoz(0.15, 0.65, 0.05),
    adat: r.esely(0.5) ? 'wacc' : 'eszkoz',
  }),
  // D/V = 0,5-nél D/E = E/D = 1, ott a két tipikus hiba a helyes értéket adná
  ervenyes: (p) => p.rA - p.rD >= 0.03 && Math.abs(p.wD - 0.5) > 0.01,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const adat = p.adat === 'wacc' ? `A vállalat súlyozott átlagos tőkeköltsége ${pct(p.rA)}.` : `A vállalat eszközeinek várható hozama ${pct(p.rA)}.`
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          adat,
          `A vállalat évi ${pct(p.rD)} kamat mellett tud hitelt felvenni.`,
          `A vállalat forrásainak ${pct(p.wD)}-a adósság, a többi saját tőke.`,
          TOKELETES,
          v === 3 ? `A kockázatmentes hozam évi ${pct(Math.min(p.rD, r.lepeskoz(0.02, 0.04, 0.005)))}.` : undefined,
        ]),
      ],
      kerdesek: ['Mekkora a részvények várható hozama (a saját tőke költsége)?'],
    }
  },
  zh: () => ({ kulcsok: ['rE'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'DE',
      formulaId: '8.3',
      kerdes: 'Mekkora a D/E arány?',
      egyseg: 'tizedes',
      ertek: (p) => p.wD / (1 - p.wD),
      tipikusHibak: (p) => [
        { ertek: p.wD, uzenet: 'Ez a D/V arány; a D/E-hez a saját tőke súlyával kell osztani.' },
        { ertek: (1 - p.wD) / p.wD, uzenet: H.ed },
      ],
      levezetes: (p) => `D/E = ${sz(p.wD)} / ${sz(1 - p.wD)} = ${sz(p.wD / (1 - p.wD))}`,
    },
    {
      tipus: 'szam',
      key: 'rE',
      formulaId: '8.3',
      kerdes: 'Mekkora a saját tőke hozama (rE)?',
      egyseg: '%',
      ertek: (p, e) => mmIIRE(p.rA, p.rD, e('DE')),
      tipikusHibak: (p) => [...mmIIHibak(p.rA, p.rD, p.wD), { ertek: mmIIRE(p.rA, p.rD, (1 - p.wD) / p.wD), uzenet: H.ed }],
      levezetes: (p, e) => `rE = rA + D/E × (rA − rD) = ${pct(p.rA)} + ${sz(e('DE'))} × (${pct(p.rA)} − ${pct(p.rD)}) = ${pct(mmIIRE(p.rA, p.rD, e('DE')))}`,
    },
  ],
  diasPeldak: [
    { forras: '8.3 Példa (szem. 2)', p: { rA: 0.12, rD: 0.08, wD: 0.2 }, vart: { DE: '0,25', rE: '13%' } },
    { forras: '8.3 Példa (szem. 2)', p: { rA: 0.12, rD: 0.08, wD: 0.5 }, vart: { DE: '1', rE: '16%' } },
    { forras: '8.3 Példa (szem. 7)', p: { rA: 0.2, rD: 0.05, wD: 0.25 }, vart: { rE: '25%' } },
  ],
}

// ---------- 8.1 → 8.3 a tőkeszerkezet átalakításával ----------

type Ujra = { ceg: string; mod: 'tiszta' | 'hiteles'; rE1: number; rD: number; wD1: number; wD2: number }

function ujraRA(p: Ujra): number {
  return p.mod === 'tiszta' ? p.rE1 : tokeSzerkezetHozam([[p.wD1, p.rD], [1 - p.wD1, p.rE1]])
}

export const mmUjrafinanszirozas: Sablon<Ujra> = {
  id: 'mm-ujrafinanszirozas',
  csalad: 'mm',
  cim: 'A tőkeszerkezet átalakítása',
  felismeresek: [{ elott: '', helyes: 'F17', zavarok: ['F16', 'F15', 'F18'] }],
  general: (r) => {
    const mod = r.esely(0.4) ? 'tiszta' : 'hiteles'
    const wD1 = mod === 'tiszta' ? 0 : r.lepeskoz(0.2, 0.45, 0.05)
    return {
      ceg: r.valaszt(CEGEK),
      mod,
      rE1: r.lepeskoz(0.12, 0.22, 0.005),
      rD: r.lepeskoz(0.04, 0.09, 0.005),
      wD1,
      wD2: mod === 'tiszta' ? r.lepeskoz(0.2, 0.6, 0.05) : r.valaszt([0, 0, 0.1, 0.2, 0.3, 0.55, 0.6]),
    }
  },
  ervenyes: (p) => ujraRA(p) - p.rD >= 0.04 && Math.abs(p.wD2 - p.wD1) > 0.01 && Math.abs(p.wD2 - 0.5) > 0.01 && Math.abs(p.wD1 - 0.5) > 0.04,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const jelen =
      p.mod === 'tiszta'
        ? 'A vállalatot jelenleg teljes egészében saját tőkéből finanszírozzák.'
        : `A vállalatot jelenleg ${pct(p.wD1)}-ban hitelből, ${pct(1 - p.wD1)}-ban saját tőkéből finanszírozzák.`
    const uj =
      p.wD2 === 0
        ? 'A tulajdonosok új részvények kibocsátásából minden hitelt visszafizetnek.'
        : p.wD2 > p.wD1
          ? `A vállalat hitelből részvényeket vásárol vissza, így a források ${pct(p.wD2)}-a lesz hitel.`
          : `A vállalat új részvényeket bocsát ki, és a hitelt annyira csökkenti, hogy a források ${pct(p.wD2)}-a marad hitel.`
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          jelen,
          `A részvényesek a jelenlegi árfolyam alapján évi ${pct(p.rE1)} hozamot várnak el.`,
          `A hitelek kamata évi ${pct(p.rD)}, az adósság kockázata nem változik.`,
          uj,
          TOKELETES,
          v === 3 ? zavaroAdat(r) : undefined,
        ]),
      ],
      kerdesek: ['Mekkora lesz a részvények várható hozama az átalakítás után?'],
    }
  },
  zh: () => ({ kulcsok: ['rE2'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'rA',
      formulaId: '8.1',
      kerdes: 'Mekkora az eszközök várható hozama (rA)? A tőkeszerkezet ezt nem változtatja meg.',
      egyseg: '%',
      mikor: (p) => p.mod === 'hiteles',
      ertek: ujraRA,
      tipikusHibak: (p) => [
        { ertek: (p.rD + p.rE1) / 2, uzenet: H.atlag },
        { ertek: p.rE1, uzenet: 'Ez a részvények hozama; az eszközök hozamában a hitel hozama is szerepel, súlyozva.' },
        { ertek: tokeSzerkezetHozam([[1 - p.wD1, p.rD], [p.wD1, p.rE1]]), uzenet: H.felcserelt },
      ],
      levezetes: (p) => `rA = ${sz(p.wD1)} × ${pct(p.rD)} + ${sz(1 - p.wD1)} × ${pct(p.rE1)} = ${pct(ujraRA(p))}`,
    },
    {
      tipus: 'szam',
      key: 'rE2',
      formulaId: '8.3',
      kerdes: 'Mekkora a részvények várható hozama az átalakítás után?',
      egyseg: '%',
      ertek: (p) => mmIIRE(ujraRA(p), p.rD, p.wD2 / (1 - p.wD2)),
      tipikusHibak: (p) => {
        const rA = ujraRA(p)
        const hibak: TipikusHiba[] = [{ ertek: p.rE1, uzenet: 'Ez a régi hozam; a tőkeszerkezet változásával a részvények hozama is változik, az rA marad.' }]
        if (p.wD2 === 0)
          hibak.push(
            { ertek: (p.rE1 + p.rD) / 2, uzenet: H.atlag },
            { ertek: p.rD, uzenet: 'Hitel nélkül a részvények hozama az eszközök hozamával egyezik meg, nem a hitelével.' },
            { ertek: (1 - p.wD1) * p.rE1, uzenet: 'Az eszközök hozamához a hitel tagja is kell: D/V × rD + E/V × rE.' },
          )
        else {
          const de = p.wD2 / (1 - p.wD2)
          hibak.push(
            { ertek: rA, uzenet: 'Ez az eszközök hozama; hitel mellett a részvények hozama ennél magasabb.' },
            { ertek: mmIIRE(rA, p.rD, p.wD2), uzenet: H.deDv },
            { ertek: rA + de * rA, uzenet: H.felar },
            { ertek: p.rE1 + de * (rA - p.rD), uzenet: 'A kiindulópont az eszközök hozama (rA), nem a régi rE.' },
            { ertek: rA - de * (rA - p.rD), uzenet: 'Az előjel rossz: a tőkeáttétel növeli a saját tőke hozamát.' },
          )
        }
        return hibak
      },
      levezetes: (p) => {
        const de = p.wD2 / (1 - p.wD2)
        const rA = ujraRA(p)
        return `rE = rA + D/E × (rA − rD) = ${pct(rA)} + ${sz(de)} × (${pct(rA)} − ${pct(p.rD)}) = ${pct(mmIIRE(rA, p.rD, de))}`
      },
    },
  ],
  diasPeldak: [
    { forras: '8.3 Példa (szem. 8)', p: { mod: 'tiszta', rE1: 0.15, rD: 0.06, wD1: 0, wD2: 0.5 }, vart: { rE2: '24%' } },
    { forras: '8.3 Példa (szem. 8)', p: { mod: 'tiszta', rE1: 0.15, rD: 0.08, wD1: 0, wD2: 0.5 }, vart: { rE2: '22%' } },
    { forras: '8.3 Példa (szem. 9)', p: { mod: 'hiteles', rE1: 0.2, rD: 0.08, wD1: 0.4, wD2: 0 }, vart: { rA: '15,2%', rE2: '15,2%' } },
  ],
}

// ---------- 5.1 → 8.1 → 8.2 ----------

type Beta = { ceg: string; rf: number; MRP: number; piac: 'rM' | 'MRP'; betaE: number; wD: number; rD: number; kockazatos: boolean }

export const mmEszkozBeta: Sablon<Beta> = {
  id: 'mm-eszkozbeta',
  csalad: 'mm',
  cim: 'Eszközök bétája',
  felismeresek: [{ elott: '', helyes: 'F18', zavarok: ['F15', 'F17', 'F22'] }],
  general: (r) => {
    const rf = r.lepeskoz(0.02, 0.06, 0.005)
    const kockazatos = r.esely(0.6)
    return {
      ceg: r.valaszt(CEGEK),
      rf,
      MRP: r.lepeskoz(0.05, 0.1, 0.005),
      piac: r.esely(0.5) ? 'rM' : 'MRP',
      betaE: r.lepeskoz(0.7, 1.8, 0.05),
      wD: r.lepeskoz(0.15, 0.6, 0.05),
      rD: kockazatos ? rf + r.lepeskoz(0.01, 0.03, 0.005) : rf,
      kockazatos,
    }
  },
  ervenyes: (p) => Math.abs(p.wD - 0.5) > 0.01 && p.rD < capm(p.rf, p.betaE, p.MRP) - 0.01,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const piac = p.piac === 'rM' ? `A piaci portfólió várható hozama ${pct(p.rf + p.MRP)}.` : `A piaci kockázati prémium ${pct(p.MRP)}.`
    const hitel = p.kockazatos
      ? `A vállalatot ${pct(p.wD)}-ban hitelből, ${pct(1 - p.wD)}-ban saját tőkéből finanszírozzák; a hitel hozama évi ${pct(p.rD)}.`
      : `A vállalatot ${pct(p.wD)}-ban kockázatmentes hitelből, ${pct(1 - p.wD)}-ban saját tőkéből finanszírozzák.`
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          hitel,
          `A kockázatmentes hozam évi ${pct(p.rf)}.`,
          piac,
          `A vállalat részvényeinek bétája ${sz(p.betaE)}.`,
          TOKELETES,
          v === 3 ? zavaroAdat(r) : undefined,
        ]),
      ],
      kerdesek: ['Mekkora a vállalat eszközeinek bétája?'],
    }
  },
  zh: () => ({ kulcsok: ['bA'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'rE',
      formulaId: '5.1',
      kerdes: 'Mekkora a saját tőke várható hozama?',
      egyseg: '%',
      ertek: (p) => capm(p.rf, p.betaE, p.MRP),
      tipikusHibak: (p) => [{ ertek: p.rf + p.betaE * (p.rf + p.MRP), uzenet: 'A piac hozamával számoltál a prémium helyett: MRP = E(rM) − rf.' }],
      levezetes: (p) => `rE = rf + βE × MRP = ${pct(p.rf)} + ${sz(p.betaE)} × ${pct(p.MRP)} = ${pct(capm(p.rf, p.betaE, p.MRP))}`,
    },
    {
      tipus: 'szam',
      key: 'rA',
      formulaId: '8.1',
      kerdes: 'Mekkora a vállalat tőkeköltsége (rA)?',
      egyseg: '%',
      ertek: (p, e) => tokeSzerkezetHozam([[p.wD, p.rD], [1 - p.wD, e('rE')]]),
      tipikusHibak: (p, e) => [
        { ertek: tokeSzerkezetHozam([[1 - p.wD, p.rD], [p.wD, e('rE')]]), uzenet: H.felcserelt },
        { ertek: (p.rD + e('rE')) / 2, uzenet: H.atlag },
      ],
      levezetes: (p, e) => `rA = ${sz(p.wD)} × ${pct(p.rD)} + ${sz(1 - p.wD)} × ${pct(e('rE'))} = ${pct(tokeSzerkezetHozam([[p.wD, p.rD], [1 - p.wD, e('rE')]]))}`,
    },
    {
      tipus: 'szam',
      key: 'bD',
      formulaId: '8.2',
      kerdes: 'Mekkora a hitel bétája?',
      egyseg: 'tizedes',
      mikor: (p) => p.kockazatos,
      ertek: (p) => hitelBeta(p.rD, p.rf, p.MRP),
      tipikusHibak: (p) => [{ ertek: p.rD / p.MRP, uzenet: 'A hitel hozamából előbb le kell vonni a kockázatmentes hozamot: βD = (rD − rf) / MRP.' }],
      levezetes: (p) => `βD = (rD − rf) / MRP = (${pct(p.rD)} − ${pct(p.rf)}) / ${pct(p.MRP)} = ${sz(hitelBeta(p.rD, p.rf, p.MRP))}`,
    },
    {
      tipus: 'szam',
      key: 'bA',
      formulaId: '8.2',
      kerdes: 'Mekkora az eszközök bétája (βA)?',
      egyseg: 'tizedes',
      ertek: (p) => eszkozBeta(1 - p.wD, p.betaE, p.wD, p.kockazatos ? hitelBeta(p.rD, p.rf, p.MRP) : 0),
      tipikusHibak: (p, e) => {
        const bD = p.kockazatos ? hitelBeta(p.rD, p.rf, p.MRP) : 0
        const hibak: TipikusHiba[] = [
          { ertek: p.betaE, uzenet: 'Ez a részvények bétája; az eszközöké ennél kisebb, mert a hitel kockázata alacsonyabb.' },
          { ertek: eszkozBeta(p.wD, p.betaE, 1 - p.wD, bD), uzenet: H.felcserelt },
          { ertek: e('rA') / p.MRP, uzenet: 'Az rA-ból előbb le kell vonni a kockázatmentes hozamot: βA = (rA − rf) / MRP.' },
          { ertek: e('rA') / (p.rf + p.MRP), uzenet: 'A béta nem az rA és a piaci hozam hányadosa: βA = (rA − rf) / MRP.' },
        ]
        if (p.kockazatos) hibak.push({ ertek: (1 - p.wD) * p.betaE, uzenet: 'A hitel nem kockázatmentes, ezért a βD tagja is kell: D/V × βD.' }, { ertek: (p.betaE + bD) / 2, uzenet: H.atlag })
        return hibak
      },
      levezetes: (p) => {
        const bD = p.kockazatos ? hitelBeta(p.rD, p.rf, p.MRP) : 0
        return `βA = E/V × βE + D/V × βD = ${sz(1 - p.wD)} × ${sz(p.betaE)} + ${sz(p.wD)} × ${sz(bD)} = ${sz(eszkozBeta(1 - p.wD, p.betaE, p.wD, bD))}`
      },
    },
  ],
  diasPeldak: [
    { forras: '8.2 Példa (szem. 3)', p: { rf: 0.05, MRP: 0.1, betaE: 0.7, wD: 0.4, rD: 0.05, kockazatos: false }, vart: { rE: '12%', rA: '9,2%', bA: '0,42' } },
    { forras: '8.2 Példa (szem. 6)', p: { rf: 0.05, MRP: 0.08, betaE: 1.5, wD: 0.2, rD: 0.07, kockazatos: true }, vart: { rE: '17%', rA: '15%', bD: '0,25', bA: '1,25' } },
  ],
}

// ---------- 8.4 → 8.6 ----------

type Merleg = { ceg: string; nft: number; be: number; D: number; Tc: number; rD: number; mod: 'pv' | 'ujhitel' | 'vu'; dD: number }

function merlegTabla(nft: number, be: number, D: number) {
  return {
    fejlec: ['Eszközök', 'M USD', 'Források', 'M USD'],
    sorok: [
      ['Nettó forgótőke', sz(nft), 'Hitel', sz(D)],
      ['Befektetett eszközök', sz(be), 'Saját tőke', sz(nft + be - D)],
      ['Összesen', sz(nft + be), 'Összesen', sz(nft + be)],
    ],
  }
}

export const adopajzsOrok: Sablon<Merleg> = {
  id: 'adopajzs-orok',
  csalad: 'ado',
  cim: 'Adómegtakarítás örökjáradékként',
  felismeresek: [{ elott: '', helyes: 'F19', zavarok: ['F20', 'F21', 'F22'] }],
  general: (r) => ({
    ceg: r.valaszt(CEGEK),
    nft: r.lepeskoz(20, 80, 10),
    be: r.lepeskoz(160, 480, 20),
    D: r.lepeskoz(40, 160, 10),
    Tc: r.valaszt(ADOKULCSOK),
    rD: r.lepeskoz(0.04, 0.1, 0.01),
    mod: r.valaszt(['pv', 'ujhitel', 'vu'] as const),
    dD: r.lepeskoz(20, 60, 10),
  }),
  ervenyes: (p) => p.D < (p.nft + p.be) * 0.6,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          'A táblázat a vállalat piaci értékű mérlege.',
          `Az adósság állandó nagyságú, kockázatmentes és örökké fennmarad, kamata évi ${pct(p.rD)}.`,
          `A vállalati adókulcs ${pct(p.Tc)}.`,
          'Feltételezzük, hogy az MM-elmélet adók létezése esetén is érvényes.',
          p.mod === 'ujhitel' ? `A vállalat további ${sz(p.dD)} M USD kockázatmentes kölcsönt vesz fel, és ebből részvényeket vásárol vissza.` : undefined,
          v === 3 ? zavaroAdat(r) : undefined,
        ]),
      ],
      tabla: merlegTabla(p.nft, p.be, p.D),
      kerdesek: [
        'Mekkora a vállalat értékéből a hitel miatti adómegtakarítás jelenértéke?',
        ...(p.mod === 'ujhitel' ? ['Mennyivel járnak jobban a részvényesek a további hitel miatt?'] : p.mod === 'vu' ? ['Mekkora lenne a vállalat értéke hitel nélkül?'] : []),
      ],
    }
  },
  zh: (p) =>
    p.mod === 'pv'
      ? { kulcsok: ['pv'] }
      : p.mod === 'ujhitel'
        ? { kulcsok: ['nyereseg'], kerdesek: ['Mennyivel járnak jobban a részvényesek a további hitel miatt?'] }
        : { kulcsok: ['VU'], kerdesek: ['Mekkora lenne a vállalat értéke hitel nélkül?'] },
  lepesek: [
    {
      tipus: 'szam',
      key: 'pv',
      formulaId: '8.4',
      latexIdx: 1,
      kerdes: 'Mekkora a hitel miatti adómegtakarítás jelenértéke?',
      egyseg: 'M USD',
      ertek: (p) => adomegtakaritasPvOrok(p.Tc, p.D),
      tipikusHibak: (p) => [
        { ertek: adomegtakaritasEves(p.Tc, p.D, p.rD), uzenet: 'Ez az éves adómegtakarítás; a jelenértéke örökjáradékként TC × D.' },
        { ertek: p.D, uzenet: 'Ez maga az adósság; a jelenérték TC × D.' },
        { ertek: (1 - p.Tc) * p.D, uzenet: 'A jelenérték TC × D, nem (1 − TC) × D.' },
        { ertek: p.Tc * (p.nft + p.be), uzenet: 'Az adókulcsot az adóssággal kell szorozni, nem a vállalat értékével.' },
        { ertek: p.Tc * (p.nft + p.be - p.D), uzenet: 'Az adókulcsot az adóssággal kell szorozni, nem a saját tőkével: a kamat vonható le.' },
      ],
      levezetes: (p) => `PV(TS) = TC × D = ${sz(p.Tc)} × ${sz(p.D)} = ${sz(adomegtakaritasPvOrok(p.Tc, p.D))} M USD`,
    },
    {
      tipus: 'szam',
      key: 'nyereseg',
      formulaId: '8.4',
      latexIdx: 1,
      kerdes: 'Mennyivel járnak jobban a részvényesek a további hitel miatt?',
      egyseg: 'M USD',
      mikor: (p) => p.mod === 'ujhitel',
      ertek: (p) => adomegtakaritasPvOrok(p.Tc, p.dD),
      tipikusHibak: (p) => [
        { ertek: p.Tc * (p.D + p.dD), uzenet: 'Ez a teljes adósság adómegtakarítása; a kérdés a többlet: TC × ΔD.' },
        { ertek: p.dD, uzenet: 'Ez a felvett hitel; a részvényesek nyeresége csak az adómegtakarítás: TC × ΔD.' },
        { ertek: adomegtakaritasEves(p.Tc, p.dD, p.rD), uzenet: 'Ez az éves összeg; a jelenértéke TC × ΔD.' },
        { ertek: (1 - p.Tc) * p.dD, uzenet: 'A jelenérték TC × ΔD, nem (1 − TC) × ΔD.' },
      ],
      levezetes: (p) => `TC × ΔD = ${sz(p.Tc)} × ${sz(p.dD)} = ${sz(p.Tc * p.dD)} M USD`,
    },
    {
      tipus: 'szam',
      key: 'VU',
      formulaId: '8.6',
      kerdes: 'Mekkora lenne a vállalat értéke hitel nélkül (VU)?',
      egyseg: 'M USD',
      mikor: (p) => p.mod === 'vu',
      ertek: (p, e) => p.nft + p.be - e('pv'),
      tipikusHibak: (p, e) => {
        const V = p.nft + p.be
        return [
          { ertek: V + e('pv'), uzenet: 'Az előjel rossz: VL = VU + TC × D, ezért VU = VL − TC × D.' },
          { ertek: V, uzenet: 'Ez a tőkeáttételes érték (VL); le kell vonni belőle az adómegtakarítás jelenértékét.' },
          { ertek: V - p.D, uzenet: 'Ez a saját tőke értéke; VU = VL − TC × D.' },
          { ertek: V - adomegtakaritasEves(p.Tc, p.D, p.rD), uzenet: 'Az éves összeget vontad le; a jelenérték TC × D.' },
        ]
      },
      levezetes: (p, e) => `VU = VL − TC × D = ${sz(p.nft + p.be)} − ${sz(e('pv'))} = ${sz(p.nft + p.be - e('pv'))} M USD`,
    },
  ],
  diasPeldak: [
    { forras: '8.4 Példa (szem. adó 1)', p: { mod: 'ujhitel', nft: 40, be: 280, D: 80, Tc: 0.4, dD: 40, rD: 0.08 }, vart: { pv: '32', nyereseg: '16' } },
    { forras: '8.6 Példa (szem. adó 1)', p: { mod: 'vu', nft: 40, be: 280, D: 80, Tc: 0.4, rD: 0.08 }, vart: { pv: '32', VU: '288' } },
  ],
}

// ---------- 8.5 ----------

type Veges = { ceg: string; D: number; rD: number; Tc: number; n: number; mod: 'lejarat' | 'torleszto' }

function kamatok(p: Veges): number[] {
  return p.mod === 'lejarat' ? new Array<number>(p.n).fill(p.D * p.rD) : egyenloTorlesztesKamatai(p.D, p.n, p.rD)
}

export const adopajzsVeges: Sablon<Veges> = {
  id: 'adopajzs-veges',
  csalad: 'ado',
  cim: 'Adómegtakarítás véges futamidőre',
  felismeresek: [{ elott: '', helyes: 'F20', zavarok: ['F19', 'F21', 'F15'] }],
  general: (r) => {
    const mod = r.esely(0.5) ? 'lejarat' : 'torleszto'
    const n = mod === 'lejarat' ? r.egesz(3, 6) : r.egesz(3, 4)
    return { ceg: r.valaszt(CEGEK), D: n * r.lepeskoz(5, 30, 5), rD: r.lepeskoz(0.04, 0.1, 0.005), Tc: r.valaszt(ADOKULCSOK), n, mod }
  },
  ervenyes: () => true,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          `A vállalat ${sz(p.D)} M USD kockázatmentes hitel felvételét fontolgatja, évi ${pct(p.rD)} kamatra.`,
          p.mod === 'lejarat' ? `A hitelt ${p.n} év múlva egy összegben kell visszafizetni, addig csak kamatot fizet.` : `A hitelt ${p.n} év alatt, egyenlő éves tőkerészletekben kell törleszteni.`,
          `A vállalat a következő években biztosan nyereséges lesz, a nyereségadó kulcsa ${pct(p.Tc)}.`,
          v === 3 ? zavaroAdat(r) : undefined,
        ]),
      ],
      kerdesek: ['Mekkora a kamatfizetésből származó adómegtakarítás jelenértéke (a hitel kamatlábával diszkontálva)?'],
    }
  },
  zh: () => ({ kulcsok: ['pv'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'k1',
      formulaId: '8.5',
      kerdes: 'Mekkora az első évi kamat?',
      egyseg: 'M USD',
      ertek: (p) => p.D * p.rD,
      levezetes: (p) => `K1 = ${sz(p.D)} × ${pct(p.rD)} = ${sz(p.D * p.rD)} M USD`,
    },
    {
      tipus: 'szam',
      key: 'ts1',
      formulaId: '8.5',
      kerdes: 'Mekkora az első évi adómegtakarítás?',
      egyseg: 'M USD',
      ertek: (p, e) => p.Tc * e('k1'),
      tipikusHibak: (p, e) => [{ ertek: (1 - p.Tc) * e('k1'), uzenet: 'A megtakarítás a kamat TC-szerese, nem (1 − TC)-szerese.' }],
      levezetes: (p, e) => `TC × K1 = ${sz(p.Tc)} × ${sz(e('k1'))} = ${sz(p.Tc * e('k1'))} M USD`,
    },
    {
      tipus: 'szam',
      key: 'pv',
      formulaId: '8.5',
      kerdes: 'Mekkora az adómegtakarítás jelenértéke?',
      egyseg: 'M USD',
      tures: { abs: 0.01, rel: 0.002 },
      ertek: (p) => adomegtakaritasPvVeges(p.Tc, kamatok(p), p.rD),
      tipikusHibak: (p) => {
        const k = kamatok(p)
        const hibak: TipikusHiba[] = [
          { ertek: adomegtakaritasPvOrok(p.Tc, p.D), uzenet: 'A TC × D örökké fennálló adósságra érvényes; itt az évek adómegtakarításait külön kell diszkontálni.' },
          { ertek: p.Tc * k.reduce((s, x) => s + x, 0), uzenet: 'Ez a diszkontálatlan összeg; minden évet (1 + rD)^t-vel kell diszkontálni.' },
          { ertek: adomegtakaritasPvVeges(1, k, p.rD), uzenet: 'Ez a kamatok jelenértéke; az adómegtakarítás ennek TC-szerese.' },
          { ertek: adomegtakaritasPvVeges(1 - p.Tc, k, p.rD), uzenet: 'A megtakarítás a kamat TC-szerese, nem (1 − TC)-szerese.' },
        ]
        if (p.mod === 'torleszto') hibak.push({ ertek: adomegtakaritasPvVeges(p.Tc, new Array<number>(p.n).fill(p.D * p.rD), p.rD), uzenet: 'A törlesztő hitelnél a tartozás, és vele a kamat, évről évre csökken.' })
        return hibak
      },
      levezetes: (p) => {
        const k = kamatok(p)
        return `PV(TS) = ${k.map((x, i) => `${sz(p.Tc)} × ${sz(x)} / ${sz(1 + p.rD)}^${i + 1}`).join(' + ')} = ${sz(adomegtakaritasPvVeges(p.Tc, k, p.rD))} M USD`
      },
    },
  ],
  diasPeldak: [
    // a megoldás kerekített annuitásfaktorral (3,993) 10,222-t kap; pontosan 10,2213
    { forras: '8.5 Példa (szem. adó 1)', p: { mod: 'lejarat', D: 80, rD: 0.08, Tc: 0.4, n: 5 }, vart: { k1: '6,4', ts1: '2,56', pv: '10,22' } },
    { forras: '8.5 Példa (szem. adó 3)', p: { mod: 'torleszto', D: 30, rD: 0.05, Tc: 0.2, n: 3 }, vart: { k1: '1,5', pv: '0,55' } },
  ],
}

// ---------- 8.7 → 8.8 ----------

type AdosRE = { ceg: string; rU: number; rD: number; wE: number; Tc: number }

export const adosTokekoltseg: Sablon<AdosRE> = {
  id: 'ados-tokekoltseg',
  csalad: 'ado',
  cim: 'Saját tőke és WACC* adóval',
  felismeresek: [{ elott: '', helyes: 'F21', zavarok: ['F22', 'F16', 'F19'] }],
  general: (r) => ({
    ceg: r.valaszt(CEGEK),
    rU: r.lepeskoz(0.09, 0.18, 0.005),
    rD: r.lepeskoz(0.04, 0.08, 0.005),
    wE: r.lepeskoz(0.4, 0.85, 0.05),
    Tc: r.valaszt(ADOKULCSOK),
  }),
  ervenyes: (p) => p.rU - p.rD >= 0.03 && Math.abs(p.wE - 0.5) > 0.01,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          `A vállalat tőkeáttétel nélküli hozama ${pct(p.rU)}.`,
          `A vállalat évi ${pct(p.rD)} kamat mellett tud hitelt felvenni.`,
          `A célzott tőkeszerkezet ${pct(p.wE)} saját tőke és ${pct(1 - p.wE)} adósság.`,
          `A társasági adókulcs ${pct(p.Tc)}.`,
          v === 3 ? zavaroAdat(r) : undefined,
        ]),
      ],
      kerdesek: ['Mekkora a saját tőke költsége?', 'Mekkora az adóval módosított tőkeköltség (WACC*)?'],
    }
  },
  zh: () => ({ kulcsok: ['rE', 'wacc'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'rE',
      formulaId: '8.7',
      kerdes: 'Mekkora a saját tőke költsége (rE)?',
      egyseg: '%',
      ertek: (p) => adosRE(p.rU, p.rD, (1 - p.wE) / p.wE, p.Tc),
      tipikusHibak: (p) => {
        const de = (1 - p.wE) / p.wE
        return [
          { ertek: mmIIRE(p.rU, p.rD, de), uzenet: 'Ez az adó nélküli MM II.; adóval a felár az (1 − TC)-szeresére csökken.' },
          { ertek: p.rU, uzenet: 'Ez a tőkeáttétel nélküli hozam; a tőkeáttétel miatt jön rá a felár.' },
          { ertek: adosRE(p.rU, p.rD, 1 - p.wE, p.Tc), uzenet: H.deDv },
          { ertek: p.rU + de * (p.rU - p.rD) * p.Tc, uzenet: 'A szorzó (1 − TC), nem TC.' },
        ]
      },
      levezetes: (p) => {
        const de = (1 - p.wE) / p.wE
        return `rE = rU + D/E × (rU − rD) × (1 − TC) = ${pct(p.rU)} + ${sz(de)} × (${pct(p.rU)} − ${pct(p.rD)}) × ${sz(1 - p.Tc)} = ${pct(adosRE(p.rU, p.rD, de, p.Tc))}`
      },
    },
    {
      tipus: 'szam',
      key: 'wacc',
      formulaId: '8.8',
      kerdes: 'Mekkora az adóval módosított tőkeköltség (WACC*)?',
      egyseg: '%',
      ertek: (p, e) => modositottWacc(p.wE, e('rE'), 1 - p.wE, p.rD, p.Tc),
      tipikusHibak: (p, e) => {
        const wD = 1 - p.wE
        return [
          { ertek: modositottWacc(p.wE, e('rE'), wD, p.rD, 0), uzenet: 'A hitel költségét (1 − TC)-vel kell szorozni.' },
          { ertek: p.rU, uzenet: 'Ez a tőkeáttétel nélküli hozam; adóval a tőkeköltség ennél kisebb.' },
          { ertek: modositottWacc(wD, e('rE'), p.wE, p.rD, p.Tc), uzenet: H.felcserelt },
          { ertek: p.wE * e('rE'), uzenet: 'Csak a saját tőke tagját számoltad ki; a hitel adózás utáni tagja hiányzik.' },
          { ertek: modositottWacc(p.wE, mmIIRE(p.rU, p.rD, wD / p.wE), wD, p.rD, p.Tc), uzenet: 'Az rE-t az adós képlettel kell számolni, az (1 − TC) szorzóval.' },
        ]
      },
      levezetes: (p, e) => `WACC* = ${sz(p.wE)} × ${pct(e('rE'))} + ${sz(1 - p.wE)} × ${pct(p.rD)} × ${sz(1 - p.Tc)} = ${pct(modositottWacc(p.wE, e('rE'), 1 - p.wE, p.rD, p.Tc))}`,
    },
  ],
  diasPeldak: [
    { forras: '8.7 Példa (szem. adó 4)', p: { rU: 0.12, rD: 0.08, wE: 0.8, Tc: 0.35 }, vart: { rE: '12,65%', wacc: '11,16%' } },
    { forras: '8.7 Példa (szem. adó 4)', p: { rU: 0.12, rD: 0.08, wE: 0.5, Tc: 0.35 }, vart: { rE: '14,6%', wacc: '9,9%' } },
  ],
}

// ---------- 8.8 ----------

type Csillag = { ceg: string; nft: number; be: number; D: number; rD: number; rE: number; Tc: number; konyvE?: number }

export const modositottTokekoltseg: Sablon<Csillag> = {
  id: 'modositott-tokekoltseg',
  csalad: 'ado',
  cim: 'WACC* piaci mérlegből',
  felismeresek: [{ elott: '', helyes: 'F22', zavarok: ['F21', 'F15', 'F20'] }],
  general: (r) => {
    const nft = r.lepeskoz(20, 80, 10)
    const be = r.lepeskoz(160, 480, 20)
    return {
      ceg: r.valaszt(CEGEK),
      nft,
      be,
      D: r.lepeskoz(40, 200, 10),
      rD: r.lepeskoz(0.04, 0.09, 0.005),
      rE: r.lepeskoz(0.12, 0.26, 0.005),
      Tc: r.valaszt(ADOKULCSOK),
      konyvE: r.esely(0.5) ? r.lepeskoz(60, 200, 10) : undefined,
    }
  },
  ervenyes: (p) => {
    const w = p.D / (p.nft + p.be)
    return w > 0.1 && w < 0.7 && Math.abs(w - 0.5) > 0.05 && p.konyvE !== p.nft + p.be - p.D
  },
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          'A táblázat a vállalat piaci értékű mérlege.',
          `A saját tőke hozama ${pct(p.rE)}, a hitelek kamata ${pct(p.rD)}.`,
          `A vállalati adókulcs ${pct(p.Tc)}.`,
          p.konyvE !== undefined ? `A saját tőke könyv szerinti értéke ${sz(p.konyvE)} M USD.` : undefined,
          v === 3 && p.konyvE === undefined ? zavaroAdat(r) : undefined,
        ]),
      ],
      tabla: merlegTabla(p.nft, p.be, p.D),
      kerdesek: ['Mennyi az adóval módosított tőkeköltség (WACC*)?'],
    }
  },
  zh: () => ({ kulcsok: ['wacc'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'wD',
      formulaId: '8.8',
      kerdes: 'Mekkora az adósság súlya (D/V)?',
      egyseg: 'tizedes',
      tures: { abs: 0.0005 },
      ertek: (p) => p.D / (p.nft + p.be),
      tipikusHibak: (p) => [{ ertek: p.D / (p.nft + p.be - p.D), uzenet: 'Ez a D/E arány; a súlyhoz a teljes értékkel osztunk.' }],
      levezetes: (p) => `D/V = ${sz(p.D)} / ${sz(p.nft + p.be)} = ${sz(p.D / (p.nft + p.be))}`,
    },
    {
      tipus: 'szam',
      key: 'wacc',
      formulaId: '8.8',
      kerdes: 'Mekkora az adóval módosított tőkeköltség (WACC*)?',
      egyseg: '%',
      ertek: (p, e) => modositottWacc(1 - e('wD'), p.rE, e('wD'), p.rD, p.Tc),
      tipikusHibak: (p, e) => {
        const wD = e('wD')
        const hibak: TipikusHiba[] = [
          { ertek: modositottWacc(1 - wD, p.rE, wD, p.rD, 0), uzenet: 'A hitel költségét (1 − TC)-vel kell szorozni.' },
          { ertek: modositottWacc(wD, p.rE, 1 - wD, p.rD, p.Tc), uzenet: H.felcserelt },
          { ertek: (p.rE + p.rD * (1 - p.Tc)) / 2, uzenet: H.atlag },
          { ertek: p.rE, uzenet: 'Ez a saját tőke hozama; a tőkeköltségben a hitel adózás utáni költsége is szerepel, súlyozva.' },
          { ertek: (1 - wD) * p.rE, uzenet: 'Csak a saját tőke tagját számoltad ki; a hitel adózás utáni tagja hiányzik.' },
        ]
        if (p.konyvE !== undefined) {
          const w = p.D / (p.D + p.konyvE)
          hibak.push({ ertek: modositottWacc(1 - w, p.rE, w, p.rD, p.Tc), uzenet: 'A súlyok a piaci értékből jönnek, nem a könyv szerinti saját tőkéből.' })
        }
        return hibak
      },
      levezetes: (p, e) => `WACC* = ${sz(1 - e('wD'))} × ${pct(p.rE)} + ${sz(e('wD'))} × ${pct(p.rD)} × ${sz(1 - p.Tc)} = ${pct(modositottWacc(1 - e('wD'), p.rE, e('wD'), p.rD, p.Tc))}`,
    },
  ],
  diasPeldak: [{ forras: '8.8 Példa (szem. adó 2)', p: { nft: 40, be: 280, D: 80, rD: 0.05, rE: 0.25, Tc: 0.3 }, vart: { wD: '0,25', wacc: '19,625%' } }],
}
