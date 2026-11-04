import { describe, expect, it } from 'vitest'
import { utvonalHashbol } from '../router.ts'
import { idkSzovegben, kepletIdkSzovegben, parseKepletter } from './parse.ts'

// Új tananyag hozzáadhatósága: egy 8. vagy későbbi fejezet és kétjegyű képletszám (pl. 10.12) is
// működjön kódmódosítás nélkül (beolvasás, hivatkozás a szövegben, útvonal, felismerő lánc).

const md = `# Teszt képlettár

## A képletek térképe

Bevezető.

## 8. Új fejezet

### 8.1 Első képlet

\`\`\`latex
x = 1
\`\`\`

## 10. Még egy fejezet

### 10.12 Kétjegyű képlet

\`\`\`latex
y = 2
\`\`\`

- **Kell hozzá:** 8.1

## Feladattípus-felismerő

| Ha a feladat ezt adja… | …és ezt kérdezi | Lánc (fejezetek) |
| --- | --- | --- |
| x | y | 8.1 → 10.12 |

## Hibák a diákon

| Hol | A dián | Helyesen | Státusz |
| --- | --- | --- | --- |
| sehol | semmi | semmi | számítással igazolva |
`

describe('bővíthetőség: új fejezet és kétjegyű képletszám', () => {
  it('a 8. és a 10. fejezet képletei beolvasódnak', () => {
    const kt = parseKepletter(md)
    expect(kt.fejezetek.map((f) => [f.szam, f.kepletek.map((k) => k.id)])).toEqual([
      [8, ['8.1']],
      [10, ['10.12']],
    ])
    expect(kt.felismero.sorok[0].kepletek).toEqual(['8.1', '10.12'])
  })

  it('a szövegbeli hivatkozás és az útvonal a kétjegyű képletszámot is felismeri', () => {
    expect(idkSzovegben('lásd 8.1 és 10.12, de nem 1,25 vagy 3.14.15', new Set(['8.1', '10.12']))).toEqual(['8.1', '10.12'])
    expect(kepletIdkSzovegben('8.1 → 10.12 (7.5)')).toEqual(['8.1', '10.12', '7.5'])
    expect(utvonalHashbol('#/k/10.12')).toEqual({ oldal: 'keplet', id: '10.12' })
  })
})
