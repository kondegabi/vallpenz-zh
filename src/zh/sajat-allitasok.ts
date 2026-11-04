// Saját igaz-hamis állítások a saját jegyzeteidből. A ZH-sorsolás ezeket is használja, és ugyanaz a
// teszt fut rájuk, mint a képlettárból jövőkre: a hamis alak az igazból EGY pontos cserével készüljön
// (legfeljebb két helyen, pl. két szó felcserélése; helyenként legfeljebb 6 szó), és valódi tévedést
// fogjon meg, ne nyelvtani képtelenséget.
//
// Mezők:
// - id: egyedi azonosító (pl. „sajat-wacc-1”), nem lehet azonos egy másikéval
// - forras: a képlet száma (pl. „7.4”), ha van; a sorsolás ebből tudja, melyik fejezet. Ha nincs,
//   írj ide rövid forrást (pl. „jegyzet, 5. ea”); ilyenkor az állítás egy külön csoportba kerül
// - igaz: az igaz alak, egész mondat
// - hamis: ugyanez egyetlen cserével
// - megjegyzes (nem kötelező): honnan van (pl. „saját jegyzet, 5. ea, 12. dia”)
//
// Példa (vedd ki a // jeleket, és írd át a sajátodra):
//
//   {
//     id: 'sajat-pelda-1',
//     forras: '7.4',
//     igaz: 'A WACC súlyai a saját tőke és az adósság piaci értékéből jönnek.',
//     hamis: 'A WACC súlyai a saját tőke és az adósság névértékéből jönnek.',
//     megjegyzes: 'saját jegyzet, 5. ea',
//   },

export type SajatAllitas = { id: string; forras: string; igaz: string; hamis: string; megjegyzes?: string }

export const SAJAT_ALLITASOK: SajatAllitas[] = [
  // ide jönnek a saját állítások
]
