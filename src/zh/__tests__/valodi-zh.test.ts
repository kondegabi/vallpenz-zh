import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { VALODI_ZH_MINTAK, zhMintaBeolvas } from '../valodiZh.ts'

const minta = readFileSync(fileURLToPath(new URL('./minta/minta-zh.md', import.meta.url)), 'utf8')

describe('valódi ZH-minta: formátum és beolvasó', () => {
  it('a MINTA példát hibátlanul beolvassa', () => {
    const z = zhMintaBeolvas(minta)
    expect(z.hibak).toEqual([])
    expect(z.minta).toBe(true)
    expect(z.cim).toMatch(/MINTA/)
    expect(z.igazHamis).toEqual([
      { szoveg: 'A kockázati prémium a várható hozam mínusz a kockázatmentes hozam.', igaz: true, fejezet: '2.1' },
      { szoveg: 'A kockázatmentes eszköz bétája 1.', igaz: false, fejezet: '4.2' },
    ])
    expect(z.valasztos).toHaveLength(2)
    expect(z.valasztos[0]).toMatchObject({ kerdes: 'Melyik kockázatot fizeti meg a piac?', helyes: 1, fejezet: '4.3', tipus: 'elméleti' })
    expect(z.valasztos[0].opciok).toHaveLength(4)
    expect(z.valasztos[1]).toMatchObject({ helyes: 1, fejezet: '5.1', tipus: 'számítási' })
    expect(z.szamitas).toEqual([
      {
        szoveg: 'Egy projekt ma 100 egységbe kerül, egy év múlva 120 egységet hoz, a diszkontráta 10%. Mekkora az NPV, és elfogadjuk-e?',
        fejezet: '6.1',
        megoldasok: [
          { cimke: 'NPV', ertek: '9,09' },
          { cimke: 'döntés', ertek: 'elfogadjuk' },
        ],
      },
    ])
  })

  it('a hibás bejegyzéseket megnevezi (nincs jó válasz, ismeretlen jelölés, megoldás nélküli példa)', () => {
    const z = zhMintaBeolvas(`## Igaz-hamis

1. [?] Valami. {fejezet: 1.1}

## Feleletválasztós

1. Kérdés?
   - [ ] a
   - [ ] b

## Számítási

1. Példa megoldás nélkül.
`)
    expect(z.hibak).toHaveLength(3)
    expect(z.hibak.join(' ')).toMatch(/Igaz-hamis 1/)
    expect(z.hibak.join(' ')).toMatch(/Feleletválasztós 1/)
    expect(z.hibak.join(' ')).toMatch(/Számítási 1/)
  })

  it('a forras/zh-minta mappából csak a valódi mintákat tölti be (a leírás és a _ kezdetű sablon nem az)', () => {
    for (const z of VALODI_ZH_MINTAK) {
      expect(z.fajl).not.toMatch(/(^|\/)(_|README)/)
      expect(z.hibak, z.fajl).toEqual([])
    }
  })
})
