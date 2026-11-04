// Portfólió béta (4.4) és kockázatos + kockázatmentes portfólió (5.4).

import { hianyzoBeta, portfolioBeta, sulyCelBetahoz } from '../../calc/beta.ts'
import { kevertPortfolio, sulyCelHozamhoz } from '../../calc/capm.ts'
import { pct, sz } from '../formaz.ts'
import type { Rng, Sablon } from '../tipusok.ts'
import { betuNevelovel, kerekit4, nagyKezdet, RESZVENY_BETUK } from './kozos.ts'

/** n darab, 5%-os egységekből álló súly, amelyek összege 100%. */
function sulyok(r: Rng, n: number): number[] {
  for (;;) {
    const vagasok = Array.from({ length: n - 1 }, () => r.egesz(1, 19)).sort((a, b) => a - b)
    const egysegek = [...vagasok, 20].map((v, i) => v - (i === 0 ? 0 : vagasok[i - 1]))
    if (egysegek.every((e) => e >= 1)) return egysegek.map((e) => e / 20)
  }
}

/** A szövegváltozatok szereplői (a keret sorszáma szerint). */
const SZEREPLOK = ['Egy befektető', 'Egy alapkezelő', 'Egy nyugdíjpénztár', 'Egy magánbefektető'] as const

// ---------------- 4.4: portfólió béta ----------------

type PB = {
  valtozat: 'beta' | 'hianyzo' | 'suly'
  nevek: string[] // a kockázatmentes eszköz neve 'rf'
  a: number[]
  b: (number | null)[]
  egyenlo: boolean
  cel: number
  piacMint: boolean
  tablaval: boolean
}

function z(x: number): string {
  return x < 0 ? `(${sz(x)})` : sz(x)
}

function kockazatosIdx(p: PB): number[] {
  return p.nevek.map((n, i) => (n === 'rf' ? -1 : i)).filter((i) => i >= 0)
}

function eszkozLeiras(p: PB, i: number, betaval: boolean): string {
  if (p.nevek[i] === 'rf') return `${pct(p.a[i])}-a kockázatmentes állampapír`
  const b = p.b[i]
  return `${pct(p.a[i])}-a ${betuNevelovel(p.nevek[i])} részvény${betaval && b !== null ? ` (β = ${sz(b)})` : ''}`
}

export const portfolioBetaSablon: Sablon<PB> = {
  id: 'portfolio-beta',
  csalad: 'beta',
  cim: 'Portfólió béta, hiányzó béta vagy súly',
  felismeresek: [{ elott: '', helyes: 'F06', zavarok: ['F05', 'F07', 'F08'] }],
  general: (r) => {
    const valtozat = r.valaszt(['beta', 'beta', 'hianyzo', 'suly'] as const)
    if (valtozat === 'suly') {
      const beta = r.lepeskoz(0.6, 2, 0.05)
      return {
        valtozat,
        nevek: [r.valaszt(RESZVENY_BETUK), 'rf'],
        a: [],
        b: [beta, 0],
        egyenlo: false,
        cel: r.lepeskoz(0.3, 3, 0.05),
        piacMint: false,
        tablaval: false,
      }
    }
    const k = valtozat === 'beta' ? r.egesz(2, 4) : r.egesz(2, 3)
    const rfBenne = r.esely(valtozat === 'hianyzo' ? 0.5 : 0.35)
    const nevek = [...r.kever(RESZVENY_BETUK).slice(0, k).sort(), ...(rfBenne ? ['rf'] : [])]
    const egyenlo = valtozat === 'hianyzo' && r.esely(0.5)
    const a = egyenlo ? nevek.map(() => 1 / nevek.length) : sulyok(r, nevek.length)
    const b: (number | null)[] = nevek.map((n) => (n === 'rf' ? 0 : r.lepeskoz(0.4, 2, 0.05)))
    const piacMint = valtozat === 'hianyzo' && r.esely(0.5)
    let cel = 0
    if (valtozat === 'hianyzo') {
      const ismeretlen = r.valaszt(nevek.map((n, i) => (n === 'rf' ? -1 : i)).filter((i) => i >= 0))
      cel = piacMint ? 1 : kerekit4(portfolioBeta(a, b as number[]))
      if (!piacMint) cel = Math.round(cel * 20) / 20
      b[ismeretlen] = null
    }
    return { valtozat, nevek, a, b, egyenlo, cel, piacMint, tablaval: !rfBenne && r.esely(0.4) }
  },
  ervenyes: (p) => {
    // egyenlő súlyoknál a súlyozott és az egyszerű átlag egybeesne: a feladat nem mérné a súlyozást
    if (p.valtozat === 'beta') return new Set(p.a).size > 1 && new Set(p.b).size === p.b.length
    // 1-es bétájú részvénynél és 100%-os súlynál a súlyszámítás triviális
    if (p.valtozat === 'suly') return Math.abs(p.b[0]! - 1) >= 0.05 && Math.abs(p.cel - p.b[0]!) >= 0.05
    const v = hianyzoBeta(p.cel, p.a, p.b)
    return v >= 0.2 && v <= 3 && p.a[p.b.indexOf(null)] <= 0.8
  },
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const szereplo = SZEREPLOK[v]
    const valtozat = `${p.valtozat}-k${v}`
    // a 4. keretben mindig van zavaró adat
    const zavaro = v === 3 ? `A piaci portfólió várható hozama ${pct(r.lepeskoz(0.08, 0.14, 0.005))}.` : undefined
    if (p.valtozat === 'suly') {
      const d = betuNevelovel(p.nevek[0])
      const beta = `${nagyKezdet(d)} részvény bétája ${sz(p.b[0]!)}.`
      const cel = `${szereplo} ${d} részvényből és kockázatmentes eszközből olyan portfóliót akar összeállítani, amelynek szisztematikus kockázata β = ${sz(p.cel)}.`
      return {
        valtozat,
        bekezdesek: [(v % 2 === 1 ? [cel, zavaro, beta] : [beta, zavaro, cel]).filter(Boolean).join(' ')],
        kerdesek: [`Vagyona hány százalékát fektesse ${d} részvénybe, és hány százalékát a kockázatmentes eszközbe?`],
      }
    }
    const idx = p.nevek.map((_, i) => i)
    const sorrend = v === 1 ? [...idx].reverse() : v === 2 ? [...idx.slice(1), idx[0]] : idx
    if (p.valtozat === 'beta') {
      if (p.tablaval) {
        return {
          valtozat,
          bekezdesek: [[`${szereplo} portfóliójának összetételét a táblázat mutatja.`, zavaro].filter(Boolean).join(' ')],
          tabla: { fejlec: ['Részvény', 'Súly', 'Béta'], sorok: sorrend.map((i) => [p.nevek[i], pct(p.a[i]), sz(p.b[i]!)]) },
          kerdesek: ['Mekkora a portfólió bétája?'],
        }
      }
      return {
        valtozat,
        bekezdesek: [[`${szereplo} portfóliójának ${sorrend.map((i) => eszkozLeiras(p, i, true)).join(', ')}.`, zavaro].filter(Boolean).join(' ')],
        kerdesek: ['Mekkora a portfólió bétája?'],
      }
    }
    // hiányzó béta
    const ismeretlen = p.b.indexOf(null)
    const kockazatos = kockazatosIdx(p)
    const osszetetel = p.egyenlo
      ? `${szereplo} vagyonát egyenlő arányban osztja meg ${kockazatos.map((i) => betuNevelovel(p.nevek[i])).join(', ').replace(/, ([^,]*)$/, ' és $1')} részvény${p.nevek.includes('rf') ? ', valamint a kockázatmentes eszköz' : ''} között.`
      : `${szereplo} portfóliójának ${sorrend.map((i) => eszkozLeiras(p, i, false)).join(', ')}.`
    const ismertBetak =
      nagyKezdet(
        kockazatos
          .filter((i) => i !== ismeretlen)
          .map((i) => `${betuNevelovel(p.nevek[i])} részvény bétája ${sz(p.b[i]!)}`)
          .join(', '),
      ) + '.'
    const cel = p.piacMint ? 'A portfólió pontosan olyan kockázatos, mint a piaci portfólió.' : `A portfólió szisztematikus kockázata β = ${sz(p.cel)}.`
    const mondatok = [
      [osszetetel, ismertBetak, cel],
      [osszetetel, cel, ismertBetak],
      [ismertBetak, osszetetel, cel],
      [osszetetel, zavaro, ismertBetak, cel],
    ][v]
    return {
      valtozat,
      bekezdesek: [mondatok.filter(Boolean).join(' ')],
      kerdesek: [`Mekkora ${betuNevelovel(p.nevek[ismeretlen])} részvény bétája?`],
    }
  },
  zh: (p) => ({ kulcsok: p.valtozat === 'suly' ? ['w', 'wf'] : p.valtozat === 'beta' ? ['betaP'] : ['hiany'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'betaP',
      formulaId: '4.4',
      kerdes: 'Mekkora a portfólió bétája?',
      egyseg: 'tizedes',
      tures: { abs: 0.001 },
      mikor: (p) => p.valtozat === 'beta',
      ertek: (p) => portfolioBeta(p.a, p.b as number[]),
      tipikusHibak: (p) => {
        const k = kockazatosIdx(p)
        const hibak = [
          { ertek: k.reduce((s, i) => s + p.b[i]!, 0) / k.length, uzenet: 'Ez a béták egyszerű átlaga; a súlyokkal kell súlyozni.' },
          { ertek: k.reduce((s, i) => s + p.b[i]!, 0), uzenet: 'Ez a béták összege; minden bétát a saját súlyával kell szorozni.' },
          { ertek: portfolioBeta(p.a, p.b as number[]) / p.nevek.length, uzenet: 'A súlyozott összeget nem kell az elemszámmal osztani: a súlyok összege már 1.' },
          { ertek: portfolioBeta([...p.a.slice(1), p.a[0]], p.b as number[]), uzenet: 'A súlyokat elcsúsztattad: minden bétát a saját elemének súlyával kell szorozni.' },
        ]
        if (k.length < p.nevek.length) {
          hibak.push({ ertek: portfolioBeta(p.a, p.b.map((b, i) => (p.nevek[i] === 'rf' ? 1 : b!))), uzenet: 'A kockázatmentes eszköz bétája 0, nem 1.' })
          const kockazatosSuly = k.reduce((s, i) => s + p.a[i], 0)
          hibak.push({
            ertek: portfolioBeta(p.a, p.b as number[]) / kockazatosSuly,
            uzenet: 'A kockázatmentes rész bétája 0, de a súlya ugyanúgy számít: nem kell a kockázatos részre átsúlyozni.',
          })
        }
        return hibak
      },
      levezetes: (p) => {
        const v = portfolioBeta(p.a, p.b as number[])
        return `βP = ${p.a.map((a, i) => `${sz(a)} × ${sz(p.b[i]!)}`).join(' + ')} = ${sz(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'hiany',
      formulaId: '4.4',
      kerdes: 'Mekkora a hiányzó béta?',
      egyseg: 'tizedes',
      tures: { abs: 0.005 },
      mikor: (p) => p.valtozat === 'hianyzo',
      ertek: (p) => hianyzoBeta(p.cel, p.a, p.b),
      tipikusHibak: (p) => {
        const i = p.b.indexOf(null)
        const tobbi = p.a.reduce((s, a, j) => (j === i ? s : s + a * p.b[j]!), 0)
        const hibak = [
          { ertek: p.cel - tobbi, uzenet: 'Még el kell osztani a hiányzó elem súlyával.' },
          { ertek: p.cel / p.a[i], uzenet: 'A többi elem súlyozott bétáját le kell vonni, mielőtt a hiányzó elem súlyával osztasz.' },
          { ertek: p.cel / p.a[i] - tobbi, uzenet: 'Az egész egyenletet kell a súllyal osztani, nem csak a portfólió bétáját.' },
          { ertek: (p.cel - tobbi) * p.a[i], uzenet: 'A hiányzó elem súlyával osztani kell, nem szorozni.' },
        ]
        const k = kockazatosIdx(p)
        if (k.length < p.nevek.length) {
          // ha valaki a kockázatmentes eszközt kihagyja, és a kockázatos részt 100%-nak veszi
          const s = k.reduce((x, j) => x + p.a[j], 0)
          const a2 = p.a.map((a, j) => (p.nevek[j] === 'rf' ? 0 : a / s))
          hibak.push({ ertek: hianyzoBeta(p.cel, a2, p.b), uzenet: 'A kockázatmentes eszköz is a portfólió része: a bétája 0, de a súlya beleszámít.' })
          hibak.push({ ertek: hianyzoBeta(p.cel, p.a, p.b.map((b, j) => (p.nevek[j] === 'rf' ? 1 : b))), uzenet: 'A kockázatmentes eszköz bétája 0, nem 1.' })
        }
        return hibak
      },
      levezetes: (p) => {
        const i = p.b.indexOf(null)
        const tagok = p.a.map((a, j) => (j === i ? `${sz(a)} × β${p.nevek[i]}` : `${sz(a)} × ${sz(p.b[j]!)}`))
        return `${sz(p.cel)} = ${tagok.join(' + ')} → β${p.nevek[i]} = ${sz(hianyzoBeta(p.cel, p.a, p.b))}`
      },
    },
    {
      tipus: 'szam',
      key: 'w',
      formulaId: '4.4',
      kerdes: 'Mekkora a részvény súlya a portfólióban?',
      egyseg: '%',
      mikor: (p) => p.valtozat === 'suly',
      ertek: (p) => sulyCelBetahoz(p.cel, p.b[0]!).w,
      tipikusHibak: (p) => [{ ertek: p.b[0]! / p.cel, uzenet: 'Fordítva osztottál: a súly a cél béta osztva a részvény bétájával.' }],
      levezetes: (p) => {
        const w = sulyCelBetahoz(p.cel, p.b[0]!).w
        return `${sz(p.cel)} = w × ${sz(p.b[0]!)} + (1 − w) × 0 → w = ${sz(p.cel)} / ${sz(p.b[0]!)} = ${sz(w)} → ${pct(w)}`
      },
    },
    {
      tipus: 'szam',
      key: 'wf',
      formulaId: '4.4',
      kerdes: 'Mekkora a kockázatmentes eszköz súlya?',
      egyseg: '%',
      mikor: (p) => p.valtozat === 'suly',
      ertek: (_p, e) => 1 - e('w'),
      tipikusHibak: (p, e) => [
        { ertek: 1 - p.b[0]! / p.cel, uzenet: 'A részvény súlyát fordítva számoltad: w = cél béta / részvény béta, a kockázatmentes súly 1 − w.' },
        { ertek: 1 - p.cel, uzenet: 'A cél bétát el kell osztani a részvény bétájával: w = βcél / βrészvény, utána wf = 1 − w.' },
        { ertek: e('w') - 1, uzenet: 'Előjelhiba: a kockázatmentes súly 1 − w (hitelfelvételnél negatív).' },
        { ertek: 1 - p.cel * p.b[0]!, uzenet: 'A cél bétát a részvény bétájával osztani kell, nem szorozni: w = βcél / βrészvény.' },
        { ertek: e('w'), uzenet: 'Ez a részvény súlya; a kockázatmentes eszköz súlya 1 − w.' },
      ],
      levezetes: (_p, e) => {
        const wf = 1 - e('w')
        return `wf = 1 − ${sz(e('w'))} = ${sz(wf)} → ${pct(wf)}${wf < 0 ? ' (negatív súly: hitelfelvétel)' : ''}`
      },
    },
  ],
  diasPeldak: [
    { forras: '4.4 Példa (3. ea)', p: { valtozat: 'beta', nevek: ['A', 'B'], a: [0.4, 0.6], b: [0.8, 1.4] }, vart: { betaP: '1,16' } },
    {
      forras: '4.4 Példa (5. ea)',
      p: { valtozat: 'beta', nevek: ['A', 'B', 'C', 'D'], a: [0.15, 0.2, 0.3, 0.35], b: [0.8, 1.2, 1.05, 1.35] },
      vart: { betaP: '1,1475' },
    },
    {
      forras: '4.4 Visszafejtés (5. ea)',
      p: { valtozat: 'hianyzo', nevek: ['A', 'B', 'rf'], a: [1 / 3, 1 / 3, 1 / 3], b: [1.2, null, 0], cel: 1 },
      vart: { hiany: '1,8' },
    },
    { forras: '4.4 Súly visszafejtése (5. ea), cél 0,9', p: { valtozat: 'suly', nevek: ['D', 'rf'], b: [1.2, 0], cel: 0.9 }, vart: { w: '75%', wf: '25%' } },
    { forras: '4.4 Súly visszafejtése (5. ea), cél 2,4', p: { valtozat: 'suly', nevek: ['D', 'rf'], b: [1.2, 0], cel: 2.4 }, vart: { w: '200%', wf: '−100%' } },
  ],
}

// ---------------- 5.4: kockázatos + kockázatmentes portfólió ----------------

type KP = {
  valtozat: 'adott' | 'cel'
  betu: string
  EA: number
  betaA: number
  rf: number
  w: number
  cel: number
  sajat: number
}

export const kevertPortfolioSablon: Sablon<KP> = {
  id: 'kevert-portfolio',
  csalad: 'beta',
  cim: 'Kockázatos és kockázatmentes eszköz keveréke',
  felismeresek: [{ elott: '', helyes: 'F06', zavarok: ['F07', 'F08', 'F10'] }],
  general: (r) => {
    const rf = r.lepeskoz(0.02, 0.06, 0.005)
    const EA = kerekit4(rf + r.lepeskoz(0.04, 0.14, 0.005))
    const w = r.valaszt([0.25, 0.4, 0.5, 0.6, 0.75, 1.25, 1.5, 2] as const)
    return {
      valtozat: r.esely(0.6) ? 'adott' : 'cel',
      betu: r.valaszt(RESZVENY_BETUK),
      EA,
      betaA: r.lepeskoz(0.6, 2, 0.1),
      rf,
      w,
      cel: kerekit4(rf + w * (EA - rf)),
      sajat: r.lepeskoz(50, 200, 10) * 1000,
    }
  },
  ervenyes: () => true,
  szoveg: (p, r) => {
    const v = r.egesz(0, 3)
    const szereplo = SZEREPLOK[v]
    const a = betuNevelovel(p.betu)
    const reszveny = `${nagyKezdet(a)} részvény várható hozama ${pct(p.EA)}, bétája ${sz(p.betaA)}.`
    const rf = `A kockázatmentes hozam ${pct(p.rf)}.`
    // a 4. keretben mindig van zavaró adat
    const zavaro = v === 3 ? `${nagyKezdet(a)} részvény hozamának szórása ${pct(r.lepeskoz(0.15, 0.45, 0.01))}.` : undefined
    const sorrend = (szereplos: string) =>
      [
        [reszveny, rf, szereplos],
        [szereplos, reszveny, rf],
        [rf, szereplos, reszveny],
        [reszveny, szereplos, zavaro, rf],
      ][v]
        .filter(Boolean)
        .join(' ')
    if (p.valtozat === 'cel') {
      return {
        valtozat: `cel-k${v}`,
        bekezdesek: [sorrend(`${szereplo} ${a} részvényből és kockázatmentes eszközből ${pct(p.cel)} várható hozamú portfóliót szeretne összeállítani.`)],
        kerdesek: [`Vagyona hány százalékát fektesse ${a} részvénybe?`, 'Mekkora lesz a portfólió bétája?'],
      }
    }
    const befektetes =
      p.w > 1
        ? `${szereplo} ${sz(p.sajat)} USD saját pénzéhez ${sz((p.w - 1) * p.sajat)} USD hitelt vesz fel a kockázatmentes kamatlábon, és a teljes ${sz(p.w * p.sajat)} USD-t ${a} részvénybe fekteti.`
        : `${szereplo} vagyonának ${pct(p.w)}-át ${a} részvénybe, a többit kockázatmentes állampapírba fekteti.`
    return { valtozat: `adott-k${v}`, bekezdesek: [sorrend(befektetes)], kerdesek: ['Mekkora a portfólió várható hozama és bétája?'] }
  },
  zh: (p) => ({ kulcsok: p.valtozat === 'cel' ? ['w', 'betaP'] : ['EP', 'betaP'] }),
  lepesek: [
    {
      tipus: 'szam',
      key: 'w',
      formulaId: '5.4',
      kerdes: 'Mekkora a részvény súlya a portfólióban?',
      egyseg: '%',
      mikor: (p) => p.valtozat === 'cel',
      ertek: (p) => sulyCelHozamhoz(p.cel, p.EA, p.rf),
      tipikusHibak: (p) => [
        { ertek: p.cel / p.EA, uzenet: 'A kockázatmentes rész is hoz hozamot: w = (E(rP) − rf) / (E(rA) − rf).' },
      ],
      levezetes: (p) => {
        const w = sulyCelHozamhoz(p.cel, p.EA, p.rf)
        return `${sz(p.cel)} = w × ${sz(p.EA)} + (1 − w) × ${sz(p.rf)} → w = (${sz(p.cel)} − ${sz(p.rf)}) / (${sz(p.EA)} − ${sz(p.rf)}) = ${sz(w)} → ${pct(w)}`
      },
    },
    {
      tipus: 'szam',
      key: 'EP',
      formulaId: '5.4',
      kerdes: 'Mekkora a portfólió várható hozama?',
      egyseg: '%',
      mikor: (p) => p.valtozat === 'adott',
      ertek: (p) => kevertPortfolio(p.w, p.EA, p.betaA, p.rf).Er,
      tipikusHibak: (p) => [
        {
          ertek: p.w * p.EA,
          uzenet:
            p.w > 1
              ? 'A hitel kamatát le kell vonni: a kockázatmentes súly (1 − w) negatív.'
              : 'A kockázatmentes részre jutó hozamot, (1 − w) × rf-et is hozzá kell adni.',
        },
      ],
      levezetes: (p) => {
        const v = kevertPortfolio(p.w, p.EA, p.betaA, p.rf).Er
        return `E(rP) = ${sz(p.w)} × ${sz(p.EA)} + ${z(1 - p.w)} × ${sz(p.rf)} = ${sz(v)} → ${pct(v)}`
      },
    },
    {
      tipus: 'szam',
      key: 'betaP',
      formulaId: '5.4',
      kerdes: 'Mekkora a portfólió bétája?',
      egyseg: 'tizedes',
      tures: { abs: 0.001 },
      ertek: (p, e) => kevertPortfolio(p.valtozat === 'cel' ? e('w') : p.w, p.EA, p.betaA, p.rf).beta,
      tipikusHibak: (p, e) => {
        const w = p.valtozat === 'cel' ? e('w') : p.w
        return [
          { ertek: p.betaA, uzenet: 'A kockázatos rész súlyával is szorozni kell: βP = w × βA.' },
          { ertek: w * w * p.betaA, uzenet: 'A súly a bétánál nem szerepel négyzetre emelve (az a portfólió varianciájánál van): βP = w × βA.' },
          ...(p.valtozat === 'adott'
            ? [{ ertek: (kevertPortfolio(w, p.EA, p.betaA, p.rf).Er / p.EA) * p.betaA, uzenet: 'A béta nem a hozamok arányában oszlik meg: βP = w × βA, a kockázatmentes rész bétája 0.' }]
            : []),
          { ertek: p.betaA / w, uzenet: 'A súllyal szorozni kell, nem osztani: βP = w × βA.' },
          { ertek: w * p.betaA + (1 - w), uzenet: 'A kockázatmentes eszköz bétája 0, nem 1.' },
          p.valtozat === 'cel'
            ? { ertek: (p.cel / p.EA) * p.betaA, uzenet: 'A súlyhoz a kockázatmentes hozamot is figyelembe kell venni: w = (E(rP) − rf) / (E(rA) − rf).' }
            : { ertek: (1 - w) * p.betaA, uzenet: 'A kockázatos rész súlyával kell szorozni, nem a kockázatmentesével.' },
        ]
      },
      levezetes: (p, e) => {
        const w = p.valtozat === 'cel' ? e('w') : p.w
        return `βP = w × βA = ${sz(w)} × ${sz(p.betaA)} = ${sz(w * p.betaA)}`
      },
    },
  ],
  diasPeldak: [
    { forras: '5.4 Példa (3. ea), 25% A', p: { valtozat: 'adott', EA: 0.2, betaA: 1.6, rf: 0.08, w: 0.25 }, vart: { EP: '11%', betaP: '0,4' } },
    { forras: '5.4 Példa (3. ea), 150% A hitellel', p: { valtozat: 'adott', EA: 0.2, betaA: 1.6, rf: 0.08, w: 1.5 }, vart: { EP: '26%', betaP: '2,4' } },
    { forras: '5.4 Példa (5. ea)', p: { valtozat: 'cel', EA: 0.12, betaA: 1.2, rf: 0.04, cel: 0.09 }, vart: { w: '62,5%', betaP: '0,75' } },
  ],
}
