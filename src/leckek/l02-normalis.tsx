// 2. lecke: normális eloszlás és szigma-szabályok (2.4).
// Diás nézet: az 1. ea 26. diája (Ross 12.11): haranggörbe, −3σ … +3σ, a sávhatárok értéke és a
// 68% / 95% / 99%-os keretek. Bővített: az 1. ea 21. diájának gyakorisági ábrája élő, szemléltető
// változatban (97 szimulált év, fix seed), illesztett haranggörbével és kiemelt sávval.

import { scaleLinear } from 'd3-scale'
import { useState } from 'react'
import { normalisSuruseg } from '../calc/kockazat.ts'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { formatSzazalek } from '../lib/szam.ts'
import { link } from '../router.ts'
import { L02_ALAP, L02_EVEK, l02, type L02 } from './szamitas/l02.ts'
import { Abra, Gorbe, Sav, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'E' | 'sigma' | null
type K = 1 | 2 | 3

/** egy tizedesjegy, a dia alakjában (12,0%) */
const p1 = (v: number) => formatSzazalek(v, 1)
const SZAZALEK: Record<K, string> = { 1: '68%', 2: '95%', 3: '99%' }
const sigmaFelirat = (k: number) => (k === 0 ? '0' : `${k > 0 ? '+' : '−'}${Math.abs(k)}σ`)

/** Két sor felirat az x tengely alatt: a szigma-többszörös és a hozzá tartozó hozam. */
function SzigmaTickek({ x, E, sigma, y0, dias, kicsi }: { x: (v: number) => number; E: number; sigma: number; y0: number; dias: boolean; kicsi?: boolean }) {
  // szűk helyen a páratlan szigma-többszörösök értéke egy sorral lejjebb kerül, hogy ne érjenek össze
  const szuk = x(E + sigma) - x(E) < 56
  return (
    <g className={dias ? 'szigma-tickek dias' : 'szigma-tickek'} aria-hidden>
      {[-3, -2, -1, 0, 1, 2, 3].map((k) => {
        const v = E + k * sigma
        return (
          <g key={k} transform={`translate(${x(v)},${y0})`}>
            <line className="tick" y2={5} />
            <text className="szigma-felirat" y={19} textAnchor="middle">
              {sigmaFelirat(k)}
            </text>
            {!kicsi && (
              <text className="tick-felirat" y={szuk && k % 2 !== 0 ? 50 : 35} textAnchor="middle">
                {p1(v)}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** A görbe alatti terület az [a, b] szakaszon. */
function terulet(gorbe: [number, number][], a: number, b: number, x: (v: number) => number, y: (v: number) => number, E: number, sigma: number) {
  const bent = gorbe.filter(([v]) => v >= a && v <= b)
  const pontok: [number, number][] = [[a, normalisSuruseg(a, E, sigma)], ...bent, [b, normalisSuruseg(b, E, sigma)]]
  return `M${x(a)},${y(0)}L${pontok.map(([v, f]) => `${x(v)},${y(f)}`).join('L')}L${x(b)},${y(0)}Z`
}

// ---------- 26. dia ----------

export function L02DiasAbra({ s, kicsi }: { s: L02; kicsi?: boolean }) {
  const e = l02(s)
  if (e.hiba) return <ErvenytelenUzenet magassag={kicsi ? 180 : 300}>{e.hiba}</ErvenytelenUzenet>
  const { E, sigma } = s
  const csucs = normalisSuruseg(E, E, sigma)
  return (
    <Abra cim="Normális eloszlás a szigma-sávokkal" dias arany={kicsi ? 0.75 : 0.5} minH={kicsi ? 180 : 280} margo={{ bal: 16, jobb: 16, fent: 26, lent: kicsi ? 30 : 76 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([E - 3.7 * sigma, E + 3.7 * sigma]).range([0, bw])
        const y = scaleLinear().domain([0, csucs * 1.08]).range([bh, 0])
        const f = (k: number) => normalisSuruseg(E + k * sigma, E, sigma)
        const doboz = (k: number) => (
          <rect className={k === 1 ? 'dias-doboz dias-doboz-68' : 'dias-doboz'} x={x(E - k * sigma)} y={y(f(k))} width={x(E + k * sigma) - x(E - k * sigma)} height={bh - y(f(k))} />
        )
        return (
          <>
            <path className="dias-terulet-kozep" d={terulet(e.gorbe, E - 2 * sigma, E + 2 * sigma, x, y, E, sigma)} />
            <path className="dias-terulet-farok" d={terulet(e.gorbe, E - 3 * sigma, E - 2 * sigma, x, y, E, sigma)} />
            <path className="dias-terulet-farok" d={terulet(e.gorbe, E + 2 * sigma, E + 3 * sigma, x, y, E, sigma)} />
            {doboz(1)}
            {doboz(2)}
            {doboz(3)}
            <line className="dias-szaggatott" x1={x(E)} x2={x(E)} y1={bh} y2={y(csucs)} />
            <Gorbe pontok={e.gorbe.filter(([v]) => v >= x.domain()[0] && v <= x.domain()[1]).map(([v, fv]) => [x(v), y(fv)])} className="dias-vonal vastag" />
            <line className="tengelyvonal" x1={0} x2={bw} y1={bh} y2={bh} />
            <SzigmaTickek x={x} E={E} sigma={sigma} y0={bh} dias kicsi={kicsi} />
            {!kicsi && (
              <>
                <text className="dias-felirat dias-szazalek" x={x(E)} y={y(f(1)) + 18} textAnchor="middle">
                  68%
                </text>
                <text className="dias-felirat dias-szazalek" x={x(E)} y={y(f(2)) - 4} textAnchor="middle">
                  95%
                </text>
                <text className="dias-felirat dias-szazalek" x={x(E)} y={y(f(3)) - 3} textAnchor="middle">
                  99%
                </text>
                <text className="dias-felirat" x={x(E)} y={-10} textAnchor="middle">
                  Valószínűség
                </text>
                <text className="dias-felirat" x={bw / 2} y={bh + 70} textAnchor="middle">
                  Hozam (%)
                </text>
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

// ---------- 21. dia élő változata ----------

function L02GyakorisagAbra({ s, k }: { s: L02; k: K }) {
  const e = l02(s)
  if (e.hiba) return <ErvenytelenUzenet magassag={320}>{e.hiba}</ErvenytelenUzenet>
  const { E, sigma } = s
  const w = e.rekeszek[0].felso - e.rekeszek[0].also
  // a haranggörbe darabszámra skálázva: N · rekeszszélesség · sűrűség
  const skala = L02_EVEK * w
  const maxDb = Math.max(...e.rekeszek.map((r) => r.db), skala * normalisSuruseg(E, E, sigma))
  const sav = e.savok[k - 1]
  return (
    <Abra cim="Szemléltető gyakorisági ábra illesztett haranggörbével" arany={0.52} minH={300} margo={{ bal: 40, jobb: 16, fent: 28, lent: 62 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([E - 4 * sigma, E + 4 * sigma]).range([0, bw])
        const y = scaleLinear().domain([0, Math.ceil(maxDb * 1.1)]).range([bh, 0])
        const cellaH = Math.max(1, y(0) - y(1) - 1.5)
        return (
          <>
            <Sav x0={x(sav.also)} x1={x(sav.felso)} y0={0} y1={bh} className="sav-kiemelt" />
            {e.savok
              .filter((v) => v.k !== k)
              .flatMap((v) => [v.also, v.felso])
              .map((h) => (
                <line key={h} className="savhatar" x1={x(h)} x2={x(h)} y1={0} y2={bh} />
              ))}
            <Tengely skala={y} irany="y" poz={0} tickek={y.ticks(4).filter((t) => Number.isInteger(t))} formaz={(t) => sz(t, 0)} racs={bw} />
            {e.rekeszek.map((r, j) => {
              const bent = r.also >= sav.also - 1e-12 && r.felso <= sav.felso + 1e-12
              return Array.from({ length: r.db }, (_, i) => (
                <rect
                  key={`${j}-${i}`}
                  className={bent ? 'ev-cella bent' : 'ev-cella'}
                  x={x(r.also) + 1}
                  y={y(i + 1) + 0.75}
                  width={Math.max(1, x(r.felso) - x(r.also) - 2)}
                  height={cellaH}
                />
              ))
            })}
            <Gorbe pontok={e.gorbe.map(([v, f]) => [x(v), y(skala * f)])} className="osszesito" />
            <line className="tengelyvonal" x1={0} x2={bw} y1={bh} y2={bh} />
            <SzigmaTickek x={x} E={E} sigma={sigma} y0={bh} dias={false} />
            <text className="mono-felirat fokusz-szoveg" x={x((sav.also + sav.felso) / 2)} y={-10} textAnchor="middle">
              ±{k}σ: {SZAZALEK[k]} (kb.)
            </text>
            <text className="mono-felirat" x={-4} y={-10} textAnchor="start">
              év
            </text>
          </>
        )
      }}
    </Abra>
  )
}

// ---------- A lecke ----------

function tanulsag(e: Exclude<ReturnType<typeof l02>, { hiba: string }>, k: K): string {
  const v = e.savok[k - 1]
  const alap = `a hozamok kb. ${SZAZALEK[k]}-a esik ${p1(v.also)} és ${p1(v.felso)} közé; a sáv szélessége ${2 * k}σ, a várható hozamtól nem függ`
  return e.savok[1].also >= 0 && k === 2 ? `${alap}, és most a 95%-os sávban nincs negatív hozam` : alap
}

export function Lecke02() {
  const [s, setS] = useState<L02>(L02_ALAP)
  const [k, setK] = useState<K>(2)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const e = l02(s)
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const set = (p: Partial<L02>) => setS((v) => ({ ...v, ...p }))
  const v = e.hiba ? undefined : e.savok[k - 1]
  const kiemeles = aktiv === 'sigma' ? ['1σ', '2σ', '3σ'] : aktiv === 'E' ? ['várható érték'] : undefined

  return (
    <LeckeKeret
      szam={2}
      cim="Normális eloszlás és szigma-szabályok"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="2.4" kiemelt={kiemeles} />}
      kijelzo={
        <EloKijelzo
          cimke={`${SZAZALEK[k]}-os sáv (±${k}σ)`}
          ertek={v ? `${p1(v.also)} … ${p1(v.felso)}` : '–'}
          alcim={v ? `szélessége ${sz(v.szelesseg * 100, 1)} százalékpont` : undefined}
        />
      }
      fejlecCsuszka={
        <FejlecCsuszka
          cimke="σ, a hozam szórása"
          ertek={Math.max(0.01, s.sigma)}
          min={0.01}
          max={0.5}
          lepes={0.001}
          formaz={(x) => p1(x)}
          skalaPontok={[
            { ertek: 0.099, cimke: '9,9%', alcimke: 'a fele' },
            { ertek: 0.198, cimke: '19,8%', alcimke: 'diás példa' },
            { ertek: 0.396, cimke: '39,6%', alcimke: 'a duplája' },
          ]}
          onValtozik={(sigma) => set({ sigma })}
          onAktiv={aktival('sigma')}
        />
      }
      abra={nezet === 'dias' ? <L02DiasAbra s={s} /> : <L02GyakorisagAbra s={s} k={k} />}
      tanulsag={!e.hiba && <Tanulsag>{tanulsag(e, k)}</Tanulsag>}
      kulcsSzamok={
        <KulcsSzamok
          sorok={
            e.hiba
              ? [{ cimke: 'sávok', ertek: '–' }]
              : [
                  ...e.savok.map((x) => ({ cimke: `${SZAZALEK[x.k]}-os sáv (±${x.k}σ)`, ertek: `${p1(x.also)} … ${p1(x.felso)}`, kiemelt: x.k === k })),
                  ...(nezet === 'bovitett'
                    ? [
                        {
                          cimke: `szimulált évek (±${k}σ)`,
                          ertek: `${Math.round(e.mintaArany[k - 1] * L02_EVEK)} / ${L02_EVEK} (${pct(e.mintaArany[k - 1], 0)})`,
                        },
                      ]
                    : []),
                ]
          }
        />
      }
      bemenetek={
        <>
          <div className="eset-valaszto sav-valaszto">
            <span>Sáv:</span>
            <div className="szegmens" role="group" aria-label="Kiemelt sáv">
              {([1, 2, 3] as const).map((x) => (
                <button key={x} aria-pressed={k === x} onClick={() => setK(x)}>
                  ±{x}σ
                </button>
              ))}
            </div>
          </div>
          <CsuszkaMezo cimke="E(r), várható hozam" ertek={s.E} min={-0.2} max={0.4} lepes={0.001} szazalek onValtozik={(E) => set({ E })} onAktiv={aktival('E')} />
          <SzamBevitel cimke="σ, szórás" ertek={s.sigma} szazalek onValtozik={(sigma) => set({ sigma })} onAktiv={aktival('sigma')} />
          {nezet === 'bovitett' && (
            <p className="megjegyzes">
              Szemléltető: {L02_EVEK} szimulált év (fix seed, a 21. dia 1926–2022-es időszakának hosszával), nem a valódi adatsor. E(r) és σ csak átskálázza a mintát, ezért a sávokba
              eső évek száma nem változik. A görbe a normális eloszlás sűrűségfüggvénye, darabszámra skálázva.
            </p>
          )}
        </>
      }
      onAlaphelyzet={() => (setS(L02_ALAP), setK(2))}
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: 'Duplázd meg σ-t (19,8% → 39,6%). Mi lesz a 95%-os sáv szélességével?',
              kesz: !e.hiba && e.probak[0],
              keszSzoveg: 'Sikerült: a 95%-os sáv szélessége is duplázódik, 79,2-ről 158,4 százalékpontra, mert a sáv 4σ széles.',
            },
            {
              szoveg: 'Állítsd be úgy, hogy a −1σ határ éppen 0% legyen.',
              kesz: !e.hiba && e.probak[1],
              keszSzoveg: `Sikerült: ehhez a várható hozamnak a szórással kell egyenlőnek lennie (E(r) − 1σ = 0), most ${p1(s.E)} és ${p1(s.sigma)}.`,
            },
            {
              szoveg: 'Állítsd be úgy, hogy a 95%-os sávban ne legyen negatív hozam.',
              kesz: !e.hiba && e.probak[2],
              keszSzoveg: 'Sikerült: ehhez a várható hozamnak legalább 2σ-nak kell lennie (az alsó határ E(r) − 2σ ≥ 0).',
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('2.4')}>2.4</a>, <a href={link.keplet('2.3')}>2.3</a> · Gyakorlás: <a href={link.gyakorlo('historikus-szoras')}>Historikus szórás</a>
        </>
      }
    />
  )
}

export function Elonezet02() {
  return <L02DiasAbra s={L02_ALAP} kicsi />
}
