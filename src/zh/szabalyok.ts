// A ZH-szimuláció szabályai egy helyen. A formátumot és a pontozást a felhasználó adta meg a tárgy
// kiírásából (2026-10-10): 25 perc, 8 igaz-hamis, 8 feleletválasztós, 4 számítási példa, 50 pont. A 2. ZH
// formátuma a felhasználó tudomása szerint ugyanez (2026-11-04).
// A „feltételezett” jelölésűek a mi feltevéseink: a tanszéktől nem jönnek, a valódi ZH eltérhet.

export type ZhSzabalyok = {
  perc: number
  /** igaz-hamis: legfeljebb `kuszob` jó válasz 0 pont, felette minden jó `pontPerJo` pont (4 jó: 2, … 8 jó: 10) */
  igazHamis: { db: number; kuszob: number; pontPerJo: number }
  valasztos: { db: number; pont: number }
  /**
   * számítási példa. `reszpont` (feltételezett): false = a pont csak akkor jár, ha minden kért érték jó;
   * true = a jó értékek arányában.
   */
  szamitas: { db: number; pont: number; reszpont: boolean }
  /** feltételezett: a százalékos végeredménynél elfogadott eltérés, százalékpontban (saját tűrés nélküli lépéseknél) */
  tures: { szazalekpont: number }
  /** a kiértékelés ennél hosszabb kérdésidőt jelöl (25 perc / 20 kérdés = 75 mp) */
  lassuKuszobMp: number
}

export const SZABALYOK: ZhSzabalyok = {
  perc: 25,
  igazHamis: { db: 8, kuszob: 3, pontPerJo: 2 },
  valasztos: { db: 8, pont: 3 },
  szamitas: { db: 4, pont: 4, reszpont: false },
  tures: { szazalekpont: 0.05 },
  lassuKuszobMp: 75,
}

export function maxPont(sz: ZhSzabalyok = SZABALYOK) {
  const ih = (sz.igazHamis.db - sz.igazHamis.kuszob) * sz.igazHamis.pontPerJo
  const mc = sz.valasztos.db * sz.valasztos.pont
  const szam = sz.szamitas.db * sz.szamitas.pont
  return { ih, mc, sz: szam, ossz: ih + mc + szam }
}

function szazalekpont(x: number): string {
  return x.toLocaleString('hu-HU', { maximumFractionDigits: 3 })
}

/** A kezdőoldalon mutatott feltevések, a beállított értékekből. */
export function feltetelezettSzabalyok(sz: ZhSzabalyok = SZABALYOK): string[] {
  return [
    sz.szamitas.reszpont
      ? `a számítási példánál a pont a jó értékek arányában jár`
      : `a számítási példa ${sz.szamitas.pont} pontja csak akkor jár, ha minden kért érték jó`,
    `a százalékos eredményeknél ±${szazalekpont(sz.tures.szazalekpont)} százalékpont eltérést fogadunk el`,
  ]
}
