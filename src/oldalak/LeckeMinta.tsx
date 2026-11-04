// Komponens-minta a B fázis jóváhagyásához: a közös elemek és a színtokenek egy oldalon.
// A számok a mag függvényeiből jönnek (a 2. ea / képlettár kételemű példája, 5. ea WACC).

import { scaleLinear } from 'd3-scale'
import { useMemo, useState } from 'react'
import { arazas, capm } from '../calc/capm.ts'
import { minVarianciaSuly, portfolioGorbe, portfolioHozam, portfolioVarianciaKorr } from '../calc/portfolio.ts'
import { egyFaktorosPalyak, korreltMinta } from '../calc/szimulacio.ts'
import { wacc } from '../calc/toke.ts'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { Abra, Gorbe, NyilDef, Pont, Sav, Tengely } from '../leckek/ui/abra.tsx'
import { LeckeKeret } from '../leckek/ui/keret.tsx'
import {
  EloKijelzo,
  ErvenytelenUzenet,
  KepletFejlec,
  KomponensSavok,
  KulcsSzamok,
  PanelPar,
  ProbaldKi,
  Tanulsag,
} from '../leckek/ui/kijelzok.tsx'
import { ElojelesNegyedek, Pontfelho, SzimulaltVonalak } from '../leckek/ui/szimulalt.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet } from '../leckek/ui/vezerlok.tsx'
import { link } from '../router.ts'

// A képlettár kételemű adatsora (2.1, 3.3 példa): A: 20%, 10%; B: 25%, 45%
const E1 = 0.2
const E2 = 0.25
const S1 = 0.1
const S2 = 0.45

function portfolio(a: number, k: number) {
  return { E: portfolioHozam([a, 1 - a], [E1, E2]), s: Math.sqrt(Math.max(0, portfolioVarianciaKorr(a, 1 - a, S1, S2, k))) }
}

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`

/** A kételemű portfólió E(r)–σ(r) ábrája (a minta fő ábrája, egyben a panelpár eleme). */
function PortfolioAbra({ a, k, nezet, kicsi }: { a: number; k: number; nezet: Nezet; kicsi?: boolean }) {
  const gorbe = portfolioGorbe(E1, E2, S1, S2, k, 120)
  const p = portfolio(a, k)
  const aMin = Math.min(1, Math.max(0, minVarianciaSuly(S1, S2, k)))
  const pMin = portfolio(aMin, k)
  const dias = nezet === 'dias'
  return (
    <Abra cim="Kételemű portfólió az E(r)–σ(r) síkon" dias={dias} arany={kicsi ? 0.8 : 0.62} minH={kicsi ? 200 : 260}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, 0.5]).range([0, bw])
        const y = scaleLinear().domain([0.185, 0.265]).range([bh, 0])
        const pontok = gorbe.map((g) => [x(g.szoras), y(g.E)] as [number, number])
        // a minimális szórású pont fölötti rész a hatékony ág
        const iMin = gorbe.findIndex((g) => g.a1 >= aMin)
        const hatekony = pontok.slice(0, Math.max(1, iMin + 1))
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={dias ? [] : 5} formaz={pctTengely} cimke="σ(r)" nyil={dias} racs={dias ? undefined : -bh} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [] : 4} formaz={pctTengely} cimke="E(r)" nyil={dias} racs={dias ? undefined : bw} />
            <Gorbe pontok={pontok} className={dias ? 'dias-vonal vekony' : 'masodlagos halvanyabb'} />
            <Gorbe pontok={hatekony} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            {!dias && (
              <>
                <line className="vetulet" x1={x(p.s)} x2={x(p.s)} y1={y(p.E)} y2={bh} />
                <line className="vetulet" x1={0} x2={x(p.s)} y1={y(p.E)} y2={y(p.E)} />
              </>
            )}
            <Pont x={x(S1)} y={y(E1)} jel={dias ? 'x' : 'kor'} className={dias ? 'dias-pont' : 'masodlagos'} cimke="A" r={dias ? 5 : 5} />
            <Pont x={x(S2)} y={y(E2)} jel={dias ? 'x' : 'kor'} className={dias ? 'dias-pont' : 'masodlagos'} cimke="B" cimkeIrany="bal" />
            {dias ? (
              <Pont x={x(pMin.s)} y={y(pMin.E)} className="dias-pont tomor" r={3.5} cimke="min. σ" cimkeIrany="bal" />
            ) : (
              <Pont x={x(p.s)} y={y(p.E)} className="fokusz nagy" r={7} cimke={kicsi ? undefined : `a_1 = ${pct(a, 1)}`} />
            )}
            {dias && !kicsi && (
              <text className="dias-felirat" x={x(0.3)} y={y(0.262)}>
                Hatékony portfóliók
              </text>
            )}
          </>
        )
      }}
    </Abra>
  )
}

function SmlDemo() {
  const rf = 0.02
  const ErM = 0.085
  const [g, setG] = useState({ beta: 1.6, E: 0.12 })
  const d = arazas(g.E, rf, g.beta, ErM - rf, 1e-4)
  return (
    <Abra cim="Húzható pont az SML körül" arany={0.55} minH={220}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, 2.2]).range([0, bw])
        const y = scaleLinear().domain([0, 0.18]).range([bh, 0])
        const sml: [number, number][] = [0, 2.2].map((b) => [x(b), y(capm(rf, b, ErM - rf))])
        const felul: [number, number][] = [...sml, [x(2.2), y(0.18)], [x(0), y(0.18)]]
        const alul: [number, number][] = [...sml, [x(2.2), y(0)], [x(0), y(0)]]
        return (
          <>
            <path className="terulet-pozitiv" d={`M${felul.map((p) => p.join(',')).join('L')}Z`} />
            <path className="terulet-negativ" d={`M${alul.map((p) => p.join(',')).join('L')}Z`} />
            <Tengely skala={x} irany="x" poz={bh} tickek={[0, 0.5, 1, 1.5, 2]} formaz={(v) => sz(v, 1)} cimke="β" />
            <Tengely skala={y} irany="y" poz={0} tickek={4} formaz={pctTengely} cimke="E(r)" />
            <Gorbe pontok={sml} className="fokusz" />
            <Pont
              x={x(g.beta)}
              y={y(g.E)}
              className={d === 'alulárazott' ? 'pozitiv' : d === 'túlárazott' ? 'negativ' : 'fokusz'}
              cimke={`G: ${d}`}
              onHuz={(px, py) =>
                setG({ beta: Math.min(2.2, Math.max(0, Math.round(x.invert(px) * 20) / 20)), E: Math.min(0.18, Math.max(0, Math.round(y.invert(py) * 1000) / 1000)) })
              }
              onLep={(dx, dy) => setG((v) => ({ beta: Math.min(2.2, Math.max(0, v.beta + dx * 0.05)), E: Math.min(0.18, Math.max(0, v.E + dy * 0.001)) }))}
              ariaLabel={`G pont: β ${sz(g.beta, 2)}, E(r) ${pct(g.E, 1)}`}
            />
          </>
        )
      }}
    </Abra>
  )
}

function PalyakDemo() {
  const { eszkozok, portfolio: port } = useMemo(() => egyFaktorosPalyak({ eszkozok: 60, idoszakok: 40, E: 0, sigma: 0.425, k: 0.6, seed: 11 }), [])
  return (
    <Abra cim="Sok halvány eszközpálya és a vastag portfóliópálya" arany={0.45} minH={200}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, 39]).range([0, bw])
        const y = scaleLinear().domain([-1.2, 1.2]).range([bh, 0])
        const vonal = (s: number[]) => s.map((v, t) => [x(t), y(v)] as [number, number])
        return (
          <>
            <Tengely skala={x} irany="x" poz={bh} tickek={[0, 10, 20, 30]} formaz={(v) => String(v)} cimke="t" />
            <Tengely skala={y} irany="y" poz={0} tickek={[-1, 0, 1]} formaz={pctTengely} cimke="r" />
            <SzimulaltVonalak halvanyak={eszkozok.map(vonal)} eros={vonal(port)} erosOsztaly="osszesito" />
          </>
        )
      }}
    </Abra>
  )
}

function NegyedekDemo() {
  const minta = useMemo(() => korreltMinta(140, -0.6, 21, { s1: 0.1, s2: 0.45 }), [])
  return (
    <Abra cim="Kovariancia-pontdiagram előjeles negyedekkel" arany={0.8} minH={220} margo={{ bal: 44 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([-0.35, 0.35]).range([0, bw])
        const y = scaleLinear().domain([-1.4, 1.4]).range([bh, 0])
        return (
          <>
            <ElojelesNegyedek cx={x(0)} cy={y(0)} w={bw} h={bh} />
            <Tengely skala={x} irany="x" poz={bh} tickek={[-0.2, 0, 0.2]} formaz={pctTengely} cimke="r_A − E(r_A)" />
            <Tengely skala={y} irany="y" poz={0} tickek={[-1, 0, 1]} formaz={pctTengely} cimke="r_B − E(r_B)" />
            <Pontfelho pontok={minta.map(([a, b]) => [x(a), y(b)] as [number, number])} className="masodlagos" />
          </>
        )
      }}
    </Abra>
  )
}

const SZINEK = [
  ['--fokusz', 'kiemelőszín: a lecke fő eleme'],
  ['--akcent', 'másodlagos sorozatok (hideg kék)'],
  ['--szoveg', 'összesítő, átlag (sötét témában fehér)'],
  ['--szoveg-3', 'halvány szimulált elemek (átlátszósággal)'],
  ['--jo', 'alulárazott, teljesítve'],
  ['--rossz', 'túlárazott, rossz döntés'],
  ['--felulet', 'az ábra háttere'],
] as const

export function LeckeMinta() {
  const [nezet, setNezet] = useState<Nezet>('bovitett')
  const [a, setA] = useState(0.5)
  const [k, setK] = useState(-1)
  const [aktiv, setAktiv] = useState<'a' | 'k' | null>(null)
  const p = portfolio(a, k)
  const aMin = minVarianciaSuly(S1, S2, k)

  const tanulsag =
    k === -1
      ? 'k = −1 mellett van olyan súly, amelynél a portfólió kockázata eltűnik'
      : k === 1
        ? 'k = +1 mellett a görbe egyenes: a keverés nem csökkenti a kockázatot'
        : 'a súly mozgatásával a pont a görbén csúszik; kisebb korrelációnál a görbe jobban balra hajlik'

  const W = wacc(0.8576, 0.1318, 0.1424, 0.11, 0.21)
  const W0 = wacc(0.8576, 0.1318, 0.1424, 0.11, 0)

  return (
    <div className="lecke-minta">
      <LeckeKeret
        szam={4}
        cim="Komponens-minta (kételemű portfólió adataival)"
        nezet={nezet}
        onNezet={setNezet}
        keplet={<KepletFejlec kepletId="3.4" latexIdx={1} kiemelt={aktiv === 'k' ? ['k_{1,2}'] : aktiv === 'a' ? ['a_1^2', 'a_2^2', '2a_1a_2'] : undefined} />}
        kijelzo={<EloKijelzo cimke="σ(rP)" ertek={pct(p.s, 1)} alcim={`E(rP) ${pct(p.E, 1)}`} />}
        fejlecCsuszka={
          <FejlecCsuszka
            cimke="Korreláció (k)"
            ertek={k}
            min={-1}
            max={1}
            lepes={0.05}
            formaz={(v) => sz(v, 2)}
            skalaPontok={[-1, -0.5, 0, 0.5, 1].map((v) => ({ ertek: v, cimke: sz(v, 1), alcimke: `σ ${pct(portfolio(a, v).s, 1)}` }))}
            onValtozik={setK}
            onAktiv={(b) => setAktiv(b ? 'k' : null)}
          />
        }
        abra={<PortfolioAbra a={a} k={k} nezet={nezet} />}
        tanulsag={<Tanulsag>{tanulsag}</Tanulsag>}
        kulcsSzamok={
          <KulcsSzamok
            sorok={[
              { cimke: 'a₁ (A súlya)', ertek: pct(a, 1) },
              { cimke: 'E(rP)', ertek: pct(p.E, 2) },
              { cimke: 'σ(rP)', ertek: pct(p.s, 2), kiemelt: true },
              { cimke: 'minimális σ súlya', ertek: pct(Math.min(1, Math.max(0, aMin)), 1) },
            ]}
          />
        }
        bemenetek={
          <CsuszkaMezo cimke="a₁, az A részvény súlya" ertek={a} min={0} max={1} lepes={0.001} szazalek onValtozik={setA} onAktiv={(b) => setAktiv(b ? 'a' : null)} />
        }
        onAlaphelyzet={() => {
          setA(0.5)
          setK(-1)
        }}
        probaldKi={
          <ProbaldKi
            feladatok={[
              { szoveg: 'k = −1 mellett keresd meg azt a súlyt, ahol σ(rP) = 0.', kesz: k === -1 && p.s < 0.001, keszSzoveg: `Sikerült: a₁ = ${pct(a, 1)} mellett a szórás 0.` },
              { szoveg: 'Állítsd a korrelációt +1-re: mi lesz a görbéből?', kesz: k === 1, keszSzoveg: 'Egyenes a két pont között: nincs diverzifikációs haszon.' },
            ]}
          />
        }
        kapcsolodik={
          <>
            Kapcsolódik: <a href={link.keplet('3.1')}>3.1</a>, <a href={link.keplet('3.4')}>3.4</a> · gyakorlás:{' '}
            <a href={link.gyakorlo('portfolio-ket')}>Kételemű portfólió</a>
          </>
        }
        extra={
          <section className="minta-extra">
            <h2>További közös elemek</h2>

            <h3>Panelpár azonos skálával</h3>
            <PanelPar
              balCim={<>alacsony korreláció: k = −0,5</>}
              jobbCim={<>magas korreláció: k = 0,9</>}
              bal={<PortfolioAbra a={a} k={-0.5} nezet="bovitett" kicsi />}
              jobb={<PortfolioAbra a={a} k={0.9} nezet="bovitett" kicsi />}
            />

            <h3>Húzható pont, árnyékolt tartományok</h3>
            <p className="minta-magyarazat">Húzd a pontot egérrel, vagy fókuszálj rá és használd a nyilakat (Shift: nagyobb lépés).</p>
            <SmlDemo />

            <h3>Vízszintes komponenssávok</h3>
            <KomponensSavok
              max={0.14}
              sorok={[
                {
                  cimke: 'WACC',
                  reszek: [
                    { ertek: 0.8576 * 0.1318, osztaly: 'fokusz', cimke: `E/V × rE ${pct(0.8576 * 0.1318, 2)}` },
                    { ertek: 0.1424 * 0.11 * 0.79, osztaly: 'masodlagos', cimke: `D/V × rD(1 − TC) ${pct(0.1424 * 0.11 * 0.79, 2)}` },
                  ],
                  osszeg: pct(W, 2),
                },
                {
                  cimke: 'adópajzs nélkül',
                  halvany: true,
                  reszek: [
                    { ertek: 0.8576 * 0.1318, osztaly: 'semleges', cimke: '' },
                    { ertek: 0.1424 * 0.11, osztaly: 'semleges', cimke: '' },
                  ],
                  osszeg: pct(W0, 2),
                },
              ]}
            />

            <h3>Sok halvány elem és egy erős (fix seed)</h3>
            <PalyakDemo />

            <h3>Előjeles negyedek</h3>
            <div className="minta-ket-oszlop">
              <NegyedekDemo />
              <div>
                <h3>Érvénytelen bemenet</h3>
                <ErvenytelenUzenet magassag={180}>A valószínűségek összege most 0,9; 1-nek kell lennie, ezért a grafikon nem értelmezett.</ErvenytelenUzenet>
              </div>
            </div>

            <h3>Árnyékolt sáv felirattal</h3>
            <Abra cim="Árnyékolt sávok" arany={0.3} minH={140}>
              {({ bw, bh }) => {
                const x = scaleLinear().domain([-0.5, 0.75]).range([0, bw])
                return (
                  <>
                    <Sav x0={x(-0.276)} x1={x(0.516)} y0={0} y1={bh} className="sav-kulso" felirat="95%" feliratPoz="lent" />
                    <Sav x0={x(-0.078)} x1={x(0.318)} y0={0} y1={bh} className="sav-belso" felirat="68%" />
                    <Tengely skala={x} irany="x" poz={bh} tickek={[-0.276, -0.078, 0.12, 0.318, 0.516]} formaz={(v) => pct(v, 1)} cimke="r" />
                  </>
                )
              }}
            </Abra>

            <h3>Színtokenek</h3>
            <ul className="szin-lista">
              {SZINEK.map(([v, leiras]) => (
                <li key={v}>
                  <span className="szin-minta" style={{ background: `var(${v})` }} />
                  <code>{v}</code> {leiras}
                </li>
              ))}
            </ul>
          </section>
        }
      />
    </div>
  )
}
