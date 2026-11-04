// 13. lecke: MM-tételek, tőkeköltség és tőkeáttétel (8.1, 8.3, 8.7, 8.8).
// Diás nézet: a Tőkeszerkezet diasor 14–16. diája: r_E, WACC = r_A és r_D a D/E függvényében, tökéletes piacon.
// Bővített: adóval (8.7, 8.8) a WACC* a tőkeáttétellel csökken; kapcsolóval a kockázatos hitel alakja
// (13–16. dia), amelyre nincs képlet, ezért „szemléltető alak”.

import { scaleLinear } from 'd3-scale'
import { useState } from 'react'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { L13_ALAP, L13_XMAX, l13, type L13, type L13Eredmeny } from './szamitas/l13.ts'
import { Abra, Gorbe, NyilDef, Pont, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet } from './ui/vezerlok.tsx'

type Ok = Exclude<L13Eredmeny, { hiba: string }>
type Param = 'rA' | 'rD' | 'DperE' | 'Tc' | 'kuszob' | null

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`

/** A végfeliratok y helyeit szétszórja, hogy ne fedjék egymást (legalább `min` px távolság). */
function szetszed(ys: number[], min: number): number[] {
  const rend = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)
  for (let k = 1; k < rend.length; k++) if (rend[k].y - rend[k - 1].y < min) rend[k].y = rend[k - 1].y + min
  const ki = [...ys]
  rend.forEach((r) => (ki[r.i] = r.y))
  return ki
}

export function L13Abra({ s, e, nezet, kicsi }: { s: L13; e: Ok; nezet: Nezet; kicsi?: boolean }) {
  const dias = nezet === 'dias'
  const yMax = Math.max(...e.gorbe.map((p) => Math.max(p.rE, p.WACC, p.rD)), s.rA) * 1.1
  return (
    <Abra
      cim="Tőkeköltség a tőkeáttétel (D/E) függvényében: r_E, WACC és r_D"
      dias={dias}
      arany={kicsi ? 0.75 : 0.6}
      minH={kicsi ? 180 : 300}
      margo={{ bal: kicsi ? 14 : 58, jobb: kicsi ? 14 : 100, fent: 22, lent: kicsi ? 14 : 42 }}
    >
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, L13_XMAX]).range([0, bw])
        const y = scaleLinear().domain([0, yMax]).range([bh, 0])
        const vonal = (f: (p: (typeof e.gorbe)[number]) => number) => e.gorbe.map((p) => [x(p.DperE), y(f(p))] as [number, number])
        const veg = e.gorbe[e.gorbe.length - 1]
        const cimkeY = szetszed([y(veg.rE), y(veg.WACC), y(veg.rD)], 15)
        const px = x(s.DperE)
        const kuszobX = x(Math.min(s.kuszob, L13_XMAX))
        return (
          <>
            <NyilDef />
            {/* a kockázatos hitel tartománya: szemléltető alak */}
            {e.kockazatos && s.kuszob < L13_XMAX && (
              <>
                <rect className="terulet-negativ" x={kuszobX} y={0} width={bw - kuszobX} height={bh} />
                <line className="dias-szaggatott" x1={kuszobX} x2={kuszobX} y1={0} y2={bh} />
                <SvgMatek szoveg="(D/E)*" className="mono-felirat" x={kuszobX + 6} y={14} />
                <text className="mono-felirat" x={bw - 6} y={14} textAnchor="end">
                  szemléltető alak
                </text>
              </>
            )}
            <Tengely skala={x} irany="x" poz={bh} tickek={kicsi ? [] : [0, 0.5, 1, 1.5, 2]} formaz={(v) => sz(v, 1)} nyil={dias} racs={dias || kicsi ? undefined : -bh} cimke={kicsi ? undefined : 'D/E'} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [...new Set([s.rD, s.rA])] : 5} formaz={pctTengely} nyil={dias} racs={dias ? undefined : bw} cimke={kicsi ? undefined : 'Tőkeköltség'} />
            <Gorbe pontok={vonal((p) => p.rD)} className={dias ? 'dias-vonal' : 'masodlagos'} />
            <Gorbe pontok={vonal((p) => p.WACC)} className={dias ? 'dias-vonal vastag' : 'osszesito'} />
            <Gorbe pontok={vonal((p) => p.rE)} className={dias ? 'dias-vonal' : 'fokusz'} />
            {!kicsi && (
              <>
                <SvgMatek szoveg="r_E" className={dias ? 'svg-matek dias-felirat' : 'mono-felirat fokusz-szoveg'} x={bw + 8} y={cimkeY[0] + 4} />
                <SvgMatek szoveg={e.Tc > 0 ? 'WACC*' : 'WACC = r_A'} className={dias ? 'svg-matek dias-felirat' : 'mono-felirat'} x={bw + 8} y={cimkeY[1] + 4} />
                <SvgMatek szoveg="r_D" className={dias ? 'svg-matek dias-felirat' : 'mono-felirat'} x={bw + 8} y={cimkeY[2] + 4} />
                <line className="dias-szaggatott" x1={px} x2={px} y1={y(e.rE)} y2={bh} />
                <Pont x={px} y={y(e.rE)} r={5} className={dias ? 'dias-pont tomor' : 'fokusz'} cimke={`r_E = ${pct(e.rE, 2)}`} cimkeIrany="fent" />
                <Pont x={px} y={y(e.WACC)} r={4} className={dias ? 'dias-pont tomor' : 'nagy'} cimke={`${e.Tc > 0 ? 'WACC*' : 'WACC'} = ${pct(e.WACC, 2)}`} cimkeIrany="lent" />
                <Pont x={px} y={y(e.rD)} r={4} className={dias ? 'dias-pont tomor' : 'nagy'} cimke={`r_D = ${pct(e.rD, 2)}`} cimkeIrany="lent" />
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

function tanulsag(s: L13, e: Ok): string {
  if (e.kockazatos && s.DperE > s.kuszob) return 'a küszöb fölött a hitelezők is kockázatot vállalnak: r_D emelkedik, ezért r_E már lassabban nő (szemléltető alak)'
  if (e.Tc > 0) return `adóval a hitel olcsóbb: a WACC* a tőkeáttétellel csökken (most ${pct(e.WACC, 2)}, tőkeáttétel nélkül ${pct(s.rA, 2)})`
  return 'a hitel olcsóbb, de a részvényesek hozama pont annyival nő, hogy a WACC = r_A nem változik: a tőkeszerkezet tökéletes piacon irreleváns'
}

export function Lecke13() {
  const [s, setS] = useState<L13>(L13_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const sx: L13 = { ...s, bovitett: nezet === 'bovitett' }
  const e = l13(sx)
  const ok = e.hiba === undefined ? e : null
  const set = (p: Partial<L13>) => setS((v) => ({ ...v, ...p }))
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const bovitett = nezet === 'bovitett'
  const kiemeles =
    aktiv === 'rA' ? [bovitett ? 'r_U' : 'r_A'] : aktiv === 'rD' ? ['r_D'] : aktiv === 'DperE' ? ['\\frac{D}{E}'] : aktiv === 'Tc' ? ['T_C', '(1 - T_C)'] : undefined
  // a fejléc-csúszka skálapontjainál a hozzá tartozó r_E
  const rEItt = (x: number) => {
    const r = l13({ ...sx, DperE: x })
    return r.hiba === undefined ? r.rE : undefined
  }

  return (
    <LeckeKeret
      szam={13}
      cim="MM-tételek: tőkeköltség és tőkeáttétel"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId={bovitett ? '8.7' : '8.3'} kiemelt={kiemeles} />}
      kijelzo={
        <EloKijelzo
          cimke={`r_E, D/E = ${sz(s.DperE, 2)}`}
          ertek={ok ? pct(ok.rE, 2) : '–'}
          alcim={ok ? `${ok.Tc > 0 ? 'WACC*' : 'WACC'} ${pct(ok.WACC, 2)} · r_D ${pct(ok.rD, 2)} · D/V ${sz(ok.wD, 3)}` : undefined}
        />
      }
      fejlecCsuszka={
        <FejlecCsuszka
          cimke="D/E, a tőkeáttétel (D/V = D/E / (1 + D/E))"
          ertek={s.DperE}
          min={0}
          max={L13_XMAX}
          lepes={0.01}
          formaz={(v) => `${sz(v, 2)} · D/V ${sz(v / (1 + v), 3)}`}
          skalaPontok={[0, 0.25, 0.5, 1, 1.5, 2].map((v) => {
            const r = rEItt(v)
            return { ertek: v, cimke: sz(v, 2), alcimke: r === undefined ? undefined : `r_E ${pct(r, 1)}` }
          })}
          onValtozik={(DperE) => set({ DperE })}
          onAktiv={aktival('DperE')}
        />
      }
      abra={ok ? <L13Abra s={sx} e={ok} nezet={nezet} /> : <ErvenytelenUzenet>{e.hiba}</ErvenytelenUzenet>}
      tanulsag={ok && <Tanulsag>{tanulsag(sx, ok)}</Tanulsag>}
      kulcsSzamok={
        ok && (
          <KulcsSzamok
            sorok={[
              { cimke: bovitett ? 'rE (8.7)' : 'rE (8.3)', ertek: pct(ok.rE, 2), kiemelt: true },
              { cimke: ok.Tc > 0 ? 'WACC* (8.8)' : 'WACC (8.1)', ertek: pct(ok.WACC, 2) },
              { cimke: 'E/V · D/V', ertek: `${sz(ok.wE, 4)} · ${sz(ok.wD, 4)}` },
              { cimke: 'rD az adott D/E-nél', ertek: pct(ok.rD, 2) },
              ...(ok.Tc === 0 ? [{ cimke: 'E/V · rE + D/V · rD (8.1)', ertek: pct(ok.ellenorzes81, 2) }] : []),
            ]}
          />
        )
      }
      bemenetek={
        <>
          <CsuszkaMezo cimke={<>r<sub>A</sub>, az eszközök hozama{bovitett ? ' (adóval r_U)' : ''}</>} ertek={s.rA} min={0.02} max={0.3} lepes={0.0025} szazalek onValtozik={(rA) => set({ rA })} onAktiv={aktival('rA')} />
          <CsuszkaMezo cimke={<>r<sub>D</sub>, a hitel hozama</>} ertek={s.rD} min={0} max={0.3} lepes={0.0025} szazalek onValtozik={(rD) => set({ rD })} onAktiv={aktival('rD')} />
          {bovitett && (
            <>
              <CsuszkaMezo cimke={<>T<sub>C</sub>, társasági adókulcs</>} ertek={s.Tc} min={0} max={0.5} lepes={0.005} szazalek onValtozik={(Tc) => set({ Tc })} onAktiv={aktival('Tc')} />
              <div className="eset-valaszto">
                <span>Hitel:</span>
                <div className="szegmens" role="group" aria-label="A hitel kockázata">
                  <button aria-pressed={!s.kockazatos} onClick={() => set({ kockazatos: false })}>
                    kockázatmentes
                  </button>
                  <button aria-pressed={s.kockazatos} onClick={() => set({ kockazatos: true })}>
                    kockázatos (szemléltető alak)
                  </button>
                </div>
              </div>
              {s.kockazatos && (
                <>
                  <CsuszkaMezo cimke="(D/E)*, ahol a hitel kockázatossá válik" ertek={s.kuszob} min={0.25} max={1.75} lepes={0.05} onValtozik={(kuszob) => set({ kuszob })} onAktiv={aktival('kuszob')} />
                  <p className="megjegyzes">
                    A diák (13–16.) szerint (D/E)* felett r_D emelkedik az r_A felé, és r_E növekedése lassul, de ehhez nem adnak képletet. Az ábra alakja ezért szemléltető: r_D(D/E) = r_D + (r_A − r_D) · (1 − √((D/E)* / (D/E))).
                  </p>
                </>
              )}
            </>
          )}
          {!bovitett && <p className="megjegyzes">Alapértékek: szem. 2 (r_A = 12%, r_D = 8%). Az adót és a kockázatos hitelt a bővített nézet adja hozzá.</p>}
        </>
      }
      onAlaphelyzet={() => setS(L13_ALAP)}
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: 'Told a D/E-t 1-re (a hitel és a saját tőke egyenlő). Mennyi lesz r_E?',
              kesz: !!ok?.probak[0],
              keszSzoveg: ok && `Sikerült: r_E = ${pct(ok.rE, 2)}. A WACC közben ${pct(ok.WACC, 2)} maradt, mert a drágább saját tőke ellensúlyozza az olcsóbb hitel növekvő súlyát.`,
            },
            {
              szoveg: 'Emeld r_D-t r_A-ig. Mi történik r_E-vel a D/E növelésekor?',
              kesz: !!ok?.probak[1],
              keszSzoveg: 'Ha r_D = r_A, a (r_A − r_D) tag nulla: r_E vízszintes, mert a hitelezők viselik az eszközök kockázatát.',
            },
            {
              szoveg: 'Bővített nézet: állítsd T_C-t 0-ra. Hova kerül a WACC*?',
              kesz: !!ok?.probak[2],
              keszSzoveg: 'Adó nélkül a WACC* vízszintes, éppen r_A-n: ez a tökéletes piac, az adópajzs hozza a csökkenést.',
            },
            {
              szoveg: 'Bővített nézet: kapcsold be a kockázatos hitelt, és vidd a D/E-t (D/E)* fölé.',
              kesz: !!ok?.probak[3],
              keszSzoveg: ok && `Sikerült: r_D már ${pct(ok.rD, 2)}, r_E emelkedése lassul. (Szemléltető alak: a diák nem adnak rá képletet.)`,
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('8.1')}>8.1</a>, <a href={link.keplet('8.3')}>8.3</a>, <a href={link.keplet('8.7')}>8.7</a>, <a href={link.keplet('8.8')}>8.8</a> · Gyakorlás:{' '}
          <a href={link.gyakorlo('mm-sajat-toke')}>Saját tőke hozama (MM II.)</a>, <a href={link.gyakorlo('ados-tokekoltseg')}>Saját tőke és WACC* adóval</a> · A WACC összetétele: <a href={link.lecke(11)}>11. lecke</a>
        </>
      }
    />
  )
}

export function Elonezet13() {
  const e = l13(L13_ALAP)
  return e.hiba === undefined ? <L13Abra s={L13_ALAP} e={e} nezet="dias" kicsi /> : null
}
