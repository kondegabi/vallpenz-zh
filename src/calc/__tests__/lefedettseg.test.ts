import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Minden diás példának (a képlettárban „**Címke (N. ea):**” alakú pontnak) legyen tesztje
// „<képlet id> <címke>” néven; ugyanolyan címkéjű példáknál „ #1”, „ #2” utótaggal.

const md = readFileSync(fileURLToPath(new URL('../../../keplettar.md', import.meta.url)), 'utf8')
const tesztMappa = fileURLToPath(new URL('.', import.meta.url))

function vartPeldak(): Map<string, number> {
  const vart = new Map<string, number>()
  let id: string | null = null
  for (const sor of md.split(/\r?\n/)) {
    const fejlec = /^### (\d+\.\d+) /.exec(sor)
    if (fejlec) id = fejlec[1]
    else if (/^## /.test(sor)) id = null
    const pont = /^- \*\*(.+?):\*\*/.exec(sor)
    if (!id || !pont) continue
    const cimke = pont[1].replace(/\\_/g, '_')
    if (!/\((\d+\. ea|videó|szem\.[^)]*|jegyzet[^)]*)\)/.test(cimke)) continue
    const kulcs = `${id} ${cimke}`
    vart.set(kulcs, (vart.get(kulcs) ?? 0) + 1)
  }
  return vart
}

function tesztNevek(): Map<string, number> {
  const nevek = new Map<string, number>()
  for (const f of readdirSync(tesztMappa)) {
    if (!f.endsWith('.test.ts') || f === 'lefedettseg.test.ts') continue
    const forras = readFileSync(tesztMappa + f, 'utf8')
    for (const m of forras.matchAll(/\bit\('([^']+)'/g)) {
      const kulcs = m[1].replace(/ #\d+$/, '')
      nevek.set(kulcs, (nevek.get(kulcs) ?? 0) + 1)
    }
  }
  return nevek
}

describe('Lefedettség', () => {
  const vart = vartPeldak()

  it('a képlettárban van mit ellenőrizni', () => {
    expect(vart.size).toBeGreaterThan(30)
  })

  it('minden diás példának van tesztje', () => {
    const nevek = tesztNevek()
    const hianyzik = [...vart].filter(([k, db]) => (nevek.get(k) ?? 0) < db).map(([k, db]) => `${k} (${db}×)`)
    expect(hianyzik).toEqual([])
  })
})
