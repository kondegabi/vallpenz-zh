import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { kiertekelo, ujFeladat } from '../motor.ts'
import { SABLONOK } from '../sablonok/index.ts'
import { FeladatSzoveg } from '../ui/FeladatSzoveg.tsx'

// Táblázatkiegészítős feladat (szem. osztalék 3–4): a kitöltendő táblázat a feladat szövegében látszik, a
// cellákat a lépések töltik ki sorban.

const sablon = SABLONOK.find((s) => s.id === 'osztalek-tablazat')!

describe('táblázatkiegészítő feladat', () => {
  it('a sablon létezik, és a táblázat 5 sora (a szemináriumi megoldás szerint, névértékkel) 4 időpontra szól', () => {
    expect(sablon).toBeDefined()
    const f = ujFeladat(sablon, 1)
    const t = f.szoveg.kitoltendo!
    expect(t.fejlec).toHaveLength(5)
    expect(t.sorok.map((s) => s.cimke)).toEqual(['Darabszám', 'Árfolyam', 'Névérték', 'Saját tőke értéke', 'Alaptőke'])
  })

  it('minden kitöltendő cellához tartozik aktív lépés, és minden lépés egy cella (200 véletlen feladat)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const f = ujFeladat(sablon, seed)
      const cellak = f.szoveg.kitoltendo!.sorok.flatMap((s) => s.cellak.flatMap((c) => (typeof c === 'string' ? [] : [c.kulcs])))
      expect(new Set(cellak).size, `#${seed}`).toBe(cellak.length)
      expect([...cellak].sort(), `#${seed}`).toEqual(f.lepesek.map((l) => l.key).sort())
    }
  })

  it('10.5 Példa (szem. osztalék 4) táblázata: SokSikert', () => {
    const d = sablon.diasPeldak.find((x) => x.forras === '10.5 Példa (szem. osztalék 4)')!
    const get = kiertekelo(sablon, d.p)
    expect([get('db0'), get('P0')]).toEqual([50000, 15000])
    expect([get('dbH'), get('PH'), get('EH'), get('AH')]).toEqual([50000, 15000, 750, 500])
    expect([get('dbO'), get('PO'), get('EO'), get('AO')]).toEqual([50000, 12000, 600, 500])
    expect([get('dbV'), get('PV'), get('EV'), get('AV')]).toEqual([200000, 3000, 600, 500])
    // 1:4 felaprózás: a névérték a negyede
    expect([get('NH'), get('NO'), get('NV')]).toEqual([10000, 10000, 2500])
  })

  it('10.5 Példa (szem. osztalék 3) táblázata: GTK, részvényosztalékkal az alaptőke is nő', () => {
    const d = sablon.diasPeldak.find((x) => x.forras === '10.5 Példa (szem. osztalék 3)')!
    const get = kiertekelo(sablon, d.p)
    expect([get('dbO'), get('PO'), get('EO'), get('AO')]).toEqual([200000, 240, 48, 20])
    expect([get('dbV'), get('PV'), get('EV'), get('AV')]).toEqual([400000, 120, 48, 40])
    // a szemináriumi megoldás táblázata: a névérték végig 100 (az osztalékrészvény névértéken jár)
    expect([get('NH'), get('NO'), get('NV')]).toEqual([100, 100, 100])
  })

  it('a megjelenítés: a kitöltött cellában az érték, az aktívban kiemelt kérdőjel, a többiben kérdőjel', () => {
    const html = renderToStaticMarkup(
      <FeladatSzoveg
        szoveg={{
          bekezdesek: [],
          kerdesek: [],
          kitoltendo: { fejlec: ['', 'Most', 'Utána'], sorok: [{ cimke: 'Árfolyam', cellak: [{ kulcs: 'a' }, { kulcs: 'b' }] }, { cimke: 'Alaptőke', cellak: ['500', { kulcs: 'c' }] }] },
        }}
        kitoltott={{ a: '15 000' }}
        aktivKulcs="b"
      />,
    )
    expect(html).toContain('15 000')
    expect(html).toContain('500')
    expect(html.match(/class="kitoltendo aktiv"/g)).toHaveLength(1)
    expect(html.match(/>\?</g)).toHaveLength(2)
  })
})
