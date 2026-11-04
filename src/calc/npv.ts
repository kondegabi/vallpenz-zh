// 6. fejezet: NPV és IRR.

/** 6.1 Nettó jelenérték: Σ CF_n / (1 + r)^n, ahol cf[0] = CF_0. */
export function npv(r: number, cf: number[]): number {
  return cf.reduce((s, c, n) => s + c / Math.pow(1 + r, n), 0)
}

/** 6.2 Belső megtérülési ráta: az a ráta, amelynél az NPV = 0 (felezéses iteráció). */
export function irr(cf: number[], also = -0.99, felso = 10): number {
  let fa = npv(also, cf)
  if (fa * npv(felso, cf) > 0) throw new Error('Az IRR nincs a keresett tartományban')
  let lo = also
  let hi = felso
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2
    const fm = npv(m, cf)
    if (fm === 0) return m
    if (fa * fm < 0) hi = m
    else {
      lo = m
      fa = fm
    }
  }
  return (lo + hi) / 2
}

/** 6.1 az NPV a diszkontráta függvényében (NPV-profil), rMin és rMax között egyenletesen. */
export function npvProfil(cf: number[], rMin: number, rMax: number, lepesek = 200): { r: number; npv: number }[] {
  return Array.from({ length: lepesek + 1 }, (_, i) => {
    const r = rMin + ((rMax - rMin) * i) / lepesek
    return { r, npv: npv(r, cf) }
  })
}

/** 6.2 IRR, ha létezik a keresett tartományban; különben null (pl. nincs előjelváltás). */
export function irrHaVan(cf: number[]): number | null {
  try {
    return irr(cf)
  } catch {
    return null
  }
}

export type Dontes = 'elfogadjuk' | 'elutasítjuk'

/** 6.1 Döntés: NPV > 0 → elfogadjuk. */
export function npvDontes(NPV: number): Dontes {
  return NPV > 0 ? 'elfogadjuk' : 'elutasítjuk'
}

/** 6.2 Döntés: IRR > elvárt hozam → elfogadjuk. 7.5-ben is ez a szabály (várható hozam vs. elvárt). */
export function hozamDontes(hozam: number, elvart: number): Dontes {
  return hozam > elvart ? 'elfogadjuk' : 'elutasítjuk'
}
