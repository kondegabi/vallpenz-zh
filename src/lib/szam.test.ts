import { describe, expect, it } from 'vitest'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { beolvas, formatPenz, formatSzam, formatSzazalek, kerekit } from './szam.ts'

describe('Magyar számformátum', () => {
  it('kerekít 4 tizedesre', () => {
    expect(kerekit(0.857580398)).toBe(0.8576)
    expect(kerekit(0.00005)).toBe(0.0001)
  })

  it('tizedesvesszővel és valódi mínuszjellel ír', () => {
    expect(formatSzam(0.0064)).toBe('0,0064')
    expect(formatSzam(-0.045, 3)).toBe('−0,045')
    expect(formatSzazalek(0.1318)).toBe('13,18%')
    expect(formatSzazalek(-0.134, 1)).toBe('−13,4%')
    expect(formatPenz(12627.4144)).toBe('12 627,41')
  })

  it('felesleges nullák nélkül, de az egészek végéről nem vág', () => {
    expect(sz(10, 0)).toBe('10')
    expect(sz(0, 0)).toBe('0')
    expect(sz(0.03)).toBe('0,03')
    expect(sz(1.5, 2)).toBe('1,5')
    expect(sz(2000, 2)).toBe('2000')
    expect(pct(0.1)).toBe('10%')
    expect(pct(0.105)).toBe('10,5%')
  })

  it('beolvassa a beírt alakokat', () => {
    expect(beolvas('13,18')).toEqual({ ertek: 13.18, szazalek: false, tizedesjegyek: 2 })
    expect(beolvas('13.18 %')).toEqual({ ertek: 13.18, szazalek: true, tizedesjegyek: 2 })
    expect(beolvas('−0,045')?.ertek).toBe(-0.045)
    expect(beolvas('12 627,41')?.ertek).toBe(12627.41)
    expect(beolvas('-1')?.ertek).toBe(-1)
    expect(beolvas('abc')).toBeNull()
    expect(beolvas('')).toBeNull()
    expect(beolvas('1,2,3')).toBeNull()
  })
})
