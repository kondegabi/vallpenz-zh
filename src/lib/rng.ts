
// Seedelt álvéletlen: a gyakorló mód és a leckék szimulációi is ezt használják.

export type Rng = {
  /** [0, 1) */
  next: () => number
  /** egyenletes egész a [min, max] zárt intervallumban */
  egesz: (min: number, max: number) => number
  /** min és max között lepes-enként, pl. lepeskoz(0.01, 0.06, 0.005) */
  lepeskoz: (min: number, max: number, lepes: number) => number
  valaszt: <T>(t: readonly T[]) => T
  kever: <T>(t: readonly T[]) => T[]
  esely: (p: number) => boolean
}

/** Seedelt álvéletlen (mulberry32): ugyanabból a seedből ugyanaz a feladat. */
export function rng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const egesz = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  return {
    next,
    egesz,
    lepeskoz: (min, max, lepes) => {
      const n = Math.round((max - min) / lepes)
      // kerekítés, hogy 0,1 + 0,2 jellegű lebegőpontos maradék ne legyen
      return Math.round((min + egesz(0, n) * lepes) * 1e6) / 1e6
    },
    valaszt: (t) => t[Math.floor(next() * t.length)],
    kever: (t) => {
      const k = [...t]
      for (let i = k.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[k[i], k[j]] = [k[j], k[i]]
      }
      return k
    },
    esely: (p) => next() < p,
  }
}

export function ujSeed(): number {
  return Math.floor(Math.random() * 2 ** 32)
}
