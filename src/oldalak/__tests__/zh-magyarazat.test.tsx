import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ujFeladat } from '../../gyakorlas/motor.ts'
import { SABLONOK } from '../../gyakorlas/sablonok/index.ts'
import { ALLITASOK } from '../../zh/allitasok.ts'
import { ELMELETI } from '../../zh/elmeleti.ts'
import { MC_HATTER, zhOsszeallit } from '../../zh/sorsolas.ts'
import { IgazHamisMiert, Reszeredmenyek, SzamitasMiert, ValasztosMiert } from '../ZhMagyarazat.tsx'

// A ZH kiértékelésének magyarázó blokkjai.

describe('részeredmények blokk', () => {
  it('a kérdezettig minden lépés egy sor, a kérdezett végeredmény kiemelve, a levezetéssel', () => {
    const s = SABLONOK.find((x) => x.id === 'baumol')!
    const f = ujFeladat(s, 1)
    const kulcsok = s.zh!(f.p).kulcsok
    const html = renderToStaticMarkup(<Reszeredmenyek feladat={f} kerdezett={kulcsok} />)
    const utolso = Math.max(...f.lepesek.map((l, i) => (kulcsok.includes(l.key) ? i : -1)))
    expect(html).toContain('Részeredmények')
    expect((html.match(/<li/g) ?? []).length).toBe(utolso + 1)
    expect(html).toContain('kerdezett')
    for (const l of f.lepesek.slice(0, utolso + 1)) expect(html).toContain(l.kerdes.replace(/&/g, '&amp;').replace(/"/g, '&quot;').slice(0, 15))
  })
})

describe('igaz-hamis magyarázat', () => {
  it('hamisnál a cserélt szavak jelölve, és ott a képlettár mondata a forrás nevével', () => {
    const a = ALLITASOK.find((x) => x.id === 'teljes-hozam')!
    const html = renderToStaticMarkup(<IgazHamisMiert k={{ allitas: a, igaz: false, szoveg: a.hamis }} />)
    expect(html).toContain('Miért?')
    expect(html).toMatch(/<mark class="zh-csere-hamis">záró<\/mark>/)
    expect(html).toMatch(/<mark class="zh-csere-igaz">kezdő<\/mark>/)
    expect(html).toContain('Teljes (százalékos) hozam')
    expect(html).toContain('<blockquote')
  })

  it('a kiemelésben nincs benne a szóvégi írásjel', () => {
    const a = ALLITASOK.find((x) => x.hamis.includes('kisebb, mint az eszközöké'))!
    const html = renderToStaticMarkup(<IgazHamisMiert k={{ allitas: a, igaz: false, szoveg: a.hamis }} />)
    expect(html).not.toMatch(/<mark[^>]*>[^<]*[,.;:]<\/mark>/)
  })

  it('„A képlettár szerint:” felirat (képlet vagy táblázatsor is jöhet), és minden forrás megjelenik', () => {
    const a = ALLITASOK.find((x) => x.id === 'agazat-kozmu-szoftver')!
    const html = renderToStaticMarkup(<IgazHamisMiert k={{ allitas: a, igaz: false, szoveg: a.hamis }} />)
    expect(html).toContain('A képlettár szerint:')
    expect(html).not.toContain('A képlettár mondata')
    expect((html.match(/<blockquote/g) ?? []).length).toBe(3)
    const m = ALLITASOK.find((x) => x.id === 'miller-orr-szoras')!
    expect(renderToStaticMarkup(<IgazHamisMiert k={{ allitas: m, igaz: true, szoveg: m.igaz }} />)).toContain('zh-idezet-magyarazat')
  })

  it('igaznál nincs csere-jelölés, csak a forrás', () => {
    const a = ALLITASOK.find((x) => x.id === 'teljes-hozam')!
    const html = renderToStaticMarkup(<IgazHamisMiert k={{ allitas: a, igaz: true, szoveg: a.igaz }} />)
    expect(html).not.toContain('<mark')
    expect(html).toContain('<blockquote')
  })
})

describe('feleletválasztós magyarázat', () => {
  // a felhasználó kérése (2026-11-24): számolós kérdésnél csak a számítások, a többinél a „Miért?”
  it('elméletinél és felismerősnél „Miért?”, számításinál csak a részeredmények; képletnél KaTeX', () => {
    const fajtak = new Set<string>()
    for (let seed = 1; seed <= 10; seed++)
      for (const k of zhOsszeallit(seed, [], 2).valasztos) {
        fajtak.add(k.fajta)
        const html = renderToStaticMarkup(<ValasztosMiert k={k} valasz={null} />)
        if (k.fajta === 'szamitas') {
          expect(html).not.toContain('Miért?')
          expect(html).toContain('Részeredmények')
        } else {
          expect(html, k.fajta).toContain('Miért?')
          expect(html, k.fajta).not.toContain('Részeredmények')
        }
        if (k.fajta === 'elmeleti') expect(html).toContain('<blockquote')
        if (k.fajta === 'felismeres') expect(html).toContain('a lánc')
      }
    expect([...fajtak].sort()).toEqual(['elmeleti', 'felismeres', 'szamitas'])
    const tsq = ELMELETI.find((x) => x.kulcs.startsWith('TS_{'))!
    const q = { fajta: 'elmeleti' as const, kerdes: tsq.kerdes, opciok: [tsq.helyes, ...tsq.rosszak], helyes: 0 }
    MC_HATTER.set(q, { fajta: 'elmeleti', kerdes: tsq })
    expect(renderToStaticMarkup(<ValasztosMiert k={q} valasz={1} />)).toContain('katex')
  })

  it('számítási kérdésnél a részeredmények a kérdezett értékig tartanak, és az a kiemelt', () => {
    let db = 0
    for (let seed = 1; seed <= 30; seed++)
      for (const k of zhOsszeallit(seed, [], 1).valasztos) {
        const h = MC_HATTER.get(k)
        if (h?.fajta !== 'szamitas') continue
        const html = renderToStaticMarkup(<ValasztosMiert k={k} valasz={null} />)
        expect(html.match(/<li class="kerdezett"/g) ?? []).toHaveLength(1)
        expect(html.trimEnd()).toMatch(/<li class="kerdezett">(?:(?!<li).)*<\/li><\/ol><\/div>$/s)
        db++
      }
    expect(db).toBeGreaterThan(20)
  })
})

describe('számítási példa magyarázata', () => {
  it('csak a részeredmények, „Miért?” nélkül', () => {
    for (const p of zhOsszeallit(7, [], 1).szamitas) {
      const html = renderToStaticMarkup(<SzamitasMiert p={p} />)
      expect(html).toContain('Részeredmények')
      expect(html).not.toContain('Miért?')
    }
  })

  it('felismerős kérdésnél kérdőjellel végződő kérdés után nincs „?.”', () => {
    let db = 0
    for (let seed = 1; seed <= 200; seed++)
      for (const k of zhOsszeallit(seed, [], 1).valasztos) {
        const h = MC_HATTER.get(k)
        if (h?.fajta !== 'felismeres') continue
        expect(renderToStaticMarkup(<ValasztosMiert k={k} valasz={null} />)).not.toContain('?.')
        db++
      }
    expect(db).toBeGreaterThan(50)
  })

  it('a magyarázatokban nincs nyers markdown-jelölés (\\_ vagy **)', () => {
    for (let seed = 1; seed <= 15; seed++)
      for (const kor of [1, 2] as const) {
        const zh = zhOsszeallit(seed, [], kor)
        const html = [
          ...zh.igazHamis.map((k) => renderToStaticMarkup(<IgazHamisMiert k={k} />)),
          ...zh.valasztos.map((k) => renderToStaticMarkup(<ValasztosMiert k={k} valasz={null} />)),
          ...zh.szamitas.map((p) => renderToStaticMarkup(<SzamitasMiert p={p} />)),
        ].join('\n')
        expect(html, `${kor}/${seed}`).not.toMatch(/\\_|\*\*/)
      }
  })
})
