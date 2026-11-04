// CAPM család (5. fejezet): A1 elvárt hozam, A2 visszafejtés, A3 árazás, A4 két helyesen árazott eszköz.

import {
  arazas,
  betaVissza,
  capm,
  mrp,
  mrpBetaKulonbsegbol,
  mrpVissza,
  meredekseg,
  rfKetEszkozbol,
  rfVisszaErMbol,
  rfVisszaMRPbol,
} from '../../calc/capm.ts'
import { pct, sz } from '../formaz.ts'
import type { Getter, Rng, Sablon } from '../tipusok.ts'
import { betuNevelovel, CAPM_BEVEZETOK, kerekit4, keretbe, nagyKezdet, RESZVENY_BETUK } from './kozos.ts'

type PiacMod = 'ErM' | 'MRP'

/** Célzott üzenetek a fejezet csapdájához (E(rM) vagy MRP). */
const H = {
  piacHozam: 'Ez a piac várható hozama; a prémium ennél rf-fel kisebb: MRP = E(rM) − rf.',
  ErMmintMRP: 'A piac hozamával (E(rM)) számoltál a prémium helyett; az MRP = E(rM) − rf.',
  MRPbolLevon: 'A megadott érték már a prémium (MRP); nem kell belőle még egyszer kivonni az rf-et.',
  premiumNemHozam: 'Ez a piaci kockázati prémium; a piac várható hozama E(rM) = rf + MRP.',
}

/** A CAPM-mel számolt elvárt hozam tipikus hibái: a piaci adat fajtája szerinti csapda, és a képlet egy-egy tagjának kihagyása. */
export function capmHibak(p: { mod: PiacMod; rf: number; beta: number; ErM: number; MRP: number }) {
  const m = p.mod === 'ErM' ? p.ErM - p.rf : p.MRP
  return [
    { ertek: p.rf + p.beta * (p.rf + m), uzenet: p.mod === 'ErM' ? H.ErMmintMRP : 'A prémium helyett a piac teljes hozamával (rf + MRP) szoroztál; a bétával csak az MRP-t kell szorozni.' },
    ...(p.mod === 'MRP' ? [{ ertek: p.rf + p.beta * (p.MRP - p.rf), uzenet: H.MRPbolLevon }] : []),
    { ertek: p.beta * m, uzenet: 'Ez csak a kockázati prémium (β × MRP); a kockázatmentes hozamot is hozzá kell adni.' },
    { ertek: p.rf + m, uzenet: 'A bétával nem szoroztál: rf + MRP a piac várható hozama, nem a részvényé.' },
    { ertek: p.beta * (p.rf + m), uzenet: 'A piac teljes hozamát szoroztad bétával; csak a prémiumot kell: rf + β × (E(rM) − rf).' },
    { ertek: p.beta * p.rf + m, uzenet: 'A bétával a prémiumot kell szorozni, nem a kockázatmentes hozamot.' },
  ]
}

/** A piaci adat mondatrésze: E(rM) vagy MRP, két megfogalmazásban. Ez a fejezet fő csapdája. */
function piacSzoveg(mod: PiacMod, ErM: number, MRP: number, v: number): string {
  if (mod === 'ErM') {
    return v % 2 === 0 ? `a piaci portfólió várható hozama ${pct(ErM)}` : `a piac várható hozama ${pct(ErM)}`
  }
  return v % 2 === 0
    ? `a piaci kockázati prémium ${pct(MRP)}`
    : `a piaci portfólió várhatóan ${pct(MRP)} többlethozamot kínál a kockázatmentes hozam fölött`
}

function mrpLevezetes(ErM: number, rf: number): string {
  return `MRP = E(rM) − rf = ${sz(ErM)} − ${sz(rf)} = ${sz(ErM - rf)} → ${pct(ErM - rf)}`
}

function piacLepes<P extends { mod: PiacMod; ErM: number; rf: number }>(
  mikor: (p: P) => boolean,
  formulaId = '5.1',
) {
  return {
    tipus: 'szam' as const,
    key: 'mrp',
    formulaId,
    kerdes: 'Mekkora a piaci kockázati prémium (MRP)?',
    egyseg: '%' as const,
    mikor: (p: P) => p.mod === 'ErM' && mikor(p),
    ertek: (p: P) => mrp(p.ErM, p.rf),
    tipikusHibak: (p: P) => [{ ertek: p.ErM, uzenet: H.piacHozam }],
    levezetes: (p: P) => mrpLevezetes(p.ErM, p.rf),
  }
}

function aMRP(p: { mod: PiacMod; MRP: number }, e: Getter): number {
  return p.mod === 'ErM' ? e('mrp') : p.MRP
}

function piacGeneral(r: Rng, rfMin = 0.01, rfMax = 0.06) {
  const rf = r.lepeskoz(rfMin, rfMax, 0.005)
  const MRP = r.lepeskoz(0.04, 0.09, 0.005)
  return { rf, MRP, ErM: kerekit4(rf + MRP), mod: (r.esely(0.5) ? 'ErM' : 'MRP') as PiacMod }
}

// ---------------- A1: elvárt hozam ----------------

type P1 = {
  betu: string
  rf: number
  beta: number
  MRP: number
  ErM: number
  mod: PiacMod
  zavaro?: 'szoras' | 'mult'
  zavaroErtek: number
  /** a 4. ea 29. diájának példája (nyitott diahiba: a szöveg r_f = 3%, a számítás 0,04) */
  dia?: boolean
}

/** 4. ea, 29. dia: β = 1,3, r_f = 3%, MRP = 6%; a dia számítása 0,04-gyel megy (11,8%). */
const DIA29 = { rf: 0.03, MRP: 0.06, beta: 1.3, diaRf: 0.04 }

const DIA29_UZENET = (v: number) =>
  `Nyitott diahiba (4. ea, 29. dia): a dia szövege r_f = 3%-ot ad (${pct(capm(DIA29.rf, DIA29.beta, DIA29.MRP))}), a számítása viszont 0,04-gyel megy (${pct(v)}). Amíg az oktató nem dönt, mindkettőt elfogadjuk.`

export const capmElvart: Sablon<P1> = {
  id: 'capm-elvart',
  csalad: 'capm',
  cim: 'Elvárt hozam a CAPM-ből',
  felismeresek: [{ elott: '', helyes: 'F07', zavarok: ['F08', 'F09', 'F13'] }],
  general: (r) => {
    const p: P1 = {
      betu: r.valaszt(RESZVENY_BETUK),
      beta: r.lepeskoz(0.4, 2, 0.05),
      ...piacGeneral(r),
      zavaro: r.esely(0.5) ? r.valaszt(['szoras', 'mult'] as const) : undefined,
      zavaroErtek: r.lepeskoz(0.12, 0.42, 0.01),
    }
    // néha a dia saját példája: erre épül a nyitott diahiba
    if (r.esely(0.12)) return { ...p, rf: DIA29.rf, MRP: DIA29.MRP, ErM: kerekit4(DIA29.rf + DIA29.MRP), beta: DIA29.beta, mod: 'MRP', zavaro: undefined, dia: true }
    return p
  },
  // β = 1-nél az elvárt hozam maga a piaci hozam: a tipikus hibák egybeesnének a helyessel
  ervenyes: (p) => Math.abs(p.beta - 1) >= 0.05,
  szoveg: (p, r) => {
    if (p.dia) {
      // a 4. ea 29. diájának szövege
      return {
        valtozat: 'dia29',
        bekezdesek: [`Tegyük fel, hogy egy vállalat részvényének bétája ${sz(DIA29.beta)}. A kockázatmentes hozam ${pct(DIA29.rf)}, a piaci kockázati prémium ${pct(DIA29.MRP)}.`],
        kerdesek: ['Mekkora a saját tőke költsége?'],
      }
    }
    const v = r.egesz(0, 3)
    const b = betuNevelovel(p.betu)
    const piac = piacSzoveg(p.mod, p.ErM, p.MRP, v)
    // a 4. keretben mindig van zavaró adat
    const zavaroTipus = p.zavaro ?? (v === 3 ? 'mult' : undefined)
    const zavaro =
      zavaroTipus === 'szoras'
        ? `${nagyKezdet(b)} részvény hozamának szórása ${pct(p.zavaroErtek)}.`
        : zavaroTipus === 'mult'
          ? `${nagyKezdet(b)} részvény hozama az elmúlt évben ${pct(p.zavaroErtek)} volt.`
          : undefined
    const adatok = [
      [`Az állampapírok hozama ${pct(p.rf)}, ${piac}.`, `${nagyKezdet(b)} részvény bétája ${sz(p.beta)}.`],
      [`Egy befektető ${b} részvényt elemzi, amelynek bétája ${sz(p.beta)}.`, `A kockázatmentes kamatláb ${pct(p.rf)}, ${piac}.`],
      [`${nagyKezdet(piac)}, a kincstárjegyek hozama ${pct(p.rf)}.`, `${nagyKezdet(b)} részvény bétája ${sz(p.beta)}.`],
      [`Egy alapkezelő ${b} részvényt venné meg a portfóliójába.`, `${nagyKezdet(b)} részvény bétája ${sz(p.beta)}; ${piac}, a kockázatmentes hozam ${pct(p.rf)}.`],
    ][v]
    if (zavaro) adatok.splice(r.egesz(1, adatok.length), 0, zavaro)
    return {
      valtozat: `k${v}`,
      bekezdesek: [adatok.join(' ')],
      kerdesek: [
        [
          `Mekkora ${b} részvény elvárt hozama a CAPM szerint?`,
          'Milyen hozamot vár el a befektető a részvénytől?',
          `Mekkora ${b} részvény elvárt hozama?`,
          'Milyen hozamot kell az alapkezelőnek a részvénytől elvárnia?',
        ][v],
      ],
    }
  },
  zh: () => ({ kulcsok: ['Er'] }),
  lepesek: [
    piacLepes<P1>(() => true),
    {
      tipus: 'szam',
      key: 'Er',
      formulaId: '5.1',
      kerdes: 'Mekkora a részvény elvárt hozama?',
      egyseg: '%',
      ertek: (p, e) => capm(p.rf, p.beta, aMRP(p, e)),
      tipikusHibak: (p) => capmHibak(p),
      nyitott: (p) => (p.dia ? [{ ertek: capm(DIA29.diaRf, DIA29.beta, DIA29.MRP), uzenet: DIA29_UZENET(capm(DIA29.diaRf, DIA29.beta, DIA29.MRP)) }] : []),
      levezetes: (p, e) => {
        const m = aMRP(p, e)
        const v = capm(p.rf, p.beta, m)
        return `E(r) = rf + β × MRP = ${sz(p.rf)} + ${sz(p.beta)} × ${sz(m)} = ${sz(v)} → ${pct(v)}`
      },
    },
  ],
  diasPeldak: [
    { forras: '5.1 Példa (5. ea)', p: { rf: 0.03, ErM: 0.12, beta: 0.7, mod: 'ErM' }, vart: { mrp: '9%', Er: '9,3%' } },
    { forras: '7.2 Ha mindkét módszer adatai adottak (4. ea), CAPM-ág', p: { rf: 0.06, MRP: 0.07, beta: 1.2, mod: 'MRP' }, vart: { Er: '14,4%' } },
    { forras: 'Hibák a diákon: 4. ea, 29. dia (r_f = 3%)', p: { rf: 0.03, MRP: 0.06, beta: 1.3, mod: 'MRP' }, vart: { Er: '10,8%' } },
  ],
}

// ---------------- A2: visszafejtés ----------------

type Ismeretlen = 'beta' | 'rf' | 'mrp'
type P2 = { betu: string; rf: number; beta: number; MRP: number; ErM: number; Er: number; mod: PiacMod; ismeretlen: Ismeretlen; ErMis: boolean }

export const capmVisszafejtes: Sablon<P2> = {
  id: 'capm-visszafejtes',
  csalad: 'capm',
  cim: 'CAPM visszafejtése (β, r_f vagy MRP)',
  felismeresek: [{ elott: '', helyes: 'F08', zavarok: ['F07', 'F10', 'F09'] }],
  general: (r) => {
    const piac = piacGeneral(r)
    const beta = r.lepeskoz(0.5, 2, 0.1)
    const ismeretlen = r.valaszt(['beta', 'rf', 'mrp'] as const)
    return {
      betu: r.valaszt(RESZVENY_BETUK),
      beta,
      ...piac,
      // MRP-visszafejtésnél a piaci adat maga az ismeretlen
      mod: ismeretlen === 'mrp' ? 'MRP' : piac.mod,
      Er: kerekit4(piac.rf + beta * piac.MRP),
      ismeretlen,
      ErMis: r.esely(0.4),
    }
  },
  // β = 1 közelében: E(rM)-ből rf nem határozható meg, MRP mellett pedig a visszafejtés triviális
  ervenyes: (p) => Math.abs(p.beta - 1) >= (p.ismeretlen === 'rf' && p.mod === 'ErM' ? 0.15 : 0.05),
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const b = betuNevelovel(p.betu)
    const B = nagyKezdet(b)
    const piac = nagyKezdet(piacSzoveg(p.mod, p.ErM, p.MRP, r.egesz(0, 1))) + '.'
    // a 4. keretben mindig van zavaró adat
    const zavaro = v === 3 ? `${B} részvény hozamának szórása ${pct(r.lepeskoz(0.15, 0.45, 0.01))}.` : undefined
    const valtozat = `k${v}`
    if (p.ismeretlen === 'beta') {
      return {
        valtozat,
        bekezdesek: [keretbe(v, CAPM_BEVEZETOK, [`${B} részvény elvárt hozama ${pct(p.Er)}.`, `A kockázatmentes hozam ${pct(p.rf)}.`, piac, zavaro])],
        kerdesek: [`Mekkora ${b} részvény bétája?`],
      }
    }
    if (p.ismeretlen === 'rf') {
      return {
        valtozat,
        bekezdesek: [keretbe(v, CAPM_BEVEZETOK, [`${B} részvény bétája ${sz(p.beta)}.`, `${B} részvény helyesen árazott, várható hozama ${pct(p.Er)}.`, piac, zavaro])],
        kerdesek: ['Mekkora a kockázatmentes hozam?'],
      }
    }
    return {
      valtozat,
      bekezdesek: [keretbe(v, CAPM_BEVEZETOK, [`${B} részvény helyesen árazott, bétája ${sz(p.beta)}.`, `${B} részvény várható hozama ${pct(p.Er)}.`, `Az állampapírok hozama ${pct(p.rf)}.`, zavaro])],
      kerdesek: ['Mekkora a piaci kockázati prémium?', ...(p.ErMis ? ['Mekkora a piaci portfólió várható hozama?'] : [])],
    }
  },
  zh: (p) => ({ kulcsok: p.ismeretlen === 'beta' ? ['beta'] : p.ismeretlen === 'rf' ? ['rf'] : ['mrp', ...(p.ErMis ? ['ErM'] : [])] }),
  lepesek: [
    piacLepes<P2>((p) => p.ismeretlen === 'beta'),
    {
      tipus: 'szam',
      key: 'beta',
      formulaId: '5.1',
      kerdes: 'Mekkora a részvény bétája?',
      egyseg: 'tizedes',
      mikor: (p) => p.ismeretlen === 'beta',
      ertek: (p, e) => betaVissza(p.Er, p.rf, aMRP(p, e)),
      tipikusHibak: (p, e) => {
        const m = aMRP(p, e)
        return [
          p.mod === 'ErM'
            ? { ertek: (p.Er - p.rf) / p.ErM, uzenet: 'E(rM)-mel osztottál; a prémiummal (E(rM) − rf) kell.' }
            : { ertek: (p.Er - p.rf) / (p.MRP - p.rf), uzenet: H.MRPbolLevon },
          { ertek: p.Er / m, uzenet: 'A kockázatmentes hozamot elfelejtetted levonni: β = (E(r) − rf) / MRP.' },
          { ertek: m / (p.Er - p.rf), uzenet: 'Fordítva osztottál: β = (E(r) − rf) / MRP.' },
          { ertek: p.Er / (p.rf + m), uzenet: 'A két hozam hányadosa nem a béta: β = (E(r) − rf) / (E(rM) − rf).' },
        ].filter((h) => Number.isFinite(h.ertek)) // MRP = rf esetén az első út nullával osztana
      },
      levezetes: (p, e) => {
        const m = aMRP(p, e)
        return `β = (E(r) − rf) / MRP = (${sz(p.Er)} − ${sz(p.rf)}) / ${sz(m)} = ${sz(betaVissza(p.Er, p.rf, m))}`
      },
    },
    {
      tipus: 'szam',
      key: 'rf',
      formulaId: '5.1',
      kerdes: 'Mekkora a kockázatmentes hozam?',
      egyseg: '%',
      mikor: (p) => p.ismeretlen === 'rf',
      ertek: (p) => (p.mod === 'ErM' ? rfVisszaErMbol(p.Er, p.beta, p.ErM) : rfVisszaMRPbol(p.Er, p.beta, p.MRP)),
      tipikusHibak: (p) => {
        if (p.mod === 'ErM') {
          const rf = rfVisszaErMbol(p.Er, p.beta, p.ErM)
          return [
            { ertek: rfVisszaMRPbol(p.Er, p.beta, p.ErM), uzenet: 'Ez akkor jönne ki, ha a megadott érték a prémium lenne. Itt a piac hozama (E(rM)) adott, így rf a zárójelben is szerepel.' },
            { ertek: (p.Er - p.beta * p.ErM) / (1 + p.beta), uzenet: 'Előjelhiba az átrendezésben: rf × (1 − β) = E(r) − β × E(rM).' },
            { ertek: (p.Er - p.ErM) / (1 - p.beta), uzenet: 'A zárójel mindkét tagját szorozni kell bétával: E(r) = rf + β × E(rM) − β × rf.' },
            { ertek: -rf, uzenet: 'Előjelhiba: (1 − β)-val kell osztani, nem (β − 1)-gyel.' },
            { ertek: p.Er - p.ErM, uzenet: 'A bétát nem hagyhatod ki: E(r) = rf + β × (E(rM) − rf), ebből rf × (1 − β) = E(r) − β × E(rM).' },
          ]
        }
        return [
          { ertek: rfVisszaErMbol(p.Er, p.beta, p.MRP), uzenet: 'Ez akkor jönne ki, ha a megadott érték a piac hozama lenne. Itt a prémium (MRP) adott: rf = E(r) − β × MRP.' },
          { ertek: p.Er - p.MRP, uzenet: 'A prémiumot bétával kell szorozni: rf = E(r) − β × MRP.' },
          { ertek: p.beta * p.MRP, uzenet: 'Ez a részvény kockázati prémiuma (β × MRP); az rf = E(r) − β × MRP.' },
          { ertek: p.Er + p.beta * p.MRP, uzenet: 'Előjelhiba: rf = E(r) − β × MRP.' },
          { ertek: p.Er / p.beta - p.MRP, uzenet: 'Bétával csak a prémiumot kell szorozni, az egész egyenletet nem kell vele osztani: rf = E(r) − β × MRP.' },
        ]
      },
      levezetes: (p) => {
        if (p.mod === 'ErM') {
          const v = rfVisszaErMbol(p.Er, p.beta, p.ErM)
          return `${sz(p.Er)} = rf + ${sz(p.beta)} × (${sz(p.ErM)} − rf) → rf = (${sz(p.Er)} − ${sz(p.beta)} × ${sz(p.ErM)}) / (1 − ${sz(p.beta)}) = ${sz(v)} → ${pct(v)}`
        }
        const v = rfVisszaMRPbol(p.Er, p.beta, p.MRP)
        return `${sz(p.Er)} = rf + ${sz(p.beta)} × ${sz(p.MRP)} → rf = ${sz(p.Er)} − ${sz(p.beta * p.MRP)} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'mrp',
      formulaId: '5.1',
      kerdes: 'Mekkora a piaci kockázati prémium (MRP)?',
      egyseg: '%',
      mikor: (p) => p.ismeretlen === 'mrp',
      ertek: (p) => mrpVissza(p.Er, p.rf, p.beta),
      tipikusHibak: (p) => [
        { ertek: p.Er - p.rf, uzenet: 'Ez a részvény kockázati prémiuma; még el kell osztani a bétával: MRP = (E(r) − rf) / β.' },
        { ertek: p.Er / p.beta, uzenet: 'A kockázatmentes hozamot elfelejtetted levonni: MRP = (E(r) − rf) / β.' },
        { ertek: (p.Er - p.rf) * p.beta, uzenet: 'Bétával osztani kell, nem szorozni: MRP = (E(r) − rf) / β.' },
        { ertek: p.rf + mrpVissza(p.Er, p.rf, p.beta), uzenet: 'Ez a piac várható hozama (E(rM) = rf + MRP); a prémium ennél rf-fel kisebb.' },
        { ertek: mrpVissza(p.Er, p.rf, p.beta) - p.rf, uzenet: 'Az rf-et kétszer vontad le: MRP = (E(r) − rf) / β.' },
        { ertek: p.Er / p.beta - p.rf, uzenet: 'Az rf-et a bétával való osztás előtt kell levonni: MRP = (E(r) − rf) / β.' },
      ],
      levezetes: (p) => {
        const v = mrpVissza(p.Er, p.rf, p.beta)
        return `MRP = (E(r) − rf) / β = (${sz(p.Er)} − ${sz(p.rf)}) / ${sz(p.beta)} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'ErM',
      formulaId: '5.1',
      kerdes: 'Mekkora a piaci portfólió várható hozama?',
      egyseg: '%',
      mikor: (p) => p.ismeretlen === 'mrp' && p.ErMis,
      ertek: (p, e) => p.rf + e('mrp'),
      tipikusHibak: (p, e) => [
        { ertek: e('mrp'), uzenet: H.premiumNemHozam },
        { ertek: p.Er, uzenet: 'Ez a részvény várható hozama; a piacé E(rM) = rf + (E(r) − rf) / β.' },
        { ertek: p.rf + (p.Er - p.rf) * p.beta, uzenet: 'Bétával osztani kell, nem szorozni: E(rM) = rf + (E(r) − rf) / β.' },
        { ertek: p.Er / p.beta, uzenet: 'A kockázatmentes hozamot is figyelembe kell venni: E(rM) = rf + (E(r) − rf) / β.' },
        { ertek: 2 * p.rf + e('mrp'), uzenet: 'Az rf-et kétszer adtad hozzá: E(rM) = rf + MRP.' },
      ],
      levezetes: (p, e) => `E(rM) = rf + MRP = ${sz(p.rf)} + ${sz(e('mrp'))} = ${sz(p.rf + e('mrp'))} → ${pct(p.rf + e('mrp'))}`,
    },
  ],
  diasPeldak: [
    { forras: '5.1 Visszafejtés β-ra (5. ea)', p: { Er: 0.183, rf: 0.03, ErM: 0.12, mod: 'ErM', ismeretlen: 'beta' }, vart: { mrp: '9%', beta: '1,7' } },
    { forras: '5.1 Visszafejtés r_f-re (5. ea)', p: { Er: 0.105, beta: 0.85, ErM: 0.12, mod: 'ErM', ismeretlen: 'rf' }, vart: { rf: '2%' } },
    { forras: '5.1 Csapda: ugyanezek a számok MRP-ként (5. ea)', p: { Er: 0.105, beta: 0.85, MRP: 0.12, mod: 'MRP', ismeretlen: 'rf' }, vart: { rf: '0,3%' } },
    { forras: '5.1 Visszafejtés MRP-re (5. ea)', p: { Er: 0.14, beta: 1.5, rf: 0.02, mod: 'MRP', ismeretlen: 'mrp' }, vart: { mrp: '8%' } },
  ],
}

// ---------------- A3: alul- vagy túlárazott ----------------

type P3 = { betu: string; rf: number; beta: number; MRP: number; ErM: number; mod: PiacMod; Er: number }

export const capmArazas: Sablon<P3> = {
  id: 'capm-arazas',
  csalad: 'capm',
  cim: 'Alul- vagy túlárazott? (SML-meredekség)',
  felismeresek: [{ elott: '', helyes: 'F09', zavarok: ['F07', 'F08', 'F10'] }],
  general: (r) => {
    const piac = piacGeneral(r, 0.01, 0.05)
    const beta = r.lepeskoz(0.5, 1.8, 0.1)
    const elteres = r.esely(0.12) ? 0 : r.valaszt([-0.02, -0.015, -0.01, -0.005, 0.005, 0.01, 0.015, 0.02])
    return { betu: r.valaszt(RESZVENY_BETUK), beta, ...piac, Er: kerekit4(piac.rf + beta * piac.MRP + elteres) }
  },
  ervenyes: (p) => p.Er > p.rf + 0.005,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const B = nagyKezdet(betuNevelovel(p.betu))
    const piac = nagyKezdet(piacSzoveg(p.mod, p.ErM, p.MRP, r.egesz(0, 1))) + '.'
    // a 4. keretben mindig van zavaró adat
    const zavaro = v === 3 ? `${B} részvény hozamának szórása ${pct(r.lepeskoz(0.15, 0.45, 0.01))}.` : undefined
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, CAPM_BEVEZETOK, [`${B} részvény bétája ${sz(p.beta)}, és a befektetők ${pct(p.Er)} hozamra számítanak tőle.`, `A kockázatmentes hozam ${pct(p.rf)}.`, piac, zavaro]),
      ],
      kerdesek: ['Helyesen árazott-e a részvény a CAPM szerint? Ha nem, alul- vagy túlárazott?'],
    }
  },
  zh: () => ({ kulcsok: ['dontes'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'sml',
      formulaId: '5.2',
      kerdes: 'Mekkora az SML meredeksége?',
      egyseg: '%',
      ertek: (p) => (p.mod === 'ErM' ? mrp(p.ErM, p.rf) : p.MRP),
      levezetes: (p) =>
        p.mod === 'ErM'
          ? `meredekség(SML) = E(rM) − rf = ${sz(p.ErM)} − ${sz(p.rf)} = ${sz(p.ErM - p.rf)} → ${pct(p.ErM - p.rf)}`
          : `meredekség(SML) = MRP = ${pct(p.MRP)}`,
    },
    {
      tipus: 'szam',
      key: 'elvart',
      formulaId: '5.1',
      kerdes: 'Mekkora a részvény CAPM szerinti elvárt hozama?',
      egyseg: '%',
      ertek: (p, e) => capm(p.rf, p.beta, e('sml')),
      tipikusHibak: (p) => capmHibak(p),
      levezetes: (p, e) => {
        const v = capm(p.rf, p.beta, e('sml'))
        return `E(r) = rf + β × MRP = ${sz(p.rf)} + ${sz(p.beta)} × ${sz(e('sml'))} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'mered',
      formulaId: '5.2',
      kerdes: 'Mekkora a részvény meredeksége (Treynor-arány)?',
      egyseg: '%',
      ertek: (p) => meredekseg(p.Er, p.rf, p.beta),
      levezetes: (p) => {
        const v = meredekseg(p.Er, p.rf, p.beta)
        return `(E(r) − rf) / β = (${sz(p.Er)} − ${sz(p.rf)}) / ${sz(p.beta)} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'valasztas',
      key: 'dontes',
      formulaId: '5.2',
      kerdes: 'Hogyan van árazva a részvény?',
      opciok: ['alulárazott', 'túlárazott', 'helyesen árazott'],
      ertek: (p, e) => arazas(p.Er, p.rf, p.beta, e('sml'), 1e-6),
      levezetes: (p, e) => {
        const d = arazas(p.Er, p.rf, p.beta, e('sml'), 1e-6)
        if (d === 'helyesen árazott') return `A várható hozam (${pct(p.Er)}) megegyezik a CAPM szerintivel: helyesen árazott, rajta van az SML-en.`
        const fole = d === 'alulárazott'
        return `A várható hozam (${pct(p.Er)}) ${fole ? 'nagyobb' : 'kisebb'}, mint a CAPM szerinti ${pct(e('elvart'))}, a meredeksége ${fole ? 'nagyobb' : 'kisebb'}, mint az SML-é: ${d}.`
      },
    },
  ],
  diasPeldak: [
    { forras: '5.2 Példa (5. ea), G', p: { rf: 0.02, ErM: 0.085, mod: 'ErM', beta: 1.6, Er: 0.12 }, vart: { sml: '6,5%', elvart: '12,4%', mered: '6,25%', dontes: 'túlárazott' } },
    { forras: '5.2 Példa (5. ea), H', p: { rf: 0.02, ErM: 0.085, mod: 'ErM', beta: 0.8, Er: 0.09 }, vart: { sml: '6,5%', elvart: '7,2%', mered: '8,75%', dontes: 'alulárazott' } },
  ],
}

// ---------------- A4: két helyesen árazott eszköz ----------------

type P4 = {
  valtozat: 'alap' | 'kulonbseg'
  b1: string
  b2: string
  beta1: number
  beta2: number
  E1: number
  E2: number
  d: number
  rf: number
  MRP: number
}

export const capmKetEszkoz: Sablon<P4> = {
  id: 'capm-ket-eszkoz',
  csalad: 'capm',
  cim: 'Két helyesen árazott eszközből r_f és E(rM)',
  felismeresek: [{ elott: '', helyes: 'F10', zavarok: ['F08', 'F07', 'F09'] }],
  general: (r) => {
    const rf = r.lepeskoz(0.01, 0.06, 0.005)
    const MRP = r.lepeskoz(0.04, 0.1, 0.005)
    const [b1, b2] = r.kever(RESZVENY_BETUK)
    if (r.esely(0.7)) {
      const beta1 = r.lepeskoz(0.3, 2, 0.1)
      const beta2 = r.lepeskoz(0.3, 2, 0.1)
      return { valtozat: 'alap', b1, b2, beta1, beta2, E1: kerekit4(rf + beta1 * MRP), E2: kerekit4(rf + beta2 * MRP), d: 0, rf, MRP }
    }
    const beta2 = r.lepeskoz(0.5, 1.5, 0.05)
    const d = r.lepeskoz(0.1, 0.6, 0.05)
    return { valtozat: 'kulonbseg', b1: 'J', b2: 'K', beta1: beta2 + d, beta2, E1: kerekit4(rf + (beta2 + d) * MRP), E2: kerekit4(rf + beta2 * MRP), d, rf, MRP }
  },
  // 1-es bétánál a részvény hozama maga a piaci hozam (a feladat triviális lenne)
  ervenyes: (p) => p.valtozat === 'kulonbseg' || (Math.abs(p.beta1 - p.beta2) >= 0.3 && p.beta1 !== 1 && p.beta2 !== 1),
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    // a 4. keretben mindig van zavaró adat
    const zavaro = v === 3 ? `A piaci portfólió szórása ${pct(r.lepeskoz(0.15, 0.3, 0.01))}.` : undefined
    if (p.valtozat === 'kulonbseg') {
      return {
        valtozat: `kul-k${v}`,
        bekezdesek: [
          keretbe(v, CAPM_BEVEZETOK, [
            `A J részvény bétája ${sz(p.d)} egységgel nagyobb, mint a K részvényé.`,
            'A J és a K részvény is helyesen árazott.',
            `A J részvény várható hozama ${pct(p.E1)}, a K részvényé ${pct(p.E2)}.`,
            zavaro,
          ]),
        ],
        kerdesek: ['Mekkora a piaci kockázati prémium?'],
      }
    }
    const a = nagyKezdet(betuNevelovel(p.b1))
    const b = nagyKezdet(betuNevelovel(p.b2))
    const elso = r.esely(0.5)
    return {
      valtozat: `k${v}`,
      bekezdesek: [
        keretbe(v, CAPM_BEVEZETOK, [
          elso
            ? `${a} és ${betuNevelovel(p.b2)} részvény is helyesen árazott (az SML-en fekszik).`
            : 'Két részvényről tudjuk, hogy a piac helyesen árazza őket.',
          elso ? `${a} részvény bétája ${sz(p.beta1)}, várható hozama ${pct(p.E1)}.` : `${a}: β = ${sz(p.beta1)}, E(r) = ${pct(p.E1)}.`,
          elso ? `${b} részvény bétája ${sz(p.beta2)}, várható hozama ${pct(p.E2)}.` : `${b}: β = ${sz(p.beta2)}, E(r) = ${pct(p.E2)}.`,
          zavaro,
        ]),
      ],
      kerdesek: ['Mekkora a kockázatmentes hozam?', 'Mekkora a piaci portfólió várható hozama?'],
    }
  },
  zh: (p) => ({ kulcsok: p.valtozat === 'alap' ? ['rf', 'ErM'] : ['mrp'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'rf',
      formulaId: '5.3',
      kerdes: 'Mekkora a kockázatmentes hozam?',
      egyseg: '%',
      mikor: (p) => p.valtozat === 'alap',
      ertek: (p) => rfKetEszkozbol(p.E1, p.beta1, p.E2, p.beta2),
      levezetes: (p) => {
        const v = rfKetEszkozbol(p.E1, p.beta1, p.E2, p.beta2)
        return `(${sz(p.E1)} − rf) / ${sz(p.beta1)} = (${sz(p.E2)} − rf) / ${sz(p.beta2)} → rf = (${sz(p.beta2)} × ${sz(p.E1)} − ${sz(p.beta1)} × ${sz(p.E2)}) / (${sz(p.beta2)} − ${sz(p.beta1)}) = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'ErM',
      formulaId: '5.1',
      kerdes: 'Mekkora a piaci portfólió várható hozama?',
      egyseg: '%',
      mikor: (p) => p.valtozat === 'alap',
      ertek: (p, e) => e('rf') + mrpVissza(p.E2, e('rf'), p.beta2),
      tipikusHibak: (p, e) => [
        { ertek: mrpVissza(p.E2, e('rf'), p.beta2), uzenet: H.premiumNemHozam },
        { ertek: e('rf') + (p.E2 - e('rf')) * p.beta2, uzenet: 'Bétával osztani kell, nem szorozni: E(rM) = rf + (E(r) − rf) / β.' },
        { ertek: p.E2 / p.beta2, uzenet: 'A kockázatmentes hozamot is figyelembe kell venni: E(rM) = rf + (E(r) − rf) / β.' },
        { ertek: (p.E1 + p.E2) / 2, uzenet: 'A két részvény hozamának átlaga nem a piac hozama: a bétájuk nem 1.' },
        { ertek: e('rf') + (p.E1 - e('rf')) / p.beta2, uzenet: 'Az egyik részvény hozamát a másik bétájával osztottad; mindegyik a saját bétájával megy.' },
      ],
      levezetes: (p, e) => {
        const rf = e('rf')
        const v = rf + mrpVissza(p.E2, rf, p.beta2)
        return `${sz(p.E2)} = ${sz(rf)} + ${sz(p.beta2)} × (E(rM) − ${sz(rf)}) → E(rM) = ${sz(rf)} + (${sz(p.E2)} − ${sz(rf)}) / ${sz(p.beta2)} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'mrp',
      formulaId: '5.3',
      kerdes: 'Mekkora a piaci kockázati prémium (MRP)?',
      egyseg: '%',
      mikor: (p) => p.valtozat === 'kulonbseg',
      ertek: (p) => mrpBetaKulonbsegbol(p.E1 - p.E2, p.d),
      tipikusHibak: (p) => [
        { ertek: p.E1 - p.E2, uzenet: 'A hozamkülönbséget még el kell osztani a béták különbségével: MRP = ΔE / Δβ.' },
        { ertek: (p.E1 - p.E2) * p.d, uzenet: 'A béták különbségével osztani kell, nem szorozni.' },
        { ertek: (p.E1 - p.E2) / (1 + p.d), uzenet: 'A béták különbsége d, nem 1 + d: MRP = ΔE / d.' },
        { ertek: (p.E1 + p.E2) / p.d, uzenet: 'A két egyenletet ki kell vonni egymásból, nem összeadni: MRP = (E(rJ) − E(rK)) / d.' },
        { ertek: p.E1 / p.d, uzenet: 'A két CAPM-egyenletet ki kell vonni egymásból: a hozamok különbségét kell osztani a béták különbségével.' },
      ],
      levezetes: (p) => {
        const v = mrpBetaKulonbsegbol(p.E1 - p.E2, p.d)
        return `a két CAPM-egyenletet kivonva: ${sz(p.E1)} − ${sz(p.E2)} = ${sz(p.d)} × MRP → MRP = ${sz(p.E1 - p.E2)} / ${sz(p.d)} = ${sz(v)} → ${pct(v)}`
      },
    },
  ],
  diasPeldak: [
    { forras: '5.3 Példa (5. ea)', p: { valtozat: 'alap', E1: 0.18, beta1: 1.5, E2: 0.08, beta2: 0.5 }, vart: { rf: '3%', ErM: '13%' } },
    { forras: '5.3 Rokon típus (5. ea)', p: { valtozat: 'kulonbseg', E1: 0.1275, E2: 0.1065, d: 0.3 }, vart: { mrp: '7%' } },
  ],
}
