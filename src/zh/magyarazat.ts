// A ZH kiértékelésének magyarázatai: miért az a helyes válasz, és a számítások részeredményei.
// Minden szöveg a képlettárból (keplettar.md) vagy a feladat saját lépéseiből jön.

import md from '../../keplettar.md?raw'
import { KT, keplet } from '../content/kepletter.ts'
import { ellenoriz, tipikusHiba } from '../gyakorlas/ellenorzes.ts'
import { eredmeny, sz } from '../gyakorlas/formaz.ts'
import { type Feladat, felismeroSor, kiertekelo, lancNevekkel } from '../gyakorlas/motor.ts'
import type { Egyseg, Getter } from '../gyakorlas/tipusok.ts'
import type { Allitas } from './allitasok.ts'
import { MC_HATTER, type ZhValasztos } from './sorsolas.ts'

const SOROK = md.replace(/\r\n/g, '\n').split('\n')

/** A szó a szóvégi írásjel nélkül: az összehasonlításban a „ráta.” és a „ráta” ugyanaz. */
const norm = (s: string) => s.replace(/[.,;:]+$/, '')

/** LCS-illesztés a normalizált szavakon: szavanként jelölve, melyik nem illeszkedett (változott). */
function lcsJeloles(x: string[], y: string[]): [boolean[], boolean[]] {
  const L = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0))
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const jx = x.map(() => true)
  const jy = y.map(() => true)
  let i = 0
  let j = 0
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) (jx[i++] = false), (jy[j++] = false)
    else if (L[i + 1][j] >= L[i][j + 1]) i++
    else j++
  }
  return [jx, jy]
}

/** A jelölt szavak összefüggő futamai. */
function futamok(jel: boolean[]): { tol: number; ig: number }[] {
  const ki: { tol: number; ig: number }[] = []
  jel.forEach((v, k) => {
    if (!v) return
    const utolso = ki[ki.length - 1]
    if (utolso && utolso.ig === k) utolso.ig = k + 1
    else ki.push({ tol: k, ig: k + 1 })
  })
  return ki
}

export type Szakasz = { szoveg: string; valtozott: boolean }

/**
 * A két mondat szavanként, a megváltozott szavak jelölve. Ha az LCS félrevezető jelölést adna (a két
 * oldalon eltérő számú vagy ugyanolyan szövegű futam, pl. „vitatott: nem” ↔ „nem vitatott:”), a közös
 * eleje és vége közötti teljes részt jelöljük. Ha a hamis mondatból csak elhagytunk egy szót (pl. „nem”),
 * a szomszéd szót is jelöljük mindkét oldalon, hogy a hamis mondatban is látsszon, hol a hiba.
 */
export function szoJeloles(igaz: string, hamis: string): { igaz: Szakasz[]; hamis: Szakasz[] } {
  const x = igaz.split(/\s+/)
  const y = hamis.split(/\s+/)
  const nx = x.map(norm)
  const ny = y.map(norm)
  let [jx, jy] = lcsJeloles(nx, ny)
  const fx = futamok(jx)
  const fy = futamok(jy)
  const szoveg = (n: string[], f: { tol: number; ig: number }) => n.slice(f.tol, f.ig).join(' ')
  const zavaros = (fx.length > 0 && fy.length > 0 && fx.length !== fy.length) || fx.some((f, k) => fy[k] && szoveg(nx, f) === szoveg(ny, fy[k]))
  if (zavaros) {
    let eleje = 0
    while (eleje < nx.length && eleje < ny.length && nx[eleje] === ny[eleje]) eleje++
    let vege = 0
    while (vege < nx.length - eleje && vege < ny.length - eleje && nx[nx.length - 1 - vege] === ny[ny.length - 1 - vege]) vege++
    jx = x.map((_, k) => k >= eleje && k < x.length - vege)
    jy = y.map((_, k) => k >= eleje && k < y.length - vege)
  }
  if (!jy.some(Boolean) && jx.some(Boolean)) {
    // a hamis mondatból hiányzik a szó: a szomszédja (utána, a mondat végén előtte) mindkét oldalon
    const f = futamok(jx)[0]
    const k = f.ig < x.length ? f.ig : f.tol - 1
    if (k >= 0) {
      // a hamis mondat minden szava illeszkedik az igaz egy jelöletlen szavára, sorrendben: a szomszéd
      // helye a hamisban annyi, ahány jelöletlen szó áll előtte az igazban
      jy[jx.slice(0, k).filter((v) => !v).length] = true
      jx[k] = true
    }
  }
  const osszevon = (szavak: string[], jel: boolean[]) =>
    szavak.reduce<Szakasz[]>((ki, s, k) => {
      const utolso = ki[ki.length - 1]
      if (utolso && utolso.valtozott === jel[k]) utolso.szoveg += ` ${s}`
      else ki.push({ szoveg: s, valtozott: jel[k] })
      return ki
    }, [])
  return { igaz: osszevon(x, jx), hamis: osszevon(y, jy) }
}

/** A megváltozott szakaszok párban (a kiemelés futamaiból), írásjel nélkül. */
export function szoCsere(igaz: string, hamis: string): { igaz: string; hamis: string }[] {
  const j = szoJeloles(igaz, hamis)
  const ki = (s: Szakasz[]) => s.filter((x) => x.valtozott).map((x) => norm(x.szoveg))
  const a = ki(j.igaz)
  const b = ki(j.hamis)
  return Array.from({ length: Math.max(a.length, b.length) }, (_, k) => ({ igaz: a[k] ?? '', hamis: b[k] ?? '' }))
}

export type ForrasIdezet = {
  /** a képlettár szakaszának neve (képlet vagy fejezet), ahol az idézet áll */
  nev: string
  /** a képlet azonosítója, ha az idézet egy képlet szakaszában áll (link a képlet oldalára) */
  id?: string
  idezet: string
  latex?: boolean
  /** nem idézet, hanem a képlethez fűzött rövid magyarázat */
  magyarazat?: boolean
}

/** Táblázatsor szövegként: „Fejléc: cella · …” (kérdő fejlécnél kettőspont nélkül). */
function tablaSor(i: number): string {
  let fej = i
  while (fej > 0 && SOROK[fej - 1].trimStart().startsWith('|')) fej--
  const cellak = (s: string) =>
    s
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim())
  const fejlec = cellak(SOROK[fej])
  return cellak(SOROK[i])
    .map((c, k) => (fejlec[k] && fej !== i ? `${fejlec[k]}${fejlec[k].endsWith('?') ? ' ' : ': '}${c}` : c))
    .join(' · ')
}

/** Rövidítések, amelyek pontja nem mondatvég. */
const ROVIDITES = new Set(['szem', 'pl', 'kb', 'ill', 'ld', 'vö', 'ún', 'dr', 'ea'])

/**
 * Mondathatárok egy sorban: írásjel betű után, utána szóköz és nagybetű vagy számjegy. Nem határ a
 * „13. dia”, a rövidítés („szem. Baumol”) és a zárójelen belüli pont.
 */
function mondatok(sor: string): { tol: number; ig: number }[] {
  const ki: { tol: number; ig: number }[] = []
  let tol = 0
  for (const m of sor.matchAll(/(?<=[\p{L})\]”*])[.!?](?=\s+[\p{Lu}„(\d])/gu)) {
    const elotte = sor.slice(0, m.index!)
    if (ROVIDITES.has(elotte.match(/(\p{L}+)$/u)?.[1].toLowerCase() ?? '')) continue
    if ((elotte.match(/\(/g)?.length ?? 0) > (elotte.match(/\)/g)?.length ?? 0)) continue
    ki.push({ tol, ig: m.index! + 1 })
    tol = m.index! + 1
  }
  ki.push({ tol, ig: sor.length })
  return ki
}

/** A sor egy ```latex blokkban áll-e. */
function latexBlokkban(i: number): boolean {
  for (let j = i - 1; j >= 0; j--) if (SOROK[j].trimStart().startsWith('```')) return SOROK[j].trim() === '```latex'
  return false
}

/** A sor helye a képlettárban: a legközelebbi képlet- (###) vagy fejezetcím (##) szerint. */
function hely(i: number): { nev: string; id?: string } {
  for (let j = i; j >= 0; j--) {
    const k3 = SOROK[j].match(/^### (\S+) (.+)$/)
    if (k3) {
      const k = keplet(k3[1])
      return k ? { nev: k.cim, id: k.id } : { nev: k3[2] }
    }
    const k2 = SOROK[j].match(/^## (?:\d+\. )?(.+)$/)
    if (k2) return { nev: k2[1] }
  }
  return { nev: 'Képlettár' }
}

/** A képlettár mondata (vagy táblázatsora, képlete), amely a kulcsot tartalmazza, és a helye. */
export function forrasIdezet(_forras: string, kulcs: string): ForrasIdezet | undefined {
  const i = SOROK.findIndex((s) => s.includes(kulcs))
  if (i < 0) return undefined
  const h = hely(i)
  const sor = SOROK[i]
  if (latexBlokkban(i)) return { ...h, idezet: sor.trim(), latex: true }
  if (sor.trimStart().startsWith('|')) return { ...h, idezet: tablaSor(i) }
  const poz = sor.indexOf(kulcs)
  const vege = poz + kulcs.length
  const m = mondatok(sor)
  const tol = m.find((x) => x.tol <= poz && poz < x.ig)!.tol
  const ig = m.find((x) => x.tol < vege && vege <= x.ig)!.ig
  let idezet = sor
    .slice(tol, ig)
    .trim()
    .replace(/^[-*]\s+/, '')
  // a sor közepéről vett mondat elé a pont címkéje, hogy látsszon, miről szól
  const cimke = sor.match(/^\s*[-*]\s+(\*\*[^*]+:\*\*)/)?.[1]
  if (tol > 0 && cimke) idezet = `${cimke} … ${idezet}`
  return { ...h, idezet }
}

/**
 * Ahol a bank kulcsa egymagában nem hordozza a választ (csak képlet, egyetlen táblázatsor, vagy a
 * mondat másik felét támasztja alá), további képlettár-részletek, illetve egy rövid magyarázó mondat.
 * A kulcsok szó szerint a képlettárból valók (a teszt ellenőrzi).
 */
const KIEGESZITES: Record<string, { kulcsok?: string[]; magyarazat?: string }> = {
  'portfolio-beta': { kulcsok: ['1 = ⅓ × 1,2 + ⅓ × βB + ⅓ × 0'] },
  'baumol-hozam': { kulcsok: ['nagyobb hozam (r) → kisebb C\\_opt'] },
  'miller-orr-szoras': { magyarazat: 'A képletben σ² a köbgyök alatt, a számlálóban áll: nagyobb szórásnál nagyobb a C* − L távolság.' },
  'agazat-kozmu-szoftver': { kulcsok: ['| Software (System & Application) | 10,01% |', '| Software (Entertainment) | 9,58% |'] },
  'agazat-legmagasabb': { magyarazat: 'Ez a 31. dia táblázatának legnagyobb értéke.' },
  'menedzsment-csokkentes': { magyarazat: 'Ez a 28. dia táblázatának legnagyobb értéke.' },
}

/** Egy állítás vagy elméleti kérdés forrásai: a kulcs idézete, és ahol kell, a kiegészítés. */
export function forrasIdezetek(k: { id: string; forras: string; kulcs: string }): ForrasIdezet[] {
  const ki: ForrasIdezet[] = []
  const f = forrasIdezet(k.forras, k.kulcs)
  if (f) ki.push(f)
  const x = KIEGESZITES[k.id]
  for (const kulcs of x?.kulcsok ?? []) {
    const g = forrasIdezet(k.forras, kulcs)
    if (!g) throw new Error(`A kiegészítő kulcs nincs a képlettárban: ${kulcs}`)
    ki.push(g)
  }
  if (x?.magyarazat) ki.push({ nev: f?.nev ?? '', id: f?.id, idezet: x.magyarazat, magyarazat: true })
  return ki
}

export type IgazHamisMagyarazat = {
  igaz: boolean
  helyes: string
  cserek: { igaz: string; hamis: string }[]
  /** a két alak szavanként, a cserélt szavak jelölve */
  jelolt: { igaz: Szakasz[]; hamis: Szakasz[] }
  forrasok: ForrasIdezet[]
}

export function igazHamisMagyarazat(k: { allitas: Allitas; igaz: boolean; szoveg?: string }): IgazHamisMagyarazat {
  return {
    igaz: k.igaz,
    helyes: k.allitas.igaz,
    cserek: k.igaz ? [] : szoCsere(k.allitas.igaz, k.allitas.hamis),
    jelolt: szoJeloles(k.allitas.igaz, k.allitas.hamis),
    forrasok: forrasIdezetek(k.allitas),
  }
}

/**
 * Egy részeredmény kiírása: a lépés mértékegységében, de a kis tizedes értékeket (kovariancia,
 * variancia) 6 tizedesre, hogy legyen bennük legalább 3 értékes jegy (0,000319 és nem 0,0003).
 */
export function reszErtek(x: number, egyseg: Egyseg): string {
  return egyseg === 'tizedes' && x !== 0 && Math.abs(x) < 0.1 ? sz(x, 6) : eredmeny(x, egyseg)
}

export type Reszeredmeny = { key: string; kerdes: string; ertek: string; levezetes: string; kerdezett: boolean }

/** A feladat minden aktív lépése sorban: kérdés, helyes érték, levezetés; a kérdezett végeredmények jelölve. */
/** A megoldás lépései: a lépések a megoldás sorrendjében állnak, az utolsó kérdezett utániak nem kellenek. */
function megoldasLepesei(f: Feladat, kerdezett: readonly string[]) {
  const utolso = Math.max(...f.lepesek.map((l, i) => (kerdezett.includes(l.key) ? i : -1)))
  return f.lepesek.slice(0, utolso < 0 ? f.lepesek.length : utolso + 1)
}

/**
 * A megoldáshoz szükséges képletek LaTeX-alakja, sorrendben, ismétlés nélkül (a lépés saját blokkjával).
 * A ZH-ban a tanár megadja a számolós feladatok képletét (bejelentés: 2026-11-26).
 */
export function megoldasKepletei(f: Feladat, kerdezett: readonly string[]): string[] {
  const ki = megoldasLepesei(f, kerdezett).map((l) => {
    const k = keplet(l.formulaId)
    if (!k) throw new Error(`Nincs ilyen képlet: ${l.formulaId}`)
    return k.latex[l.latexIdx ?? 0] ?? k.latex[0]
  })
  return [...new Set(ki)]
}

/** A feleletválasztós kérdés képletei: csak számítási kérdésnél (a felismerősnél épp a képletet kell felismerni). */
export function mcKepletei(k: ZhValasztos): string[] {
  const h = MC_HATTER.get(k)
  return h?.fajta === 'szamitas' ? megoldasKepletei(h.feladat, [h.key]) : []
}

export function reszeredmenyek(f: Feladat, kerdezett: readonly string[]): Reszeredmeny[] {
  const get = kiertekelo(f.sablon, f.p) as Getter
  return megoldasLepesei(f, kerdezett).map((l) => ({
    key: l.key,
    kerdes: l.kerdes,
    ertek: l.tipus === 'szam' ? reszErtek(f.ertekek[l.key] as number, l.egyseg) : String(f.ertekek[l.key]),
    levezetes: l.levezetes(f.p, get),
    kerdezett: kerdezett.includes(l.key),
  }))
}

/** A feladat felismerése: mit ad, mit kérdez, és melyik képletlánc kell (nevekkel). */
export function lancMagyarazat(f: Feladat): { adja: string; kerdezi: string; lanc: string } | undefined {
  const fe = f.felismeresek[0]
  if (!fe) return undefined
  const s = felismeroSor(fe.helyes)
  // „ugyanez két részvényre”: a tábla előző sorára utal, ami itt nem látszik
  const elozo = KT.felismero.sorok[KT.felismero.sorok.indexOf(s) - 1]
  const adja = /^ugyanez /.test(s.adja) && elozo ? `${elozo.adja}, ${s.adja.replace(/^ugyanez /, '')}` : s.adja
  // a képletnevek mondat közben kisbetűvel („… vagy az SML …”), az egymás utáni zárójelek összevonva
  const lanc = lancNevekkel(s.lanc)
    .replace(/(vagy|és|, ) (A|Az) /g, (_, e: string, n: string) => `${e} ${n.toLowerCase()} `)
    .replace(/\) \(/g, '; ')
  return { adja, kerdezi: s.kerdezi, lanc }
}

/** Ha a beírt rossz érték (vagy választás) egy ismert hibás út eredménye, annak az üzenete. */
export function sajatHiba(f: Feladat, key: string, bevitel: string): string | undefined {
  const l = f.lepesek.find((x) => x.key === key)
  if (!l) return undefined
  if (l.tipus === 'valasztas') return bevitel === f.ertekek[key] ? undefined : f.tipikusValaszok[key]?.find((t) => t.valasz === bevitel)?.uzenet
  const e = ellenoriz(bevitel, f.ertekek[key] as number, l.egyseg, f.turesek[key])
  if (e.ok || e.ertek === undefined) return undefined
  return tipikusHiba(e.ertek, f.tipikusHibak[key] ?? [], l.egyseg, f.turesek[key])
}
