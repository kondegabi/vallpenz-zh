import { describe, expect, it } from 'vitest'
import { ellenoriz } from '../ellenorzes.ts'
import {
  feladatRogzit,
  felismeresRogzit,
  leggyakoribbHiba,
  lepesRogzit,
  uresStat,
} from '../statisztika.ts'

describe('Ellenőrzés', () => {
  it('%-os lépésnél a beírt szám százalék', () => {
    expect(ellenoriz('13,18', 0.1318, '%').ok).toBe(true)
    expect(ellenoriz('13,18%', 0.1318, '%').ok).toBe(true)
    expect(ellenoriz('13,2', 0.1318, '%').ok).toBe(true) // 0,02 százalékpont eltérés belefér
    expect(ellenoriz('13,3', 0.1318, '%').ok).toBe(false)
    // tizedes törtként beírva százalékos mezőbe: nem fogadjuk el
    expect(ellenoriz('0,1318', 0.1318, '%').ok).toBe(false)
  })

  it('tizedes lépésnél a megadott tűréssel', () => {
    expect(ellenoriz('0,8576', 0.857580, 'tizedes', { abs: 0.0005 }).ok).toBe(true)
    expect(ellenoriz('0,86', 0.857580, 'tizedes', { abs: 0.0005 }).ok).toBe(false)
    expect(ellenoriz('0,0064', 0.0064, 'tizedes', { abs: 0.00005, rel: 0.01 }).ok).toBe(true)
    expect(ellenoriz('0,006', 0.0064, 'tizedes', { abs: 0.00005, rel: 0.01 }).ok).toBe(false)
    expect(ellenoriz('−0,045', -0.045, 'tizedes').ok).toBe(true)
  })

  it('pénzösszeg ezres tagolással is', () => {
    expect(ellenoriz('4,24', 4.24, 'USD').ok).toBe(true)
    expect(ellenoriz('32 650 000', 32650000, 'USD').ok).toBe(true)
  })

  it('érvénytelen bevitelre üzenetet ad', () => {
    const e = ellenoriz('tizenhárom', 0.13, '%')
    expect(e.ok).toBe(false)
    expect(!e.ok && e.uzenet).toBeTruthy()
  })
})

describe('Statisztika', () => {
  it('felismerés és lépések képletenként', () => {
    let s = uresStat()
    s = felismeresRogzit(s, ['5.1', '7.2', '5.1'], true)
    s = felismeresRogzit(s, ['5.1'], false)
    s = lepesRogzit(s, '5.1', 'Mekkora az MRP?', false)
    s = lepesRogzit(s, '5.1', 'Mekkora az MRP?', false)
    s = lepesRogzit(s, '5.1', 'Mekkora az elvárt hozam?', false)
    s = lepesRogzit(s, '5.1', 'Mekkora az elvárt hozam?', true)
    s = feladatRogzit(s, 'capm-elvart', false)
    expect(s.kepletek['5.1']).toMatchObject({ felJo: 1, felOssz: 2, szamJo: 1, szamOssz: 4 })
    expect(s.kepletek['7.2']).toMatchObject({ felJo: 1, felOssz: 1 })
    expect(leggyakoribbHiba(s.kepletek['5.1'])).toEqual({ kerdes: 'Mekkora az MRP?', db: 2 })
    expect(s.sablonok['capm-elvart']).toEqual({ ossz: 1, hibatlan: 0 })
  })
})
