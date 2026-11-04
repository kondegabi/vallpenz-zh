import { describe, expect, it } from 'vitest'
import { MENU } from '../menu.ts'
import { IRANYOK, legutobbiZh } from '../oldalak/kezdolapAdat.ts'
import { utvonalHashbol } from '../router.ts'

// Aki először nyitja meg, ne a teljes képlettárat lássa hét menüponttal: kezdőoldal három iránnyal.

describe('kezdőoldal és menü', () => {
  it('a gyökér a kezdőoldal, a képletlista külön útvonalon van', () => {
    expect(utvonalHashbol('#/')).toEqual({ oldal: 'kezdolap' })
    expect(utvonalHashbol('')).toEqual({ oldal: 'kezdolap' })
    expect(utvonalHashbol('#/kepletek')).toEqual({ oldal: 'kepletek' })
  })

  it('a kezdőoldal három irányt mutat: Tanulok, Gyakorlok, Felmérem magam', () => {
    expect(IRANYOK.map((i) => i.cim)).toEqual(['Tanulok', 'Gyakorlok', 'Felmérem magam'])
    for (const i of IRANYOK) {
      expect(i.leiras.length, i.cim).toBeGreaterThan(30)
      expect(i.linkek.length, i.cim).toBeGreaterThan(0)
    }
  })

  it('a főmenü négy pontból áll; a térkép, a felismerő tábla és a diahibák a Képletek alatt vannak', () => {
    expect(MENU.map((m) => m.cim)).toEqual(['Leckék', 'Képletek', 'Gyakorlás', 'ZH-szimuláció'])
    const kepletek = MENU.find((m) => m.cim === 'Képletek')!
    for (const oldal of ['kepletek', 'terkep', 'felismero', 'hibak'] as const) expect(kepletek.aktiv({ oldal }), oldal).toBe(true)
    expect(kepletek.aktiv({ oldal: 'keplet', id: '5.1' })).toBe(true)
  })

  it('a legutóbbi ZH-eredmény a lista utolsó eleme (üres listánál nincs)', () => {
    expect(legutobbiZh([])).toBeUndefined()
    const e = (ossz: number) => ({ datum: '2026-10-10', seed: 1, pont: { ih: 0, mc: 0, sz: 0, ossz }, mp: 600, lejart: false })
    expect(legutobbiZh([e(10), e(30)])?.pont.ossz).toBe(30)
  })
})

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

describe('lusta betöltés', () => {
  it('az App statikusan csak a kezdőoldalt tölti be; minden más oldal lazy import', () => {
    const app = readFileSync(fileURLToPath(new URL('../App.tsx', import.meta.url)), 'utf8')
    const statikus = [...app.matchAll(/^import .* from '\.\/oldalak\/([^']+)'/gm)].map((m) => m[1])
    expect(statikus).toEqual(['Kezdolap.tsx'])
    for (const oldal of ['KepletOldal', 'Gyakorlas', 'GyakorloOldal', 'VegyesZh', 'Statisztika', 'ZhSzimulacio', 'LeckeOldal', 'Oldalsav'])
      expect(app.includes(`import('./oldalak/${oldal}.tsx')`), oldal).toBe(true)
  })
})
