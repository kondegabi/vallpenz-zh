// 15. lecke: célzott pénzállomány: Baumol és Miller–Orr (9.1, 9.2).
// Diás nézet: Baumol–Allais–Tobin (a Készpénz- és likviditásmenedzsment diasor 11–13. diája): fűrészfogas pénzállomány
// és a tartási költség görbéi, a minimum a C_opt (13. dia: Vulcan Corporation). A költségképletekre nincs képlet a diákon,
// ezért a görbék a 9.1 modellből következő szemléltető alakok.
// Bővített nézet: Miller–Orr (14–17. dia): véletlen pénzállomány-pálya L és U* között; a pálya szemléltető.

import { scaleLinear } from 'd3-scale'
import { useState } from 'react'
import { baumolC } from '../calc/likviditas.ts'
import { sz } from '../gyakorlas/formaz.ts'
import { ujSeed } from '../lib/rng.ts'
import { link } from '../router.ts'
import {
  BAUMOL_ALAP,
  CIKLUSOK,
  MO_ALAP,
  MO_EMPEC,
  MO_IDOSZAKOK,
  baumol,
  millerOrr,
  type Baumol,
  type BaumolEredmeny,
  type MillerOrr,
  type MillerOrrEredmeny,
} from './szamitas/l15.ts'
import { Abra, Gorbe, NyilDef, Pont, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type OkB = Exclude<BaumolEredmeny, { hiba: string }>
type OkM = Exclude<MillerOrrEredmeny, { hiba: string }>
type BaumolAbra = 'fureszfog' | 'koltseg'

const usd = (v: number, t = 0) => `${sz(v, t)} USD`

/** A végfeliratok y helyeit szétszórja, hogy ne fedjék egymást (legalább `min` px távolság). */
function szetszed(ys: number[], min: number): number[] {
  const rend = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)
  for (let k = 1; k < rend.length; k++) if (rend[k].y - rend[k - 1].y < min) rend[k].y = rend[k - 1].y + min
  const ki = [...ys]
  rend.forEach((r) => (ki[r.i] = r.y))
  return ki
}

/** 12. dia: a pénzállomány fűrészfoga, C-ről 0-ra csökken, majd a felvétellel újra C; vízszintesen az átlag, C/2. */
export function FureszfogAbra({ b, e, nezet, kicsi }: { b: Baumol; e: OkB; nezet: Nezet; kicsi?: boolean }) {
  const dias = nezet === 'dias'
  const felirat = dias ? 'dias-felirat' : 'mono-felirat'
  const xMax = CIKLUSOK * e.LnapC
  return (
    <Abra
      cim="A pénzállomány fűrészfoga az idő függvényében, az átlagos C/2 szinttel"
      dias={dias}
      arany={kicsi ? 0.75 : 0.5}
      minH={kicsi ? 180 : 280}
      margo={{ bal: kicsi ? 14 : 58, jobb: kicsi ? 14 : 70, fent: 22, lent: kicsi ? 14 : 48 }}
    >
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, xMax]).range([0, bw])
        const y = scaleLinear().domain([0, b.C * 1.12]).range([bh, 0])
        const xTick = Array.from({ length: CIKLUSOK + 1 }, (_, k) => k * e.LnapC)
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={kicsi ? [] : xTick} formaz={(v) => sz(v, 1)} nyil={dias} racs={dias || kicsi ? undefined : -bh} cimke={kicsi ? undefined : 'idő (nap)'} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [0, b.C / 2, b.C] : 4} formaz={(v) => sz(v, 0)} nyil={dias} racs={dias ? undefined : bw} cimke={kicsi ? undefined : 'pénzállomány'} />
            <line className="dias-szaggatott" x1={0} x2={bw} y1={y(e.atlag)} y2={y(e.atlag)} />
            <Gorbe pontok={e.fureszfog.map(([t, v]) => [x(t), y(v)] as [number, number])} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            {!kicsi && (
              <>
                <SvgMatek szoveg="C" className={`svg-matek ${felirat}`} x={bw + 8} y={y(b.C) + 4} />
                <SvgMatek szoveg="C/2" className={`svg-matek ${felirat}`} x={bw + 8} y={y(e.atlag) + 4} />
                <text className={felirat} x={x(e.LnapC / 2)} y={y(b.C) - 8} textAnchor="middle">
                  {`${sz(e.LnapC, 1)} nap`}
                </text>
                <Pont x={x(0)} y={y(b.C)} r={4} className={dias ? 'dias-pont tomor' : 'nagy'} cimke={`C = ${sz(b.C, 0)}`} cimkeIrany="jobb" />
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

/** 11. dia: az elmaradt hozam (nő), a tranzakciós költség (csökken) és az összegük (U alakú), minimuma C_opt-nál. */
export function KoltsegAbra({ b, e, nezet }: { b: Baumol; e: OkB; nezet: Nezet }) {
  const dias = nezet === 'dias'
  const felirat = dias ? 'dias-felirat' : 'mono-felirat'
  return (
    <Abra
      cim="Éves költség a felvett összeg (C) függvényében: elmaradt hozam, tranzakciós költség és összegük"
      dias={dias}
      arany={0.5}
      minH={280}
      margo={{ bal: 58, jobb: 130, fent: 22, lent: 48 }}
    >
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, e.cMax]).range([0, bw])
        const y = scaleLinear().domain([0, e.yMax]).range([bh, 0])
        // a görbe ábrán kívülre nyúló részét nem rajzoljuk
        const vonal = (f: (p: (typeof e.koltseg)[number]) => number) =>
          e.koltseg.filter((p) => f(p) <= e.yMax).map((p) => [x(p.C), y(f(p))] as [number, number])
        const veg = e.koltseg[e.koltseg.length - 1]
        const cimkeY = szetszed([y(veg.nyito), y(Math.min(veg.ossz, e.yMax)), y(Math.min(veg.kereskedesi, e.yMax))], 28)
        const opt = e.Copt
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={dias ? [opt] : 5} formaz={(v) => sz(v, 0)} nyil={dias} racs={dias ? undefined : -bh} cimke="C" />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [] : 5} formaz={(v) => sz(v, 0)} nyil={dias} racs={dias ? undefined : bw} cimke="éves költség" />
            <Gorbe pontok={vonal((p) => p.nyito)} className={dias ? 'dias-vonal' : 'masodlagos'} />
            <Gorbe pontok={vonal((p) => p.kereskedesi)} className={dias ? 'dias-vonal' : 'osszesito'} />
            <Gorbe pontok={vonal((p) => p.ossz)} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            <text className={felirat} x={bw + 8} y={cimkeY[0] + 4}>
              Elmaradt hozam
            </text>
            <text className={felirat} x={bw + 8} y={cimkeY[1] + 4}>
              Összköltség
            </text>
            <text className={felirat} x={bw + 8} y={cimkeY[2] + 4}>
              Tranzakciós
            </text>
            <line className="dias-szaggatott" x1={x(opt)} x2={x(opt)} y1={y(e.osszOpt)} y2={bh} />
            <SvgMatek szoveg="C_opt" className={`svg-matek ${felirat}`} x={x(opt)} y={bh + 32} textAnchor="middle" />
            <Pont x={x(opt)} y={y(e.osszOpt)} r={4} className="dias-pont tomor" cimke={`${sz(e.osszOpt, 0)} USD/év`} cimkeIrany="fent" />
            {Math.abs(b.C - opt) > 0.005 * opt && e.ossz <= e.yMax && (
              <Pont x={x(b.C)} y={y(e.ossz)} r={5} className={dias ? 'dias-pont tomor' : 'fokusz'} cimke={`C = ${sz(b.C, 0)}`} cimkeIrany={b.C > e.cMax * 0.8 ? 'bal' : 'jobb'} />
            )}
          </>
        )
      }}
    </Abra>
  )
}

/** 14–17. dia: a szemléltető pénzállomány-pálya L és U* között; C*-ról indul, a korlátnál C*-ra ugrik. */
export function MillerOrrAbra({ m, e, nezet, kicsi }: { m: MillerOrr; e: OkM; nezet: Nezet; kicsi?: boolean }) {
  const dias = nezet === 'dias'
  const felirat = dias ? 'dias-felirat' : 'mono-felirat'
  return (
    <Abra
      cim="Miller–Orr: szemléltető pénzállomány-pálya az alsó korlát (L), a célérték (C*) és a felső korlát (U*) között"
      dias={dias}
      arany={kicsi ? 0.75 : 0.5}
      minH={kicsi ? 180 : 300}
      margo={{ bal: kicsi ? 14 : 70, jobb: kicsi ? 14 : 50, fent: 22, lent: kicsi ? 14 : 48 }}
    >
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, MO_IDOSZAKOK]).range([0, bw])
        const y = scaleLinear().domain([e.yMin, e.yMax]).range([bh, 0])
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={kicsi ? [] : [0, 10, 20, 30, 40, 50, 60]} formaz={(v) => sz(v, 0)} nyil={dias} cimke={kicsi ? undefined : 'időszak'} />
            <Tengely skala={y} irany="y" poz={0} tickek={kicsi ? [] : [m.L, e.C, e.U]} formaz={(v) => sz(v, 0)} nyil={dias} cimke={kicsi ? undefined : 'pénzállomány'} />
            {[m.L, e.C, e.U].map((v, i) => (
              <line key={i} className={i === 1 ? 'dias-szaggatott' : dias ? 'dias-vonal' : 'masodlagos'} x1={0} x2={bw} y1={y(v)} y2={y(v)} />
            ))}
            <Gorbe pontok={e.ut.map(([t, v]) => [x(t), y(v)] as [number, number])} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            {!kicsi && (
              <>
                <SvgMatek szoveg="U*" className={`svg-matek ${felirat}`} x={bw + 8} y={y(e.U) + 4} />
                <SvgMatek szoveg="C*" className={`svg-matek ${felirat}`} x={bw + 8} y={y(e.C) + 4} />
                <SvgMatek szoveg="L" className={`svg-matek ${felirat}`} x={bw + 8} y={y(m.L) + 4} />
                {e.esemenyek.map((ev, i) => (
                  <Pont key={i} x={x(ev.t)} y={y(ev.fajta === 'vetel' ? e.U : m.L)} r={3.5} className={dias ? 'dias-pont tomor' : 'nagy'} />
                ))}
                <text className={felirat} x={bw - 4} y={14} textAnchor="end">
                  szemléltető pálya
                </text>
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

function tanulsagBaumol(b: Baumol, e: OkB): string {
  if (Math.abs(b.C - e.Copt) <= 0.005 * e.Copt) return `éppen az optimumnál vagy: az elmaradt hozam és a tranzakciós költség egyenlő (${usd(e.nyito, 0)}/év), az összköltség a legkisebb`
  return b.C < e.Copt
    ? `C_opt alatt túl sokszor kell pénzt felvenni: a tranzakciós költség (${usd(e.kereskedesi, 0)}) nagyobb az elmaradt hozamnál (${usd(e.nyito, 0)})`
    : `C_opt fölött túl sok pénz áll kihasználatlanul: az elmaradt hozam (${usd(e.nyito, 0)}) nagyobb a tranzakciós költségnél (${usd(e.kereskedesi, 0)})`
}

function tanulsagMo(e: OkM): string {
  const v = e.esemenyek.filter((x) => x.fajta === 'vetel').length
  const el = e.esemenyek.length - v
  return `a pénzállomány a sávban szabadon mozog, és csak a korlátnál avatkozunk be: a szemléltető pályán ${v}-szor értünk U*-hoz (értékpapírt veszünk), ${el}-szor L-hez (értékpapírt adunk el), és mindig C*-ra állunk vissza`
}

/** A bővített nézet gyorsgombjai: az adott paraméterek megegyeznek-e az előbeállítással (a seed nem számít). */
function ugyanaz(a: MillerOrr, p: MillerOrr): boolean {
  return a.L === p.L && a.F === p.F && a.sigma === p.sigma && a.r === p.r
}

export function Lecke15() {
  const [b, setB] = useState<Baumol>(BAUMOL_ALAP)
  const [m, setM] = useState<MillerOrr>(MO_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [abra, setAbra] = useState<BaumolAbra>('fureszfog')
  const bovitett = nezet === 'bovitett'
  const setBaumol = (p: Partial<Baumol>) => setB((v) => ({ ...v, ...p }))
  const setMo = (p: Partial<MillerOrr>) => setM((v) => ({ ...v, ...p }))

  // a C csúszka határa az aktuális optimumhoz igazodik
  const copt = b.d > 0 && b.r > 0 && b.F > 0 ? baumolC(365 * b.d, b.F, b.r) : 10000
  const cMaxCs = Math.max(1000, Math.ceil((2.2 * copt) / 100) * 100)
  const bx: Baumol = { ...b, C: Math.min(b.C, cMaxCs) }
  const eb = baumol(bx)
  const okB = eb.hiba === undefined ? eb : null
  const em = millerOrr(m)
  const okM = em.hiba === undefined ? em : null

  const koltsegItt = (C: number) => {
    const r = baumol({ ...bx, C })
    return r.hiba === undefined ? r.ossz : undefined
  }

  return (
    <LeckeKeret
      szam={15}
      cim="Célzott pénzállomány: Baumol és Miller–Orr"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId={bovitett ? '9.2' : '9.1'} />}
      kijelzo={
        bovitett ? (
          <EloKijelzo cimke="C*, a célérték" ertek={okM ? sz(okM.C, 1) : '–'} alcim={okM ? `L ${sz(m.L, 0)} · U* ${sz(okM.U, 0)} · átlag ${sz(okM.atlag, 0)}` : undefined} />
        ) : (
          <EloKijelzo cimke="C_opt, az optimális felvétel" ertek={okB ? usd(okB.Copt) : '–'} alcim={okB ? `L_opt ${sz(okB.Lnap, 1)} nap · T = ${sz(okB.T, 0)} USD/év` : undefined} />
        )
      }
      fejlecCsuszka={
        bovitett ? undefined : (
          <FejlecCsuszka
            cimke="C, egy felvétel összege (USD)"
            ertek={bx.C}
            min={10}
            max={cMaxCs}
            lepes={1}
            formaz={(v) => usd(v)}
            skalaPontok={[0.25, 0.5, 1, 1.5, 2].map((k) => {
              const C = Math.round(k * copt)
              const K = koltsegItt(C)
              return { ertek: C, cimke: sz(C, 0), alcimke: K === undefined ? undefined : `${sz(K, 0)} /év` }
            })}
            onValtozik={(C) => setBaumol({ C })}
           
          />
        )
      }
      abra={
        bovitett ? (
          okM ? <MillerOrrAbra m={m} e={okM} nezet={nezet} /> : <ErvenytelenUzenet>{em.hiba}</ErvenytelenUzenet>
        ) : okB ? (
          <>
            <div className="eset-valaszto">
              <span>Ábra:</span>
              <div className="szegmens" role="group" aria-label="Melyik ábra látszik">
                <button aria-pressed={abra === 'fureszfog'} onClick={() => setAbra('fureszfog')}>
                  Pénzállomány az időben
                </button>
                <button aria-pressed={abra === 'koltseg'} onClick={() => setAbra('koltseg')}>
                  Költségek C függvényében
                </button>
              </div>
            </div>
            {abra === 'fureszfog' ? <FureszfogAbra b={bx} e={okB} nezet={nezet} /> : <KoltsegAbra b={bx} e={okB} nezet={nezet} />}
          </>
        ) : (
          <ErvenytelenUzenet>{eb.hiba}</ErvenytelenUzenet>
        )
      }
      tanulsag={bovitett ? okM && <Tanulsag>{tanulsagMo(okM)}</Tanulsag> : okB && <Tanulsag>{tanulsagBaumol(bx, okB)}</Tanulsag>}
      kulcsSzamok={
        bovitett
          ? okM && (
              <KulcsSzamok
                sorok={[
                  { cimke: 'C* (9.2)', ertek: sz(okM.C, 1), kiemelt: true },
                  { cimke: 'U* = 3·C* − 2·L', ertek: sz(okM.U, 1) },
                  { cimke: 'L, az alsó korlát', ertek: sz(m.L, 0) },
                  { cimke: 'Átlagos pénzállomány (4·C* − L)/3', ertek: sz(okM.atlag, 1) },
                ]}
              />
            )
          : okB && (
              <KulcsSzamok
                sorok={[
                  { cimke: 'T = 365 · d', ertek: usd(okB.T) },
                  { cimke: 'C_opt (9.1)', ertek: usd(okB.Copt), kiemelt: true },
                  { cimke: 'L_opt (9.1)', ertek: `${sz(okB.Lev, 4)} év = ${sz(okB.Lnap, 1)} nap` },
                  { cimke: 'Átlagos pénzállomány, C/2', ertek: usd(okB.atlag, 1) },
                  { cimke: 'Elmaradt hozam, r · C/2', ertek: usd(okB.nyito, 1) },
                  { cimke: 'Tranzakciós költség, F · T/C', ertek: usd(okB.kereskedesi, 1) },
                  { cimke: 'Éves összköltség', ertek: usd(okB.ossz, 1) },
                ]}
              />
            )
      }
      bemenetek={
        bovitett ? (
          <>
            <div className="eset-valaszto">
              <span>Példa:</span>
              <div className="szegmens" role="group" aria-label="Előbeállítás">
                <button aria-pressed={ugyanaz(m, MO_ALAP)} onClick={() => setM((v) => ({ ...MO_ALAP, seed: v.seed }))}>
                  Vizsgafeladat (17. dia)
                </button>
                <button aria-pressed={ugyanaz(m, MO_EMPEC)} onClick={() => setM((v) => ({ ...MO_EMPEC, seed: v.seed }))}>
                  EMPEC (16. dia)
                </button>
              </div>
            </div>
            <SzamBevitel cimke={<>L, az alsó korlát</>} ertek={m.L} min={0} tizedes={0} ezres onValtozik={(L) => setMo({ L })} />
            <SzamBevitel cimke={<>F, egy ügylet fix költsége</>} ertek={m.F} min={0.01} tizedes={2} ezres onValtozik={(F) => setMo({ F })} />
            <SzamBevitel cimke={<>σ, a pénzáramlás szórása (időszakonként)</>} ertek={m.sigma} min={0.01} tizedes={0} ezres onValtozik={(sigma) => setMo({ sigma })} />
            <SzamBevitel cimke={<>r, a hozam (időszakonként)</>} ertek={m.r} szazalek min={0.0000001} tizedes={m.r < 0.0005 ? 7 : 3} onValtozik={(r) => setMo({ r })} />
            <button className="gomb gomb-masodlagos" onClick={() => setMo({ seed: ujSeed() })}>
              Új szemléltető pálya
            </button>
            <p className="megjegyzes">
              A pálya szemléltető: a diák is csak példa-útvonalat mutatnak. Itt σ szórású normális változások adják, C*-ról indul, és U*-nál vagy L-nél C*-ra ugrik vissza. A 17. dia havi adatokkal számol, a 16. dia (EMPEC, lengyel távfűtő) naponkéntiekkel; a 16. dia a C*-ot lefelé kerekíti (600 616,6 → 600 616), és az U*-ot már ebből számolja (1 101 848).
            </p>
          </>
        ) : (
          <>
            <CsuszkaMezo cimke="d, a napi pénzkiáramlás (USD)" ertek={b.d} min={10} max={500} lepes={10} tizedes={0} onValtozik={(d) => setBaumol({ d })} />
            <CsuszkaMezo cimke={<>r, az éves hozam</>} ertek={b.r} min={0.005} max={0.2} lepes={0.0025} szazalek onValtozik={(r) => setBaumol({ r })} />
            <CsuszkaMezo cimke="F, egy pénzfelvétel költsége (USD)" ertek={b.F} min={1} max={100} lepes={1} tizedes={0} onValtozik={(F) => setBaumol({ F })} />
            <button className="gomb gomb-masodlagos" onClick={() => setBaumol({ C: Math.round(copt) })}>
              C beállítása az optimumra
            </button>
            <p className="megjegyzes">
              Alapértékek: 13. dia (Vulcan Corporation): d = 100 USD, r = 5%, F = 10 USD → T = 36 500, C_opt = 3821, L_opt = 38,2 nap. A 11. dia csak a görbék alakját mutatja; a költségek (r · C/2 és F · T/C) a 9.1 modellből következő szemléltető alakok, összegük minimuma éppen C_opt.
            </p>
          </>
        )
      }
      onAlaphelyzet={() => {
        setB(BAUMOL_ALAP)
        setM(MO_ALAP)
      }}
      probaldKi={
        bovitett ? (
          <ProbaldKi
            feladatok={[
              {
                szoveg: 'Duplázd σ-t 400-ra. Mennyivel lesz távolabb C* az L-től?',
                kesz: !!okM?.probak[0],
                keszSzoveg: okM && `Sikerült: C* − L = ${sz(okM.C - m.L, 1)}, az alapérték ∛4 ≈ 1,59-szerese: a köbgyök miatt a kétszeres szórás nem kétszeres sávot hoz.`,
              },
              {
                szoveg: 'Válaszd az EMPEC példát (16. dia). Mekkora az U*?',
                kesz: !!okM?.probak[1],
                keszSzoveg: okM && `Sikerült: C* ≈ ${sz(okM.C, 0)}, U* ≈ ${sz(okM.U, 0)}; a sáv ugyanúgy a 3·C* − 2·L szabályból jön, csak a számok nagyok (napi adatok).`,
              },
              {
                szoveg: 'Emeld F-et a duplájára (20). Mi történik a sávval?',
                kesz: !!okM?.probak[2],
                keszSzoveg: okM && `Sikerült: U* − L = ${sz(okM.U - m.L, 0)}, szélesebb a sáv: drágább ügyletnél ritkábban avatkozunk be.`,
              },
            ]}
          />
        ) : (
          <ProbaldKi
            feladatok={[
              {
                szoveg: 'Told F-et a négyszeresére (40 USD). Mi történik C_opt-tal?',
                kesz: !!okB?.probak[0],
                keszSzoveg: okB && `Sikerült: C_opt = ${usd(okB.Copt)}, kétszer annyi: a gyökvonás miatt a négyszeres költség csak kétszeres felvételt hoz.`,
              },
              {
                szoveg: 'Duplázd r-t 10%-ra. Hogyan változik C_opt?',
                kesz: !!okB?.probak[1],
                keszSzoveg: okB && `Sikerült: C_opt = ${usd(okB.Copt)}: ha többet hoz az értékpapír, kevesebb pénzt tartunk kézben, és gyakrabban veszünk fel.`,
              },
              {
                szoveg: 'Vidd C-t az optimum dupláját meghaladó értékre, majd nézd a költségek ábráját.',
                kesz: !!okB?.probak[2],
                keszSzoveg: okB && `Sikerült: az összköltség ${usd(okB.ossz, 0)}, a minimum ${usd(okB.osszOpt, 0)}: a nagy felvételnél az elmaradt hozam nő meg.`,
              },
            ]}
          />
        )
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('9.1')}>9.1</a>, <a href={link.keplet('9.2')}>9.2</a> · Gyakorlás: <a href={link.gyakorlo('baumol')}>Baumol-modell</a>, <a href={link.gyakorlo('miller-orr')}>Miller–Orr-modell</a> · Az előző lecke:{' '}
          <a href={link.lecke(14)}>14. lecke</a>
        </>
      }
    />
  )
}

export function Elonezet15() {
  const e = baumol(BAUMOL_ALAP)
  return e.hiba === undefined ? <FureszfogAbra b={BAUMOL_ALAP} e={e} nezet="dias" kicsi /> : null
}
