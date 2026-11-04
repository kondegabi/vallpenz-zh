// 3. lecke: várható hozam és szórás állapotokból (2.1–2.2).
// Diás nézet: a 2. ea 11. diája (E(r)–σ(r) sík, × pontfelhő, szemléltető) a számolt eszköz pontjával.
// Bővített: állapotonkénti oszlopok (szélesség = valószínűség, magasság = hozam), E(r) vonala és ±σ sáv,
// húzható oszloptetőkkel. Mindkét nézetben ott a 2.2 kidolgozó táblázata élőben.

import { MinusIcon, PlusIcon } from '@phosphor-icons/react'
import { scaleLinear } from 'd3-scale'
import { useMemo, useState } from 'react'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { L03_21A, L03_21B, L03_22, L03_ALAP, l03, l03Felho, type Allapot, type L03, type L03Eredmeny } from './szamitas/l03.ts'
import { Abra, NyilDef, Pont, Sav, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'p' | 'r' | null
type Ok = Extract<L03Eredmeny, { hiba: undefined }>

const ESETEK: { cim: string; nev: string; allapotok: Allapot[] }[] = [
  { cim: '2.2 példa: 20% / 80%', nev: 'A', allapotok: L03_22 },
  { cim: '2.1 példa, A: 50% / 50%', nev: 'A', allapotok: L03_21A },
  { cim: '2.1 példa, B: 50% / 50%', nev: 'B', allapotok: L03_21B },
]

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`
const kerek = (x: number) => Math.round(x * 100000) / 100000

// ---------- 2. ea 11. dia ----------

export function L03DiasAbra({ e, nev, kicsi }: { e: L03Eredmeny; nev: string; kicsi?: boolean }) {
  const felho = useMemo(() => l03Felho(), [])
  if (e.hiba !== undefined) return <ErvenytelenUzenet magassag={kicsi ? 180 : 300}>{e.hiba}</ErvenytelenUzenet>
  const xMax = Math.max(0.5, e.szoras * 1.2)
  const yMin = Math.min(0, e.E - 0.03)
  const yMax = Math.max(0.3, e.E + 0.05)
  return (
    <Abra cim="Eszközök a várható hozam – szórás síkon" dias arany={kicsi ? 0.75 : 0.62} minH={kicsi ? 180 : 280} margo={{ bal: kicsi ? 34 : 46, fent: 24, lent: 36 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, xMax]).range([0, bw])
        const y = scaleLinear().domain([yMin, yMax]).range([bh, 0])
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={[]} cimke="σ(r)" nyil />
            <Tengely skala={y} irany="y" poz={0} tickek={[]} cimke="E(r)" nyil />
            {felho.map(([s, E], i) => (
              <Pont key={i} x={x(s)} y={y(E)} jel="x" r={3.5} className="dias-pont" />
            ))}
            <line className="dias-szaggatott" x1={x(e.szoras)} x2={x(e.szoras)} y1={y(e.E)} y2={bh} />
            <line className="dias-szaggatott" x1={0} x2={x(e.szoras)} y1={y(e.E)} y2={y(e.E)} />
            <Pont x={x(e.szoras)} y={y(e.E)} className="fokusz nagy" r={kicsi ? 5 : 6} cimke={kicsi ? nev : `${nev}: σ ${pct(e.szoras, 1)}, E(r) ${pct(e.E, 1)}`} cimkeIrany={e.szoras > xMax * 0.6 ? 'bal' : 'jobb'} />
          </>
        )
      }}
    </Abra>
  )
}

// ---------- Bővített: állapotonkénti oszlopok ----------

function L03OszlopAbra({ s, e, onR, onAktiv }: { s: L03; e: L03Eredmeny; onR: (i: number, r: number) => void; onAktiv: (b: boolean) => void }) {
  if (e.hiba !== undefined) return <ErvenytelenUzenet magassag={320}>{e.hiba}</ErvenytelenUzenet>
  const rk = s.allapotok.map((a) => a.r)
  const lo = Math.min(0, ...rk, e.E - e.szoras)
  const hi = Math.max(0, ...rk, e.E + e.szoras)
  const pad = (hi - lo) * 0.14 || 0.05
  let kum = 0
  const oszlopok = s.allapotok.map((a) => {
    const x0 = kum
    kum += a.p
    return { ...a, x0, x1: kum }
  })
  return (
    <Abra cim="Állapotonkénti hozamok: az oszlop szélessége a valószínűség, magassága a hozam" arany={0.56} minH={300} margo={{ bal: 48, jobb: 78, fent: 30, lent: 40 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, 1]).range([0, bw])
        const y = scaleLinear().domain([lo - pad, hi + pad]).range([bh, 0])
        return (
          <>
            <Sav x0={0} x1={bw} y0={y(e.E + e.szoras)} y1={y(e.E - e.szoras)} />
            <Tengely skala={y} irany="y" poz={0} tickek={5} formaz={pctTengely} racs={bw} />
            {oszlopok.map((o, i) => {
              const kx = (x(o.x0) + x(o.x1)) / 2
              const elteres = o.r - e.E
              return (
                <g key={i}>
                  <rect className="allapot-oszlop" x={x(o.x0) + 2} width={Math.max(0, x(o.x1) - x(o.x0) - 4)} y={Math.min(y(0), y(o.r))} height={Math.abs(y(0) - y(o.r))} />
                  {Math.abs(elteres) > 1e-9 && <line className="hiany-vonal" x1={kx} x2={kx} y1={y(e.E)} y2={y(o.r)} />}
                  {Math.abs(elteres) > 1e-9 && (
                    <text className="mono-felirat" x={kx + 6} y={(y(e.E) + y(o.r)) / 2 + 4}>
                      {elteres > 0 ? '+' : ''}
                      {pct(elteres, 1)}
                    </text>
                  )}
                  <text className="mono-felirat" x={kx} y={bh + 30} textAnchor="middle">
                    p{i + 1} = {pct(o.p, 1)}
                  </text>
                  <Pont
                    x={kx}
                    y={y(o.r)}
                    r={6}
                    className="masodlagos"
                    cimke={`r${'₁₂₃₄'[i]} = ${pct(o.r, 1)}`}
                    cimkeIrany="fent"
                    onHuz={(_, py) => (onAktiv(true), onR(i, Math.round(y.invert(py) * 200) / 200))}
                    onLep={(_, dy) => (onAktiv(true), onR(i, kerek(o.r + dy * 0.005)))}
                    ariaLabel={`${i + 1}. állapot hozama: ${pct(o.r, 1)}`}
                  />
                </g>
              )
            })}
            <line className="tengelyvonal" x1={0} x2={bw} y1={y(0)} y2={y(0)} />
            <line className="eros-vonal fokusz-vonal" x1={0} x2={bw} y1={y(e.E)} y2={y(e.E)} />
            <SvgMatek szoveg={`E(r) ${pct(e.E, 2)}`} className="mono-felirat fokusz-szoveg" x={bw + 6} y={y(e.E) + 4} />
            <text className="mono-felirat" x={bw + 6} y={y(e.E + e.szoras) + 4}>
              +σ
            </text>
            <text className="mono-felirat" x={bw + 6} y={y(e.E - e.szoras) + 4}>
              −σ
            </text>
          </>
        )
      }}
    </Abra>
  )
}

// ---------- A 2.2 kidolgozó táblázata ----------

function KidolgozoTabla({ s, e }: { s: L03; e: Ok }) {
  return (
    <section className="lecke-kiegeszito">
      <h2>A kidolgozás a dia táblázatával (2.2)</h2>
      <p className="levezetes-sor">
        E(r) = {s.allapotok.map((a) => `${sz(a.p, 4)} × ${pct(a.r, 2)}`).join(' + ')} = <strong>{pct(e.E, 2)}</strong>
      </p>
      <div className="tabla-keret">
        <table className="kidolgozo-tabla">
          <thead>
            <tr>
              <th>valósz. (1)</th>
              <th>r (2)</th>
              <th>r − E(r) (3)</th>
              <th>(r − E(r))² (4)</th>
              <th>(1) × (4)</th>
            </tr>
          </thead>
          <tbody>
            {e.sorok.map((x, i) => (
              <tr key={i}>
                <td>{pct(x.p, 2)}</td>
                <td>{pct(x.r, 2)}</td>
                <td>{pct(x.elteres, 2)}</td>
                <td>{sz(x.negyzet, 6)}</td>
                <td>{sz(x.sulyozott, 6)}</td>
              </tr>
            ))}
            <tr className="osszeg-sor">
              <td colSpan={3} />
              <td>σ² =</td>
              <td>{sz(e.variancia, 6)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="levezetes-sor">
        σ(r) = √{sz(e.variancia, 6)} = {sz(e.szoras, 4)} = <strong>{pct(e.szoras, 2)}</strong>
      </p>
    </section>
  )
}

// ---------- A lecke ----------

function tanulsag(e: Ok): string {
  if (e.szoras < 1e-9) return 'minden állapotban ugyanannyi a hozam: nincs eltérés a várhatótól, ezért nincs kockázat'
  const leg = e.sorok.reduce((m, x) => (Math.abs(x.elteres) > Math.abs(m.elteres) ? x : m))
  return `a várhatótól legjobban eltérő állapot (${pct(leg.r, 1)}, eltérés ${pct(leg.elteres, 1)}) csak ${pct(leg.p, 0)} valószínűséggel számít bele a σ²-be`
}

export function Lecke03() {
  const [s, setS] = useState<L03>(L03_ALAP)
  const [nev, setNev] = useState('A')
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const e = l03(s)
  const ok = e.hiba === undefined ? e : undefined
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const allit = (i: number, x: Partial<Allapot>) => setS((v) => ({ allapotok: v.allapotok.map((a, j) => (j === i ? { ...a, ...x } : a)) }))
  const ketto = s.allapotok.length === 2
  const tobbi = s.allapotok.slice(0, -1).reduce((x, a) => x + a.p, 0)
  const kiegeszitheto = !ok && tobbi <= 1 && s.allapotok.every((a) => a.p >= 0 || a === s.allapotok[s.allapotok.length - 1])
  const kiemeles = aktiv === 'p' ? ['p_i'] : aktiv === 'r' ? ['r_i'] : undefined

  return (
    <LeckeKeret
      szam={3}
      cim="Várható hozam és szórás állapotokból"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="2.2" kiemelt={kiemeles} />}
      kijelzo={<EloKijelzo cimke="σ(r), szórás" ertek={ok ? pct(ok.szoras, 2) : '–'} alcim={ok ? `E(r) ${pct(ok.E, 2)} · σ² ${sz(ok.variancia, 6)}` : undefined} />}
      fejlecCsuszka={
        <>
          <div className="eset-valaszto">
            <span>Diás példa:</span>
            <div className="szegmens" role="group" aria-label="Diás példa">
              {ESETEK.map((x) => (
                <button key={x.cim} aria-pressed={s.allapotok === x.allapotok} onClick={() => (setS({ allapotok: x.allapotok }), setNev(x.nev))}>
                  {x.cim}
                </button>
              ))}
            </div>
          </div>
          {ketto && ok?.p1Gorbe && (
            <FejlecCsuszka
              cimke="p₁, az 1. állapot valószínűsége (p₂ = 1 − p₁)"
              ertek={s.allapotok[0].p}
              min={0}
              max={1}
              lepes={0.01}
              formaz={(p) => `${pct(p, 0)} / ${pct(1 - p, 0)}`}
              skalaPontok={[0, 0.2, 0.5, 0.8, 1].map((p) => ({ ertek: p, cimke: pct(p, 0), alcimke: `σ ${pct(ok.p1Gorbe![Math.round(p * 100)][1], 1)}` }))}
              onValtozik={(p) => setS((v) => ({ allapotok: [{ ...v.allapotok[0], p: kerek(p) }, { ...v.allapotok[1], p: kerek(1 - p) }] }))}
              onAktiv={aktival('p')}
            />
          )}
        </>
      }
      abra={
        nezet === 'dias' ? (
          <L03DiasAbra e={e} nev={nev} />
        ) : (
          <L03OszlopAbra s={s} e={e} onR={(i, r) => allit(i, { r })} onAktiv={aktival('r')} />
        )
      }
      tanulsag={ok && <Tanulsag>{tanulsag(ok)}</Tanulsag>}
      kulcsSzamok={
        <KulcsSzamok
          sorok={
            ok
              ? [
                  { cimke: 'E(r), várható hozam (2.1)', ertek: pct(ok.E, 2) },
                  { cimke: 'σ², variancia (2.2)', ertek: sz(ok.variancia, 6) },
                  { cimke: 'σ, szórás (2.2)', ertek: pct(ok.szoras, 2), kiemelt: true },
                ]
              : [{ cimke: 'a valószínűségek összege', ertek: pct(e.osszeg, 2) }]
          }
        />
      }
      bemenetek={
        <>
          <fieldset className="penzaramlasok allapot-tabla">
            <legend>Állapotok</legend>
            {s.allapotok.map((a, i) => (
              <div key={i} className="eszkoz-sor">
                <SzamBevitel cimke={<>p<sub>{i + 1}</sub></>} ertek={a.p} szazalek onValtozik={(p) => allit(i, { p })} onAktiv={aktival('p')} />
                <SzamBevitel cimke={<>r<sub>{i + 1}</sub></>} ertek={a.r} szazalek onValtozik={(r) => allit(i, { r })} onAktiv={aktival('r')} />
              </div>
            ))}
            <div className="penzaramlas-gombok">
              <button className="gomb-szoveg" disabled={s.allapotok.length >= 4} onClick={() => setS((v) => ({ allapotok: [...v.allapotok, { p: 0, r: v.allapotok[v.allapotok.length - 1].r }] }))}>
                <PlusIcon size={14} aria-hidden /> állapot hozzáadása
              </button>
              <button
                className="gomb-szoveg"
                disabled={s.allapotok.length <= 2}
                onClick={() =>
                  setS((v) => {
                    // a törölt állapot valószínűsége az előzőhöz kerül, így az összeg 1 marad
                    const utolso = v.allapotok[v.allapotok.length - 1]
                    const maradek = v.allapotok.slice(0, -1)
                    return { allapotok: maradek.map((a, j) => (j === maradek.length - 1 ? { ...a, p: kerek(a.p + utolso.p) } : a)) }
                  })
                }
              >
                <MinusIcon size={14} aria-hidden /> utolsó állapot törlése
              </button>
            </div>
          </fieldset>
          {kiegeszitheto && (
            <button
              className="gomb gomb-masodlagos"
              onClick={() => setS((v) => ({ allapotok: v.allapotok.map((a, j) => (j === v.allapotok.length - 1 ? { ...a, p: kerek(1 - tobbi) } : a)) }))}
            >
              Az utolsó valószínűség legyen {pct(1 - tobbi, 2)} (összeg = 1)
            </button>
          )}
          {nezet === 'bovitett' && <p className="megjegyzes">Az oszlopok tetejét húzhatod is (vagy fókuszálj rájuk, és használd a nyilakat).</p>}
          {nezet === 'dias' && <p className="megjegyzes">A × pontfelhő szemléltető (fix seed), csak a kiemelt pont számolt.</p>}
        </>
      }
      onAlaphelyzet={() => (setS(L03_ALAP), setNev('A'))}
      extra={ok && <KidolgozoTabla s={s} e={ok} />}
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: 'Két állapotnál csak a valószínűségeket mozgasd (a fejléc csúszkájával): hol a legnagyobb σ?',
              kesz: !!ok?.probak[0],
              keszSzoveg: ok && `Sikerült: 50% / 50%-nál σ = ${pct(ok.szoras, 2)}, ez a legnagyobb. Két állapotnál σ = |r₁ − r₂| · √(p₁ · p₂) (levezetés: 2.2), és p₁ · p₂ itt a legnagyobb.`,
            },
            {
              szoveg: 'A 10% / 30% hozamokkal állítsd be, hogy E(r) = 20% legyen.',
              kesz: !!ok?.probak[1],
              keszSzoveg: 'Sikerült: 50% / 50% kell hozzá. Ez a 2.1 példa A részvénye, szórása 10%.',
            },
            {
              szoveg: 'Állíts be olyan állapotokat, amelyeknél σ = 0.',
              kesz: !!ok?.probak[2],
              keszSzoveg: 'Sikerült: ha minden állapotban ugyanannyi a hozam, nincs eltérés a várhatótól, tehát nincs kockázat.',
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('2.1')}>2.1</a>, <a href={link.keplet('2.2')}>2.2</a> · Gyakorlás:{' '}
          <a href={link.gyakorlo('allapot-egy')}>Várható hozam és szórás állapotokból</a>
        </>
      }
    />
  )
}

export function Elonezet03() {
  return <L03DiasAbra e={l03(L03_ALAP)} nev="A" kicsi />
}
