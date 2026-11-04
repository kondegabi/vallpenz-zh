// 4. lecke: kételemű portfólió (3.1–3.4). Diás nézet: 3. ea 11–12. dia (hatékony portfóliók,
// minimális szórású pont, B₃; a részvények A és B, a minimum „Min σ”). Bővített: korreláció-csúszka a fejlécben, kiemelt görbe, kovariancia-pontdiagram.

import { scaleLinear } from 'd3-scale'
import { useMemo, useState } from 'react'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { L04_ALAP, L04_NEVEK, l04, l04Minta, type L04 } from './szamitas/l04.ts'
import { Abra, Gorbe, NyilDef, Pont, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { ElojelesNegyedek, Pontfelho } from './ui/szimulalt.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'a' | 'k' | 's1' | 's2' | 'E' | null

const KIEMELES: Record<Exclude<Param, null>, string[]> = {
  a: ['a_1^2', 'a_2^2', '2a_1a_2'],
  k: ['k_{1,2}'],
  s1: ['\\sigma^2(r_1)', '\\sigma(r_1)'],
  s2: ['\\sigma^2(r_2)', '\\sigma(r_2)'],
  E: [],
}

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`

export function L04Abra({ s, nezet, onA, kicsi }: { s: L04; nezet: Nezet; onA?: (a: number) => void; kicsi?: boolean }) {
  const e = l04(s)
  if (e.hiba) return <ErvenytelenUzenet>{e.hiba}</ErvenytelenUzenet>
  const dias = nezet === 'dias'
  const xMax = Math.max(s.s1, s.s2) * 1.15
  const Emin = Math.min(s.E1, s.E2)
  const Emax = Math.max(s.E1, s.E2)
  const pad = Math.max(0.01, (Emax - Emin) * 0.2)
  return (
    <Abra cim="Kételemű portfólió az E(r)–σ(r) síkon" dias={dias} arany={kicsi ? 0.75 : 0.62} minH={kicsi ? 180 : 280}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, xMax]).range([0, bw])
        const y = scaleLinear().domain([Emin - pad, Emax + pad]).range([bh, 0])
        const P = (g: { szoras: number; E: number }) => [x(g.szoras), y(g.E)] as [number, number]
        const v = e.valasztott
        const legkozelebbi = (px: number, py: number) => {
          let best = e.gorbe[0]
          let d = Infinity
          for (const g of e.gorbe) {
            const dd = (x(g.szoras) - px) ** 2 + (y(g.E) - py) ** 2
            if (dd < d) {
              d = dd
              best = g
            }
          }
          return best.a1
        }
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={dias ? [] : 5} formaz={pctTengely} cimke="σ(r)" nyil={dias} racs={dias ? undefined : -bh} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [] : 4} formaz={pctTengely} cimke="E(r)" nyil={dias} racs={dias ? undefined : bw} />
            <Gorbe pontok={e.gorbe.map(P)} className={dias ? 'dias-vonal vekony' : 'masodlagos halvanyabb'} />
            <Gorbe pontok={e.hatekonyAg.map(P)} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            {dias && !kicsi && (
              <text className="dias-felirat" x={x(e.hatekonyAg[0]?.szoras ?? 0) - 6} y={y(e.hatekonyAg[0]?.E ?? 0) - 12} textAnchor="end">
                Hatékony portfóliók
              </text>
            )}
            {!dias && !kicsi && (
              <>
                <line className="vetulet" x1={x(v.szoras)} x2={x(v.szoras)} y1={y(v.E)} y2={bh} />
                <line className="vetulet" x1={0} x2={x(v.szoras)} y1={y(v.E)} y2={y(v.E)} />
              </>
            )}
            <Pont x={x(s.s1)} y={y(s.E1)} jel={dias ? 'x' : 'kor'} className={dias ? 'dias-pont' : 'masodlagos'} cimke={L04_NEVEK.r1} cimkeIrany="bal" r={5} />
            <Pont x={x(s.s2)} y={y(s.E2)} jel={dias ? 'x' : 'kor'} className={dias ? 'dias-pont' : 'masodlagos'} cimke={L04_NEVEK.r2} cimkeIrany="bal" r={5} />
            <Pont x={x(e.min.szoras)} y={y(e.min.E)} className="dias-pont tomor" r={3.5} cimke={L04_NEVEK.min} cimkeIrany="bal" />
            {e.b3 && (
              <>
                <line className="nyil-b3" x1={x(v.szoras)} x2={x(e.b3.szoras)} y1={y(v.E)} y2={y(e.b3.E) + 8} markerEnd="url(#lecke-nyil)" />
                <Pont x={x(e.b3.szoras)} y={y(e.b3.E)} className={dias ? 'dias-pont tomor' : 'pozitiv'} r={dias ? 3.5 : 5} cimke="B_3" />
              </>
            )}
            <Pont
              x={x(v.szoras)}
              y={y(v.E)}
              className={dias ? 'dias-pont tomor' : 'fokusz nagy'}
              r={dias ? 4 : 7}
              cimke={dias || kicsi ? undefined : `a_1 = ${pct(s.a, 1)}`}
              onHuz={onA ? (px, py) => onA(legkozelebbi(px, py)) : undefined}
              onLep={onA ? (dx) => onA(Math.min(1, Math.max(0, s.a - dx * 0.01))) : undefined}
              ariaLabel={`Választott portfólió: a₁ ${pct(s.a, 1)}, σ ${pct(v.szoras, 1)}, E(r) ${pct(v.E, 1)}`}
            />
          </>
        )
      }}
    </Abra>
  )
}

function KovarianciaAbra({ s }: { s: L04 }) {
  const minta = useMemo(() => l04Minta(s), [s])
  const hatar = Math.max(s.s1, s.s2) * 3
  return (
    <Abra cim="A két hozam együttmozgása (szemléltető minta)" arany={0.9} minH={220} margo={{ bal: 46 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([-s.s1 * 3, s.s1 * 3]).range([0, bw])
        const y = scaleLinear().domain([-hatar, hatar]).range([bh, 0])
        return (
          <>
            <ElojelesNegyedek cx={x(0)} cy={y(0)} w={bw} h={bh} />
            <Tengely skala={x} irany="x" poz={bh} tickek={3} formaz={pctTengely} cimke="r_A − E(r_A)" />
            <Tengely skala={y} irany="y" poz={0} tickek={3} formaz={pctTengely} cimke="r_B − E(r_B)" />
            <Pontfelho pontok={minta.map(([a, b]) => [x(a), y(b)] as [number, number])} className="masodlagos" />
          </>
        )
      }}
    </Abra>
  )
}

function tanulsag(s: L04, e: Exclude<ReturnType<typeof l04>, { hiba: string }>): string {
  if (!e.hatekony) return 'ez a portfólió nem hatékony: a B₃ pont azonos kockázat mellett többet hoz'
  if (s.k === -1) return 'k = −1 mellett van olyan súly, amelynél a portfólió kockázata teljesen eltűnik'
  if (s.k === 1) return 'k = +1 mellett a görbe egyenes: a keverés nem csökkenti a kockázatot'
  return 'a súly mozgatásával a pont a görbén csúszik; minél kisebb a korreláció, annál jobban balra hajlik a görbe'
}

export function Lecke04() {
  const [s, setS] = useState<L04>(L04_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const e = l04(s)
  const ok = e.hiba ? null : e
  const set = (p: Partial<L04>) => setS((v) => ({ ...v, ...p }))
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)

  return (
    <LeckeKeret
      szam={4}
      cim="Kételemű portfólió"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="3.4" latexIdx={1} kiemelt={aktiv ? KIEMELES[aktiv] : undefined} />}
      kijelzo={<EloKijelzo cimke="σ(rP)" ertek={ok ? pct(ok.valasztott.szoras, 1) : 'nincs'} alcim={ok ? `E(rP) ${pct(ok.valasztott.E, 1)}` : undefined} />}
      fejlecCsuszka={
        <FejlecCsuszka
          cimke={<>Korreláció, k<sub>1,2</sub></>}
          ertek={s.k}
          min={-1}
          max={1}
          lepes={0.05}
          formaz={(v) => sz(v, 2)}
          skalaPontok={(ok?.skalaPontok ?? []).map((p) => ({ ertek: p.k, cimke: sz(p.k, 1), alcimke: `σ ${pct(p.szoras, 1)}` }))}
          onValtozik={(k) => set({ k: Math.round(k * 100) / 100 })}
          onAktiv={aktival('k')}
        />
      }
      abra={<L04Abra s={s} nezet={nezet} onA={(a) => set({ a: Math.round(a * 1000) / 1000 })} />}
      tanulsag={ok && <Tanulsag>{tanulsag(s, ok)}</Tanulsag>}
      kulcsSzamok={
        ok && (
          <KulcsSzamok
            sorok={[
              { cimke: 'a₁, az A részvény súlya', ertek: pct(s.a, 1) },
              { cimke: 'E(rP)', ertek: pct(ok.valasztott.E, 2) },
              { cimke: 'σ(rP)', ertek: pct(ok.valasztott.szoras, 2), kiemelt: true },
              { cimke: 'Min σ: az A súlya', ertek: pct(ok.min.a1, 1) },
              { cimke: 'Min σ: a portfólió szórása', ertek: pct(ok.min.szoras, 2) },
            ]}
          />
        )
      }
      bemenetek={
        <>
          <CsuszkaMezo cimke="a₁, az A részvény súlya" ertek={s.a} min={0} max={1} lepes={0.001} szazalek onValtozik={(a) => set({ a })} onAktiv={aktival('a')} />
          <details className="eszkozadatok">
            <summary>Eszközadatok</summary>
            <div className="eszkozadatok-racs">
              <SzamBevitel cimke="E(rA)" ertek={s.E1} szazalek min={-0.5} max={1} onValtozik={(E1) => set({ E1 })} onAktiv={aktival('E')} />
              <SzamBevitel cimke="σ(rA)" ertek={s.s1} szazalek min={0} max={2} onValtozik={(s1) => set({ s1 })} onAktiv={aktival('s1')} />
              <SzamBevitel cimke="E(rB)" ertek={s.E2} szazalek min={-0.5} max={1} onValtozik={(E2) => set({ E2 })} onAktiv={aktival('E')} />
              <SzamBevitel cimke="σ(rB)" ertek={s.s2} szazalek min={0} max={2} onValtozik={(s2) => set({ s2 })} onAktiv={aktival('s2')} />
            </div>
            <p className="megjegyzes">
              A és B a képlettár két részvénye (2.1, 3.3 példa); a képletben az A indexe 1, a B-é 2 (a₁ az A súlya). A minimális szórású portfólió „Min σ”: a 3. ea 11. diáján
              ezt „A” jelöli, itt az A részvénnyel keveredne.
            </p>
          </details>
        </>
      }
      onAlaphelyzet={() => setS(L04_ALAP)}
      extra={
        nezet === 'bovitett' && (
          <section className="lecke-kiegeszito">
            <h2>Hogyan mozog együtt a két hozam?</h2>
            <div className="kiegeszito-racs">
              <KovarianciaAbra s={s} />
              <p className="megjegyzes">
                Szemléltető, fix seedű minta a beállított szórásokkal és korrelációval. A jobb felső és a bal alsó negyedben a két eltérés szorzata pozitív
                (együtt mozognak), a másik kettőben negatív. A kovariancia ezeknek a szorzatoknak a valószínűséggel súlyozott összege (3.2).
              </p>
            </div>
          </section>
        )
      }
      probaldKi={
        ok && (
          <ProbaldKi
            feladatok={[
              {
                szoveg: 'k = −1 mellett keresd meg azt a súlyt, ahol σ(rP) = 0. (A képlettár szerint 81,8%.)',
                kesz: ok.probak[0],
                keszSzoveg: `Sikerült: a₁ = ${pct(s.a, 1)} mellett a portfólió kockázatmentes, E(rP) = ${pct(ok.valasztott.E, 1)}.`,
              },
              { szoveg: 'Állítsd a korrelációt +1-re: mi lesz a görbéből?', kesz: ok.probak[1], keszSzoveg: 'Egyenes a két eszköz között: tökéletes együttmozgásnál nincs diverzifikációs haszon.' },
              {
                szoveg: 'k = 0 mellett keresd meg a minimális szórású súlyt (a „Min σ” pontot).',
                kesz: ok.probak[2],
                keszSzoveg: `Sikerült: a₁ ≈ ${pct(ok.minK0, 1)}. Korreláció nélkül is csökken a kockázat a kisebbik szórás alá.`,
              },
            ]}
          />
        )
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('3.1')}>3.1</a>, <a href={link.keplet('3.3')}>3.3</a>, <a href={link.keplet('3.4')}>3.4</a> · Gyakorlás:{' '}
          <a href={link.gyakorlo('portfolio-ket')}>Kételemű portfólió</a>, <a href={link.gyakorlo('allapot-teljes')}>Teljes lánc</a>
        </>
      }
    />
  )
}

export function Elonezet04() {
  return <L04Abra s={L04_ALAP} nezet="dias" kicsi />
}
