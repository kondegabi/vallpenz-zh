import { KOR_CIM, type Kor, type KorValasztas } from '../kor.ts'

/** Kis címke: melyik ZH anyaga. */
export function KorCimke({ kor }: { kor: Kor }) {
  return <span className={`kor-cimke kor-${kor}`}>{kor}. ZH</span>
}

/** Csoportcím a listákban: csak akkor kell, ha mindkét ZH anyaga látszik. */
export function KorFejlec({ kor, valasztas }: { kor: Kor; valasztas: KorValasztas }) {
  return valasztas === 'mind' ? <h2 className={`kor-fejlec kor-${kor}`}>{KOR_CIM[kor]}</h2> : null
}
