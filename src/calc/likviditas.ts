// 9. fejezet: készpénz- és likviditásmenedzsment (Baumol–Allais–Tobin- és Miller–Orr-modell).

/** 9.1 Optimális felvett pénzösszeg: C_opt = √(2·T·F / r). T és r ugyanarra az időszakra vonatkozik. */
export function baumolC(T: number, F: number, r: number): number {
  return Math.sqrt((2 * T * F) / r)
}

/** 9.1 Optimális időköz a pénzfelvételek között, az időszak törtrészében: L_opt = √(2·F / (r·T)) = C_opt / T. */
export function baumolL(T: number, F: number, r: number): number {
  return Math.sqrt((2 * F) / (r * T))
}

/** 9.1 Átlagos pénzállomány a fűrészfog-pályán: C / 2. */
export function atlagosPenzallomanyBaumol(C: number): number {
  return C / 2
}

/** 9.2 A pénzállomány célértéke: C* = L + ∛(3·F·σ² / (4·r)). σ és r ugyanarra az időszakra vonatkozik. */
export function millerOrrC(L: number, F: number, sigma: number, r: number): number {
  return L + Math.cbrt((3 * F * sigma * sigma) / (4 * r))
}

/** 9.2 Felső korlát: U* = 3·C* − 2·L. */
export function millerOrrU(C: number, L: number): number {
  return 3 * C - 2 * L
}

/** 9.2 Átlagos pénzállomány: (4·C* − L) / 3. */
export function atlagosPenzallomanyMillerOrr(C: number, L: number): number {
  return (4 * C - L) / 3
}
