// 9. lecke: az osztalékmodell (Gordon, 7.1) érzékenysége.
// A diákon ehhez nincs ábra (4. ea csak szöveg), ezért a diás nézet egyszerű r_E(g) vonal a dia
// jelöléseivel. Bővített: két grafikon azonos g-tengellyel: r_E(g) (a 45°-os r_E = g vonaltól mért
// távolság az osztalékhozam) és P_0(g) rögzített r_E mellett, aszimptotával g = r_E-nél.

import { scaleLinear } from 'd3-scale'
import { useState } from 'react'
import { d1, gordonRE } from '../calc/toke.ts'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { formatPenz } from '../lib/szam.ts'
import { link } from '../router.ts'
import { G_MAX, L09_4EA, L09_ALAP, L09_VIDEO, l09, type L09, type L09Eredmeny } from './szamitas/l09.ts'
import { Abra, Gorbe, NyilDef, Pont, Sav, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KulcsSzamok, PanelPar, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'g' | 'D0' | 'P0' | 'rE2' | null
type Ok = Extract<L09Eredmeny, { hiba: undefined }>

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`

export function ReAbra({ s, e, nezet, kicsi }: { s: L09; e: L09Eredmeny; nezet: Nezet; kicsi?: boolean }) {
  if (e.hiba !== undefined) return <ErvenytelenUzenet magassag={kicsi ? 180 : 280}>{e.hiba}</ErvenytelenUzenet>
  const dias = nezet === 'dias'
  const yMax = Math.max(...e.reGorbe.map(([, r]) => r)) * 1.08
  return (
    <Abra cim="A saját tőke költsége a növekedési ütem függvényében" dias={dias} arany={kicsi ? 0.75 : dias ? 0.55 : 0.75} minH={kicsi ? 180 : 240} margo={{ bal: dias ? 56 : 46, fent: 22, jobb: 18 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, G_MAX]).range([0, bw])
        const y = scaleLinear().domain([0, yMax]).range([bh, 0])
        const px = x(s.g)
        const py = y(e.rE)
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={dias ? [] : [0, 0.05, 0.1, 0.15]} formaz={pctTengely} cimke="g" nyil={dias} racs={dias ? undefined : -bh} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [] : 4} formaz={pctTengely} cimke="r_E" nyil={dias} racs={dias ? undefined : bw} />
            {!dias && (
              <>
                {/* a 45°-os r_E = g vonal: tőle mért távolság az osztalékhozam D_1 / P_0 */}
                <Gorbe pontok={[[x(0), y(0)], [x(G_MAX), y(G_MAX)]]} className="masodlagos halvanyabb" szaggatott />
                <line className="felbontas-piaci" x1={px} x2={px} y1={y(0)} y2={y(s.g)} />
                <line className="felbontas-egyedi" x1={px} x2={px} y1={y(s.g)} y2={py} />
                {!kicsi && (
                  <>
                    <text className="mono-felirat masodlagos-szoveg" x={px + 8} y={(y(0) + y(s.g)) / 2 + 4}>
                      g = {pct(s.g, 1)}
                    </text>
                    <SvgMatek szoveg={`D_1/P_0 = ${pct(e.osztalekHozam, 2)}`} className="mono-felirat fokusz-szoveg" x={px + 8} y={(y(s.g) + py) / 2 + 4} />
                    <text className="mono-felirat" x={x(G_MAX) - 4} y={y(G_MAX) + 16} textAnchor="end">
                      r_E = g
                    </text>
                  </>
                )}
              </>
            )}
            <Gorbe pontok={e.reGorbe.map(([g, r]) => [x(g), y(r)])} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            {!kicsi && (
              <>
                <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={px} x2={px} y1={py} y2={bh} />
                <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={0} x2={px} y1={py} y2={py} />
              </>
            )}
            <Pont x={px} y={py} r={dias ? 4 : 6} className={dias ? 'dias-pont tomor' : 'fokusz nagy'} cimke={kicsi || !dias ? undefined : `r_E = ${pct(e.rE, 2)}`} cimkeIrany="fent" />
            {dias && !kicsi && (
              <>
                <text className="dias-felirat" x={px} y={bh + 18} textAnchor="middle">
                  {pct(s.g, 1)}
                </text>
                <text className="dias-felirat" x={bw - 4} y={18} textAnchor="end">
                  {`D₀ = ${sz(s.D0, 2)} USD, P₀ = ${sz(s.P0, 2)} USD`}
                </text>
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

function ArAbra({ s, e }: { s: L09; e: Ok }) {
  const yMax = Math.max(s.P0 * 4, 100)
  return (
    <Abra cim="A részvény ára a növekedési ütem függvényében, rögzített r_E mellett" arany={0.75} minH={240} margo={{ bal: 54, fent: 22, jobb: 18 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, G_MAX]).range([0, bw])
        const y = scaleLinear().domain([0, yMax]).range([bh, 0])
        const pontok = e.arGorbe.filter(([, p]) => p <= yMax * 1.02).map(([g, p]) => [x(g), y(p)] as [number, number])
        const ax = x(Math.min(G_MAX, s.rE2))
        return (
          <>
            {s.rE2 < G_MAX && <Sav x0={ax} x1={bw} y0={0} y1={bh} className="sav-tiltott" />}
            <Tengely skala={x} irany="x" poz={bh} tickek={[0, 0.05, 0.1, 0.15]} formaz={pctTengely} cimke="g" racs={-bh} />
            <Tengely skala={y} irany="y" poz={0} tickek={4} formaz={(v) => sz(v, 0)} cimke="P_0 (USD)" racs={bw} />
            {s.rE2 < G_MAX && (
              <>
                <line className="aszimptota" x1={ax} x2={ax} y1={0} y2={bh} />
                <SvgMatek szoveg="g = r_E" className="mono-felirat" x={ax - 6} y={14} textAnchor="end" />
              </>
            )}
            <Gorbe pontok={pontok} className="fokusz" />
            {e.ar !== null && e.ar <= yMax && (
              <>
                <line className="vetulet" x1={x(s.g)} x2={x(s.g)} y1={y(e.ar)} y2={bh} />
                <Pont x={x(s.g)} y={y(e.ar)} r={6} className="fokusz nagy" cimke={`P₀ = ${formatPenz(e.ar, 2)}`} cimkeIrany={s.g > G_MAX * 0.5 ? 'bal' : 'jobb'} />
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

function tanulsag(s: L09, e: Ok, nezet: Nezet): string {
  const alap = `rE = ${pct(e.osztalekHozam, 2)} osztalékhozam (D₁/P₀) + ${pct(s.g, 1)} növekedés`
  if (nezet === 'dias') return alap
  if (e.ar === null) return `${alap}; a jobb oldali grafikonon g ≥ rE, ott a modell nem értelmezett (a nevező nem pozitív)`
  if (s.rE2 - s.g < 0.02) return 'g közel van rE-hez: a nevező (rE − g) kicsi, ezért P₀ nagyon érzékeny g-re'
  return `${alap}; rögzített rE mellett +1 százalékpont g ${formatPenz(e.arErzekenyseg ?? 0, 2)} USD-vel emeli P₀-t`
}

export function Lecke09() {
  const [s, setS] = useState<L09>(L09_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const e = l09(s)
  const ok = e.hiba === undefined ? e : undefined
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const set = (p: Partial<L09>) => setS((v) => ({ ...v, ...p }))
  const kiemeles = aktiv === 'g' ? ['g'] : aktiv === 'D0' ? ['D_0', 'D_1'] : aktiv === 'P0' ? ['P_0'] : aktiv === 'rE2' ? ['r_E'] : undefined
  const alap = s.eset === '4ea' ? L09_4EA : L09_VIDEO

  return (
    <LeckeKeret
      szam={9}
      cim="Osztalékmodell érzékenysége"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="7.1" kiemelt={kiemeles} />}
      kijelzo={<EloKijelzo cimke="rE, a saját tőke költsége" ertek={ok ? pct(ok.rE, 2) : '–'} alcim={ok ? `D₁ = ${formatPenz(ok.D1, 2)} USD · D₁/P₀ = ${pct(ok.osztalekHozam, 2)}` : undefined} />}
      fejlecCsuszka={
        <>
          <div className="eset-valaszto">
            <span>Példa:</span>
            <div className="szegmens" role="group" aria-label="Példa">
              <button aria-pressed={s.eset === '4ea'} onClick={() => setS(L09_4EA)}>
                4. ea: D₀ 4, P₀ 60, g 6%
              </button>
              <button aria-pressed={s.eset === 'video'} onClick={() => setS(L09_VIDEO)}>
                videó: D₀ 5, P₀ 70, g 4%
              </button>
            </div>
          </div>
          <FejlecCsuszka
            cimke="g, az osztalék növekedési üteme"
            ertek={s.g}
            min={0}
            max={G_MAX}
            lepes={0.001}
            formaz={(g) => pct(g, 1)}
            skalaPontok={[0, 0.04, 0.06, 0.1, 0.15].map((g) => ({ ertek: g, cimke: pct(g, 0), alcimke: ok ? `rE ${pct(gordonRE(d1(s.D0, g), s.P0, g), 1)}` : undefined }))}
            onValtozik={(g) => set({ g })}
            onAktiv={aktival('g')}
          />
        </>
      }
      abra={
        nezet === 'dias' ? (
          <ReAbra s={s} e={e} nezet={nezet} />
        ) : ok ? (
          <PanelPar
            balCim="rE a g függvényében (7.1, rE = D₁/P₀ + g)"
            jobbCim={`P₀ a g függvényében, rögzített rE = ${pct(s.rE2, 2)} mellett`}
            bal={<ReAbra s={s} e={e} nezet={nezet} />}
            jobb={<ArAbra s={s} e={ok} />}
          />
        ) : (
          <ErvenytelenUzenet>{e.hiba}</ErvenytelenUzenet>
        )
      }
      tanulsag={ok && <Tanulsag>{tanulsag(s, ok, nezet)}</Tanulsag>}
      kulcsSzamok={
        ok && (
          <KulcsSzamok
            sorok={[
              { cimke: 'D₁ = D₀ (1 + g)', ertek: `${formatPenz(ok.D1, 2)} USD` },
              { cimke: 'osztalékhozam D₁ / P₀', ertek: pct(ok.osztalekHozam, 2) },
              { cimke: 'rE = D₁ / P₀ + g', ertek: pct(ok.rE, 2), kiemelt: true },
              ...(nezet === 'bovitett'
                ? [
                    { cimke: `P₀ rögzített rE = ${pct(s.rE2, 2)} mellett`, ertek: ok.ar !== null ? `${formatPenz(ok.ar, 2)} USD` : 'nem értelmezett' },
                    { cimke: '+1 százalékpont g hatása P₀-ra', ertek: ok.arErzekenyseg !== null ? `+${formatPenz(ok.arErzekenyseg, 2)} USD` : '–' },
                  ]
                : []),
            ]}
          />
        )
      }
      bemenetek={
        <>
          <SzamBevitel cimke={<>D<sub>0</sub>, tavaly fizetett osztalék</>} ertek={s.D0} egyseg="USD" onValtozik={(D0) => set({ D0 })} onAktiv={aktival('D0')} />
          <SzamBevitel cimke={<>P<sub>0</sub>, mai árfolyam</>} ertek={s.P0} egyseg="USD" onValtozik={(P0) => set({ P0 })} onAktiv={aktival('P0')} />
          {nezet === 'bovitett' && (
            <CsuszkaMezo cimke="rE a jobb oldali grafikonhoz" ertek={s.rE2} min={0.02} max={0.2} lepes={0.0005} szazalek tizedes={2} onValtozik={(rE2) => set({ rE2 })} onAktiv={aktival('rE2')} />
          )}
          <p className="megjegyzes">
            Csapda (7.1): a „tavaly fizetett” osztalék D₀, ezt előbb fel kell szorozni (1 + g)-vel. {nezet === 'bovitett' && 'A jobb oldali grafikon rE-je alapból a példa eredménye, így a példa g-jénél P₀ éppen a megadott árfolyam.'}
          </p>
        </>
      }
      onAlaphelyzet={() => setS(alap)}
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: 'Bővített nézet: közelítsd g-t rE-hez (1 százalékponton belülre). Mi történik P₀-val?',
              kesz: !!ok?.probak[0],
              keszSzoveg: ok && ok.ar !== null && `P₀ = ${formatPenz(ok.ar, 2)} USD (a példa g-jénél ${formatPenz(alap.P0, 0)} USD). A nevező rE − g kicsi lett: a modell „nagyon érzékeny g-re” (7.1, korlátai).`,
            },
            {
              szoveg: 'Duplázd meg D₀-t (P₀ és g maradjon). Hogyan változik rE?',
              kesz: !!ok?.probak[1],
              keszSzoveg: ok && `rE = ${pct(ok.rE, 2)}: csak az osztalékhozam duplázódott (${pct(ok.osztalekHozam, 2)}), a g ugyanannyi maradt, ezért rE nem duplázódik.`,
            },
            {
              szoveg: 'A 4. ea adataival (D₀ 4, P₀ 60) keresd meg azt a g-t, amelynél rE = 15%.',
              kesz: !!ok?.probak[2],
              keszSzoveg: `Sikerült: g ≈ ${pct(s.g, 2)}.`,
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('7.1')}>7.1</a>, <a href={link.keplet('7.4')}>7.4</a> · Gyakorlás: <a href={link.gyakorlo('wacc')}>WACC teljes lánc</a>
        </>
      }
    />
  )
}

export function Elonezet09() {
  return <ReAbra s={L09_ALAP} e={l09(L09_ALAP)} nezet="dias" kicsi />
}
