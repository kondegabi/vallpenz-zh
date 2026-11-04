import { useSyncExternalStore } from 'react'
import type { FeladatBeallitas } from './motor.ts'

// A gyakorlás beállításai localStorage-ban (nélküle a munkamenet végéig memóriában).

export type Beallitasok = {
  /** a WACC-feladatokban a YTM-et a kötvényből, iterációval kell számolni (haladó; a ZH-ban soha) */
  haladoYtm: boolean
}

const KULCS = 'vp2zh.beall.v1'
const ALAP: Beallitasok = { haladoYtm: false }

function betolt(): Beallitasok {
  try {
    const nyers = localStorage.getItem(KULCS)
    if (nyers) return { ...ALAP, ...(JSON.parse(nyers) as Partial<Beallitasok>) }
  } catch {
    // nincs localStorage vagy sérült az adat
  }
  return ALAP
}

let allapot: Beallitasok | null = null
const figyelok = new Set<() => void>()

export function beallitasok(): Beallitasok {
  allapot ??= betolt()
  return allapot
}

export function beallit(valtozas: Partial<Beallitasok>): void {
  allapot = { ...beallitasok(), ...valtozas }
  try {
    localStorage.setItem(KULCS, JSON.stringify(allapot))
  } catch {
    // mentés nélkül is megy tovább
  }
  figyelok.forEach((l) => l())
}

export function useBeallitasok(): Beallitasok {
  return useSyncExternalStore(
    (l) => {
      figyelok.add(l)
      return () => figyelok.delete(l)
    },
    beallitasok,
  )
}

/** A feladatsorsolás beállításai a gyakorlás aktuális beállításaiból. */
export function feladatBeallitas(): FeladatBeallitas {
  return { halado: beallitasok().haladoYtm }
}
