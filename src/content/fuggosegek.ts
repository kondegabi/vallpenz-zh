// A „requires” gráf: melyik képlet melyik korábbi eredményből épül.
// A képlettár „Kell hozzá” pontjai csak néhány képletnél vannak meg, ezért ez kézi kiegészítés
// (a 0. fázisban jóváhagyott táblázat). A feltétel a képlettár megfogalmazását követi.

export type Fuggoseg = { id: string; feltetel?: string }

export const FUGGOSEGEK: Record<string, Fuggoseg[]> = {
  '1.2': [{ id: '1.1', feltetel: 'ha csak árfolyamok adottak' }],
  '1.3': [{ id: '1.1', feltetel: 'ha csak árfolyamok adottak' }],
  '2.2': [{ id: '2.1' }],
  '2.3': [{ id: '1.2' }],
  '2.4': [{ id: '2.1' }, { id: '2.2' }],
  '3.1': [{ id: '2.1' }],
  '3.2': [{ id: '2.1' }, { id: '2.2' }],
  '3.3': [{ id: '3.2' }, { id: '2.2' }],
  '3.4': [{ id: '2.2' }, { id: '3.2', feltetel: 'ha a feladat kovarianciát ad' }, { id: '3.3', feltetel: 'ha korrelációt' }],
  '3.5': [{ id: '3.4' }, { id: '3.3' }],
  '4.2': [{ id: '3.2', feltetel: 'kovariancia a piaccal' }, { id: '3.3', feltetel: 'vagy korreláció' }, { id: '2.2' }],
  '4.3': [{ id: '4.2' }],
  '4.4': [{ id: '4.2' }],
  '5.1': [{ id: '4.2', feltetel: 'ha a β-t nem adják meg' }, { id: '4.4', feltetel: 'ha a β-t nem adják meg' }],
  '5.2': [{ id: '5.1' }],
  '5.3': [{ id: '5.2' }, { id: '5.1' }],
  '5.4': [{ id: '3.1' }, { id: '4.4' }],
  '6.1': [{ id: '5.1', feltetel: 'CAPM a projekt bétájával' }, { id: '7.4', feltetel: 'WACC, ha a kockázat és a tőkeszerkezet egyezik' }],
  '6.2': [{ id: '6.1' }],
  '7.2': [{ id: '5.1' }],
  '7.3': [{ id: '6.2', feltetel: 'ha a YTM-et ki kell számolni' }],
  '7.4': [{ id: '7.1', feltetel: 'osztalékmodellel' }, { id: '7.2', feltetel: 'CAPM-mel' }, { id: '7.3' }],
  '7.5': [{ id: '5.1' }, { id: '7.4' }],
  '8.1': [{ id: '7.4', feltetel: 'piaci értékű súlyok, adó nélkül' }],
  '8.2': [{ id: '8.1' }, { id: '5.1', feltetel: 'ha a hitel bétáját az r_D-ből kell számolni' }],
  '8.3': [{ id: '8.1' }],
  '8.5': [{ id: '8.4' }],
  '8.6': [{ id: '8.4' }, { id: '8.5', feltetel: 'ha nem örökjáradék' }],
  '8.7': [{ id: '8.3' }],
  '8.8': [{ id: '8.7' }, { id: '7.3' }],
  '8.9': [{ id: '8.4' }],
  '8.10': [{ id: '8.6' }],
}
