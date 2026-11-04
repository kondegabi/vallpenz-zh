// 5. lecke: diverzifikáció (3.5, 4.3).
// Diás nézet: a 3. ea 8. diája (σ(r_P) az n függvényében, kapcsos zárójelekkel), a Ross-példánál a
// 10. dia számaival. Bővített: kiemelt diverzifikálható sáv, varianciasávok, és szemléltető
// hozampályák panelpárban (egy eszköz kontra n elemű portfólió, azonos skálán).

import { scaleLinear } from 'd3-scale'
import { useMemo, useState } from 'react'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { L05_ALAP, L05_ESZKOZOK, L05_IDOSZAKOK, L05_KT, L05_ROSS, l05, l05Palyak, sigmaP, type L05, type L05Eredmeny } from './szamitas/l05.ts'
import { Abra, Gorbe, NyilDef, Pont, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KomponensSavok, KulcsSzamok, PanelPar, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { SzimulaltVonalak } from './ui/szimulalt.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'n' | 'sigma' | 'k' | null
type Ok = Extract<L05Eredmeny, { hiba: undefined }>

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`

/** Függőleges kapcsos zárójel (y1 fent, y2 lent), a csúcsa jobbra mutat. */
function kapcsos(x: number, y1: number, y2: number, w = 7): string {
  const k = (y1 + y2) / 2
  return `M${x},${y1} q${w},0 ${w},${w} L${x + w},${k - w} q0,${w} ${w},${w} q-${w},0 -${w},${w} L${x + w},${y2 - w} q0,${w} -${w},${w}`
}

export function L05Abra({ s, e, nezet, kicsi }: { s: L05; e: L05Eredmeny; nezet: Nezet; kicsi?: boolean }) {
  if (e.hiba !== undefined) return <ErvenytelenUzenet magassag={kicsi ? 180 : 300}>{e.hiba}</ErvenytelenUzenet>
  const dias = nezet === 'dias'
  const ross = s.eset === 'ross'
  const nMax = Math.min(e.nMax, Math.max(40, s.n))
  return (
    <Abra cim="A portfólió szórása az elemszám függvényében" dias={dias} arany={kicsi ? 0.75 : 0.58} minH={kicsi ? 180 : 290} margo={{ bal: dias && !ross ? 30 : 52, jobb: 20, fent: 24, lent: 36 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, nMax + 1]).range([0, bw])
        const y = scaleLinear().domain([0, e.egy * 1.1]).range([bh, 0])
        const pontok = e.gorbe.filter(([n]) => n <= nMax).map(([n, v]) => [x(n), y(v)] as [number, number])
        const jelolt = [1, 2, 4, 10, 25, nMax].filter((n, i, t) => n <= nMax && t.indexOf(n) === i)
        const xs = x(s.n)
        const ys = y(e.szoras)
        const veg = pontok[pontok.length - 1]
        const terulet = `M${pontok.map((p) => p.join(',')).join('L')}L${veg[0]},${y(e.szint)}L${pontok[0][0]},${y(e.szint)}Z`
        return (
          <>
            <NyilDef />
            {!dias && (
              <>
                <path className="terulet-diverzifikalhato" d={terulet} />
                <rect className="terulet-szisztematikus" x={0} y={y(e.szint)} width={bw} height={bh - y(e.szint)} />
              </>
            )}
            <Tengely
              skala={x}
              irany="x"
              poz={bh}
              tickek={dias && !ross ? [] : [1, 10, 20, 30, 40, ...(nMax > 40 ? [nMax] : [])].filter((n) => n <= nMax)}
              formaz={(v) => String(v)}
              cimke="n"
              nyil={dias}
            />
            <Tengely
              skala={y}
              irany="y"
              poz={0}
              tickek={dias ? (ross ? [e.egy, e.szoras, e.szint] : []) : 5}
              formaz={(v) => (dias ? sz(v * 100, 1) : pctTengely(v))}
              cimke="σ(r_P)"
              nyil={dias}
              racs={dias ? undefined : bw}
            />
            <line className="dias-szaggatott" x1={0} x2={x(1) + 8} y1={y(e.egy)} y2={y(e.egy)} />
            <line className={dias ? 'dias-szaggatott' : 'szint-vonal'} x1={0} x2={bw} y1={y(e.szint)} y2={y(e.szint)} />
            <Gorbe pontok={pontok} className={dias ? 'dias-vonal vastag' : 'osszesito'} />
            {jelolt.map((n) => (
              <Pont key={n} x={x(n)} y={y(sigmaP(n, s.sigma, s.k))} r={dias ? 3.5 : 3} className={dias ? 'dias-pont tomor' : ''} />
            ))}
            {!kicsi && (
              <>
                <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={xs} x2={xs} y1={ys} y2={bh} />
                <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={0} x2={xs} y1={ys} y2={ys} />
              </>
            )}
            <Pont x={xs} y={ys} r={6} className="fokusz nagy" cimke={kicsi ? undefined : dias ? `n = ${s.n}` : `n = ${s.n}: ${pct(e.szoras, 2)}`} cimkeIrany="fent" />
            {dias && !kicsi && e.szint > 0 && (
              <>
                <path className="kapcsos" d={kapcsos(x(1.6), y(e.egy), y(e.szint))} />
                <text className="dias-felirat dolt" x={x(1.6) + 16} y={y(e.egy) - 6}>
                  diverzifikálható kockázat
                </text>
                <path className="kapcsos" d={kapcsos(x(nMax * 0.25), y(e.szint) + 2, bh - 2)} />
                {/* a dián is két sorban */}
                <text className="dias-felirat dolt" x={x(nMax * 0.25) + 18} y={(y(e.szint) + bh) / 2 - 4}>
                  <tspan>nem-diverzifikálható (szisztematikus)</tspan>
                  <tspan x={x(nMax * 0.25) + 18} dy={16}>
                    kockázat
                  </tspan>
                </text>
                <text className="dias-felirat dolt" x={veg[0]} y={y(e.szint) - 52} textAnchor="end">
                  <tspan>(közelítően) hatékony</tspan>
                  <tspan x={veg[0]} dy={15}>
                    portfólió
                  </tspan>
                </text>
                <line className="dias-pontozott-nyil" x1={veg[0] - 24} y1={y(e.szint) - 32} x2={veg[0] - 4} y2={veg[1] - 6} markerEnd="url(#lecke-nyil)" />
              </>
            )}
            {!dias && !kicsi && e.szint > 0 && (
              <>
                <text className="mono-felirat fokusz-szoveg" x={bw - 4} y={y(e.szint) - 8} textAnchor="end">
                  diverzifikálható
                </text>
                <SvgMatek szoveg={`szisztematikus: σ√k = ${pct(e.szint, 1)}`} className="mono-felirat" x={bw - 4} y={y(e.szint) + 18} textAnchor="end" />
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

/** Szemléltető pályák: sok halvány eszköz, rajtuk egy erős vonal; közös y skálán. */
function PalyaAbra({ halvanyak, eros, domain, cim }: { halvanyak: number[][]; eros: number[]; domain: [number, number]; cim: string }) {
  return (
    <Abra cim={cim} arany={0.62} minH={200} maxH={280} margo={{ bal: 44, jobb: 10, fent: 10, lent: 28 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, L05_IDOSZAKOK - 1]).range([0, bw])
        const y = scaleLinear().domain(domain).range([bh, 0])
        const vonal = (r: number[]) => r.map((v, t) => [x(t), y(v)] as [number, number])
        return (
          <>
            <Tengely skala={y} irany="y" poz={0} tickek={4} formaz={pctTengely} racs={bw} />
            <Tengely skala={x} irany="x" poz={bh} tickek={[0, 10, 20, 30]} formaz={(v) => `${v}.`} />
            <SzimulaltVonalak halvanyak={halvanyak.map(vonal)} eros={vonal(eros)} erosOsztaly="fokusz-vonal" />
          </>
        )
      }}
    </Abra>
  )
}

function tanulsag(s: L05, e: Ok): string {
  if (s.k <= 0) return 'korreláció nélkül (vagy negatívval) nincs alsó szint: elég elemmel a teljes kockázat eltüntethető'
  const tobb = (e.szoras - e.szint) * 100
  return `n = ${s.n} elemnél a szórás ${sz(tobb, 1)} százalékponttal van a nem diverzifikálható szint fölött; ez a rész több elemmel eltűnik, a ${pct(e.szint, 1)} megmarad`
}

export function Lecke05() {
  const [s, setS] = useState<L05>(L05_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const e = l05(s)
  const ok = e.hiba === undefined ? e : undefined
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const set = (p: Partial<L05>) => setS((v) => ({ ...v, ...p }))
  const palyak = useMemo(() => (nezet === 'bovitett' && ok ? l05Palyak(s) : null), [s, nezet, ok])
  const pDomain: [number, number] = useMemo(() => {
    if (!palyak) return [0, 1]
    const mind = palyak.eszkozok.flat()
    return [Math.min(...mind), Math.max(...mind)]
  }, [palyak])
  const kiemeles = aktiv === 'sigma' ? ['\\sigma^2(r_i)', '\\sigma(r_i)', '\\sigma(r_j)'] : aktiv === 'k' ? ['k_{i,j}'] : aktiv === 'n' ? ['a_i^2', 'a_i a_j'] : undefined

  return (
    <LeckeKeret
      szam={5}
      cim="Diverzifikáció"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="3.5" kiemelt={kiemeles} />}
      kijelzo={
        <EloKijelzo
          cimke={`σ(rP), ${s.n} elemű portfólió`}
          ertek={ok ? pct(ok.szoras, 2) : '–'}
          alcim={ok ? `egy eszköz ${pct(ok.egy, 2)} · alsó szint ${pct(ok.szint, 2)}` : undefined}
        />
      }
      fejlecCsuszka={
        <>
          <div className="eset-valaszto">
            <span>Diás példa:</span>
            <div className="szegmens" role="group" aria-label="Diás példa">
              <button aria-pressed={s.eset === 'kt'} onClick={() => setS(L05_KT)}>
                Képlettár: σ 42,5%, k 0,6 (3. ea 8. dia)
              </button>
              <button aria-pressed={s.eset === 'ross'} onClick={() => setS(L05_ROSS)}>
                Ross 13.7 (3. ea 9–10. dia)
              </button>
            </div>
          </div>
          <FejlecCsuszka
            cimke="n, a portfólió elemszáma"
            ertek={Math.min(100, s.n)}
            min={1}
            max={100}
            lepes={1}
            formaz={(n) => `${n} elem`}
            skalaPontok={[1, 10, 25, 50, 100].map((n) => ({
              ertek: n,
              cimke: String(n),
              alcimke: ok && (s.k >= -1 / Math.max(1, n - 1) || n === 1) ? pct(sigmaP(n, s.sigma, s.k), 1) : undefined,
            }))}
            onValtozik={(n) => set({ n })}
            onAktiv={aktival('n')}
          />
        </>
      }
      abra={<L05Abra s={s} e={e} nezet={nezet} />}
      tanulsag={ok && <Tanulsag>{tanulsag(s, ok)}</Tanulsag>}
      kulcsSzamok={
        ok ? (
          <KulcsSzamok
            sorok={[
              { cimke: 'egy eszköz szórása (n = 1)', ertek: pct(ok.egy, 2) },
              { cimke: `σ(rP), n = ${s.n}`, ertek: pct(ok.szoras, 2), kiemelt: true },
              { cimke: 'nem diverzifikálható szint (σ√k)', ertek: s.k > 0 ? pct(ok.szint, 2) : '0%' },
              { cimke: 'diverzifikálható rész még', ertek: `${sz((ok.szoras - ok.szint) * 100, 2)} százalékpont` },
            ]}
          />
        ) : undefined
      }
      bemenetek={
        <>
          <SzamBevitel cimke="n, elemszám" ertek={s.n} tizedes={0} min={1} max={1000} onValtozik={(n) => set({ n: Math.round(n) })} onAktiv={aktival('n')} />
          <CsuszkaMezo cimke="σ, egy eszköz szórása" ertek={s.sigma} min={0.05} max={0.8} lepes={0.0025} szazalek onValtozik={(sigma) => set({ sigma })} onAktiv={aktival('sigma')} />
          <CsuszkaMezo cimke="k, átlagos korreláció" ertek={s.k} min={-0.5} max={1} lepes={0.01} tizedes={2} onValtozik={(k) => set({ k })} onAktiv={aktival('k')} />
          <p className="megjegyzes">
            Egyenlő súlyok, minden elemnek ugyanaz a szórása, és minden pár között ugyanaz a korreláció. Ekkor a 3.5 képletéből σ²(rP) = σ²/n + (1 − 1/n)·k·σ²
            (levezetés: 3.5), n → ∞ esetén σ√k marad.
            {s.eset === 'ross' && ' A Ross-példánál k-t az 1000 elemű portfólió 19,21%-ából számoltam vissza (≈ 0,151); ezzel a képlet a 13.7-es táblázat minden sorát visszaadja.'}
          </p>
        </>
      }
      onAlaphelyzet={() => setS(s.eset === 'ross' ? L05_ROSS : L05_KT)}
      extra={
        nezet === 'bovitett' &&
        ok &&
        palyak && (
          <section className="lecke-kiegeszito">
            <h2>Hová tűnik a kockázat? (variancia, σ²)</h2>
            <KomponensSavok
              max={ok.egy * ok.egy}
              sorok={[
                {
                  cimke: 'egy eszköz',
                  reszek: [
                    { ertek: ok.szisztematikusVar, osztaly: 'masodlagos', cimke: 'szisztematikus (kσ²)' },
                    { ertek: ok.egy * ok.egy - ok.szisztematikusVar, osztaly: 'fokusz', cimke: 'diverzifikálható' },
                  ],
                  osszeg: sz(ok.egy * ok.egy, 4),
                  halvany: true,
                },
                {
                  cimke: `${s.n} elem`,
                  reszek: [
                    { ertek: ok.szisztematikusVar, osztaly: 'masodlagos', cimke: 'szisztematikus (kσ²)' },
                    { ertek: Math.max(0, ok.diverzifikalhatoVar), osztaly: 'fokusz', cimke: 'diverzifikálható' },
                  ],
                  osszeg: sz(ok.szoras * ok.szoras, 4),
                },
              ]}
            />
            <PanelPar
              balCim={`egy eszköz · σ = ${pct(ok.egy, 1)}`}
              jobbCim={`${Math.min(s.n, L05_ESZKOZOK)} elemű egyenlő súlyú portfólió · σ(rP) = ${pct(sigmaP(Math.min(s.n, L05_ESZKOZOK), s.sigma, s.k), 1)}`}
              bal={<PalyaAbra halvanyak={palyak.eszkozok} eros={palyak.egy} domain={pDomain} cim="Egy eszköz hozampályája" />}
              jobb={<PalyaAbra halvanyak={palyak.eszkozok} eros={palyak.portfolio} domain={pDomain} cim="A portfólió hozampályája" />}
            />
            <p className="megjegyzes">
              Szemléltető: {L05_ESZKOZOK} szimulált eszköz {L05_IDOSZAKOK} időszakon át (fix seed), a 4.1 szerkezetével: közös piaci rész + egyedi rész.
              {s.k < 0 && ' Negatív átlagos korrelációt ez a szimuláció nem tud előállítani, ezért ott k = 0-val fut.'}
            </p>
          </section>
        )
      }
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: 'Állítsd n = 50-re és k = 0-ra: mekkora marad a kockázat?',
              kesz: !!ok?.probak[0],
              keszSzoveg: ok && `Sikerült: σ(rP) = ${pct(ok.szoras, 2)}. Korreláció nélkül nincs alsó szint; k = 0,6 mellett ugyanennyi elemnél ${pct(sigmaP(50, s.sigma, 0.6), 1)} maradna.`,
            },
            {
              szoveg: 'Keresd meg a legkisebb n-t, amelynél a diverzifikálható rész 1 százalékpont alá esik.',
              kesz: !!ok?.probak[1],
              keszSzoveg: ok && `Sikerült: n = ${s.n}, σ(rP) = ${pct(ok.szoras, 2)}, a szint ${pct(ok.szint, 2)}.`,
            },
            {
              szoveg: 'Válts a Ross-példára: legalább hány részvény kell ahhoz, hogy a szórás 20% alá essen?',
              kesz: !!ok?.probak[2],
              keszSzoveg: ok && `Sikerült: ${s.n} részvénytől ${pct(ok.szoras, 2)}. A 13.7-es táblázatban 50 elemnél még 20,20%, 100-nál már 19,69% áll.`,
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('3.5')}>3.5</a>, <a href={link.keplet('4.3')}>4.3</a> · Gyakorlás:{' '}
          <a href={link.gyakorlo('portfolio-ket')}>Kételemű portfólió hozama és szórása</a>
        </>
      }
    />
  )
}

export function Elonezet05() {
  return <L05Abra s={L05_ALAP} e={l05(L05_ALAP)} nezet="dias" kicsi />
}
