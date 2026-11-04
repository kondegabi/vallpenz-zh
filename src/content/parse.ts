import type { Kor } from '../kor.ts'

// A keplettar.md beolvasása. A szövegeket nem alakítjuk át: minden blokk a forrás szó szerinti
// részlete (a markdown-jelölést a megjelenítés értelmezi).

export type Blokk =
  | { tipus: 'latex'; forras: string }
  | { tipus: 'kod'; forras: string }
  | { tipus: 'magyarul'; szoveg: string }
  | { tipus: 'tabla'; fejlec: string[]; sorok: string[][] }
  | { tipus: 'pont'; cimke?: string; szoveg: string; alpontok: string[] }
  | { tipus: 'bekezdes'; szoveg: string }

export type Szakasz = { szint: 2 | 3; cim: string; blokkok: Blokk[] }

export type Formula = {
  id: string
  fejezet: number
  cim: string
  blokkok: Blokk[]
  // a blokkokból származtatva
  latex: string[]
  magyarul?: string
  jelTabla?: Extract<Blokk, { tipus: 'tabla' }>
  csapdak: string[]
  peldak: { cimke: string; szoveg: string }[]
}

export type Fejezet = { szam: number; cim: string; bevezeto: Blokk[]; kepletek: Formula[]; kor: Kor }

export type FelismeroSor = { id: string; adja: string; kerdezi: string; lanc: string; kepletek: string[] }

export type Kepletter = {
  cim: string
  bevezeto: Blokk[]
  terkep: Szakasz
  fejezetek: Fejezet[]
  felismero: Szakasz & { sorok: FelismeroSor[] }
  hibak: Szakasz
}

const FORRAS_MINTA = /\((\d+\. ea|videó|szem\.[^)]*|jegyzet[^)]*)\)/

function tablaSor(sor: string): string[] {
  return sor.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
}

/** Egy szakasz törzsének sorai → blokkok. */
export function blokkokra(sorok: string[]): Blokk[] {
  const blokkok: Blokk[] = []
  let i = 0
  while (i < sorok.length) {
    const sor = sorok[i]
    if (sor.trim() === '') {
      i++
      continue
    }
    const kerites = /^```(\w*)\s*$/.exec(sor)
    if (kerites) {
      const tartalom: string[] = []
      i++
      while (i < sorok.length && !/^```\s*$/.test(sorok[i])) tartalom.push(sorok[i++])
      i++
      const forras = tartalom.join('\n')
      blokkok.push(kerites[1] === 'latex' ? { tipus: 'latex', forras } : { tipus: 'kod', forras })
      continue
    }
    if (sor.startsWith('|')) {
      const t: string[] = []
      while (i < sorok.length && sorok[i].startsWith('|')) t.push(sorok[i++])
      const [fejlec, , ...tobbi] = t.map(tablaSor)
      blokkok.push({ tipus: 'tabla', fejlec, sorok: tobbi })
      continue
    }
    const pont = /^- (.*)$/.exec(sor)
    if (pont) {
      const cimkes = /^\*\*(.+?):\*\*\s*(.*)$/.exec(pont[1])
      const blokk: Blokk = cimkes
        ? { tipus: 'pont', cimke: cimkes[1], szoveg: cimkes[2], alpontok: [] }
        : { tipus: 'pont', szoveg: pont[1], alpontok: [] }
      i++
      while (i < sorok.length && /^\s+\d+\.\s/.test(sorok[i])) blokk.alpontok.push(sorok[i++].trim())
      blokkok.push(blokk)
      continue
    }
    const magyarul = /^\*\*Magyarul:\*\*\s*(.*)$/.exec(sor)
    if (magyarul) {
      blokkok.push({ tipus: 'magyarul', szoveg: magyarul[1] })
      i++
      continue
    }
    // bekezdés: az üres sorig tart
    const bek: string[] = []
    while (i < sorok.length && sorok[i].trim() !== '' && !/^(```|\||- )/.test(sorok[i])) bek.push(sorok[i++])
    blokkok.push({ tipus: 'bekezdes', szoveg: bek.join(' ') })
  }
  return blokkok
}

/** A képlet-id-k egy szövegben, a megadott halmazra szűrve, előfordulási sorrendben. */
/**
 * Képletszám a szövegben: fejezet.sorszám, mindkettő egy- vagy kétjegyű (5.1, 10.12). Előtte és utána nem
 * állhat számjegy, pont vagy vessző (így a 3.14.15 vagy az 1,25 nem képletszám).
 */
export const KEPLET_ID_MINTA = /(?<![\d.,])(\d{1,2}\.\d{1,2})(?![\d]|[.,]\d)/g

/** A szövegben álló képletszámok sorrendben, ismétlés nélkül (ellenőrzés nélkül). */
export function kepletIdkSzovegben(szoveg: string): string[] {
  const talalt: string[] = []
  for (const m of szoveg.matchAll(KEPLET_ID_MINTA)) if (!talalt.includes(m[1])) talalt.push(m[1])
  return talalt
}

export function idkSzovegben(szoveg: string, ervenyes: Set<string>): string[] {
  return kepletIdkSzovegben(szoveg).filter((id) => ervenyes.has(id))
}

function formulaBol(id: string, cim: string, blokkok: Blokk[]): Formula {
  const pontok = blokkok.filter((b): b is Extract<Blokk, { tipus: 'pont' }> => b.tipus === 'pont')
  return {
    id,
    fejezet: Number(id.split('.')[0]),
    cim,
    blokkok,
    latex: blokkok.flatMap((b) => (b.tipus === 'latex' ? [b.forras] : [])),
    magyarul: blokkok.find((b) => b.tipus === 'magyarul')?.szoveg,
    jelTabla: blokkok.find(
      (b): b is Extract<Blokk, { tipus: 'tabla' }> => b.tipus === 'tabla' && b.fejlec[0] === 'Jel',
    ),
    csapdak: pontok.filter((p) => p.cimke?.startsWith('Csapda')).map((p) => p.szoveg),
    peldak: pontok
      .filter((p) => p.cimke && (p.cimke.startsWith('Példa') || FORRAS_MINTA.test(p.cimke)))
      .map((p) => ({ cimke: p.cimke!, szoveg: [p.szoveg, ...p.alpontok].join(' ') })),
  }
}

export function parseKepletter(md: string): Kepletter {
  const sorok = md.split(/\r?\n/)
  const cim = sorok[0].replace(/^# /, '')

  // szakaszokra bontás (## és ###)
  type Nyers = { szint: 2 | 3; cim: string; sorok: string[]; kor: Kor }
  const nyersek: Nyers[] = []
  const bevezetoSorok: string[] = []
  // a „# N. ZH …” rész-fejléc az utána jövő fejezetek ZH-ját adja meg
  let kor: Kor = 1
  for (const sor of sorok.slice(1)) {
    const resz = /^# ([12])\. ZH\b/.exec(sor)
    if (resz) {
      kor = Number(resz[1]) as Kor
      continue
    }
    const h = /^(##|###) (.+)$/.exec(sor)
    // a címekben a markdown-escape (r\_f) megjelenítve r_f
    if (h) nyersek.push({ szint: h[1] === '##' ? 2 : 3, cim: h[2].trim().replace(/\\_/g, '_'), sorok: [], kor })
    else if (nyersek.length) nyersek[nyersek.length - 1].sorok.push(sor)
    else bevezetoSorok.push(sor)
  }

  let terkep: Szakasz | undefined
  let felismero: Kepletter['felismero'] | undefined
  let hibak: Szakasz | undefined
  const fejezetek: Fejezet[] = []

  for (const n of nyersek) {
    const blokkok = blokkokra(n.sorok)
    const fejezetCim = /^(\d+)\. (.+)$/.exec(n.cim)
    const kepletCim = /^(\d+\.\d+) (.+)$/.exec(n.cim)
    if (n.szint === 3 && kepletCim) {
      const f = fejezetek[fejezetek.length - 1]
      f.kepletek.push(formulaBol(kepletCim[1], kepletCim[2], blokkok))
    } else if (n.szint === 2 && fejezetCim) {
      fejezetek.push({ szam: Number(fejezetCim[1]), cim: fejezetCim[2], bevezeto: blokkok, kepletek: [], kor: n.kor })
    } else if (n.cim.startsWith('A képletek térképe')) {
      terkep = { szint: 2, cim: n.cim, blokkok }
    } else if (n.cim.startsWith('Feladattípus-felismerő')) {
      felismero = { szint: 2, cim: n.cim, blokkok, sorok: [] }
    } else if (n.cim.startsWith('Hibák a diákon')) {
      hibak = { szint: 2, cim: n.cim, blokkok }
    } else {
      throw new Error(`Ismeretlen szakasz a képlettárban: ${n.cim}`)
    }
  }
  if (!terkep || !felismero || !hibak) throw new Error('Hiányzó fő szakasz a képlettárban')

  const ids = new Set(fejezetek.flatMap((f) => f.kepletek.map((k) => k.id)))
  const tabla = felismero.blokkok.find((b) => b.tipus === 'tabla')
  if (tabla?.tipus === 'tabla') {
    felismero.sorok = tabla.sorok.map(([adja, kerdezi, lanc], i) => ({
      id: `F${String(i + 1).padStart(2, '0')}`,
      adja,
      kerdezi,
      lanc,
      kepletek: idkSzovegben(lanc, ids),
    }))
  }

  return { cim, bevezeto: blokkokra(bevezetoSorok), terkep, fejezetek, felismero, hibak }
}
