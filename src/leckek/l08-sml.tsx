// 8. lecke: SML és árazottság (5.1–5.3). Diás nézet: 3. ea 23. / 4. ea 16. dia (SML, piaci
// portfólió β = 1-nél), illetve a 4. ea 13–14. dia két meredeksége. Bővített: kiemelt SML,
// szemléltető hozamfelhő, húzható eszközpontok zöld/piros jelöléssel.

import { scaleLinear } from 'd3-scale'
import { useMemo, useState } from 'react'
import { capm } from '../calc/capm.ts'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { L08_AB, L08_GH, l08, l08Felho, type L08 } from './szamitas/l08.ts'
import { Abra, Gorbe, NyilDef, Pont, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { Pontfelho } from './ui/szimulalt.tsx'
import { CsuszkaMezo, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'rf' | 'ErM' | 'eszkoz' | null

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`

export function L08Abra({ s, nezet, onEszkoz, onAktiv, kicsi }: { s: L08; nezet: Nezet; onEszkoz?: (i: number, beta: number, E: number) => void; onAktiv?: (i: number) => void; kicsi?: boolean }) {
  const e = l08(s)
  const felho = useMemo(() => (nezet === 'bovitett' ? l08Felho(s) : []), [s, nezet])
  const dias = nezet === 'dias'
  const bMax = Math.max(2.2, ...s.eszkozok.map((a) => a.beta * 1.15))
  const eMax = Math.max(0.05, ...(e.vanSml ? [capm(s.rf, bMax, e.MRP)] : []), ...s.eszkozok.map((a) => a.E * 1.2), s.rf * 1.5)
  return (
    <Abra cim="Értékpapírpiaci egyenes a β–E(r) síkon" dias={dias} arany={kicsi ? 0.75 : 0.6} minH={kicsi ? 180 : 280} margo={{ bal: 66 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, bMax]).range([0, bw])
        const y = scaleLinear().domain([0, eMax]).range([bh, 0])
        const sml: [number, number][] = e.vanSml ? [0, bMax].map((b) => [x(b), y(capm(s.rf, b, e.MRP))]) : []
        const terulet = (felul: boolean) => `M${[...sml, [x(bMax), felul ? 0 : bh], [x(0), felul ? 0 : bh]].map((p) => p.join(',')).join('L')}Z`
        return (
          <>
            <NyilDef />
            {!dias && e.vanSml && (
              <>
                <path className="terulet-pozitiv" d={terulet(true)} />
                <path className="terulet-negativ" d={terulet(false)} />
                {!kicsi && <Pontfelho pontok={felho.filter(([b, r]) => b >= 0 && b <= bMax && r >= 0 && r <= eMax).map(([b, r]) => [x(b), y(r)] as [number, number])} />}
              </>
            )}
            <Tengely skala={x} irany="x" poz={bh} tickek={dias ? [1] : [0, 0.5, 1, 1.5, 2]} formaz={(v) => sz(v, 1)} cimke="β" nyil={dias} racs={dias ? undefined : -bh} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [] : 4} formaz={pctTengely} cimke="E(r)" nyil={dias} racs={dias ? undefined : bw} />

            {e.vanSml ? (
              <>
                <Gorbe pontok={sml} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
                {/* a piaci portfólió β = 1-nél, vetületekkel */}
                <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={x(1)} x2={x(1)} y1={y(s.ErM)} y2={bh} />
                <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={0} x2={x(1)} y1={y(s.ErM)} y2={y(s.ErM)} />
                <Pont x={x(1)} y={y(s.ErM)} className="dias-pont tomor" r={3.5} cimke="r_M" />
                {!kicsi && (
                  <>
                    {dias && <SvgMatek szoveg="E(r_M)" className="svg-matek tengely-belso" x={-6} y={y(s.ErM) + 4} textAnchor="end" />}
                    <text className="dias-felirat" x={x(1) - 8} y={y(s.ErM) - 26} textAnchor="end">
                      Piaci portfólió
                    </text>
                    <text className="dias-felirat" x={x(bMax * 0.78)} y={y(capm(s.rf, bMax * 0.78, e.MRP)) - 14} textAnchor="end">
                      Értékpapírpiaci egyenes
                    </text>
                  </>
                )}
              </>
            ) : (
              // A/B eset: r_f-ből a két eszközön át húzott meredekség-egyenesek (4. ea 14. dia)
              e.eszkozok.map((a, i) => {
                const vegB = bMax
                const vegE = s.rf + a.meredekseg * vegB
                return (
                  <Gorbe
                    key={a.nev}
                    pontok={[
                      [x(0), y(s.rf)],
                      [x(vegB), y(vegE)],
                    ]}
                    className={dias ? `dias-vonal ${i === 0 ? 'vekony' : 'vastag'}` : i === 0 ? 'fokusz' : 'masodlagos'}
                    szaggatott={i === 0}
                  />
                )
              })
            )}
            <Pont x={0} y={y(s.rf)} className="dias-pont tomor" r={3.5} cimke="r_f" cimkeIrany="bal" />

            {e.eszkozok.map((a, i) => {
              const cls = dias
                ? 'dias-pont tomor'
                : !e.vanSml
                  ? i === 0
                    ? 'fokusz'
                    : 'masodlagos'
                  : a.arazas === 'alulárazott'
                    ? 'pozitiv'
                    : a.arazas === 'túlárazott'
                      ? 'negativ'
                      : 'fokusz'
              const cimke = dias || kicsi || !a.arazas ? a.nev : `${a.nev}: ${a.arazas}`
              return (
                <g key={a.nev}>
                  {!dias && a.elvart !== undefined && <line className="hiany-vonal" x1={x(a.beta)} x2={x(a.beta)} y1={y(a.E)} y2={y(a.elvart)} />}
                  {!e.vanSml && !kicsi && (
                    <>
                      <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={x(a.beta)} x2={x(a.beta)} y1={y(a.E)} y2={bh} />
                      <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={0} x2={x(a.beta)} y1={y(a.E)} y2={y(a.E)} />
                    </>
                  )}
                  <Pont
                    x={x(a.beta)}
                    y={y(a.E)}
                    className={cls}
                    r={dias ? 4 : 6}
                    cimke={cimke}
                    cimkeIrany={a.beta < 1 ? 'bal' : 'jobb'}
                    onHuz={
                      onEszkoz
                        ? (px, py) => {
                            onAktiv?.(i)
                            onEszkoz(i, Math.min(bMax, Math.max(0.05, Math.round(x.invert(px) * 20) / 20)), Math.min(eMax, Math.max(0, Math.round(y.invert(py) * 1000) / 1000)))
                          }
                        : undefined
                    }
                    onLep={onEszkoz ? (dx, dy) => (onAktiv?.(i), onEszkoz(i, Math.max(0.05, a.beta + dx * 0.05), Math.max(0, a.E + dy * 0.001))) : undefined}
                    ariaLabel={`${a.nev}: β ${sz(a.beta, 2)}, E(r) ${pct(a.E, 1)}`}
                  />
                </g>
              )
            })}
          </>
        )
      }}
    </Abra>
  )
}

function tanulsag(a: ReturnType<typeof l08>['eszkozok'][number] | undefined, vanSml: boolean): string {
  if (!vanSml || !a) return 'a nagyobb meredekségű eszköz egységnyi bétára több többlethozamot ad: mindenki azt venné, amíg a meredekségek ki nem egyenlítődnek'
  if (a.arazas === 'alulárazott') return `${a.nev} az SML fölött van: meredeksége nagyobb az SML-énél, alulárazott (venni fogják, ára nő, hozama csökken a vonalig)`
  if (a.arazas === 'túlárazott') return `${a.nev} az SML alatt van: meredeksége kisebb az SML-énél, túlárazott`
  return `${a.nev} az SML-en van: helyesen árazott`
}

export function Lecke08() {
  const [s, setS] = useState<L08>(L08_GH)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const [aktivEszkoz, setAktivEszkoz] = useState(0)
  const e = l08(s)
  const set = (p: Partial<L08>) => setS((v) => ({ ...v, ...p }))
  const eszkoz = (i: number, beta: number, E: number) =>
    setS((v) => ({ ...v, eszkozok: v.eszkozok.map((a, j) => (j === i ? { ...a, beta, E } : a)) }))
  const ae = e.eszkozok[aktivEszkoz]
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const gh = s.eset === 'GH'

  const kiemeles = aktiv === 'rf' ? ['r_f'] : aktiv === 'ErM' ? ['E(r_M)'] : aktiv === 'eszkoz' ? ['E(r_i)', '\\beta_i'] : undefined

  return (
    <LeckeKeret
      szam={8}
      cim="SML és árazottság"
      nezet={nezet}
      onNezet={setNezet}
      keplet={gh ? <KepletFejlec kepletId="5.1" kiemelt={kiemeles} /> : <KepletFejlec kepletId="5.2" />}
      kijelzo={
        gh ? (
          <EloKijelzo cimke={`${ae.nev} elvárt hozama (CAPM)`} ertek={pct(ae.elvart!, 1)} alcim={`várható ${pct(ae.E, 1)} · ${ae.arazas}`} />
        ) : (
          <EloKijelzo cimke={`${e.eszkozok[0].nev} meredeksége`} ertek={sz(e.eszkozok[0].meredekseg, 4)} alcim={`${e.eszkozok[1].nev}: ${sz(e.eszkozok[1].meredekseg, 4)}`} />
        )
      }
      fejlecCsuszka={
        <div className="eset-valaszto">
          <span>Diás példa:</span>
          <div className="szegmens" role="group" aria-label="Diás példa">
            <button aria-pressed={gh} onClick={() => (setS(L08_GH), setAktivEszkoz(0))}>
              G és H (5. ea 26–27. dia)
            </button>
            <button aria-pressed={!gh} onClick={() => (setS(L08_AB), setAktivEszkoz(0))}>
              A és B (4. ea 13–14. dia)
            </button>
          </div>
        </div>
      }
      abra={<L08Abra s={s} nezet={nezet} onEszkoz={eszkoz} onAktiv={setAktivEszkoz} />}
      tanulsag={<Tanulsag>{tanulsag(gh ? ae : undefined, e.vanSml)}</Tanulsag>}
      kulcsSzamok={
        <KulcsSzamok
          sorok={[
            ...(gh ? [{ cimke: 'SML meredeksége (MRP)', ertek: pct(e.MRP, 2) }] : []),
            ...e.eszkozok.flatMap((a, i) => [
              {
                cimke: `${a.nev} meredeksége`,
                ertek: gh ? pct(a.meredekseg, 2) : sz(a.meredekseg, 4),
                kiemelt: i === aktivEszkoz,
              },
              ...(gh ? [{ cimke: `${a.nev}: CAPM / várható`, ertek: `${pct(a.elvart!, 1)} / ${pct(a.E, 1)}` }] : []),
            ]),
          ]}
        />
      }
      bemenetek={
        <>
          <CsuszkaMezo cimke={<>r<sub>f</sub>, kockázatmentes hozam</>} ertek={s.rf} min={0} max={0.15} lepes={0.0025} szazalek onValtozik={(rf) => set({ rf })} onAktiv={aktival('rf')} />
          {gh && (
            <CsuszkaMezo cimke={<>E(r<sub>M</sub>), a piac várható hozama</>} ertek={s.ErM} min={0} max={0.2} lepes={0.0025} szazalek onValtozik={(ErM) => set({ ErM })} onAktiv={aktival('ErM')} />
          )}
          <div className="eszkozadatok-racs">
            {s.eszkozok.map((a, i) => (
              <div key={a.nev} className="eszkoz-sor">
                <SzamBevitel cimke={`β ${a.nev}`} ertek={a.beta} min={0.05} max={3} onValtozik={(b) => (setAktivEszkoz(i), eszkoz(i, b, a.E))} onAktiv={aktival('eszkoz')} />
                <SzamBevitel cimke={`E(r) ${a.nev}`} ertek={a.E} szazalek min={0} max={0.5} onValtozik={(v) => (setAktivEszkoz(i), eszkoz(i, a.beta, v))} onAktiv={aktival('eszkoz')} />
              </div>
            ))}
          </div>
          <p className="megjegyzes">A pontokat húzhatod is (vagy fókuszálj rájuk, és használd a nyilakat).</p>
        </>
      }
      onAlaphelyzet={() => (setS(gh ? L08_GH : L08_AB), setAktivEszkoz(0))}
      probaldKi={
        gh ? (
          <ProbaldKi
            feladatok={[
              { szoveg: 'Húzd G-t úgy, hogy pont az SML-en legyen. Mekkora E(r) kell hozzá?', kesz: e.probak[0], keszSzoveg: `Sikerült: ${pct(e.eszkozok[0].elvart!, 1)} (a képlettár szerint 12,4%).` },
              { szoveg: 'Tedd H-t is helyesen árazottá.', kesz: e.probak[1], keszSzoveg: `Sikerült: H az SML-en van, ${pct(e.eszkozok[1].elvart!, 1)}.` },
              { szoveg: 'Vigyél egy eszközt a piaci portfólió pontjába (β = 1, az SML-en).', kesz: e.probak[2], keszSzoveg: 'Sikerült: β = 1-nél a CAPM-hozam éppen E(r_M).' },
            ]}
          />
        ) : (
          <ProbaldKi
            feladatok={[
              {
                szoveg: 'Húzd B-t úgy, hogy a meredeksége megegyezzen A-éval. (A 4. ea 15. diája szerint egyensúlyban ez történik.)',
                kesz: e.probak[0],
                keszSzoveg: 'Sikerült: azonos meredekség mellett egyik eszköz sem jobb a másiknál.',
              },
            ]}
          />
        )
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('5.1')}>5.1</a>, <a href={link.keplet('5.2')}>5.2</a>, <a href={link.keplet('5.3')}>5.3</a> · Gyakorlás:{' '}
          <a href={link.gyakorlo('capm-arazas')}>Alul- vagy túlárazott?</a>, <a href={link.gyakorlo('capm-ket-eszkoz')}>Két helyesen árazott eszköz</a>
        </>
      }
    />
  )
}

export function Elonezet08() {
  return <L08Abra s={L08_GH} nezet="dias" kicsi />
}
