// 4. fejezet: béta és a kockázat felbontása.

/** 4.2 Béta kovarianciából: cov(r_i, r_M) / σ²(r_M). */
export function betaCov(covIM: number, varM: number): number {
  return covIM / varM
}

/** 4.2 Béta korrelációból: k_iM · σ(r_i) / σ(r_M). */
export function betaKorr(kIM: number, sI: number, sM: number): number {
  return (kIM * sI) / sM
}

/** 4.2 második alakja megfordítva: a piaccal vett korreláció k_iM = β · σ(r_M) / σ(r_i). */
export function korrelacioBetabol(beta: number, sI: number, sM: number): number {
  return (beta * sM) / sI
}

/** 4.3 Teljes variancia = piaci rész + egyedi rész. */
export function kockazatFelbontas(beta: number, varM: number, varEps: number) {
  const piaci = beta * beta * varM
  return { piaci, egyedi: varEps, teljes: piaci + varEps }
}

/** 4.4 Portfólió bétája: Σ a_i β_i (a kockázatmentes elem bétája 0). */
export function portfolioBeta(a: number[], b: number[]): number {
  return a.reduce((s, ai, i) => s + ai * b[i], 0)
}

/** 4.4 egyenletként rendezve: az egyetlen ismeretlen béta (null) a cél portfólióbétából. */
export function hianyzoBeta(celBeta: number, a: number[], b: (number | null)[]): number {
  const idx = b.indexOf(null)
  if (idx < 0 || b.indexOf(null, idx + 1) >= 0) throw new Error('Pontosan egy ismeretlen béta kell')
  const ismert = a.reduce((s, ai, i) => (i === idx ? s : s + ai * (b[i] as number)), 0)
  return (celBeta - ismert) / a[idx]
}

/** 4.4 Súly visszafejtése: kockázatos eszköz + kockázatmentes, cél β_P → w = β_P / β. */
export function sulyCelBetahoz(celBeta: number, beta: number) {
  const w = celBeta / beta
  return { w, wf: 1 - w }
}
