// 6. lecke: tőkeallokációs és tőkepiaci egyenes (3.5, 5.4).
// Diás nézet: a 3. ea 14. diája (r_f-ből húzott egyenesek r_i, r_j, r_k pontokon át) és a 15. dia
// (tőkepiaci egyenes, piaci portfólió). Bővített: a CAL r_f-ből A-n át, a w csúszkával mozgó ponttal;
// 100% fölött (hitelfelvétel) szaggatott. σ(r_A) a képlettárban nincs, ezért szemléltető.

import { scaleLinear } from 'd3-scale'
import { useMemo, useState } from 'react'
import { kevertPortfolio, kevertSzoras } from '../calc/capm.ts'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { L04_ALAP, L04_NEVEK } from './szamitas/l04.ts'
import { L06_3EA, L06_5EA, L06_ALAP, l06, l06Cml, l06Felho, l06Nev, type L06, type L06Eredmeny } from './szamitas/l06.ts'
import { Abra, Gorbe, NyilDef, Pont, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'w' | 'rf' | 'EA' | 'beta' | 'sA' | null

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`
const W_MAX = 2

// ---------- 14. dia / bővített CAL ----------

export function L06Abra({ s, e, nezet, onW, onAktiv, kicsi }: { s: L06; e: L06Eredmeny; nezet: Nezet; onW?: (w: number) => void; onAktiv?: (b: boolean) => void; kicsi?: boolean }) {
  if (e.hiba !== undefined) return <ErvenytelenUzenet magassag={kicsi ? 180 : 300}>{e.hiba}</ErvenytelenUzenet>
  const dias = nezet === 'dias'
  const vegW = dias ? Math.max(1.45, s.w * 1.08) : W_MAX
  const veg = kevertPortfolio(vegW, s.EA, s.betaA, s.rf)
  const xMax = kevertSzoras(vegW, s.sA) * 1.06
  const lo = Math.min(0, s.rf, veg.Er)
  const hi = Math.max(s.rf, veg.Er, s.EA) * 1.12
  // a 14. dia két további pontja (r_j, r_k) szemléltető: egy kisebb meredekségű és egy r_f alatti eszköz
  const rj = { sigma: s.sA * 0.85, E: s.rf + 0.55 * (s.EA - s.rf) }
  const rk = { sigma: s.sA * 0.9, E: s.rf - 0.22 * (s.EA - s.rf) }
  return (
    <Abra cim="Tőkeallokációs egyenes a σ–E(r) síkon" dias={dias} arany={kicsi ? 0.75 : 0.6} minH={kicsi ? 180 : 290} margo={{ bal: dias ? 34 : 50, fent: 24, jobb: 24 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, xMax]).range([0, bw])
        const y = scaleLinear().domain([lo, hi]).range([bh, 0])
        const pE = (w: number) => kevertPortfolio(w, s.EA, s.betaA, s.rf).Er
        const vonal = (sigma: number, E: number, hossz: number): [number, number][] => [
          [x(0), y(s.rf)],
          [x(sigma * hossz), y(s.rf + (E - s.rf) * hossz)],
        ]
        const P = { x: x(e.szoras), y: y(e.E) }
        const A = { x: x(s.sA), y: y(s.EA) }
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={dias ? [] : 5} formaz={pctTengely} cimke="σ(r)" nyil={dias} racs={dias ? undefined : -bh} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [] : 5} formaz={pctTengely} cimke="E(r)" nyil={dias} racs={dias ? undefined : bw} />
            {dias ? (
              <>
                <Gorbe pontok={vonal(s.sA, s.EA, vegW)} className="dias-vonal" szaggatott />
                <Gorbe pontok={vonal(rj.sigma, rj.E, 1.45)} className="dias-vonal" szaggatott />
                <Gorbe pontok={vonal(rk.sigma, rk.E, 1.45)} className="dias-vonal" szaggatott />
                <Pont x={A.x} y={A.y} r={3.5} className="dias-pont tomor" cimke="r_i" cimkeIrany="fent" />
                <Pont x={x(rj.sigma)} y={y(rj.E)} r={3.5} className="dias-pont tomor" cimke="r_j" cimkeIrany="fent" />
                <Pont x={x(rk.sigma)} y={y(rk.E)} r={3.5} className="dias-pont tomor" cimke="r_k" cimkeIrany="fent" />
              </>
            ) : (
              <>
                <Gorbe pontok={[[x(0), y(s.rf)], [A.x, A.y]]} className="fokusz" />
                <Gorbe pontok={[[A.x, A.y], [x(kevertSzoras(W_MAX, s.sA)), y(pE(W_MAX))]]} className="fokusz" szaggatott />
                {!kicsi && (
                  <>
                    <text className="mono-felirat" x={x(0) + (A.x - x(0)) * 0.62} y={y(s.rf) + (A.y - y(s.rf)) * 0.62 + 30} textAnchor="middle">
                      kölcsönadás (w ≤ 100%)
                    </text>
                    <text className="mono-felirat" x={A.x + (x(kevertSzoras(W_MAX, s.sA)) - A.x) * 0.62} y={A.y + (y(pE(W_MAX)) - A.y) * 0.62 + 30} textAnchor="middle">
                      hitelfelvétel (w &gt; 100%)
                    </text>
                    <line className="vetulet" x1={P.x} x2={P.x} y1={P.y} y2={bh} />
                    <line className="vetulet" x1={0} x2={P.x} y1={P.y} y2={P.y} />
                  </>
                )}
                <Pont x={A.x} y={A.y} r={5} className="masodlagos" cimke={`${l06Nev(s.eset)} (w = 100%)`} cimkeIrany="fent" />
              </>
            )}
            <Pont x={x(0)} y={y(s.rf)} r={3.5} className="dias-pont tomor" cimke="r_f" cimkeIrany="bal" />
            <Pont
              x={P.x}
              y={P.y}
              r={dias ? 4.5 : 7}
              className="fokusz nagy"
              cimke={kicsi ? undefined : dias ? 'P' : `P: w = ${pct(s.w, 1)}`}
              cimkeIrany={dias ? 'jobb' : 'fent'}
              onHuz={onW ? (px) => (onAktiv?.(true), onW(Math.min(W_MAX, Math.max(0, Math.round((x.invert(px) / s.sA) * 200) / 200)))) : undefined}
              onLep={onW ? (dx) => (onAktiv?.(true), onW(Math.min(W_MAX, Math.max(0, Math.round((s.w + dx * 0.05) * 200) / 200)))) : undefined}
              ariaLabel={`P portfólió, w = ${pct(s.w, 1)}`}
            />
          </>
        )
      }}
    </Abra>
  )
}

// ---------- 15. dia: tőkepiaci egyenes ----------

function CmlAbra({ s, nezet }: { s: L06; nezet: Nezet }) {
  const dias = nezet === 'dias'
  const c = useMemo(() => l06Cml(s), [s])
  const felho = useMemo(() => l06Felho(c.gorbe), [c.gorbe])
  const { M } = c
  const xMax = 0.5
  const yMax = 0.32
  return (
    <Abra cim="Tőkepiaci egyenes: r_f-ből a hatékony görbéhez húzott érintő" dias={dias} arany={0.62} minH={260} maxH={380} margo={{ bal: dias ? 46 : 50, fent: 24, jobb: 24 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, xMax]).range([0, bw])
        const y = scaleLinear().domain([0, yMax]).range([bh, 0])
        // a CML az ábra széléig
        const cmlVeg = Math.min(xMax, (yMax - s.rf) / M.meredekseg)
        const gorbe = c.gorbe.map((g) => [x(g.szoras), y(g.E)] as [number, number])
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={dias ? [] : 5} formaz={pctTengely} cimke="σ(r)" nyil={dias} racs={dias ? undefined : -bh} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [] : 4} formaz={pctTengely} cimke="E(r)" nyil={dias} racs={dias ? undefined : bw} />
            {dias &&
              felho.korok.map(([sg, E], i) => (
                <circle key={`k${i}`} className="felho-kor" cx={x(sg)} cy={y(E)} r={2.6} />
              ))}
            {dias && felho.xek.map(([sg, E], i) => <Pont key={`x${i}`} x={x(sg)} y={y(E)} jel="x" r={3} className="dias-pont" />)}
            <Gorbe pontok={gorbe} className={dias ? 'dias-vonal' : 'masodlagos'} />
            <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={x(M.szoras)} x2={x(M.szoras)} y1={y(M.E)} y2={bh} />
            <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={0} x2={x(M.szoras)} y1={y(M.E)} y2={y(M.E)} />
            <Gorbe pontok={[[x(0), y(s.rf)], [x(cmlVeg), y(s.rf + M.meredekseg * cmlVeg)]]} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            {!dias &&
              c.eszkozok.map((a, i) => <Pont key={i} x={x(a.szoras)} y={y(a.E)} r={4} className="masodlagos" cimke={[L04_NEVEK.r1, L04_NEVEK.r2][i]} cimkeIrany="jobb" />)}
            <Pont x={x(0)} y={y(s.rf)} r={3.5} className="dias-pont tomor" cimke="r_f" cimkeIrany="bal" />
            <Pont x={x(M.szoras)} y={y(M.E)} r={dias ? 4 : 6} className={dias ? 'dias-pont tomor' : 'fokusz nagy'} cimke={dias ? 'r_M' : undefined} cimkeIrany="jobb" />
            {dias ? (
              <>
                <SvgMatek szoveg="E(r_M)" className="svg-matek tengely-belso" x={-6} y={y(M.E) + 4} textAnchor="end" />
                <SvgMatek szoveg="σ(r_M)" className="svg-matek tengely-belso" x={x(M.szoras)} y={bh + 18} textAnchor="middle" />
                {/* a dián: „Piaci portfólió” vezetővonallal az r_M ponthoz, „Tőkepiaci egyenes” az egyenes végénél */}
                <text className="dias-felirat" x={x(M.szoras) + 48} y={y(M.E) - 44}>
                  Piaci portfólió
                </text>
                <line className="dias-vezeto" x1={x(M.szoras) + 54} y1={y(M.E) - 38} x2={x(M.szoras) + 5} y2={y(M.E) - 5} />
                <text className="dias-felirat" x={x(cmlVeg) + 10} y={y(s.rf + M.meredekseg * cmlVeg) + 14}>
                  Tőkepiaci egyenes
                </text>
              </>
            ) : (
              <text className="mono-felirat fokusz-szoveg" x={x(M.szoras) + 12} y={y(M.E) + 18}>
                piaci portfólió: σ {pct(M.szoras, 1)}, E(r) {pct(M.E, 1)}
              </text>
            )}
          </>
        )
      }}
    </Abra>
  )
}

// ---------- A lecke ----------

function tanulsag(s: L06): string {
  if (s.w < 1e-9) return 'w = 0: minden pénz kockázatmentes, E(rP) = r_f, a béta és a szórás 0'
  if (Math.abs(s.w - 1) < 1e-9) return 'w = 100%: csak A van a portfólióban, a pont maga A'
  if (s.w < 1) return `${pct(1 - s.w, 1)} kockázatmentes befektetés (kölcsönadás): a pont r_f és A között van, a béta és a szórás w-szeres`
  return `${pct(s.w - 1, 1)}-nyi hitelt veszünk fel r_f-en, és azt is A-ba tesszük: a pont A-n túl, a szaggatott részen van; a béta és a szórás w-szeres`
}

export function Lecke06() {
  const [s, setS] = useState<L06>(L06_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const e = l06(s)
  const ok = e.hiba === undefined ? e : undefined
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const set = (p: Partial<L06>) => setS((v) => ({ ...v, ...p }))
  const cml = useMemo(() => l06Cml(s), [s])
  const kiemeles = aktiv === 'w' ? ['w'] : aktiv === 'rf' ? ['r_f'] : aktiv === 'EA' ? ['E(r_A)'] : aktiv === 'beta' ? ['\\beta_A'] : undefined
  const nev = l06Nev(s.eset)

  return (
    <LeckeKeret
      szam={6}
      cim="Tőkeallokációs és tőkepiaci egyenes"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="5.4" kiemelt={kiemeles} />}
      kijelzo={<EloKijelzo cimke={`E(rP), w = ${pct(s.w, 1)}`} ertek={ok ? pct(ok.E, 2) : '–'} alcim={ok ? `βP ${sz(ok.beta, 3)} · σ(rP) ${pct(ok.szoras, 2)} (szemléltető)` : undefined} />}
      fejlecCsuszka={
        <>
          <div className="eset-valaszto">
            <span>Diás példa:</span>
            <div className="szegmens" role="group" aria-label="Diás példa">
              <button aria-pressed={s.eset === '3ea'} onClick={() => setS(L06_3EA)}>
                3. ea: A 20%, β 1,6, r_f 8%
              </button>
              <button aria-pressed={s.eset === '5ea'} onClick={() => setS(L06_5EA)}>
                5. ea: D 12%, β 1,2, r_f 4%
              </button>
            </div>
          </div>
          <FejlecCsuszka
            cimke={`w, ${nev} súlya (a maradék 1 − w kockázatmentes)`}
            ertek={s.w}
            min={0}
            max={W_MAX}
            lepes={0.005}
            formaz={(w) => pct(w, 1)}
            skalaPontok={[0, 0.5, 1, 1.5, 2].map((w) => ({ ertek: w, cimke: pct(w, 0), alcimke: `E ${pct(kevertPortfolio(w, s.EA, s.betaA, s.rf).Er, 1)}` }))}
            onValtozik={(w) => set({ w })}
            onAktiv={aktival('w')}
          />
        </>
      }
      abra={<L06Abra s={s} e={e} nezet={nezet} onW={nezet === 'bovitett' ? (w) => set({ w }) : undefined} onAktiv={aktival('w')} />}
      tanulsag={ok && <Tanulsag>{tanulsag(s)}</Tanulsag>}
      kulcsSzamok={
        ok && (
          <KulcsSzamok
            sorok={[
              { cimke: 'E(rP) (5.4)', ertek: pct(ok.E, 2), kiemelt: true },
              { cimke: 'βP = w · βA (5.4)', ertek: sz(ok.beta, 3) },
              { cimke: s.w > 1 ? 'hitel r_f-en (1 − w < 0)' : 'kockázatmentes rész (1 − w)', ertek: pct(1 - s.w, 1) },
              { cimke: 'σ(rP) = w · σA (szemléltető)', ertek: pct(ok.szoras, 2) },
            ]}
          />
        )
      }
      bemenetek={
        <>
          <SzamBevitel cimke="w, súly" ertek={s.w} szazalek min={0} max={W_MAX} onValtozik={(w) => set({ w })} onAktiv={aktival('w')} />
          <SzamBevitel cimke={<>r<sub>f</sub></>} ertek={s.rf} szazalek onValtozik={(rf) => set({ rf })} onAktiv={aktival('rf')} />
          <SzamBevitel cimke={`E(r) ${nev}`} ertek={s.EA} szazalek onValtozik={(EA) => set({ EA })} onAktiv={aktival('EA')} />
          <SzamBevitel cimke={`β ${nev}`} ertek={s.betaA} onValtozik={(betaA) => set({ betaA })} onAktiv={aktival('beta')} />
          <CsuszkaMezo cimke={`σ(r) ${nev}, szemléltető`} ertek={s.sA} min={0.05} max={0.6} lepes={0.005} szazalek onValtozik={(sA) => set({ sA })} onAktiv={aktival('sA')} />
          <p className="megjegyzes">
            σ(r_A) a képlettárban nincs, ezért szemléltető érték (25%). A keverék szórása w · σ(r_A) (levezetés: 3.4, a kockázatmentes rész szórása és kovarianciája 0).
            {nezet === 'bovitett' && ' A P pontot húzhatod is az egyenesen.'}
          </p>
        </>
      }
      onAlaphelyzet={() => setS(s.eset === '3ea' ? L06_3EA : L06_5EA)}
      extra={
        <section className="lecke-kiegeszito">
          <h2>Tőkepiaci egyenes (3. ea 15. dia)</h2>
          <div className="kiegeszito-racs cml-racs">
            <CmlAbra s={s} nezet={nezet} />
            <div className="lecke-bemenetek">
              <KulcsSzamok
                sorok={[
                  { cimke: 'piaci portfólió: E(rM)', ertek: pct(cml.M.E, 2) },
                  { cimke: 'piaci portfólió: σ(rM)', ertek: pct(cml.M.szoras, 2) },
                  { cimke: 'az A részvény súlya benne', ertek: pct(cml.M.a1, 1) },
                  { cimke: 'a CML meredeksége', ertek: sz(cml.M.meredekseg, 3), kiemelt: true },
                ]}
              />
              <CsuszkaMezo cimke="k, a két eszköz korrelációja" ertek={s.k} min={-0.9} max={0.9} lepes={0.05} tizedes={2} onValtozik={(k) => set({ k })} />
              <p className="megjegyzes">
                A görbe a 4. lecke A és B részvényéből jön (A: E 20%, σ {pct(L04_ALAP.s1, 0)}; B: E 25%, σ {pct(L04_ALAP.s2, 0)}), az r_f a fenti példáé. A tőkepiaci egyenes r_f-ből
                a görbéhez húzott érintő (3.5); az érintési pont a görbe azon pontja, ahol (E − r_f)/σ a legnagyobb.{nezet === 'dias' && ' A pontfelhő szemléltető.'}
              </p>
            </div>
          </div>
        </section>
      }
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: '3. ea példa: állítsd w-t 150%-ra. Hol lesz a pont?',
              kesz: !!ok?.probak[0],
              keszSzoveg: ok && `Sikerült: E(rP) = ${pct(ok.E, 2)}, βP = ${sz(ok.beta, 2)}. 50%-nyi hitelt veszünk fel r_f-en, ezért a pont az egyenes szaggatott (hitelfelvételi) részén van.`,
            },
            {
              szoveg: '5. ea példa: keresd meg azt a w-t, amelynél E(rP) = 9%.',
              kesz: !!ok?.probak[1],
              keszSzoveg: ok && `Sikerült: w = ${pct(s.w, 1)}, βP = ${sz(ok.beta, 3)} (a képlettár szerint 0,625 és 0,75).`,
            },
            {
              szoveg: '3. ea példa: állítsd be, hogy a portfólió bétája 1 legyen.',
              kesz: !!ok?.probak[2],
              keszSzoveg: ok && `Sikerült: w = ${pct(s.w, 1)}, E(rP) = ${pct(ok.E, 2)}. A béta csak a kockázatos rész súlyától függ: w = 1 / βA.`,
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('5.4')}>5.4</a>, <a href={link.keplet('3.5')}>3.5</a> · Gyakorlás: <a href={link.gyakorlo('kevert-portfolio')}>Kockázatos és kockázatmentes eszköz keveréke</a>
        </>
      }
    />
  )
}

export function Elonezet06() {
  return <L06Abra s={L06_ALAP} e={l06(L06_ALAP)} nezet="dias" kicsi />
}
