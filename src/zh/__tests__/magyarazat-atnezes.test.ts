import { describe, expect, it } from 'vitest'
import { ALLITASOK } from '../allitasok.ts'
import { ELMELETI } from '../elmeleti.ts'
import { ujFeladat } from '../../gyakorlas/motor.ts'
import { SABLONOK } from '../../gyakorlas/sablonok/index.ts'
import { forrasIdezetek, igazHamisMagyarazat, lancMagyarazat, reszeredmenyek, szoJeloles } from '../magyarazat.ts'

// A magyarázatok Fable-átnézésének javításai: mindegyikhez egy teszt, amely a hibát megfogja.

const allitas = (id: string) => ALLITASOK.find((a) => a.id === id)!
const jelolt = (id: string) => {
  const m = igazHamisMagyarazat({ allitas: allitas(id), igaz: false })
  const ki = (s: { szoveg: string; valtozott: boolean }[]) => s.filter((x) => x.valtozott).map((x) => x.szoveg.replace(/[.,;:]+$/, ''))
  return { igaz: ki(m.jelolt.igaz), hamis: ki(m.jelolt.hamis) }
}
const norm = (s: string) => s.replace(/[.,;:]+$/, '')

describe('kiemelés: a valódi különbséget jelöli', () => {
  it('ugyanaz a szó nem lehet kiemelve mindkét oldalon ugyanazon a helyen (diszkontrata-vitatott)', () => {
    for (const a of ALLITASOK) {
      const j = jelolt(a.id)
      j.igaz.forEach((s, i) => expect(norm(s), `${a.id}: ${s}`).not.toBe(norm(j.hamis[i] ?? '')))
    }
    expect(jelolt('diszkontrata-vitatott')).toEqual({ igaz: ['vitatott: nem'], hamis: ['nem vitatott'] })
  })

  it('a szóvégi írásjel nem tesz különbséget (plowback, adomegtakaritas-pv, kevert-beta)', () => {
    expect(jelolt('plowback').igaz.join(' ')).not.toContain('ráta')
    expect(jelolt('adomegtakaritas-pv').hamis).toEqual(['× rD'])
    expect(jelolt('kevert-beta').igaz).toEqual([])
    expect(szoJeloles('a ráta.', 'b ráta').igaz.filter((x) => x.valtozott).map((x) => x.szoveg)).toEqual(['a'])
  })

  it('a hamis mondatban mindig van kiemelés; ha onnan egy szó hiányzik, a szomszédja jelölt (irr-nem-jobb)', () => {
    for (const a of ALLITASOK) expect(jelolt(a.id).hamis.length, a.id).toBeGreaterThan(0)
    expect(jelolt('irr-nem-jobb')).toEqual({ igaz: ['nem jobb'], hamis: ['jobb'] })
    expect(jelolt('felaprozas-vagyon')).toEqual({ igaz: ['nem növeli'], hamis: ['növeli'] })
  })
})

describe('forrásidézet: a címke a valódi helye', () => {
  it('a fejezet bevezetőjéből vett idézet a fejezet nevét kapja, képletlink nélkül', () => {
    const f = forrasIdezetek(allitas('likviditas-def'))[0]
    expect(f.nev).toBe('Készpénz- és likviditásmenedzsment')
    expect(f.id).toBeUndefined()
    const o = forrasIdezetek(allitas('reszvenyosztalek'))[0]
    expect(o.nev).toBe('Osztalékpolitika')
    expect(forrasIdezetek(allitas('hagyomanyos-nezet'))[0].nev).toBe('Tőkeszerkezet')
  })

  it('a képlet szakaszából vett idézet a képlet nevét és linkjét kapja', () => {
    const f = forrasIdezetek(allitas('teljes-hozam'))[0]
    expect(f.nev).toBe('Teljes (százalékos) hozam')
    expect(f.id).toBe('1.1')
  })

  it('a számjeggyel kezdődő következő mondat nem kerül az idézetbe (mm2-szazszazalek)', () => {
    const f = forrasIdezetek(allitas('mm2-szazszazalek'))[0]
    expect(f.idezet).not.toContain('Magas eladósodottság felett')
  })
})

describe('részeredmények: kis értékek is olvashatók', () => {
  it('a kovariancia legalább 3 értékes jeggyel látszik (nem „0,0003”)', () => {
    const s = SABLONOK.find((x) => x.id === 'allapot-ket')!
    let db = 0
    for (let seed = 1; seed <= 60; seed++) {
      const f = ujFeladat(s, seed)
      const cov = f.ertekek.cov as number
      if (Math.abs(cov) >= 0.01 || cov === 0) continue
      const ertek = reszeredmenyek(f, []).find((x) => x.key === 'cov')!.ertek
      const jegyek = ertek.replace(/[^\d]/g, '').replace(/^0+/, '')
      // pontos érték (pl. 0,0023) rövidebb is lehet; különben legalább 3 értékes jegy
      const pontos = Math.abs(Number(ertek.replace('−', '-').replace(',', '.')) - cov) < 1e-12
      expect(pontos || jegyek.length >= 3, `#${seed}: ${ertek}`).toBe(true)
      db++
    }
    expect(db).toBeGreaterThan(5)
  })
})

describe('a lánc magyarázata', () => {
  const lanc = (id: string) => {
    const s = SABLONOK.find((x) => x.id === id)!
    return lancMagyarazat(ujFeladat(s, 1))!
  }

  it('az „ugyanez két részvényre” sor az előző sorral feloldva (allapot-ket)', () => {
    expect(lanc('allapot-ket').adja).toBe('állapotok + valószínűségek + hozamok, két részvényre')
  })

  it('a lánc nevei mondat közben kisbetűvel, egymás utáni zárójelek nélkül (capm-arazas)', () => {
    const l = lanc('capm-arazas').lanc
    expect(l).not.toMatch(/vagy Az? /)
    expect(l).not.toMatch(/\) \(/)
  })
})

describe('forrásidézet: a választ hordozó mondat', () => {
  it('portfolio-beta: a visszafejtés példája is ott van (a kockázatmentes elem súlya beleszámít)', () => {
    expect(forrasIdezetek(allitas('portfolio-beta')).map((f) => f.idezet).join(' ')).toContain('⅓ × 0')
  })

  it('baumol-hozam: a mondat, nem csak a képlet', () => {
    const f = forrasIdezetek(allitas('baumol-hozam'))
    expect(f.some((x) => !x.latex && x.idezet.includes('nagyobb hozam (r) → kisebb C\\_opt'))).toBe(true)
  })

  it('miller-orr-szoras: a képlet mellett egy mondat, hogy miért', () => {
    const f = forrasIdezetek(allitas('miller-orr-szoras'))
    expect(f.some((x) => x.latex)).toBe(true)
    expect(f.some((x) => x.magyarazat && /σ²/.test(x.idezet))).toBe(true)
  })

  it('agazat-kozmu-szoftver: a szoftvercégek sorai is ott vannak', () => {
    const s = forrasIdezetek(allitas('agazat-kozmu-szoftver')).map((f) => f.idezet).join(' ')
    expect(s).toContain('57,06%')
    expect(s).toContain('10,01%')
  })

  it('a „legmagasabb” kérdéseknél kiderül, hogy ez a táblázat legnagyobb értéke', () => {
    const q = ELMELETI.find((k) => k.id === 'agazat-legmagasabb')!
    expect(forrasIdezetek(q).map((f) => f.idezet).join(' ')).toMatch(/legnagyobb/)
    expect(forrasIdezetek(allitas('menedzsment-csokkentes')).map((f) => f.idezet).join(' ')).toMatch(/legnagyobb/)
  })

  it('minden kiegészítő kulcs szó szerint benne van a képlettárban', () => {
    for (const k of [...ALLITASOK, ...ELMELETI]) for (const f of forrasIdezetek(k)) expect(f.idezet.length, k.id).toBeGreaterThan(0)
  })
})
