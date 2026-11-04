// 1. lecke: számtani, mértani és folytonos átlag (1.2–1.4).
// Diás nézet: az 1. ea 14. diájának „1 dollár növekedése” ábrája (log skála) a beírt pályára,
// a 30. dia kamatozós sora és a 31. dia P–T ábrája. Bővített nézet: a két pálya azonos skálán,
// a számtani, illetve a mértani (= folytonos) átlaggal kamatoztatott pályával és előjeles sávokkal.

import { MinusIcon, PlusIcon } from '@phosphor-icons/react'
import { scaleLinear, scaleLog } from 'd3-scale'
import { useId, useState } from 'react'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { formatSzam } from '../lib/szam.ts'
import { link } from '../router.ts'
import { Katex } from '../ui/Katex.tsx'
import { L01_ALAP, L01_NAGY, M_SOR, PT_KOZ, PT_P0, PT_TMAX, l01, palya, type L01, type PalyaEredmeny } from './szamitas/l01.ts'
import { Abra, Gorbe, NyilDef, Pont, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'arak' | 'm' | 'rc' | null

const PALYA_NEV = ['Nagy ingadozás', 'Kis ingadozás'] as const
const PALYA_FORRAS = ['1. ea, 1.3 példa', '2. ea, 1.4 példa'] as const

const dollar = (v: number, tizedes = 2) => `$${formatSzam(v, tizedes)}`
const nyil = (arak: number[]) => arak.map((p) => sz(p, 2)).join(' → ')

/** Log skálán „kerek” tickek a tartományban (1, 2, 5 × 10^k). */
function logTickek(lo: number, hi: number): number[] {
  const t: number[] = []
  for (let k = -3; k <= 6; k++) for (const a of [1, 2, 5]) t.push(a * 10 ** k)
  const bent = t.filter((v) => v >= lo * 0.999 && v <= hi * 1.001)
  return bent.length >= 2 ? bent : [lo, hi]
}

// ---------- 14. dia: „1 dollár növekedése” ----------

export function L01IndexAbra({ p, kicsi }: { p: PalyaEredmeny; kicsi?: boolean }) {
  if (p.hiba) return <ErvenytelenUzenet magassag={kicsi ? 180 : 280}>{p.hiba}</ErvenytelenUzenet>
  const lo = Math.min(1, ...p.index) / 1.3
  const hi = Math.max(1, ...p.index) * 1.3
  return (
    <Abra cim="1 dollár növekedése, logaritmikus skálán" dias arany={kicsi ? 0.75 : 0.55} minH={kicsi ? 180 : 260} margo={{ bal: 58, jobb: kicsi ? 44 : 60, fent: 26 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, p.n]).range([0, bw])
        const y = scaleLog().domain([lo, hi]).range([bh, 0])
        const pontok = p.index.map((v, t) => [x(t), y(v)] as [number, number])
        const veg = p.index[p.n]
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={p.index.map((_, t) => t)} formaz={(v) => String(v)} cimke={kicsi ? undefined : 'Év vége'} />
            <Tengely skala={y} irany="y" poz={0} tickek={logTickek(lo, hi)} formaz={(v) => dollar(v, v < 1 ? 1 : 0)} cimke={kicsi ? undefined : 'Index ($, log skála)'} />
            <line className="dias-szaggatott" x1={0} x2={bw} y1={y(1)} y2={y(1)} />
            <Gorbe pontok={pontok} className="dias-vonal vastag" />
            <text className="dias-felirat" x={x(p.n) + 6} y={y(veg) + 4}>
              {dollar(veg)}
            </text>
          </>
        )
      }}
    </Abra>
  )
}

// ---------- Bővített: pálya + átlagpályák, azonos skálán ----------

function L01PalyaAbra({ p, domain, cim }: { p: PalyaEredmeny; domain: [number, number]; cim: string }) {
  if (p.hiba) return <ErvenytelenUzenet magassag={240}>{p.hiba}</ErvenytelenUzenet>
  return (
    <Abra cim={cim} arany={0.7} minH={220} maxH={340} margo={{ bal: 48, jobb: 16, fent: 18, lent: 34 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, p.n]).range([0, bw])
        const y = scaleLinear().domain(domain).range([bh, 0])
        const veg = p.arak[p.n]
        const kulonbseg = p.szamtaniVeg - veg
        return (
          <>
            <Tengely skala={x} irany="x" poz={bh} tickek={p.arak.map((_, t) => t)} formaz={(v) => `${v}. év`} racs={-bh} />
            <Tengely skala={y} irany="y" poz={0} tickek={4} formaz={(v) => sz(v, 0)} racs={bw} />
            <Gorbe pontok={p.szamtaniPalya.map(([t, v]) => [x(t), y(v)])} className="masodlagos" szaggatott />
            <Gorbe pontok={p.mertaniPalya.map(([t, v]) => [x(t), y(v)])} className="fokusz" />
            <Gorbe pontok={p.arak.map((v, t) => [x(t), y(v)])} className="osszesito halvanyabb" />
            {p.arak.map((v, t) => (
              <Pont key={t} x={x(t)} y={y(v)} r={4} />
            ))}
            {Math.abs(kulonbseg) > 1e-9 && (
              <>
                <line className="hiany-vonal" x1={x(p.n)} x2={x(p.n)} y1={y(p.szamtaniVeg)} y2={y(veg)} />
                <text className="mono-felirat masodlagos-szoveg" x={x(p.n) - 8} y={(y(p.szamtaniVeg) + y(veg)) / 2 + 4} textAnchor="end">
                  {kulonbseg > 0 ? '+' : ''}
                  {sz(kulonbseg, 2)}
                </text>
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

/** Előjeles vízszintes sávok a nulla körül, közös skálán. */
function AtlagSavok({ p, max }: { p: PalyaEredmeny; max: number }) {
  if (p.hiba) return null
  const sorok = [
    { cimke: 'számtani (1.2)', ertek: p.szamtani, osztaly: 'masodlagos' },
    { cimke: 'mértani (1.3)', ertek: p.mertani, osztaly: 'fokusz' },
    { cimke: 'folytonos (1.4)', ertek: p.folytonos, osztaly: 'fokusz halvany' },
  ]
  return (
    <div className="elojeles-savok">
      {sorok.map((s) => {
        const w = (Math.abs(s.ertek) / max) * 50
        return (
          <div key={s.cimke} className="elojeles-sor">
            <span className="elojeles-cimke">{s.cimke}</span>
            <span className="elojeles-sav">
              <span className="elojeles-nulla" />
              <span className={`elojeles-resz ${s.osztaly}`} style={{ left: `${s.ertek < 0 ? 50 - w : 50}%`, width: `${w}%` }} />
            </span>
            <span className="elojeles-ertek">{pct(s.ertek, 2)}</span>
          </div>
        )
      })}
    </div>
  )
}

function VonalJelmagyarazat() {
  const minta = (cls: string, szagg?: boolean) => (
    <svg width="26" height="10" aria-hidden>
      <line x1="1" x2="25" y1="5" y2="5" className={`gorbe ${cls} ${szagg ? 'szaggatott' : ''}`} />
    </svg>
  )
  return (
    <ul className="vonal-jelmagyarazat">
      <li>{minta('osszesito halvanyabb')}árfolyam</li>
      <li>{minta('masodlagos', true)}a számtani átlaggal kamatoztatva</li>
      <li>{minta('fokusz')}a mértani (= folytonos) átlaggal</li>
    </ul>
  )
}

// ---------- 30. dia: (1 + 1/m)^m → e ----------

function MSorLista({ mIdx }: { mIdx: number }) {
  const e = l01({ ...L01_ALAP, mIdx })
  return (
    <div className="m-sor-dia">
      <p className="m-sor-cim">Folytonos kamatos kamatozás (1 $, 100% éves kamat, 1 év)</p>
      <ul className="m-sor-lista">
        {e.mSor.map((x, i) => (
          <li key={x.m} className={i === mIdx ? 'aktiv' : undefined}>
            <span>{x.nev}</span>
            <span className="m-sor-keplet">
              1$ × (1 + 1/{x.m})<sup>{x.m}</sup> = {formatSzam(x.ertek, x.jegy)}$
            </span>
          </li>
        ))}
      </ul>
      <Katex latex={'P_T = P_0 \\lim_{m\\to\\infty}\\left(1+\\frac{r}{m}\\right)^{mT} = P_0 e^{r_c T}'} display />
      <p className="megjegyzes">A dián 2,6925, 2,7145 és 2,718281 áll: ezek levágott értékek, kerekítve 2,6926, 2,7146 és 2,718282.</p>
    </div>
  )
}

const HATVANY = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
const tizHatvany = (v: number) => {
  const k = Math.round(Math.log10(v))
  return k < 3 ? String(10 ** k) : `10${HATVANY[k]}`
}

function KonvergenciaAbra({ mIdx }: { mIdx: number }) {
  const e = l01({ ...L01_ALAP, mIdx })
  const v = e.valasztottM
  return (
    <Abra cim="(1 + 1/m)^m az m függvényében" arany={0.62} minH={220} maxH={320} margo={{ bal: 48, jobb: 18, fent: 18 }}>
      {({ bw, bh }) => {
        const x = scaleLog().domain([0.7, 6e7]).range([0, bw])
        const y = scaleLinear().domain([1.9, 2.82]).range([bh, 0])
        return (
          <>
            <Tengely skala={x} irany="x" poz={bh} tickek={[1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7]} formaz={tizHatvany} cimke="m" />
            <Tengely skala={y} irany="y" poz={0} tickek={[2, 2.25, 2.5, 2.75]} formaz={(t) => sz(t, 2)} racs={bw} />
            <line className="eros-vonal szaggatott-vonal" x1={0} x2={bw} y1={y(Math.E)} y2={y(Math.E)} />
            <text className="mono-felirat" x={4} y={y(Math.E) - 6}>
              e ≈ 2,71828
            </text>
            <Gorbe pontok={e.mSor.map((p) => [x(p.m), y(p.ertek)])} className="masodlagos halvanyabb" />
            {e.mSor.map((p) => (
              <Pont key={p.m} x={x(p.m)} y={y(p.ertek)} r={3} />
            ))}
            <line className="hiany-vonal" x1={x(v.m)} x2={x(v.m)} y1={y(v.ertek)} y2={y(Math.E)} />
            <Pont x={x(v.m)} y={y(v.ertek)} className="fokusz nagy" r={6} cimke={formatSzam(v.ertek, 4)} cimkeIrany={mIdx > 5 ? 'bal' : 'jobb'} />
          </>
        )
      }}
    </Abra>
  )
}

// ---------- 31. dia: P–T ábra ----------

function PTAbra({ s, nezet }: { s: L01; nezet: Nezet }) {
  const e = l01(s)
  const dias = nezet === 'dias'
  return (
    <Abra cim="Az árfolyam folytonos kamatozással: P_T = P_0 e^(r_c T)" dias={dias} arany={0.72} minH={240} maxH={340} margo={{ bal: 48, jobb: 22, fent: 22 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, 3.4]).range([0, bw])
        const pMax = Math.max(250, ...e.ptGorbek.map((g) => g.pontok[g.pontok.length - 1][1] * 1.08))
        const y = scaleLinear().domain([0, pMax]).range([bh, 0])
        const yTickek = Array.from({ length: Math.floor(pMax / 20) }, (_, k) => (k + 1) * 20)
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={dias ? [0, 1] : [0, 1, 2, 3]} formaz={(v) => String(v)} cimke="T" nyil={dias} />
            <Tengely
              skala={y}
              irany="y"
              poz={0}
              tickek={dias ? yTickek : 5}
              formaz={(v) => (dias ? (v === 100 ? '100' : '') : sz(v, 0))}
              cimke="P"
              nyil={dias}
              racs={dias ? undefined : bw}
            />
            <line className="dias-szaggatott" x1={0} x2={x(PT_TMAX)} y1={y(PT_P0)} y2={y(PT_P0)} />
            <line className="dias-szaggatott" x1={x(1)} x2={x(1)} y1={bh} y2={0} />
            {e.ptGorbek.map((g, i) => {
              const veg = g.pontok[g.pontok.length - 1]
              const kozepso = i === 1
              const cls = dias ? 'dias-vonal vastag' : kozepso ? 'fokusz' : 'masodlagos halvanyabb'
              return (
                <g key={i}>
                  <Gorbe pontok={[[x(0), y(PT_P0)], [x(veg[0]), y(veg[1])]]} className={dias ? 'dias-vonal vekony' : kozepso ? 'fokusz halvanyabb' : 'masodlagos halvanyabb'} szaggatott />
                  <Gorbe pontok={g.pontok.map(([T, P]) => [x(T), y(P)])} className={cls} />
                  {!dias && (
                    <text className={`mono-felirat ${kozepso ? 'fokusz-szoveg' : 'halvany-szoveg'}`} x={x(veg[0]) + 6} y={y(veg[1]) + 4}>
                      {pct(g.rc, 1)}
                    </text>
                  )}
                </g>
              )
            })}
            {!dias && (
              <>
                <line className="vetulet" x1={0} x2={x(1)} y1={y(e.P1)} y2={y(e.P1)} />
                <Pont x={x(1)} y={y(e.P1)} className="fokusz" r={5} />
                <text className="mono-felirat fokusz-szoveg" x={-8} y={y(e.P1) + 4} textAnchor="end">
                  {sz(e.P1, 2)}
                </text>
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

/** Lépcsős csúszka a 30. dia m-értékeire. */
function MCsuszka({ mIdx, onValtozik, onAktiv }: { mIdx: number; onValtozik: (i: number) => void; onAktiv: (b: boolean) => void }) {
  const id = useId()
  const x = M_SOR[mIdx]
  return (
    <div className="csuszka-mezo">
      <label htmlFor={id}>m, tőkésítés évente</label>
      <div className="csuszka-sor">
        <input
          id={id}
          type="range"
          min={0}
          max={M_SOR.length - 1}
          step={1}
          value={mIdx}
          aria-valuetext={`m = ${sz(x.m, 0)} (${x.nev})`}
          onChange={(ev) => onValtozik(Number(ev.target.value))}
          onPointerDown={() => onAktiv(true)}
          onPointerUp={() => onAktiv(false)}
          onFocus={() => onAktiv(true)}
          onBlur={() => onAktiv(false)}
        />
        <output htmlFor={id} className="lepcsos-ertek">
          {sz(x.m, 0)}
          <span>{x.nev}</span>
        </output>
      </div>
    </div>
  )
}

// ---------- A lecke ----------

function tanulsag(p: PalyaEredmeny): string {
  if (p.hiba) return 'javítsd az árfolyamokat: nem pozitív árfolyamból nem számolható hozam'
  const kulonbseg = (p.szamtani - p.mertani) * 100
  if (p.n >= 2 && Math.max(...p.r) - Math.min(...p.r) < 1e-6) return 'minden évben ugyanakkora a hozam, ezért a számtani és a mértani átlag egyenlő'
  if (p.szamtani > 0 && Math.abs(p.mertani) < 1e-9) return `a számtani átlag ${pct(p.szamtani, 2)}, pedig semmit sem kerestünk: ezt a mértani átlag mutatja helyesen`
  if (p.szamtani > 0 && p.mertani < 0) return 'egy átlagos évben nyertünk, összességében mégis veszítettünk: ezt csak a mértani átlag mutatja'
  if (p.n === 1) return 'egyetlen évnél a számtani és a mértani átlag ugyanaz: maga az évi hozam'
  return `a számtani átlag mindig legalább akkora, mint a mértani; itt ${sz(kulonbseg, 2)} százalékponttal nagyobb`
}

export function Lecke01() {
  const [s, setS] = useState<L01>(L01_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const e = l01(s)
  const p = e.aktiv
  const arak = s.palyak[s.aktiv]
  const aktival = (x: Param) => (b: boolean) => setAktiv(b ? x : null)
  const arakAllit = (f: (a: number[]) => number[]) =>
    setS((v) => {
      const palyak = [...v.palyak] as L01['palyak']
      palyak[v.aktiv] = f(palyak[v.aktiv])
      return { ...v, palyak }
    })

  // a bővített nézet közös skálája: a két pálya és az átlagpályák
  const jok = e.palyak.filter((x): x is Extract<PalyaEredmeny, { hiba: undefined }> => !x.hiba)
  const ertekek = jok.flatMap((x) => [...x.arak, x.szamtaniVeg])
  const domain: [number, number] = ertekek.length ? [Math.min(...ertekek) * 0.9, Math.max(...ertekek) * 1.08] : [0, 1]
  const savMax = Math.max(0.01, ...jok.flatMap((x) => [x.szamtani, x.mertani, x.folytonos].map(Math.abs)))

  return (
    <LeckeKeret
      szam={1}
      cim="Számtani, mértani és folytonos átlag"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="1.3" kiemelt={aktiv === 'arak' ? ['(1 + r_1)', '(1 + r_2)', '(1 + r_n)'] : undefined} />}
      kijelzo={
        <EloKijelzo
          cimke="Mértani átlaghozam"
          ertek={p.hiba ? '–' : pct(p.mertani, 2)}
          alcim={p.hiba ? undefined : `számtani ${pct(p.szamtani, 2)} · folytonos ${pct(p.folytonos, 2)}`}
        />
      }
      fejlecCsuszka={
        <div className="eset-valaszto">
          <span>Pálya:</span>
          <div className="szegmens" role="group" aria-label="Melyik pályát szerkeszted">
            {PALYA_NEV.map((nev, i) => (
              <button key={nev} aria-pressed={s.aktiv === i} onClick={() => setS((v) => ({ ...v, aktiv: i as 0 | 1 }))}>
                {nev} ({PALYA_FORRAS[i]})
              </button>
            ))}
          </div>
        </div>
      }
      abra={
        nezet === 'dias' ? (
          <L01IndexAbra p={p} />
        ) : (
          <>
            <div className="panel-par">
              {e.palyak.map((x, i) => (
                <figure key={i} className={s.aktiv === i ? 'panel-aktiv' : undefined}>
                  <figcaption>
                    <button type="button" className="panel-valaszto" aria-pressed={s.aktiv === i} onClick={() => setS((v) => ({ ...v, aktiv: i as 0 | 1 }))}>
                      {PALYA_NEV[i]}
                    </button>{' '}
                    · {nyil(s.palyak[i])}
                  </figcaption>
                  <L01PalyaAbra p={x} domain={domain} cim={`${PALYA_NEV[i]}: árfolyampálya és átlagpályák`} />
                  <AtlagSavok p={x} max={savMax} />
                </figure>
              ))}
            </div>
            <VonalJelmagyarazat />
          </>
        )
      }
      tanulsag={<Tanulsag>{tanulsag(p)}</Tanulsag>}
      kulcsSzamok={
        <KulcsSzamok
          sorok={
            p.hiba
              ? [{ cimke: 'számtani / mértani / folytonos', ertek: '–' }]
              : [
                  { cimke: 'évenkénti hozamok (1.1)', ertek: p.r.map((r) => pct(r, 2)).join(' · ') },
                  { cimke: 'számtani átlag (1.2)', ertek: pct(p.szamtani, 2) },
                  { cimke: 'mértani átlag (1.3)', ertek: pct(p.mertani, 2), kiemelt: true },
                  { cimke: 'folytonos hozamok (1.4)', ertek: p.rc.map((r) => pct(r, 2)).join(' · ') },
                  { cimke: 'folytonos átlag (1.4)', ertek: pct(p.folytonos, 2) },
                ]
          }
        />
      }
      bemenetek={
        <fieldset className="penzaramlasok">
          <legend>Árfolyamok (USD): {PALYA_NEV[s.aktiv].toLowerCase()}</legend>
          {arak.map((ar, i) => (
            <SzamBevitel key={i} cimke={<>P<sub>{i}</sub></>} ertek={ar} tizedes={2} egyseg="USD" onValtozik={(v) => arakAllit((a) => a.map((x, j) => (j === i ? v : x)))} onAktiv={aktival('arak')} />
          ))}
          <div className="penzaramlas-gombok">
            <button className="gomb-szoveg" disabled={arak.length >= 6} onClick={() => arakAllit((a) => [...a, a[a.length - 1]])}>
              <PlusIcon size={14} aria-hidden /> év hozzáadása
            </button>
            <button className="gomb-szoveg" disabled={arak.length <= 2} onClick={() => arakAllit((a) => a.slice(0, -1))}>
              <MinusIcon size={14} aria-hidden /> utolsó év törlése
            </button>
          </div>
        </fieldset>
      }
      onAlaphelyzet={() => setS((v) => ({ ...L01_ALAP, aktiv: v.aktiv }))}
      extra={
        <section className="lecke-kiegeszito">
          <h2>Honnan jön az e? (1. ea 30–31. dia)</h2>
          <KepletFejlec kepletId="1.4" kiemelt={aktiv === 'rc' ? ['r_c'] : undefined} />
          <div className="kiegeszito-ket-panel">
            <div>
              {nezet === 'dias' ? <MSorLista mIdx={s.mIdx} /> : <KonvergenciaAbra mIdx={s.mIdx} />}
              <MCsuszka mIdx={s.mIdx} onValtozik={(mIdx) => setS((v) => ({ ...v, mIdx }))} onAktiv={aktival('m')} />
              {nezet === 'bovitett' && (
                <p className="megjegyzes">
                  {M_SOR[s.mIdx].nev} tőkésítve 1 $-ból 1 év alatt {sz(e.valasztottM.ertek, 6)} $ lesz; e-től {sz(Math.E - e.valasztottM.ertek, 6)} választja el.
                </p>
              )}
            </div>
            <div>
              <PTAbra s={s} nezet={nezet} />
              <CsuszkaMezo
                cimke={<>r<sub>c</sub>, a középső görbe folytonos hozama</>}
                ertek={s.rc}
                min={-0.1}
                max={0.4}
                lepes={0.005}
                szazalek
                onValtozik={(rc) => setS((v) => ({ ...v, rc }))}
                onAktiv={aktival('rc')}
              />
              {nezet === 'bovitett' && (
                <p className="megjegyzes">
                  {pct(s.rc, 1)} folytonos hozammal 100-ból 1 év alatt {sz(e.P1, 2)} lesz, ez {pct(e.egyevesHozam, 2)} egyéves hozam (1.1). A görbék {pct(s.rc - PT_KOZ, 1)},{' '}
                  {pct(s.rc, 1)} és {pct(s.rc + PT_KOZ, 1)} folytonos hozamhoz tartoznak; a szaggatott egyenesek a végpontjukat kötik össze a kezdőponttal, ahogy a dián.
                </p>
              )}
            </div>
          </div>
        </section>
      }
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: 'Írj be olyan pályát, amelyen a számtani átlag pozitív, a mértani negatív.',
              kesz: e.probak[0],
              keszSzoveg: !p.hiba && `Sikerült: számtani ${pct(p.szamtani, 2)}, mértani ${pct(p.mertani, 2)}. Egy átlagos évben nyertünk, összességében veszítettünk.`,
            },
            {
              szoveg: 'Mikor egyezik a számtani és a mértani átlag? Írj be legalább kétéves pályát, ahol egyenlők.',
              kesz: e.probak[1],
              keszSzoveg: !p.hiba && `Sikerült: ha minden évben ugyanakkora a hozam, a két átlag egyenlő (${pct(p.szamtani, 2)}). A folytonos átlag ilyenkor is ln(1 + r), azaz ${pct(p.folytonos, 2)}.`,
            },
            {
              szoveg: 'Növeld m-et, amíg az érték 4 tizedesre e lesz (2,7183).',
              kesz: e.probak[2],
              keszSzoveg: `Sikerült: ${M_SOR[s.mIdx].nev} tőkésítve már ${formatSzam(e.valasztottM.ertek, 4)}. Óránként még csak 2,7181.`,
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('1.2')}>1.2</a>, <a href={link.keplet('1.3')}>1.3</a>, <a href={link.keplet('1.4')}>1.4</a> · Gyakorlás:{' '}
          <a href={link.gyakorlo('atlaghozamok')}>Átlaghozamok</a>
        </>
      }
    />
  )
}

export function Elonezet01() {
  return <L01IndexAbra p={palya(L01_NAGY)} kicsi />
}
