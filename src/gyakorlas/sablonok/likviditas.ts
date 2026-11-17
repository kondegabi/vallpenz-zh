// 2. ZH, 9. fejezet: készpénz- és likviditásmenedzsment. A feladatok a Készpénz-diasor példái (13. és 17. dia)
// mintájára készültek; a számok véletlenek, a képletek a képlettárból jönnek.

import { atlagosPenzallomanyMillerOrr, baumolC, baumolL, millerOrrC, millerOrrU } from '../../calc/likviditas.ts'
import { pct, sz } from '../formaz.ts'
import type { Rng, Sablon, TipikusHiba } from '../tipusok.ts'
import { keretbe } from './kozos.ts'

const CEGEK = [
  'a Vulkán Gépgyár Nyrt.',
  'a Mecsek Kereskedelmi Zrt.',
  'a Hortobágy Agrár Kft.',
  'a Dráva Logisztika Zrt.',
  'az Alpok Szállítmányozó Kft.',
  'a Kékes Távhő Zrt.',
  'a Nyírség Élelmiszer Kft.',
  'az Ister Gyógyszer Zrt.',
] as const

function bevezetok(ceg: string): [string, string, string] {
  return [`Egy elemző ${ceg} pénzgazdálkodását vizsgálja.`, `A pénzügyi vezető ${ceg} likviditását tervezi.`, `Egy tanácsadó ${ceg} adatait gyűjtötte össze.`]
}

function zavaroAdat(r: Rng): string {
  return r.valaszt([
    `A vállalat tavalyi árbevétele ${sz(r.lepeskoz(20, 300, 5))} millió USD volt.`,
    `A vállalat rövid lejáratú hitelének kamata évi ${pct(r.lepeskoz(0.04, 0.12, 0.005))}.`,
    `A vállalat készleteinek értéke ${sz(r.lepeskoz(50, 900, 10))} ezer USD.`,
  ])
}

// ---------- 9.1 Baumol–Allais–Tobin ----------

const IDOSZAK = { napi: { db: 365, nev: 'napi' }, heti: { db: 52, nev: 'heti' }, havi: { db: 12, nev: 'havi' }, eves: { db: 1, nev: 'éves' } } as const

type Baumol = { ceg: string; mod: keyof typeof IDOSZAK; osszeg: number; r: number; F: number; kerdes: 'C' | 'L' }

function eviT(p: Baumol): number {
  return p.osszeg * IDOSZAK[p.mod].db
}

export const baumolSablon: Sablon<Baumol> = {
  id: 'baumol',
  csalad: 'likvid',
  cim: 'Baumol–Allais–Tobin-modell',
  felismeresek: [{ elott: '', helyes: 'F23', zavarok: ['F24', 'F25', 'F20'] }],
  general: (r) => {
    const mod = r.valaszt(['napi', 'napi', 'heti', 'havi', 'eves'] as const)
    const osszeg = mod === 'napi' ? r.lepeskoz(50, 800, 10) : mod === 'heti' ? r.lepeskoz(500, 5000, 100) : mod === 'havi' ? r.lepeskoz(2000, 20000, 500) : r.lepeskoz(20000, 300000, 5000)
    return { ceg: r.valaszt(CEGEK), mod, osszeg, r: r.lepeskoz(0.02, 0.1, 0.005), F: r.lepeskoz(5, 60, 5), kerdes: r.esely(0.6) ? 'C' : 'L' }
  },
  ervenyes: (p) => baumolL(eviT(p), p.F, p.r) * 365 > 2,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const kiaramlas = p.mod === 'eves' ? `A vállalat éves pénzigénye egyenletesen ${sz(p.osszeg)} USD.` : `A vállalat ${IDOSZAK[p.mod].nev} pénzkiáramlása egyenletesen ${sz(p.osszeg)} USD.`
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          kiaramlas,
          `A pénz elhelyezésére használt értékpapírok éves hozama ${pct(p.r)}.`,
          `A pénzállomány feltöltésének tranzakciós költsége alkalmanként ${sz(p.F)} USD.`,
          v === 3 ? zavaroAdat(r) : undefined,
        ]),
      ],
      kerdesek: ['Mekkora az optimális felveendő pénzösszeg?', 'Hány naponként kell a pénzállományt feltölteni?'],
    }
  },
  zh: (p) =>
    p.kerdes === 'C'
      ? { kulcsok: ['C'], kerdesek: ['Mekkora az optimális felveendő pénzösszeg?'] }
      : { kulcsok: ['Lnap'], kerdesek: ['Hány naponként kell a pénzállományt feltölteni?'] },
  lepesek: [
    {
      tipus: 'szam',
      key: 'T',
      formulaId: '9.1',
      kerdes: 'Mekkora az éves pénzigény (T)?',
      egyseg: 'USD',
      mikor: (p) => p.mod !== 'eves',
      ertek: eviT,
      tipikusHibak: (p) => [{ ertek: p.osszeg, uzenet: `Ez a ${IDOSZAK[p.mod].nev} összeg; az éves hozamhoz éves pénzigény kell: × ${IDOSZAK[p.mod].db}.` }],
      levezetes: (p) => `T = ${IDOSZAK[p.mod].db} × ${sz(p.osszeg)} = ${sz(eviT(p))} USD`,
    },
    {
      tipus: 'szam',
      key: 'C',
      formulaId: '9.1',
      kerdes: 'Mekkora az optimális felveendő pénzösszeg (C_opt)?',
      egyseg: 'USD',
      tures: { abs: 0.5, rel: 0.001 },
      ertek: (p) => baumolC(eviT(p), p.F, p.r),
      tipikusHibak: (p) => {
        const C = baumolC(eviT(p), p.F, p.r)
        const hibak: TipikusHiba[] = [
          { ertek: C / Math.SQRT2, uzenet: 'A 2-es szorzó kimaradt: C = √(2 × T × F / r).' },
          { ertek: C / 2, uzenet: 'Ez az átlagos pénzállomány (C / 2); a kérdés az egyszerre felveendő összeg.' },
          { ertek: C / 10, uzenet: 'A hozamot százalékként (pl. 5) írtad be; tizedes törtként kell (0,05).' },
          { ertek: (2 * eviT(p) * p.F) / p.r, uzenet: 'A négyzetgyökvonás kimaradt.' },
          { ertek: Math.sqrt(2 * eviT(p) * p.F) / p.r, uzenet: 'Az r is a gyök alatt van: C = √(2 × T × F / r).' },
          { ertek: 2 * Math.sqrt((eviT(p) * p.F) / p.r), uzenet: 'A 2 a gyök alatt van: C = √(2 × T × F / r).' },
        ]
        if (p.mod !== 'eves') hibak.push({ ertek: baumolC(p.osszeg, p.F, p.r), uzenet: `A ${IDOSZAK[p.mod].nev} összeggel számoltál; az éves hozamhoz éves pénzigény (T) kell.` })
        return hibak
      },
      levezetes: (p) => `C = √(2 × ${sz(eviT(p))} × ${sz(p.F)} / ${sz(p.r)}) = ${sz(baumolC(eviT(p), p.F, p.r), 2)} USD`,
    },
    {
      tipus: 'szam',
      key: 'L',
      formulaId: '9.1',
      latexIdx: 1,
      kerdes: 'Mekkora az optimális időköz években (L_opt)?',
      egyseg: 'tizedes',
      tures: { abs: 0.0005 },
      ertek: (p) => baumolL(eviT(p), p.F, p.r),
      tipikusHibak: (p) => [{ ertek: Math.sqrt(p.F / (p.r * eviT(p))), uzenet: 'A 2-es szorzó kimaradt: L = √(2F / (r × T)).' }],
      levezetes: (p) => `L = √(2 × ${sz(p.F)} / (${sz(p.r)} × ${sz(eviT(p))})) = ${sz(baumolL(eviT(p), p.F, p.r))} év`,
    },
    {
      tipus: 'szam',
      key: 'Lnap',
      formulaId: '9.1',
      latexIdx: 1,
      kerdes: 'Hány naponként kell feltölteni (L_opt napokban)?',
      egyseg: 'tizedes',
      // az előző lépés ±0,0005 év tűrése napokban ±0,18 nap
      tures: { abs: 0.2 },
      ertek: (_p, e) => e('L') * 365,
      tipikusHibak: (p, e) => {
        const T = eviT(p)
        const C = baumolC(T, p.F, p.r)
        return [
          { ertek: T / C, uzenet: 'Ez az évi feltöltések száma (T / C); a kérdés a két feltöltés közötti napok száma: 365 / (T / C).' },
          { ertek: e('L') * 12, uzenet: 'Ez hónapokban van; napokban × 365.' },
          { ertek: Math.sqrt(p.F / (p.r * T)) * 365, uzenet: 'A 2-es szorzó kimaradt: L = √(2F / (r × T)).' },
          { ertek: ((2 * p.F) / (p.r * T)) * 365, uzenet: 'A négyzetgyökvonás kimaradt.' },
          { ertek: 2 * Math.sqrt(p.F / (p.r * T)) * 365, uzenet: 'A 2 a gyök alatt van: L = √(2F / (r × T)).' },
        ]
      },
      levezetes: (_p, e) => `${sz(e('L'))} év × 365 = ${sz(e('L') * 365, 1)} nap`,
    },
  ],
  diasPeldak: [
    { forras: '9.1 Példa (13. dia)', p: { mod: 'napi', osszeg: 100, r: 0.05, F: 10, kerdes: 'L' }, vart: { T: '36500', C: '3821', L: '0,1047', Lnap: '38,2' } },
  ],
}

// ---------- 9.2 Miller–Orr ----------

type MillerOrr = { ceg: string; idoszak: 'napi' | 'heti' | 'havi'; L: number; F: number; sigma: number; r: number; kerdes: 'C' | 'U' | 'atlag' }

function moC(p: MillerOrr): number {
  return millerOrrC(p.L, p.F, p.sigma, p.r)
}

export const millerOrrSablon: Sablon<MillerOrr> = {
  id: 'miller-orr',
  csalad: 'likvid',
  cim: 'Miller–Orr-modell',
  felismeresek: [{ elott: '', helyes: 'F24', zavarok: ['F23', 'F26', 'F19'] }],
  general: (r) => {
    const idoszak = r.valaszt(['havi', 'havi', 'heti', 'napi'] as const)
    const rr = idoszak === 'havi' ? r.lepeskoz(0.005, 0.02, 0.001) : idoszak === 'heti' ? r.lepeskoz(0.0005, 0.003, 0.0001) : r.lepeskoz(0.0001, 0.0004, 0.00001)
    return {
      ceg: r.valaszt(CEGEK),
      idoszak,
      L: r.lepeskoz(50, 2000, 50),
      F: r.lepeskoz(5, 50, 5),
      sigma: r.lepeskoz(100, 3000, 50),
      r: rr,
      kerdes: r.valaszt(['C', 'C', 'U', 'atlag'] as const),
    }
  },
  ervenyes: (p) => moC(p) - p.L > 20,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, bevezetok(p.ceg), [
          `A vállalat minimális pénzállománya ${sz(p.L)} USD.`,
          `Az értékpapír eladásának tranzakciós költsége ${sz(p.F)} USD.`,
          `A pénzáramlás ${p.idoszak} szórása ${sz(p.sigma)} USD, a ${p.idoszak} hozam ${pct(p.r, 3)}.`,
          v === 3 ? zavaroAdat(r) : undefined,
        ]),
      ],
      kerdesek: [
        'Mekkora a pénzállomány célértéke?',
        ...(p.kerdes === 'U' ? ['Mekkora a felső korlát?'] : p.kerdes === 'atlag' ? ['Mekkora az átlagos pénzállomány?'] : []),
      ],
    }
  },
  zh: (p) =>
    p.kerdes === 'C'
      ? { kulcsok: ['C'] }
      : p.kerdes === 'U'
        ? { kulcsok: ['U'], kerdesek: ['Mekkora a felső korlát?'] }
        : { kulcsok: ['atlag'], kerdesek: ['Mekkora az átlagos pénzállomány?'] },
  lepesek: [
    {
      tipus: 'szam',
      key: 'C',
      formulaId: '9.2',
      kerdes: 'Mekkora a pénzállomány célértéke (C*)?',
      egyseg: 'USD',
      tures: { abs: 0.5, rel: 0.001 },
      ertek: moC,
      tipikusHibak: (p) => {
        const resz = (3 * p.F * p.sigma * p.sigma) / (4 * p.r)
        return [
          { ertek: Math.cbrt(resz), uzenet: 'Az alsó korlát (L) kimaradt: C* = L + ∛(…).' },
          { ertek: p.L + Math.sqrt(resz), uzenet: 'Köbgyök kell, nem négyzetgyök.' },
          { ertek: p.L + Math.cbrt((3 * p.F * p.sigma) / (4 * p.r)), uzenet: 'A szórás négyzete (σ²) kell, nem a szórás.' },
          { ertek: p.L + Math.cbrt((4 * p.F * p.sigma * p.sigma) / (3 * p.r)), uzenet: 'A 3 és a 4 helyet cserélt: ∛(3Fσ² / (4r)).' },
        ]
      },
      levezetes: (p) => `C* = ${sz(p.L)} + ∛(3 × ${sz(p.F)} × ${sz(p.sigma)}² / (4 × ${sz(p.r, 5)})) = ${sz(moC(p), 2)} USD`,
    },
    {
      tipus: 'szam',
      key: 'U',
      formulaId: '9.2',
      latexIdx: 1,
      kerdes: 'Mekkora a felső korlát (U*)?',
      egyseg: 'USD',
      tures: { abs: 1.5, rel: 0.001 },
      mikor: (p) => p.kerdes === 'U',
      ertek: (p) => millerOrrU(moC(p), p.L),
      tipikusHibak: (p) => {
        const C = moC(p)
        return [
          { ertek: 3 * C, uzenet: 'A −2L tag kimaradt: U* = 3C* − 2L.' },
          { ertek: 3 * C - p.L, uzenet: 'Kétszer kell levonni az alsó korlátot: U* = 3C* − 2L.' },
          { ertek: 3 * (C - p.L), uzenet: 'Az elején álló L kimaradt: U* = L + 3 × (C* − L).' },
          { ertek: 2 * C - p.L, uzenet: 'A célérték nem a sáv közepe: U* − C* kétszerese a C* − L-nek, ezért U* = 3C* − 2L.' },
        ]
      },
      levezetes: (p) => `U* = 3 × ${sz(moC(p), 2)} − 2 × ${sz(p.L)} = ${sz(millerOrrU(moC(p), p.L), 2)} USD`,
    },
    {
      tipus: 'szam',
      key: 'atlag',
      formulaId: '9.2',
      latexIdx: 2,
      kerdes: 'Mekkora az átlagos pénzállomány?',
      egyseg: 'USD',
      tures: { abs: 0.5, rel: 0.001 },
      mikor: (p) => p.kerdes === 'atlag',
      ertek: (p) => atlagosPenzallomanyMillerOrr(moC(p), p.L),
      tipikusHibak: (p) => {
        const C = moC(p)
        return [
          { ertek: (p.L + millerOrrU(C, p.L)) / 2, uzenet: 'Nem a két korlát átlaga: a célérték nem a sáv közepén van, az átlag (4C* − L) / 3.' },
          { ertek: (4 * C + p.L) / 3, uzenet: 'Az L-et le kell vonni: (4C* − L) / 3.' },
          { ertek: C / 2, uzenet: 'A C / 2 a Baumol-modell átlaga; itt (4C* − L) / 3.' },
          { ertek: (C + p.L) / 2, uzenet: 'Nem a célérték és az alsó korlát átlaga: (4C* − L) / 3.' },
        ]
      },
      levezetes: (p) => `(4 × ${sz(moC(p), 2)} − ${sz(p.L)}) / 3 = ${sz(atlagosPenzallomanyMillerOrr(moC(p), p.L), 2)} USD`,
    },
  ],
  diasPeldak: [
    { forras: '9.2 Példa (17. dia)', p: { idoszak: 'havi', L: 100, F: 10, sigma: 200, r: 0.01, kerdes: 'U' }, vart: { C: '411', U: '1032' } },
    { forras: '9.2 Példa (17. dia), átlag', p: { idoszak: 'havi', L: 100, F: 10, sigma: 200, r: 0.01, kerdes: 'atlag' }, vart: { atlag: '514' } },
  ],
}
