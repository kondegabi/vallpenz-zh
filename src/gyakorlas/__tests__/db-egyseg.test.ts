import { describe, expect, it } from 'vitest'
import { ellenoriz } from '../ellenorzes.ts'
import { eredmeny } from '../formaz.ts'
import { SABLONOK } from '../sablonok/index.ts'

// Darabszám: egész számként, ezres tagolással, tizedesjegyek nélkül; fél darab tűréssel.

describe('db egység', () => {
  it('a kiírás egész szám ezres tagolással', () => {
    expect(eredmeny(270000, 'db')).toBe('270 000')
    expect(eredmeny(22000, 'db')).toBe('22 000')
  })

  it('a tűrés fél darab', () => {
    expect(ellenoriz('270000', 270000.3, 'db').ok).toBe(true)
    expect(ellenoriz('270001', 270000, 'db').ok).toBe(false)
  })

  it('a darabszámot kérő lépések db egységűek', () => {
    const lepesek = SABLONOK.flatMap((s) => s.lepesek.filter((l) => /darab|hány részvény|Hány részvény/i.test(l.kerdes)).map((l) => `${s.id}:${l.key}:${l.tipus === 'szam' ? l.egyseg : ''}`))
    expect(lepesek.length).toBeGreaterThan(0)
    for (const l of lepesek) expect(l).toMatch(/:db$/)
  })
})
