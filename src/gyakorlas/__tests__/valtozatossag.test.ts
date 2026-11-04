import { describe, expect, it } from 'vitest'
import { ujFeladat } from '../motor.ts'
import { SABLONOK } from '../sablonok/index.ts'
import type { FeladatSzoveg } from '../tipusok.ts'
import { valtozatKulcsok, zhOsszeallit } from '../../zh/sorsolas.ts'

// Minden ZH-képes sablonnak legalább 4 eltérő szövegváltozata van (más szereplő, sorrend, zavaró adat),
// hogy pár futás után ne a megfogalmazást ismerjem fel, hanem a feladatot.

/** A szöveg „kerete”: a számok és a részvénybetűk nélkül, az eleje. */
function keret(sz: FeladatSzoveg): string {
  return sz.bekezdesek
    .join(' ')
    .replace(/[−-]?\d[\d\s,.]*/g, '#')
    .replace(/\b[A-Z]\b/g, 'X')
    .slice(0, 40)
}

describe('szövegváltozatok', () => {
  it.each(SABLONOK.filter((s) => s.zh).map((s) => [s.id, s] as const))('%s: legalább 4 szövegváltozat, eltérő kezdettel', (_id, s) => {
    const valtozatok = new Set<string>()
    const keretek = new Set<string>()
    for (let seed = 1; seed <= 400; seed++) {
      const f = ujFeladat(s, seed)
      expect(f.szoveg.valtozat, `${s.id} #${seed}`).toBeDefined()
      valtozatok.add(f.szoveg.valtozat!)
      keretek.add(keret(f.szoveg))
    }
    expect(valtozatok.size).toBeGreaterThanOrEqual(4)
    expect(keretek.size).toBeGreaterThanOrEqual(4)
  })

  it('a ZH-sorsolás kerüli az előző ZH szövegváltozatait', () => {
    let elozo: string[] = []
    for (let i = 1; i <= 60; i++) {
      const zh = zhOsszeallit(i * 7741, elozo)
      const most = valtozatKulcsok(zh)
      expect(most.filter((k) => elozo.includes(k)), `#${i}`).toEqual([])
      expect(new Set(most).size, `#${i}: egy ZH-n belül sem ismétlődik`).toBe(most.length)
      elozo = most
    }
  })
})
