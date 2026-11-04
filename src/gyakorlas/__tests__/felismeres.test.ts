import { describe, expect, it } from 'vitest'
import { FELISMERO_KERDES, felismeroSzoveg, lancReszek } from '../felismeres.ts'
import { ujFeladat } from '../motor.ts'
import { SABLONOK } from '../sablonok/index.ts'
import type { FeladatSzoveg } from '../tipusok.ts'
import { zhOsszeallit } from '../../zh/sorsolas.ts'

// A felismerő kérdés ne árulja el a választ: a látható feladatszöveg nem tartalmazhatja
// sem a helyes opció szavait, sem a felismerő tábla „…és ezt kérdezi” oszlopának mennyiségét.

/** Kötőszavak a lánc szövegében, amelyek nem utalnak mennyiségre. */
const KOTOSZAVAK = new Set(['vagy', 'esetén', 'előbb', 'gyel', 'osztva', 'egyenletként', 'rendezve', 'átrendezve'])

/** A felismerő tábla „…és ezt kérdezi” oszlopának mennyiségei soronként (kisbetűs részletek). Új sornál ide is írj bejegyzést. */
const KERDEZETT: Record<string, string[]> = {
  F01: ['átlaghozam', 'mértani', 'számtani', 'logaritmikus', 'folytonos'],
  F02: ['szórás', 'historikus', 'variancia'],
  F03: ['várható hozam', 'szórás', 'variancia', 'kockázati prémium'],
  F04: ['kovariancia', 'korreláció', 'szórás'],
  F05: ['portfólió szórás', 'portfólió várható hozam', 'portfólió varianci'],
  F06: ['portfólió bétá'],
  F07: ['elvárt hozam'],
  F08: [],
  F09: ['árazott-e', 'túlárazott', 'alulárazott'],
  F10: ['kockázatmentes hozam', 'piaci kockázati prémium', 'piaci portfólió várható'],
  F11: ['npv', 'nettó jelenérték', 'irr', 'belső megtérülési', 'elfogad'],
  F12: ['saját tőke költség', 'tőkeköltség'],
  F13: ['wacc', 'tőkeköltség', 'súlyozott átlagos'],
  F14: ['elfogad', 'érdemes'],
  F15: ['eszközök várható hozam', 'eszközeinek várható hozam', 'tőkeköltség'],
  F16: ['részvények várható hozam', 'saját tőke költség'],
  F17: ['részvények várható hozam', 'saját tőke költség'],
  F18: ['eszközök bétá', 'eszközeinek bétá'],
  F19: ['adómegtakarítás', 'adópajzs', 'jelenérték'],
  F20: ['adómegtakarítás', 'adópajzs', 'jelenérték'],
  F21: ['tőkeköltség', 'módosított'],
  F22: ['tőkeköltség', 'módosított'],
}

function szovegbol(sz: FeladatSzoveg): string {
  return [...sz.bekezdesek, ...(sz.tabla ? [sz.tabla.fejlec.join(' '), ...sz.tabla.sorok.map((s) => s.join(' '))] : []), ...sz.kerdesek].join(' ')
}

function szavak(s: string): Set<string> {
  return new Set((s.toLowerCase().match(/\p{L}+/gu) ?? []).filter((w) => w.length >= 3))
}

/** Egy felismerő opció (lánc) látható szavai: a szöveges részek szavai és a képletekben álló szavak (NPV, WACC, \text{…}). */
function opcioSzavai(sorId: string): string[] {
  const ki: string[] = []
  for (const r of lancReszek(sorId)) {
    if (r.tipus === 'szoveg') ki.push(...szavak(r.szoveg))
    else {
      for (const m of r.latex.matchAll(/\\(?:text|mathrm)\{([^}]*)\}/g)) ki.push(...szavak(m[1]))
      const parancsNelkul = r.latex.replace(/\\(?:text|mathrm)\{[^}]*\}/g, ' ').replace(/\\[a-zA-Z]+/g, ' ')
      ki.push(...szavak(parancsNelkul))
    }
  }
  return ki.filter((w) => !KOTOSZAVAK.has(w))
}

function ellenoriz(sorId: string, latott: FeladatSzoveg, cimke: string) {
  const szoveg = szovegbol(latott)
  const szovegSzavai = szavak(szoveg)
  for (const w of opcioSzavai(sorId)) expect(szovegSzavai.has(w), `${cimke}: a szöveg tartalmazza a helyes opció szavát: „${w}” — ${szoveg}`).toBe(false)
  for (const k of KERDEZETT[sorId] ?? []) expect(szoveg.toLowerCase().includes(k), `${cimke}: a szöveg elárulja a kérdezett mennyiséget: „${k}” — ${szoveg}`).toBe(false)
}

describe('felismerő kérdések', () => {
  it('gyakorló mód: a felismerés alatt látható szöveg nem árulja el a láncot (sok seeddel)', () => {
    for (const s of SABLONOK) {
      for (let seed = 1; seed <= 300; seed++) {
        const f = ujFeladat(s, seed * 7919)
        for (const fe of f.felismeresek) ellenoriz(fe.helyes, felismeroSzoveg(f.szoveg, fe), `${s.id} #${seed} ${fe.helyes}`)
      }
    }
  })

  it('ZH-szimuláció: a felismerős feleletválasztós szövege és kérdése nem árulja el a választ (sok seeddel)', () => {
    let db = 0
    for (let seed = 1; seed <= 400; seed++) {
      const zh = zhOsszeallit(seed * 104729)
      for (const k of zh.valasztos.filter((x) => x.fajta === 'felismeres')) {
        db++
        expect(k.kerdes).toBe(FELISMERO_KERDES)
        expect(k.lancok, 'a felismerős opciók a lánc soraira hivatkoznak').toBeDefined()
        ellenoriz(k.lancok![k.helyes], k.szoveg!, `ZH #${seed}`)
      }
    }
    expect(db).toBeGreaterThan(300)
  })

  it('a felismerés kérdése mindig ugyanaz, és minden opció más képletláncot mutat', () => {
    for (const s of SABLONOK) {
      for (const fe of s.felismeresek) {
        expect('kerdes' in fe, `${s.id}: egyedi felismerő kérdés`).toBe(false)
        const lancok = [fe.helyes, ...fe.zavarok].map((id) => JSON.stringify(lancReszek(id)))
        expect(new Set(lancok).size, s.id).toBe(4)
      }
    }
  })
})
