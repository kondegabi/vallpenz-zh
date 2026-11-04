import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DIAHIBAK, diahibaKor } from '../content/diahibak.ts'
import { fejezetKor, felismeroSorKor, kepletKor, KEPLETEK, KT } from '../content/kepletter.ts'
import { parseKepletter } from '../content/parse.ts'
import { CSALADOK, sablonKor, SABLONOK } from '../gyakorlas/sablonok/index.ts'
import { korbaTartozik, korBeolvas, korCsoportok, KOR_OPCIOK, korEredmenyei } from '../kor.ts'
import { leckeKor, LECKEK } from '../leckek/leckek.ts'
import { eredmeny } from '../gyakorlas/formaz.ts'
import { ALLITASOK, allitasKor, IGAZ_HAMIS_BANK } from '../zh/allitasok.ts'
import { ELMELETI, elmeletiKor } from '../zh/elmeleti.ts'
import { kiertekel, type Valaszok } from '../zh/pontozas.ts'
import { IH_DB, MC_DB, SZ_DB, type Zh, zhOsszeallit } from '../zh/sorsolas.ts'

// A két ZH anyaga egy appban van, de minden elem pontosan az egyikhez tartozik: az 1. ZH tartalma az
// új anyagtól nem változhat, és a választó szerint szűrve nem keveredhetnek.

const md = readFileSync(fileURLToPath(new URL('../../keplettar.md', import.meta.url)), 'utf8').replace(/\r\n/g, '\n')

function fnv(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

describe('az 1. ZH tartalma nem változott (ujjlenyomat a 2. ZH anyaga előttről)', () => {
  it('a képlettár 1–7. fejezete betűre ugyanaz', () => {
    const eleje = md.indexOf('## 1. Hozamszámítás')
    const vege = md.indexOf('\n# 2. ZH')
    expect(vege).toBeGreaterThan(eleje)
    expect(fnv(md.slice(eleje, vege).trim())).toBe('afada9a8')
  })

  it('ugyanabból a seedből ugyanaz az 1. ZH sorsolódik', () => {
    const zhk = [1, 2, 3, 7, 42, 1234, 99999].map((s) => JSON.stringify(zhOsszeallit(s)))
    expect(fnv(zhk.join('|'))).toBe('cd503fc8')
  })
})

describe('melyik ZH-hoz tartozik: a képlettár rész-fejléce dönti el', () => {
  it('a „# N. ZH” fejléc az utána jövő fejezetekre érvényes', () => {
    const kt = parseKepletter(`# Cím

## A képletek térképe

Szöveg.

# 1. ZH anyaga

## 1. Első

### 1.1 Egy

\`\`\`latex
x
\`\`\`

# 2. ZH anyaga

## 8. Második

### 8.1 Kettő

\`\`\`latex
y
\`\`\`

## Feladattípus-felismerő

| A | B | C |
| --- | --- | --- |
| a | b | 8.1 |

## Hibák a diákon

Nincs.
`)
    expect(kt.fejezetek.map((f) => [f.szam, f.kor])).toEqual([
      [1, 1],
      [8, 2],
    ])
    expect(kt.terkep.blokkok).toHaveLength(1)
  })

  it('rész-fejléc nélkül minden az 1. ZH-é', () => {
    const kt = parseKepletter('# C\n\n## A képletek térképe\n\n## 3. X\n\n## Feladattípus-felismerő\n\n## Hibák a diákon\n')
    expect(kt.fejezetek[0].kor).toBe(1)
  })

  it('az 1–7. fejezet az 1., a 8. a 2. ZH-é; minden képletnek pontosan egy ZH-ja van', () => {
    expect(KT.fejezetek.filter((f) => f.kor === 1).map((f) => f.szam)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(KT.fejezetek.filter((f) => f.kor === 2).map((f) => f.szam)).toEqual([8])
    expect(fejezetKor(7)).toBe(1)
    expect(fejezetKor(8)).toBe(2)
    expect(kepletKor('7.4')).toBe(1)
    expect(kepletKor('8.1')).toBe(2)
    for (const k of KEPLETEK) expect([1, 2], k.id).toContain(kepletKor(k.id))
  })

  it('a felismerő tábla 14 régi sora az 1., az új sorok a 2. ZH-é', () => {
    const korok = KT.felismero.sorok.map(felismeroSorKor)
    expect(korok.slice(0, 14)).toEqual(new Array(14).fill(1))
    expect(korok.slice(14).length).toBeGreaterThan(4)
    expect(korok.slice(14).every((k) => k === 2)).toBe(true)
  })

  it('a diahibák táblázatában minden sor egy ZH-hoz tartozik', () => {
    expect(DIAHIBAK.filter((h) => diahibaKor(h) === 1)).toHaveLength(7)
    expect(DIAHIBAK.filter((h) => diahibaKor(h) === 2).length).toBeGreaterThan(0)
  })

  it('leckék: a régi 12 az 1., az újak a 2. ZH-é, és egy lecke képletei egy ZH-ban vannak', () => {
    expect(LECKEK.filter((l) => leckeKor(l) === 1)).toHaveLength(12)
    expect(LECKEK.filter((l) => leckeKor(l) === 2).length).toBeGreaterThan(0)
    for (const l of LECKEK) for (const id of l.kepletek) expect(kepletKor(id), `${l.szam}: ${id}`).toBe(leckeKor(l))
  })

  it('feladatok: minden sablon családja egy ZH-hoz tartozik, a végeredmény képlete is abból a ZH-ból van', () => {
    expect(CSALADOK.filter((c) => c.kor === 1).map((c) => c.id)).toEqual(['hozam', 'allapot', 'beta', 'capm', 'npv', 'wacc'])
    expect(CSALADOK.filter((c) => c.kor === 2).length).toBeGreaterThan(0)
    for (const s of SABLONOK) expect(kepletKor(s.lepesek[s.lepesek.length - 1].formulaId), s.id).toBe(sablonKor(s))
  })
})

describe('a választó', () => {
  it('három lehetőség: 1. ZH, 2. ZH, összes', () => {
    expect(KOR_OPCIOK.map((o) => o.ertek)).toEqual([1, 2, 'mind'])
  })

  it('szűrés, csoportosítás és a választó értéke', () => {
    expect([korBeolvas('1'), korBeolvas('2'), korBeolvas('mind')]).toEqual([1, 2, 'mind'])
    expect(korbaTartozik(1, 1)).toBe(true)
    expect(korbaTartozik(1, 2)).toBe(false)
    expect(korbaTartozik('mind', 2)).toBe(true)
    expect(korCsoportok('mind')).toEqual([1, 2])
    expect(korCsoportok(2)).toEqual([2])
  })

  it('a régi ZH-eredmények (kor nélkül) az 1. ZH-hoz számítanak', () => {
    const e = (kor?: 1 | 2 | 'mind') => ({ datum: 'd', seed: 1, pont: { ih: 0, mc: 0, sz: 0, ossz: 0 }, mp: 1, lejart: false, kor })
    const lista = [e(), e(1), e(2), e('mind')]
    expect(korEredmenyei(lista, 1)).toEqual([lista[0], lista[1]])
    expect(korEredmenyei(lista, 2)).toEqual([lista[2]])
    expect(korEredmenyei(lista, 'mind')).toEqual(lista)
  })
})

function jok(zh: Zh): Valaszok {
  return {
    ih: zh.igazHamis.map((k) => k.igaz),
    mc: zh.valasztos.map((k) => k.helyes),
    sz: zh.szamitas.map((p) =>
      Object.fromEntries(
        p.kulcsok.map((k) => {
          const l = p.feladat.lepesek.find((x) => x.key === k)!
          const v = p.feladat.ertekek[k]
          if (l.tipus !== 'szam') return [k, String(v)]
          return [k, eredmeny(v as number, l.egyseg).replace(/ ?(%|M USD|USD)$/, '')]
        }),
      ),
    ),
  }
}

describe('ZH-szimuláció ZH-nként', () => {
  it('a bankok elegendők a 2. ZH-hoz', () => {
    expect(IGAZ_HAMIS_BANK.filter((a) => allitasKor(a) === 2).length).toBeGreaterThanOrEqual(3 * IH_DB)
    expect(ELMELETI.filter((k) => elmeletiKor(k) === 2).length).toBeGreaterThanOrEqual(8)
    expect(ALLITASOK.filter((a) => allitasKor(a) === 1).length).toBe(47)
    expect(ELMELETI.filter((k) => elmeletiKor(k) === 1).length).toBe(16)
  })

  it('a 2. ZH-ban csak 2. ZH-s elem van, a darabszámok jók, a hibátlan kitöltés 50 pont', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const zh = zhOsszeallit(seed * 104729, [], 2)
      expect(zh.igazHamis).toHaveLength(IH_DB)
      expect(zh.valasztos).toHaveLength(MC_DB)
      expect(zh.szamitas).toHaveLength(SZ_DB)
      for (const k of zh.igazHamis) expect(allitasKor(k.allitas), k.allitas.id).toBe(2)
      for (const p of zh.szamitas) expect(sablonKor(p.feladat.sablon), p.feladat.sablon.id).toBe(2)
      expect(new Set(zh.szamitas.map((p) => p.feladat.sablon.id)).size, `#${seed}`).toBe(SZ_DB)
      for (const k of zh.valasztos) if (k.kulcs) expect(sablonKor(SABLONOK.find((s) => s.id === k.kulcs!.split(':')[0])!), k.kulcs).toBe(2)
      expect(kiertekel(zh, jok(zh)).pont.ossz, `#${seed}`).toBe(50)
    }
  })

  it('az 1. ZH-ban csak 1. ZH-s elem van', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const zh = zhOsszeallit(seed * 7907, [], 1)
      for (const k of zh.igazHamis) expect(allitasKor(k.allitas), k.allitas.id).toBe(1)
      for (const p of zh.szamitas) expect(sablonKor(p.feladat.sablon), p.feladat.sablon.id).toBe(1)
    }
  })

  it('az összes anyagból sorsolt ZH-ban mindkét ZH anyaga előfordul', () => {
    const korok = new Set<number>()
    for (let seed = 1; seed <= 100; seed++) for (const p of zhOsszeallit(seed * 31, [], 'mind').szamitas) korok.add(sablonKor(p.feladat.sablon))
    expect([...korok].sort()).toEqual([1, 2])
  })
})
