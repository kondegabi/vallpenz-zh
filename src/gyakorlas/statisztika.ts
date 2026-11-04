import { useSyncExternalStore } from 'react'

// Haladás képletenként és sablononként, localStorage-ban (nélküle a munkamenet végéig memóriában).

export type KepletStat = {
  felJo: number
  felOssz: number
  szamJo: number
  szamOssz: number
  /** hibás lépések száma lépéskérdésenként */
  hibak: Record<string, number>
}

export type Stat = {
  v: 1
  kepletek: Record<string, KepletStat>
  sablonok: Record<string, { ossz: number; hibatlan: number }>
}

const KULCS = 'vp2zh.stat.v1'

export function uresStat(): Stat {
  return { v: 1, kepletek: {}, sablonok: {} }
}

function kepletStat(s: Stat, id: string): KepletStat {
  return s.kepletek[id] ?? { felJo: 0, felOssz: 0, szamJo: 0, szamOssz: 0, hibak: {} }
}

/** Felismerés: minden érintett képlethez egy próbálkozás. */
export function felismeresRogzit(s: Stat, kepletIdk: string[], jo: boolean): Stat {
  const kepletek = { ...s.kepletek }
  for (const id of new Set(kepletIdk)) {
    const k = kepletStat(s, id)
    kepletek[id] = { ...k, felJo: k.felJo + (jo ? 1 : 0), felOssz: k.felOssz + 1 }
  }
  return { ...s, kepletek }
}

/** Számolási lépés: elsőre jó-e; ha nem, a lépés kérdésénél nő a hibaszám. */
export function lepesRogzit(s: Stat, formulaId: string, kerdes: string, elsoreJo: boolean): Stat {
  const k = kepletStat(s, formulaId)
  return {
    ...s,
    kepletek: {
      ...s.kepletek,
      [formulaId]: {
        ...k,
        szamJo: k.szamJo + (elsoreJo ? 1 : 0),
        szamOssz: k.szamOssz + 1,
        hibak: elsoreJo ? k.hibak : { ...k.hibak, [kerdes]: (k.hibak[kerdes] ?? 0) + 1 },
      },
    },
  }
}

export function feladatRogzit(s: Stat, sablonId: string, hibatlan: boolean): Stat {
  const f = s.sablonok[sablonId] ?? { ossz: 0, hibatlan: 0 }
  return { ...s, sablonok: { ...s.sablonok, [sablonId]: { ossz: f.ossz + 1, hibatlan: f.hibatlan + (hibatlan ? 1 : 0) } } }
}

/** A leggyakrabban elrontott lépés egy képletnél. */
export function leggyakoribbHiba(k: KepletStat): { kerdes: string; db: number } | undefined {
  const [kerdes, db] = Object.entries(k.hibak).sort((a, b) => b[1] - a[1])[0] ?? []
  return kerdes ? { kerdes, db: db! } : undefined
}

// ---- tároló ----

function betolt(): Stat {
  try {
    const nyers = localStorage.getItem(KULCS)
    if (nyers) {
      const s = JSON.parse(nyers) as Stat
      if (s?.v === 1 && s.kepletek && s.sablonok) return s
    }
  } catch {
    // nincs localStorage vagy sérült az adat: üresről indulunk
  }
  return uresStat()
}

let allapot: Stat | null = null
const figyelok = new Set<() => void>()

function aktualis(): Stat {
  allapot ??= betolt()
  return allapot
}

export function statFrissit(f: (s: Stat) => Stat): void {
  allapot = f(aktualis())
  try {
    localStorage.setItem(KULCS, JSON.stringify(allapot))
  } catch {
    // mentés nélkül is megy tovább
  }
  figyelok.forEach((l) => l())
}

export function statTorles(): void {
  statFrissit(() => uresStat())
}

export function useStat(): Stat {
  return useSyncExternalStore(
    (l) => {
      figyelok.add(l)
      return () => figyelok.delete(l)
    },
    aktualis,
  )
}
