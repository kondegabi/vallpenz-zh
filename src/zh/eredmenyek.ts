import { useSyncExternalStore } from 'react'
import type { KorValasztas } from '../kor.ts'

// A beadott ZH-k eredményei localStorage-ban (nélküle a munkamenet végéig memóriában).

export type ZhEredmeny = { datum: string; seed: number; pont: { ih: number; mc: number; sz: number; ossz: number }; mp: number; lejart: boolean; kor?: KorValasztas }

const KULCS = 'vp2zh.zh.v1'

function betolt(): ZhEredmeny[] {
  try {
    const nyers = localStorage.getItem(KULCS)
    if (nyers) {
      const t = JSON.parse(nyers)
      if (Array.isArray(t)) return t as ZhEredmeny[]
    }
  } catch {
    // nincs localStorage vagy sérült az adat: üresről indulunk
  }
  return []
}

let allapot: ZhEredmeny[] | null = null
const figyelok = new Set<() => void>()

function aktualis(): ZhEredmeny[] {
  allapot ??= betolt()
  return allapot
}

function ment(uj: ZhEredmeny[]): void {
  allapot = uj
  try {
    localStorage.setItem(KULCS, JSON.stringify(uj))
  } catch {
    // mentés nélkül is megy tovább
  }
  figyelok.forEach((l) => l())
}

export function zhEredmenyRogzit(e: ZhEredmeny): void {
  ment([...aktualis(), e].slice(-100))
}

export function zhEredmenyekTorlese(): void {
  ment([])
}

export function useZhEredmenyek(): ZhEredmeny[] {
  return useSyncExternalStore(
    (l) => {
      figyelok.add(l)
      return () => figyelok.delete(l)
    },
    aktualis,
  )
}

// Az előző ZH szövegváltozatai: a következő ZH ezeket kerüli (külön kulcs, a beadástól függetlenül).
const VALTOZAT_KULCS = 'vp2zh.zh.valtozatok.v1'

export function elozoValtozatok(): string[] {
  try {
    const t = JSON.parse(localStorage.getItem(VALTOZAT_KULCS) ?? '[]')
    return Array.isArray(t) ? t.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function valtozatokMentes(kulcsok: string[]): void {
  try {
    localStorage.setItem(VALTOZAT_KULCS, JSON.stringify(kulcsok))
  } catch {
    // mentés nélkül is megy tovább
  }
}
