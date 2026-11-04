// NPV és IRR (6. fejezet): jövőbeli pénzáramlások jelenértéke → NPV → (IRR) → döntés.

import { hozamDontes, irr, npv, npvDontes } from '../../calc/npv.ts'
import { formatPenz } from '../../lib/szam.ts'
import { pct, sz } from '../formaz.ts'
import type { Sablon } from '../tipusok.ts'

const PROJEKTEK = [
  'Egy vállalat új gépsor beszerzését fontolgatja.',
  'Egy logisztikai cég új raktárat építene.',
  'Egy energetikai vállalat napelemparkba fektetne.',
  'Egy szoftvercég új termék fejlesztését mérlegeli.',
  'Egy élelmiszeripari cég csomagolósort cserélne.',
] as const

/** A diszkontráta három neve a képlettár szerint ugyanazt jelenti (6.1 jeltábla). */
const RATA_NEVEK = ['A projekt elvárt hozama', 'A projekt tőkeköltsége', 'A diszkontráta'] as const

type N = {
  projekt: string
  cf: number[] // cf[0] = CF0 (negatív)
  r: number
  irrIs: boolean
  rataNev: string
  tablaval: boolean
  zavaro?: 'beta' | 'arfolyam'
  zavaroErtek: number
}

function usd(x: number): string {
  return `${formatPenz(x)} USD`
}

function pvTagok(p: N): string[] {
  return p.cf.slice(1).map((c, i) => `${sz(c)} / ${sz(1 + p.r)}${i === 0 ? '' : `^${i + 1}`}`)
}

function jovobeliPV(p: N): number {
  return npv(p.r, [0, ...p.cf.slice(1)])
}

export const npvIrr: Sablon<N> = {
  id: 'npv-irr',
  csalad: 'npv',
  cim: 'NPV és IRR, elfogadjuk-e a projektet?',
  felismeresek: [{ elott: '', helyes: 'F11', zavarok: ['F14', 'F13', 'F07'] }],
  general: (r) => {
    const n = r.egesz(2, 5)
    const befektetes = r.lepeskoz(50, 500, 5) * 1000
    // a jövőbeli pénzáramlások összege a befektetés 0,9–1,5-szerese, évekre véletlen súlyokkal elosztva, ezer USD-re kerekítve
    const osszes = befektetes * r.lepeskoz(0.9, 1.5, 0.01)
    const sulyok = Array.from({ length: n }, () => r.lepeskoz(0.5, 1.5, 0.1))
    const sulyOsszeg = sulyok.reduce((a, b) => a + b, 0)
    const cf = [-befektetes, ...sulyok.map((w) => Math.round((osszes * w) / sulyOsszeg / 1000) * 1000)]
    return {
      projekt: r.valaszt(PROJEKTEK),
      cf,
      r: r.lepeskoz(0.06, 0.16, 0.005),
      irrIs: r.esely(0.5),
      rataNev: r.valaszt(RATA_NEVEK),
      tablaval: r.esely(0.5),
      zavaro: r.esely(0.35) ? r.valaszt(['beta', 'arfolyam'] as const) : undefined,
      zavaroErtek: r.lepeskoz(0.6, 1.6, 0.05),
    }
  },
  ervenyes: (p) => {
    const NPV = npv(p.r, p.cf)
    // ne legyen a döntés a kerekítésen múló határeset, és az IRR legyen értelmes tartományban
    if (Math.abs(NPV) < 0.02 * -p.cf[0]) return false
    const IRR = irr(p.cf)
    return IRR > -0.2 && IRR < 0.6
  },
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const n = p.cf.length - 1
    const rata = `${p.rataNev} ${pct(p.r)}.`
    // a 4. keretben mindig van zavaró adat
    const zavaroTipus = p.zavaro ?? (v === 3 ? 'arfolyam' : undefined)
    const zavaro =
      zavaroTipus === 'beta'
        ? `A vállalat részvényeinek bétája ${sz(p.zavaroErtek)}.`
        : zavaroTipus === 'arfolyam'
          ? `A vállalat részvényeinek árfolyama ${sz(Math.round(p.zavaroErtek * 40))} USD.`
          : undefined
    const kerdesek = [
      'Mekkora a projekt nettó jelenértéke (NPV)?',
      ...(p.irrIs ? ['Mekkora a projekt belső megtérülési rátája (IRR)?'] : []),
      'Elfogadja-e a vállalat a projektet?',
    ]
    const jovobeli = p.cf.slice(1).map((c) => sz(c))
    const felsorolas = n === 1 ? jovobeli[0] : `${jovobeli.slice(0, -1).join(', ')} és ${jovobeli[n - 1]}`
    const cfMondat = p.tablaval
      ? 'A beruházás várható pénzáramlásait a táblázat mutatja (a 0. év a mai kezdő befektetés).'
      : `A beruházás ma ${sz(-p.cf[0])} USD, és a következő ${n} év végén rendre ${felsorolas} USD nettó pénzáramlást hoz.`
    const mondatok = [
      [p.projekt, cfMondat, rata, zavaro],
      [rata, p.projekt, cfMondat, zavaro],
      [p.projekt, zavaro, rata, cfMondat],
      [zavaro, p.projekt, cfMondat, rata],
    ][v]
    return {
      valtozat: `k${v}`,
      bekezdesek: [mondatok.filter(Boolean).join(' ')],
      ...(p.tablaval ? { tabla: { fejlec: ['Év', 'Pénzáramlás (USD)'], sorok: p.cf.map((c, t) => [String(t), sz(c)]) } } : {}),
      kerdesek,
    }
  },
  zh: (p) => ({ kulcsok: ['npv', ...(p.irrIs ? ['irr'] : []), 'dontes'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'pv',
      formulaId: '6.1',
      kerdes: 'Mekkora a jövőbeli pénzáramlások jelenértéke összesen?',
      egyseg: 'USD',
      // kézzel 4 tizedesre kerekített diszkonttényezőkkel is beleférjen
      tures: (p) => ({ abs: Math.max(1, 0.0005 * -p.cf[0]) }),
      ertek: (p) => jovobeliPV(p),
      tipikusHibak: (p) => [
        { ertek: p.cf.slice(1).reduce((a, b) => a + b, 0), uzenet: 'Ez a pénzáramlások diszkontálatlan összege; minden tagot (1 + r)^t-vel kell osztani.' },
      ],
      levezetes: (p) => {
        const tagok = p.cf.slice(1).map((c, i) => c / Math.pow(1 + p.r, i + 1))
        return `PV = ${pvTagok(p).join(' + ')} = ${tagok.map((t) => formatPenz(t)).join(' + ')} = ${usd(jovobeliPV(p))}`
      },
    },
    {
      tipus: 'szam',
      key: 'npv',
      formulaId: '6.1',
      kerdes: 'Mekkora a projekt NPV-je?',
      egyseg: 'USD',
      tures: (p) => ({ abs: Math.max(1, 0.0005 * -p.cf[0]) }),
      ertek: (p) => npv(p.r, p.cf),
      tipikusHibak: (p, e) => [
        { ertek: e('pv'), uzenet: 'Ez a jövőbeli pénzáramlások jelenértéke; az NPV-hez hozzá kell adni a (negatív) kezdő befektetést.' },
        { ertek: p.cf.reduce((a, b) => a + b, 0), uzenet: 'Diszkontálás nélkül adtad össze a pénzáramlásokat; minden tagot (1 + r)^t-vel kell osztani.' },
        {
          ertek: p.cf[0] + p.cf.slice(1).reduce((a, b) => a + b, 0) / (1 + p.r),
          uzenet: 'Minden pénzáramlást a saját évének megfelelő hatványon kell diszkontálni: (1 + r)^t, nem mindet egyszer.',
        },
        {
          ertek: p.cf[0] + npv(p.r, [0, 0, ...p.cf.slice(1)]),
          uzenet: 'Egy évvel tovább diszkontáltál: az első év végi pénzáramlást (1 + r)-rel osztjuk, nem (1 + r)²-tel.',
        },
        {
          ertek: p.cf.reduce((a, c, t) => a + c * Math.pow(1 + p.r, t), 0),
          uzenet: 'Kamatoztattál diszkontálás helyett: a jövőbeli pénzáramlásokat (1 + r)^t-vel osztani kell, nem szorozni.',
        },
        { ertek: p.cf[0] * (1 + p.r) + e('pv'), uzenet: 'A kezdő befektetés ma történik: nem kell kamatoztatni, egyszerűen hozzáadjuk (CF0).' },
        { ertek: npv(p.r, [0, ...p.cf]), uzenet: 'A kezdő befektetés ma történik (t = 0), nem kell diszkontálni; az első év pénzáramlását (1 + r)-rel osztjuk.' },
      ],
      levezetes: (p, e) => `NPV = CF0 + PV = ${sz(p.cf[0])} + ${formatPenz(e('pv'))} = ${usd(npv(p.r, p.cf))}`,
    },
    {
      tipus: 'szam',
      key: 'irr',
      formulaId: '6.2',
      kerdes: 'Mekkora a projekt IRR-je?',
      egyseg: '%',
      // az IRR-t kézzel próbálgatással keressük, ezért 0,1 százalékpont is elég
      tures: { abs: 0.001 },
      mikor: (p) => p.irrIs,
      ertek: (p) => irr(p.cf),
      tipikusHibak: (p) => {
        const hozam = p.cf.slice(1).reduce((a, b) => a + b, 0) / -p.cf[0] - 1
        return [
          { ertek: p.r, uzenet: 'Ez a diszkontráta (elvárt hozam); az IRR az a ráta, amelynél az NPV pontosan nulla.' },
          { ertek: hozam / (p.cf.length - 1), uzenet: 'Ez a diszkontálatlan átlagos éves hozam; az IRR-nél a pénzáramlások időzítése is számít.' },
          { ertek: hozam, uzenet: 'Ez a teljes időszak diszkontálatlan hozama; az IRR éves ráta, amelynél az NPV nulla.' },
          {
            ertek: p.cf.slice(1).reduce((a, b) => a + b, 0) / (p.cf.length - 1) / -p.cf[0],
            uzenet: 'Ez az átlagos éves pénzáramlás a befektetéshez mérve; az IRR az a ráta, amelynél az NPV nulla.',
          },
          { ertek: npv(p.r, p.cf) / -p.cf[0], uzenet: 'Ez az NPV a befektetéshez viszonyítva; az IRR az a ráta, amelynél az NPV nulla.' },
        ]
      },
      levezetes: (p) => {
        const v = irr(p.cf)
        const tagok = p.cf.slice(1).map((c, i) => `${sz(c)} / (1 + IRR)${i === 0 ? '' : `^${i + 1}`}`)
        return `0 = ${sz(p.cf[0])} + ${tagok.join(' + ')}; próbálgatással IRR = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'valasztas',
      key: 'dontes',
      formulaId: '6.1',
      kerdes: 'Elfogadjuk a projektet?',
      opciok: ['elfogadjuk', 'elutasítjuk'],
      ertek: (p) => npvDontes(npv(p.r, p.cf)),
      levezetes: (p) => {
        const NPV = npv(p.r, p.cf)
        const d = npvDontes(NPV)
        const irrResz = p.irrIs ? `, és IRR = ${pct(irr(p.cf))} ${hozamDontes(irr(p.cf), p.r) === 'elfogadjuk' ? '>' : '<'} ${pct(p.r)}` : ''
        return `NPV = ${usd(NPV)} ${NPV > 0 ? '> 0' : '< 0'}${irrResz}, ezért ${d}.`
      },
    },
  ],
  diasPeldak: [
    {
      forras: '6.1 és 6.2 Példa (4. ea)',
      p: { cf: [-165000, 63120, 70800, 91080], r: 0.12, irrIs: true },
      vart: { npv: '12 627,41', irr: '16,13%', dontes: 'elfogadjuk' },
    },
  ],
}
