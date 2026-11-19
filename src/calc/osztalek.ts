// 10. fejezet: osztalékpolitika (osztalékdiszkontálási modell, fenntartható növekedés, részvényműveletek).

/** 10.1 Állandó növekedésű osztalékdiszkontálási modell: P_0 = DIV_1 / (r − g), ha g < r. */
export function osztalekModellAr(DIV1: number, r: number, g: number): number {
  if (g >= r) throw new Error('g < r kell')
  return DIV1 / (r - g)
}

/** 10.1 Elvárt hozam: r = DIV_1 / P_0 + g. */
export function osztalekModellHozam(DIV1: number, P0: number, g: number): number {
  return DIV1 / P0 + g
}

/** 10.2 Egy részvényre jutó nyereség: EPS = nyereség / részvényszám. */
export function eps(nyereseg: number, db: number): number {
  return nyereseg / db
}

/** 10.2 Sajáttőke-arányos nyereség a dia szerint: ROE = EPS_1 / P_0. */
export function roe(EPS1: number, P0: number): number {
  return EPS1 / P0
}

/** 10.2 Osztalék-kifizetési ráta: dp = DIV / EPS. */
export function kifizetesiRata(DIV: number, EPS: number): number {
  return DIV / EPS
}

/** 10.2 Újrabefektetési hányad (plow-back ratio): 1 − dp. */
export function ujrabefektetesiHanyad(dp: number): number {
  return 1 - dp
}

/** 10.3 Fenntartható növekedési ütem: g = ROE × (1 − dp). */
export function fenntarthatoNovekedes(ROE: number, dp: number): number {
  return ROE * (1 - dp)
}

/** 10.4 Egy megtartó tulajdonos hányada visszavásárlás után: N_i / (N − N_v). */
export function tulajdoniHanyadVisszavasarlasUtan(Ni: number, N: number, Nv: number): number {
  return Ni / (N - Nv)
}

/** 10.4 Árfolyam k:1 arányú felaprózás után: P / k (a részvényesi vagyon nem változik). */
export function felaprozottAr(P: number, k: number): number {
  return P / k
}

/**
 * 10.1 szakaszonként: az eredményt t = 0 … k − 1 teljesen visszaforgatják (az EPS évente ROE-val nő),
 * t = k-tól dp-t fizetnek ki, onnan g = ROE × (1 − dp). P_0 = DIV_k / (r − g) / (1 + r)^(k − 1).
 */
export function ketszakaszosAr(EPS0: number, ROE: number, k: number, dp: number, r: number): number {
  const EPSk = EPS0 * Math.pow(1 + ROE, k)
  const Pkm1 = osztalekModellAr(dp * EPSk, r, fenntarthatoNovekedes(ROE, dp))
  return Pkm1 / Math.pow(1 + r, k - 1)
}

/** 10.5 Tökéletes piacon az osztalék kifizetésekor az árfolyam az osztalékkal esik: P_ex = P_cum − DIV. */
export function exDividendAr(Pcum: number, DIV: number): number {
  return Pcum - DIV
}

/** 10.5 A kibocsátandó részvények száma: forrásigény / kibocsátási ár. */
export function kibocsatandoDarab(forrasigeny: number, ar: number): number {
  return forrasigeny / ar
}

/** 10.5 Alaptőke = részvényszám × névérték (a felaprózás nem, a részvényosztalék növeli). */
export function alaptoke(db: number, nevertek: number): number {
  return db * nevertek
}
