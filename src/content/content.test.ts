import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { FUGGOSEGEK } from './fuggosegek.ts'
import { JELEK } from './jelek.ts'
import { elofordulasok, kiemel } from './kiemel.ts'
import { KEPLETEK, KEPLET_IDK, KT } from './kepletter.ts'

const md = readFileSync(fileURLToPath(new URL('../../keplettar.md', import.meta.url)), 'utf8')

const KATEX_OPCIOK = {
  displayMode: true,
  throwOnError: true,
  strict: 'ignore' as const,
  trust: (ctx: { command: string }) => ctx.command === '\\htmlClass',
}

describe('A képlettár beolvasása', () => {
  it('megvan az 1. ZH 7 fejezete és 28 képlete, utána a 2. ZH anyaga, sorrendben', () => {
    expect(KT.fejezetek.map((f) => f.szam)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(KEPLETEK.filter((k) => k.fejezet === 8).map((k) => k.id)).toEqual(['8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '8.10'])
    expect(KEPLETEK.filter((k) => k.fejezet <= 7).map((k) => k.id)).toEqual([
      '1.1', '1.2', '1.3', '1.4', '2.1', '2.2', '2.3', '2.4', '3.1', '3.2', '3.3', '3.4', '3.5',
      '4.1', '4.2', '4.3', '4.4', '5.1', '5.2', '5.3', '5.4', '6.1', '6.2', '7.1', '7.2', '7.3', '7.4', '7.5',
    ])
  })

  it('a 2.4 és a 7.5 kivételével minden képletnek van LaTeX-e és „Magyarul:” mondata', () => {
    for (const k of KEPLETEK) {
      if (k.id === '2.4' || k.id === '7.5') continue
      expect(k.latex.length, k.id).toBeGreaterThan(0)
      if (k.id !== '7.5') expect(k.magyarul, k.id).toBeTruthy()
    }
    expect(KEPLETEK.find((k) => k.id === '3.4')!.latex).toHaveLength(2)
  })

  it('a szövegek szó szerint a forrásból jönnek', () => {
    for (const k of KEPLETEK) {
      for (const b of k.blokkok) {
        if (b.tipus === 'magyarul') expect(md).toContain(`**Magyarul:** ${b.szoveg}`)
        if (b.tipus === 'latex') expect(md).toContain(b.forras)
        if (b.tipus === 'pont') expect(md).toContain(b.cimke ? `**${b.cimke}:** ${b.szoveg}` : b.szoveg)
        if (b.tipus === 'bekezdes') expect(md.replace(/\r?\n/g, ' ')).toContain(b.szoveg)
      }
    }
  })

  it('a csapdák és a példák kigyűjtése', () => {
    const k71 = KEPLETEK.find((k) => k.id === '7.1')!
    expect(k71.csapdak[0]).toMatch(/^„tavaly fizetett”/)
    expect(k71.peldak.map((p) => p.cimke)).toEqual(['Példa (4. ea)', 'Példa (videó)'])
    const k74 = KEPLETEK.find((k) => k.id === '7.4')!
    const lanc = k74.blokkok.find((b) => b.tipus === 'pont' && b.cimke?.includes('teljes lánc'))
    expect(lanc?.tipus === 'pont' && lanc.alpontok).toHaveLength(4)
  })

  it('a címekben nincs markdown-escape', () => {
    expect(KEPLETEK.find((k) => k.id === '5.3')!.cim).toBe('Két helyesen árazott eszközből r_f és E(rM)')
  })

  it('a fő szakaszok és a felismerő tábla sorai (14 az 1. ZH-é)', () => {
    expect(KT.cim).toBe('Vállalati pénzügyek II – ZH képlettár')
    expect(KT.terkep.blokkok[0].tipus).toBe('kod')
    expect(KT.felismero.sorok).toHaveLength(22)
    for (const s of KT.felismero.sorok) expect(s.kepletek.length, s.lanc).toBeGreaterThan(0)
    expect(KT.felismero.sorok[13].kepletek).toEqual(['5.1', '7.5'])
    expect(KT.hibak.blokkok.some((b) => b.tipus === 'tabla')).toBe(true)
  })
})

describe('Függőségek', () => {
  it('csak létező képletekre hivatkoznak', () => {
    for (const [id, fs] of Object.entries(FUGGOSEGEK)) {
      expect(KEPLET_IDK.has(id), id).toBe(true)
      for (const f of fs) expect(KEPLET_IDK.has(f.id), `${id} → ${f.id}`).toBe(true)
    }
  })
})

describe('KaTeX és jelkiemelés', () => {
  it('minden LaTeX-blokk hiba nélkül renderelődik', () => {
    for (const k of KEPLETEK) for (const l of k.latex) expect(() => katex.renderToString(l, KATEX_OPCIOK), k.id).not.toThrow()
  })

  it('minden képletnek van jeltáblája (jel és jelentés)', () => {
    const hianyzik = KEPLETEK.filter((k) => !k.jelTabla || k.jelTabla.sorok.some((s) => !s[0]?.trim() || !s[1]?.trim())).map((k) => k.id)
    expect(hianyzik).toEqual([])
  })

  it('minden jeltáblának van megfeleltetése, soronként', () => {
    for (const k of KEPLETEK) {
      if (!k.jelTabla) continue
      expect(JELEK[k.id], k.id).toBeDefined()
      expect(JELEK[k.id].length, k.id).toBe(k.jelTabla.sorok.length)
    }
    for (const id of Object.keys(JELEK)) expect(KEPLETEK.find((k) => k.id === id)?.jelTabla, id).toBeDefined()
  })

  it('minden kiemelési minta önállóan előfordul a képletben, és kiemelve is renderelődik', () => {
    for (const [id, jelek] of Object.entries(JELEK)) {
      const latex = KEPLETEK.find((k) => k.id === id)!.latex
      for (const j of jelek) {
        expect(() => katex.renderToString(j.megj, { ...KATEX_OPCIOK, displayMode: false }), j.megj).not.toThrow()
        for (const m of j.mintak) {
          const db = latex.reduce((s, l) => s + elofordulasok(l, m).length, 0)
          expect(db, `${id}: ${m}`).toBeGreaterThan(0)
        }
        for (const l of latex) {
          const html = katex.renderToString(kiemel(l, j.mintak), KATEX_OPCIOK)
          expect(html.includes('jel-kiemelt') || !j.mintak.some((m) => elofordulasok(l, m).length), `${id}: ${j.megj}`).toBe(true)
        }
      }
    }
  })

  it('a kiemelés nem nyúl bele hosszabb jelekbe', () => {
    // 7.4: az E nem emelhető ki az r_E belsejéből, a D az r_D-ből
    const l = KEPLETEK.find((k) => k.id === '7.4')!.latex[0]
    expect(elofordulasok(l, 'E')).toHaveLength(2)
    expect(elofordulasok(l, 'D')).toHaveLength(2)
    // 7.3: csak a jobb oldali r_D
    expect(kiemel('r_D^{x} = r_D\\,(1 - T_C)', ['r_D\\,'])).toBe('r_D^{x} = \\htmlClass{jel-kiemelt}{r_D\\,}(1 - T_C)')
  })
})

describe('a 8. fejezet lefedi a diasort (a jegyzettel összevetve)', () => {
  it.each([
    ['6. dia, hozzáadott érték', 'a meglévő saját tőke növekedése'],
    ['9. dia, hatékony piac', 'a tökéletes piac hatékony'],
    ['9. dia, CAPM', 'jól működik (CAPM)'],
    ['13. dia, nem-normális helyzet', 'nem-normális helyzet'],
    ['17. dia, mutatók', 'EPS, P (árfolyam), P/E, EBIT és ROE'],
    ['23. dia, FCFE', 'Equity érték (FCFE'],
    ['23. dia, APV', 'Capital CF, APV'],
    ['26. dia, volatilis CF', 'ha a CF volatilis'],
    ['31. dia, a táblázat eleje', '| Food Wholesalers | 79,51% |'],
    ['31. dia, a táblázat vége', '| Semiconductor Equip | 2,22% |'],
  ])('%s', (_nev, szoveg) => {
    expect(md.includes(szoveg), szoveg).toBe(true)
  })

  it('a 31. dia táblázatának mind a 20 sora megvan', () => {
    const k = KEPLETEK.find((x) => x.id === '8.10')!
    const t = k.blokkok.find((b) => b.tipus === 'tabla' && b.fejlec[0] === 'Ágazat')
    expect(t?.tipus === 'tabla' && t.sorok).toHaveLength(20)
  })
})
