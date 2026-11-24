import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { KT } from '../../content/kepletter.ts'
import { kiertekelo, ujFeladat } from '../../gyakorlas/motor.ts'
import type { Getter } from '../../gyakorlas/tipusok.ts'
import { SABLONOK } from '../../gyakorlas/sablonok/index.ts'
import { beolvas } from '../../lib/szam.ts'
import { MC_HATTER, zhOsszeallit } from '../sorsolas.ts'

// Az 1. ZH javításai a magyarázatok átnézése után (a felhasználó jóváhagyásával; a sorsolás ujjlenyomata ezért frissült).

const sor = (id: string) => KT.felismero.sorok.find((s) => s.id === id)!

describe('felismerő tábla: a feladatváltozatokhoz illő sorok', () => {
  it('új sor: WACC osztalékos (Gordon) saját tőke költséggel (7.1 → 7.3 → 7.4)', () => {
    const s = KT.felismero.sorok.find((x) => x.kepletek.includes('7.1') && x.kepletek.includes('7.4'))
    expect(s, 'nincs Gordon-os WACC sor').toBeDefined()
    expect(s!.adja).toMatch(/osztalék/)
    expect(s!.kepletek).not.toContain('5.1')
  })

  it('új sor: kockázatos + kockázatmentes keverék (5.4), súllyal vagy célhozammal', () => {
    const s = KT.felismero.sorok.find((x) => x.kepletek.includes('5.4'))
    expect(s, 'nincs 5.4-es sor').toBeDefined()
    expect(s!.adja).toMatch(/célhozam/)
  })

  it('az új sorok a tábla végén vannak, a régi azonosítók nem csúsztak el', () => {
    expect(sor('F13').kepletek).toEqual(['5.1', '7.2', '7.3', '7.4'])
    expect(sor('F28').kepletek).toEqual(['10.5'])
  })

  it('a meglévő sorok a változatokat is lefedik (béták különbsége, céges béta, most fizetett osztalék)', () => {
    expect(sor('F10').kerdezi).toMatch(/MRP/)
    expect(sor('F14').adja).toMatch(/a cég bétája/)
    expect(sor('F25').adja).toMatch(/most fizetett osztalék/)
  })
})

describe('a sablonok felismerése a változathoz illő sor', () => {
  const sablon = (id: string) => SABLONOK.find((s) => s.id === id)!

  it('WACC: osztalékos adatoknál a Gordon-os lánc a helyes, és a CAPM-es csak rossz opció; CAPM-es adatoknál fordítva', () => {
    let gordon = 0
    let capm = 0
    for (let seed = 1; seed <= 120; seed++) {
      const f = ujFeladat(sablon('wacc'), seed)
      expect(f.felismeresek, `#${seed}`).toHaveLength(1)
      const fe = f.felismeresek[0]
      if (f.p.reMod === 'capm') {
        expect(fe.helyes).toBe('F13')
        capm++
      } else {
        expect(fe.helyes, `#${seed} ${f.p.reMod}`).toBe('F29')
        expect(fe.opciok).toContain('F13')
        expect(fe.opciok).not.toContain('F12')
        gordon++
      }
    }
    expect(gordon).toBeGreaterThan(10)
    expect(capm).toBeGreaterThan(10)
  })

  it('kevert portfólió: az 5.4-es sor a helyes, a portfólióbéta (4.4) sora nem opció', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const fe = ujFeladat(sablon('kevert-portfolio'), seed).felismeresek[0]
      expect(fe.helyes).toBe('F30')
      expect(fe.opciok).not.toContain('F06')
    }
  })
})

describe('levezetés: a kiírt számokból újraszámolva a kiírt eredmény jön ki', () => {
  /** „… = <kifejezés> = <eredmény>[ → …]”: a kifejezés értéke a kiírt pontosságig egyezik az eredménnyel. */
  function ellenoriz(lev: string, nev: string) {
    const reszek = lev.split(' → ')[0].split(' = ')
    const kif = reszek[reszek.length - 2]
    const ered = reszek[reszek.length - 1]
    const szam = (s: string) => s.replace(/\s/g, '').replace(/−/g, '-').replace(/,/g, '.').replace(/×/g, '*')
    const v = Function(`return ${szam(kif)}`)() as number
    const tizedes = (ered.split(',')[1] ?? '').replace(/\D.*$/, '').length
    expect(Math.abs(v - Number(szam(ered))), `${nev}: ${lev}`).toBeLessThanOrEqual(0.5 * 10 ** -tizedes + 1e-12)
  }
  const sablon = (id: string) => SABLONOK.find((s) => s.id === id)!
  const levezetes = (id: string, seed: number, key: string) => {
    const f = ujFeladat(sablon(id), seed)
    const l = f.lepesek.find((x) => x.key === key)
    return l ? l.levezetes(f.p, kiertekelo(f.sablon, f.p) as Getter) : undefined
  }

  it('korreláció (allapot-ket), WACC (wacc), céges WACC (wacc-vagy-capm)', () => {
    for (let seed = 1; seed <= 60; seed++) {
      ellenoriz(levezetes('allapot-ket', seed, 'k')!, `allapot-ket #${seed}`)
      ellenoriz(levezetes('wacc', seed, 'wacc')!, `wacc #${seed}`)
      const w = levezetes('wacc-vagy-capm', seed, 'wacc')
      if (w) ellenoriz(w, `wacc-vagy-capm #${seed}`)
    }
  })
})

describe('a „jobboldaliak” kérdések maradnak (a felhasználó döntése), a képlettár mondata ehhez igazodik', () => {
  it('a Hibák záró mondata már nem állítja, hogy a 25. dia megnevezésére nem épül kérdés', () => {
    const md = readFileSync(fileURLToPath(new URL('../../../keplettar.md', import.meta.url)), 'utf8')
    expect(md).not.toContain('ezekre nem épül kérdés')
    expect(md).toContain('a szerzők nevével együtt')
  })
})

describe('korreláció: a ZH opciói a [−1, 1] tartományban', () => {
  it('a −1 alatti vagy +1 feletti érték nem lehet opció (elárulná a választ)', () => {
    let db = 0
    for (let seed = 1; seed <= 400; seed++)
      for (const k of zhOsszeallit(seed, [], 1).valasztos) {
        const h = MC_HATTER.get(k)
        if (h?.fajta !== 'szamitas' || h.key !== 'k') continue
        for (const o of k.opciok) {
          const v = beolvas(o)!.ertek
          expect(Math.abs(v), `#${seed}: ${k.opciok.join(' | ')}`).toBeLessThanOrEqual(1)
        }
        db++
      }
    expect(db).toBeGreaterThan(5)
  })
})
