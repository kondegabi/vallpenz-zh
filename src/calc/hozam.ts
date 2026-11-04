// 1. fejezet: hozamszámítás és átlagok. Minden hozam tizedes tört (0,1 = 10%).

/** 1.1 Teljes (százalékos) hozam: osztalékhozam + árfolyamváltozás hozama. */
export function teljesHozam(Pt: number, Pt1: number, Dt1 = 0) {
  const osztalekHozam = Dt1 / Pt
  const arfolyamHozam = (Pt1 - Pt) / Pt
  return { osztalekHozam, arfolyamHozam, teljes: osztalekHozam + arfolyamHozam }
}

/** Árfolyamsorból (osztalék nélkül) az egyes időszakok 1.1 szerinti hozamai. */
export function hozamokArfolyamokbol(arak: number[]): number[] {
  return arak.slice(1).map((P, i) => teljesHozam(arak[i], P).teljes)
}

/** 1.2 Számtani átlaghozam. */
export function szamtaniAtlag(r: number[]): number {
  return r.reduce((s, x) => s + x, 0) / r.length
}

/** 1.3 Mértani (geometriai) átlaghozam. */
export function mertaniAtlag(r: number[]): number {
  const szorzat = r.reduce((s, x) => s * (1 + x), 1)
  return Math.pow(szorzat, 1 / r.length) - 1
}

/** 1.4 Folytonos hozam: r_c = (1/T) ln(P_T / P_0). */
export function folytonosHozam(P0: number, PT: number, T = 1): number {
  return Math.log(PT / P0) / T
}

/** 1.4 Az egyes időszakok folytonos hozamai egy árfolyamsorból. */
export function folytonosHozamok(arak: number[]): number[] {
  return arak.slice(1).map((P, i) => folytonosHozam(arak[i], P))
}

/** 1.4 Az árfolyam folytonos hozammal: P_T = P_0 e^(r_c T). */
export function folytonosErtek(P0: number, rc: number, T: number): number {
  return P0 * Math.exp(rc * T)
}

/** „1 dollár növekedése” (1. ea 14. dia): az árfolyamsor a kezdő árfolyamhoz viszonyítva, P_t / P_0. */
export function indexPalya(arak: number[]): number[] {
  return arak.map((P) => P / arak[0])
}

/**
 * Évente m-szer tőkésítve r éves kamattal T év alatt 1 egységből (1 + r/m)^(mT) lesz
 * (1. ea 30. dia; m → ∞ esetén e^(rT), ez az 1.4 e-je). Nagy m-nél log1p-vel pontos.
 */
export function diszkretTokesites(r: number, m: number, T = 1): number {
  return Math.exp(m * T * Math.log1p(r / m))
}
