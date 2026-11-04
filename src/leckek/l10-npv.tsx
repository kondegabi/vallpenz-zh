// 10. lecke: NPV-profil és IRR (6.1–6.2). A diákon nincs ehhez ábra (4. ea 19–21. dia csak
// szöveg), ezért a diás nézet egyszerű görbe a dia jelöléseivel; a bővített nézet kiemeli az
// IRR-t, a választott r-t és a pozitív / negatív NPV tartományt.

import { MinusIcon, PlusIcon } from '@phosphor-icons/react'
import { scaleLinear } from 'd3-scale'
import { useState } from 'react'
import { formatPenz } from '../lib/szam.ts'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { L10_ALAP, l10, type L10 } from './szamitas/l10.ts'
import { Abra, Gorbe, NyilDef, Pont, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'r' | 'cf' | null

const ezres = (v: number) => sz(v, 0)

export function L10Abra({ s, nezet, kicsi }: { s: L10; nezet: Nezet; kicsi?: boolean }) {
  const e = l10(s)
  const dias = nezet === 'dias'
  const npvk = e.profil.map((p) => p.npv)
  const lo = Math.min(0, ...npvk)
  const hi = Math.max(0, ...npvk)
  const pad = (hi - lo) * 0.08 || 1000
  return (
    <Abra cim="Az NPV a diszkontráta függvényében" dias={dias} arany={kicsi ? 0.75 : 0.58} minH={kicsi ? 180 : 280} margo={{ bal: 70 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, e.rMax]).range([0, bw])
        const y = scaleLinear().domain([lo - pad, hi + pad]).range([bh, 0])
        const pontok = e.profil.map((p) => [x(p.r), y(p.npv)] as [number, number])
        const y0 = y(0)
        // a görbe és a nulla közötti terület, előjel szerint külön
        const terulet = (pozitiv: boolean) => {
          const r = e.profil.map((p) => [x(p.r), y(pozitiv ? Math.max(0, p.npv) : Math.min(0, p.npv))] as [number, number])
          return `M${x(0)},${y0}L${r.map((p) => p.join(',')).join('L')}L${x(e.rMax)},${y0}Z`
        }
        const npvR = e.NPV
        // ha a választott r közel van az IRR-hez, a két felirat ne érjen össze: az NPV-felirat az
        // IRR-ponttal ellentétes oldalra kerül, egybeeséskor pedig csak az IRR-felirat marad
        const irrX = e.IRR !== null && e.IRR <= e.rMax ? x(e.IRR) : null
        const tav = irrX !== null ? x(s.r) - irrX : Infinity
        const kozel = Math.abs(tav) < 180
        const egybeesik = Math.abs(tav) < 8
        return (
          <>
            <NyilDef />
            {!dias && (
              <>
                <path className="terulet-pozitiv" d={terulet(true)} />
                <path className="terulet-negativ" d={terulet(false)} />
              </>
            )}
            <Tengely skala={x} irany="x" poz={y0} tickek={dias ? [] : 5} formaz={(v) => pct(v, 0)} cimke="r" nyil={dias} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [0] : 5} formaz={ezres} cimke="NPV" nyil={dias} racs={dias ? undefined : bw} />
            <Gorbe pontok={pontok} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            {!kicsi && (
              <>
                <line className={dias ? 'dias-szaggatott' : 'vetulet'} x1={x(s.r)} x2={x(s.r)} y1={y0} y2={y(npvR)} />
                <Pont
                  x={x(s.r)}
                  y={y(npvR)}
                  className={dias ? 'dias-pont tomor' : npvR >= 0 ? 'pozitiv' : 'negativ'}
                  r={dias ? 4 : 6}
                  cimke={dias || egybeesik ? undefined : `NPV(${pct(s.r, 1)}) = ${formatPenz(npvR, 0)}`}
                  cimkeIrany={kozel && tav < 0 ? 'bal' : 'jobb'}
                />
              </>
            )}
            {e.IRR !== null && e.IRR <= e.rMax && (
              <Pont x={x(e.IRR)} y={y0} className={dias ? 'dias-pont tomor' : 'fokusz nagy'} r={dias ? 4 : 6} cimke={kicsi || dias ? 'IRR' : egybeesik ? `IRR = ${pct(e.IRR, 2)} · NPV ≈ 0` : `IRR = ${pct(e.IRR, 2)}`} cimkeIrany={!dias && kozel && !egybeesik ? (tav < 0 ? 'jobb' : 'bal') : 'fent'} />
            )}
          </>
        )
      }}
    </Abra>
  )
}

function tanulsag(e: ReturnType<typeof l10>, r: number): string {
  if (e.IRR === null) return 'előjelváltás nélkül az NPV sehol sem nulla, ezért IRR nincs'
  if (Math.abs(r - e.IRR) < 0.0015) return 'itt az NPV nulla: ez a diszkontráta az IRR'
  return r < e.IRR
    ? 'r kisebb az IRR-nél, ezért az NPV pozitív: elfogadjuk'
    : 'r nagyobb az IRR-nél, ezért az NPV negatív: elutasítjuk'
}

export function Lecke10() {
  const [s, setS] = useState<L10>(L10_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const e = l10(s)
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const cfAllit = (i: number, v: number) => setS((x) => ({ ...x, cf: x.cf.map((c, j) => (j === i ? v : c)) }))

  return (
    <LeckeKeret
      szam={10}
      cim="NPV-profil és IRR"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="6.1" kiemelt={aktiv === 'r' ? ['r'] : aktiv === 'cf' ? ['CF_0', 'CF_1', 'CF_2', 'CF_n'] : undefined} />}
      kijelzo={<EloKijelzo cimke={`NPV ${pct(s.r, 1)} mellett`} ertek={`${formatPenz(e.NPV, 0)} USD`} alcim={e.IRR !== null ? `IRR ${pct(e.IRR, 2)}` : 'IRR nincs'} />}
      abra={<L10Abra s={s} nezet={nezet} />}
      tanulsag={<Tanulsag>{tanulsag(e, s.r)}</Tanulsag>}
      kulcsSzamok={
        <KulcsSzamok
          sorok={[
            { cimke: 'NPV a választott r-nél', ertek: `${formatPenz(e.NPV, 2)} USD`, kiemelt: true },
            { cimke: 'IRR', ertek: e.IRR !== null ? pct(e.IRR, 2) : 'nincs' },
            { cimke: 'NPV r = 0-nál (Σ CF)', ertek: `${formatPenz(e.profil[0].npv, 0)} USD` },
            { cimke: 'döntés', ertek: e.dontes },
          ]}
        />
      }
      bemenetek={
        <>
          <CsuszkaMezo cimke="r, diszkontráta" ertek={s.r} min={0} max={e.rMax} lepes={0.0005} szazalek tizedes={2} onValtozik={(r) => setS((x) => ({ ...x, r }))} onAktiv={aktival('r')} />
          <fieldset className="penzaramlasok">
            <legend>Pénzáramlások (USD)</legend>
            {s.cf.map((c, i) => (
              <SzamBevitel key={i} cimke={<>CF<sub>{i}</sub></>} ertek={c} tizedes={0} ezres egyseg="USD" onValtozik={(v) => cfAllit(i, v)} onAktiv={aktival('cf')} />
            ))}
            <div className="penzaramlas-gombok">
              <button className="gomb-szoveg" disabled={s.cf.length >= 7} onClick={() => setS((x) => ({ ...x, cf: [...x.cf, x.cf[x.cf.length - 1]] }))}>
                <PlusIcon size={14} aria-hidden /> év hozzáadása
              </button>
              <button className="gomb-szoveg" disabled={s.cf.length <= 2} onClick={() => setS((x) => ({ ...x, cf: x.cf.slice(0, -1) }))}>
                <MinusIcon size={14} aria-hidden /> utolsó év törlése
              </button>
            </div>
          </fieldset>
          {e.uzenet && <p className="figyelmeztetes">{e.uzenet}</p>}
        </>
      }
      onAlaphelyzet={() => setS(L10_ALAP)}
      probaldKi={
        <ProbaldKi
          feladatok={[
            { szoveg: 'Mekkora r-nél fordul az NPV negatívba? Állítsd r-t erre a pontra.', kesz: e.probak[0], keszSzoveg: `Sikerült: ${pct(s.r, 2)} mellett az NPV ≈ 0, és ez egyezik az IRR-rel (16,13%).` },
            { szoveg: 'Változtasd meg CF₀-t úgy, hogy 12%-on az NPV éppen 0 legyen.', kesz: e.probak[1], keszSzoveg: 'Sikerült: ekkora kezdő befektetésnél a projekt pont a 12%-os elvárt hozamot hozza (IRR = 12%).' },
            { szoveg: 'Keress olyan r-t, amelynél a projektet el kell utasítani.', kesz: e.probak[2], keszSzoveg: 'Sikerült: az IRR fölötti rátánál az NPV negatív.' },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('6.1')}>6.1</a>, <a href={link.keplet('6.2')}>6.2</a> · Gyakorlás: <a href={link.gyakorlo('npv-irr')}>NPV és IRR</a>
        </>
      }
    />
  )
}

export function Elonezet10() {
  return <L10Abra s={L10_ALAP} nezet="dias" kicsi />
}
