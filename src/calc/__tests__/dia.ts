import { expect } from 'vitest'
import { beolvas } from '../../lib/szam.ts'

/**
 * Összeveti a számolt értéket a dián (képlettárban) szereplő alakkal, pl. dia(rE, '13,18%').
 * A tűrés a dián mutatott pontosság fele: '13,18%' → ±0,00005, '11,1%' → ±0,0005.
 * Pontos értékeknél ('−1', '0%') a harmadik paraméterrel szigorítható.
 */
export function dia(szamolt: number, diaAlak: string, tures?: number): void {
  const b = beolvas(diaAlak)
  if (!b) throw new Error(`Nem értelmezhető diás érték: ${diaAlak}`)
  const vart = b.szazalek ? b.ertek / 100 : b.ertek
  const jegyek = b.tizedesjegyek + (b.szazalek ? 2 : 0)
  const t = tures ?? 0.5 * Math.pow(10, -jegyek) + 1e-12
  expect(Math.abs(szamolt - vart), `${szamolt} ≉ ${diaAlak} (tűrés ${t})`).toBeLessThanOrEqual(t)
}
