import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { keplet } from '../../content/kepletter.ts'
import { ujFeladat } from '../../gyakorlas/motor.ts'
import { SABLONOK } from '../../gyakorlas/sablonok/index.ts'
import { ZhKepletek } from '../../oldalak/ZhMagyarazat.tsx'
import { mcKepletei, megoldasKepletei } from '../magyarazat.ts'
import { MC_HATTER, zhOsszeallit } from '../sorsolas.ts'

// A tanár bejelentése (2026-11-26, pontosítva 2026-11-27): a ZH-ban képletet csak a készpénz- és
// likviditásmenedzsment (9. fejezet: Baumol, Miller–Orr) számolós feladataihoz ad. A szimuláció ezért csak
// ezeknél mutatja a képletet kitöltés közben (név és képletszám nélkül); a többi számolós feladatnál és a
// felismerős kérdéseknél nem.

const ZH_SABLONOK = SABLONOK.filter((s) => s.zh)
const KEPLETES = ['baumol', 'miller-orr']

describe('a megoldáshoz szükséges képletek', () => {
  it('a likviditási sablonoknál: a lépések képletei a kérdezettig, ismétlés nélkül, a lépés saját LaTeX-blokkjával', () => {
    for (const s of ZH_SABLONOK.filter((x) => KEPLETES.includes(x.id)))
      for (let seed = 1; seed <= 20; seed++) {
        const f = ujFeladat(s, seed)
        const kulcsok = s.zh!(f.p).kulcsok
        const k = megoldasKepletei(f, kulcsok)
        expect(k.length, s.id).toBeGreaterThan(0)
        expect(new Set(k).size, s.id).toBe(k.length)
        const utolso = Math.max(...f.lepesek.map((l, i) => (kulcsok.includes(l.key) ? i : -1)))
        const vart = [...new Set(f.lepesek.slice(0, utolso + 1).map((l) => keplet(l.formulaId)!.latex[l.latexIdx ?? 0] ?? keplet(l.formulaId)!.latex[0]))]
        expect(k, `${s.id} #${seed}`).toEqual(vart)
      }
  })

  it('a többi számolós sablonnál nincs képlet', () => {
    const tobbi = ZH_SABLONOK.filter((x) => !KEPLETES.includes(x.id))
    expect(tobbi.length).toBeGreaterThan(10)
    for (const s of tobbi)
      for (let seed = 1; seed <= 20; seed++) {
        const f = ujFeladat(s, seed)
        expect(megoldasKepletei(f, s.zh!(f.p).kulcsok), `${s.id} #${seed}`).toEqual([])
      }
  })

  it('mindkét likviditási sablon ZH-képes', () => {
    expect(ZH_SABLONOK.map((x) => x.id)).toEqual(expect.arrayContaining(KEPLETES))
  })

  it('a kérdezett utáni lépés képlete nem kerül bele (Baumol: C kérdésnél nincs az időköz képlete)', () => {
    const s = SABLONOK.find((x) => x.id === 'baumol')!
    for (let seed = 1; seed <= 60; seed++) {
      const f = ujFeladat(s, seed)
      const l = f.lepesek.find((x) => x.key === 'L')
      if (!l) continue
      const idokoz = keplet(l.formulaId)!.latex[l.latexIdx ?? 0]
      expect(megoldasKepletei(f, ['C'])).not.toContain(idokoz)
      expect(megoldasKepletei(f, ['L'])).toContain(idokoz)
      return
    }
    throw new Error('nincs Baumol-feladat L lépéssel')
  })
})

describe('a ZH feleletválasztós kérdései', () => {
  it('likviditási számítási kérdésnél a kérdezett értékig a képletek; minden más kérdésnél semmi', () => {
    const fajtak = new Set<string>()
    let kepletes = 0
    for (let seed = 1; seed <= 20; seed++)
      for (const kor of [1, 2] as const)
        for (const k of zhOsszeallit(seed, [], kor).valasztos) {
          fajtak.add(k.fajta)
          const h = MC_HATTER.get(k)!
          if (h.fajta === 'szamitas' && KEPLETES.includes(h.feladat.sablon.id)) {
            kepletes++
            expect(mcKepletei(k).length).toBeGreaterThan(0)
            expect(mcKepletei(k)).toEqual(megoldasKepletei(h.feladat, [h.key]))
          } else expect(mcKepletei(k), `${k.fajta} ${"feladat" in h ? h.feladat.sablon.id : ""}`).toEqual([])
        }
    expect([...fajtak].sort()).toEqual(['elmeleti', 'felismeres', 'szamitas'])
    expect(kepletes, 'legalább egy likviditási számítási kérdés').toBeGreaterThan(0)
  })
})

describe('a képletdoboz', () => {
  it('a képleteket KaTeX-szel rajzolja, a képlet neve és száma nélkül', () => {
    const s = SABLONOK.find((x) => x.id === 'baumol')!
    const f = ujFeladat(s, 1)
    const html = renderToStaticMarkup(<ZhKepletek kepletek={megoldasKepletei(f, ['C'])} />)
    expect(html).toContain('Képletek')
    expect(html).toContain('katex')
    expect(html).not.toContain('Baumol')
    expect(html).not.toMatch(/\b9\.1\b/)
  })

  it('üres listánál nem rajzol semmit', () => {
    expect(renderToStaticMarkup(<ZhKepletek kepletek={[]} />)).toBe('')
  })
})
