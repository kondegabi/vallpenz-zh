// 14. lecke: adómegtakarítás és optimális tőkeszerkezet (8.4, 8.6, 8.10).
// Diás nézet: a Tőkeszerkezet diasor 28. diája (Ross et al. 560. o.): vízszintes V_U, emelkedő V_L = V_U + T_C · D,
// a „tényleges vállalatérték” görbéje D*-nál csúcsosodik. Bővített: a nehézségek költségének mérete is állítható.
// A PV(pénzügyi nehézségek)-re nincs képlet a diákon, ezért az alakja szemléltető.

import { scaleLinear } from 'd3-scale'
import { useState } from 'react'
import { sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { L14_ALAP, L14_DMAX, l14, type L14, type L14Eredmeny } from './szamitas/l14.ts'
import { Abra, Gorbe, NyilDef, Pont, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Ok = Exclude<L14Eredmeny, { hiba: string }>
type Param = 'Tc' | 'D' | 'nehezseg' | 'VU' | null

const musd = (v: number, t = 1) => `${sz(v, t)} M USD`

/** Magyar felirat, alatta kicsiben a megjegyzés vagy az angol eredeti. */
function Felirat({ x, y, hu, kicsi, anchor = 'start', className }: { x: number; y: number; hu: string; kicsi?: string; anchor?: 'start' | 'middle' | 'end'; className: string }) {
  return (
    <text className={className} x={x} y={y} textAnchor={anchor}>
      <tspan>{hu}</tspan>
      {kicsi && (
        <tspan className="eredeti-felirat" x={x} dy={13}>
          {kicsi}
        </tspan>
      )}
    </text>
  )
}

/** A végfeliratok y helyeit szétszórja, hogy ne fedjék egymást (legalább `min` px távolság). */
function szetszed(ys: number[], min: number): number[] {
  const rend = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)
  for (let k = 1; k < rend.length; k++) if (rend[k].y - rend[k - 1].y < min) rend[k].y = rend[k - 1].y + min
  const ki = [...ys]
  rend.forEach((r) => (ki[r.i] = r.y))
  return ki
}

export function L14Abra({ s, e, nezet, kicsi }: { s: L14; e: Ok; nezet: Nezet; kicsi?: boolean }) {
  const dias = nezet === 'dias'
  const felirat = dias ? 'dias-felirat' : 'mono-felirat'
  return (
    <Abra
      cim="Vállalatérték az adósság függvényében: V_U, V_L és a tényleges érték"
      dias={dias}
      arany={kicsi ? 0.75 : 0.62}
      minH={kicsi ? 180 : 320}
      margo={{ bal: kicsi ? 14 : 58, jobb: kicsi ? 14 : 150, fent: 22, lent: kicsi ? 14 : 48 }}
    >
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, L14_DMAX]).range([0, bw])
        const y = scaleLinear().domain([e.yMin, e.yMax]).range([bh, 0])
        const vL = (D: number) => s.VU + s.Tc * D
        const gorbe = e.gorbe.filter((_, i) => i % 2 === 0).map(([D, V]) => [x(D), y(V)] as [number, number])
        // a két rés: az adómegtakarítás (V_U és V_L között) és a nehézségek költsége (V_L és a görbe között)
        const tsTerulet = `M${x(0)},${y(s.VU)} L${x(L14_DMAX)},${y(s.VU)} L${x(L14_DMAX)},${y(vL(L14_DMAX))} Z`
        const nehezTerulet = `M${e.gorbe
          .filter((_, i) => i % 2 === 0)
          .map(([D]) => `${x(D)},${y(vL(D))}`)
          .join(' L')} L${[...gorbe].reverse().map(([px, py]) => `${px},${py}`).join(' L')} Z`
        const vegV = e.gorbe[e.gorbe.length - 1][1]
        const cimkeY = szetszed([y(vL(L14_DMAX)), y(s.VU), y(vegV)], 28)
        const px = x(s.D)
        const tsMid = y((s.VU + vL(L14_DMAX * 0.3)) / 2)
        const tsPx = Math.abs(y(s.VU) - y(vL(L14_DMAX * 0.3)))
        const nehezMid = y((vL(L14_DMAX) + vegV) / 2)
        const nehezPx = Math.abs(y(vL(L14_DMAX)) - y(vegV))
        return (
          <>
            <NyilDef />
            <path className={dias ? 'dias-terulet-teves-el' : 'terulet-pozitiv'} d={tsTerulet} />
            <path className={dias ? 'dias-terulet-teves-fo' : 'terulet-negativ'} d={nehezTerulet} />
            <Tengely skala={x} irany="x" poz={bh} tickek={kicsi ? [] : [0, 50, 100, 150, 200]} formaz={(v) => sz(v, 0)} nyil={dias} racs={dias || kicsi ? undefined : -bh} cimke={kicsi ? undefined : 'D'} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [s.VU] : 5} formaz={(v) => sz(v, 0)} nyil={dias} racs={dias ? undefined : bw} cimke={kicsi ? undefined : 'V'} />
            <Gorbe pontok={[[x(0), y(s.VU)], [x(L14_DMAX), y(s.VU)]]} className={dias ? 'dias-vonal' : 'masodlagos'} />
            <Gorbe pontok={[[x(0), y(vL(0))], [x(L14_DMAX), y(vL(L14_DMAX))]]} className={dias ? 'dias-vonal' : 'osszesito'} />
            <Gorbe pontok={gorbe} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            {!kicsi && (
              <>
                <SvgMatek szoveg="V_L = V_U + T_C · D" className={`svg-matek ${felirat}`} x={bw + 8} y={cimkeY[0] + 4} />
                <SvgMatek szoveg="V_U" className={`svg-matek ${felirat}`} x={bw + 8} y={cimkeY[1] + 4} />
                <Felirat x={bw + 8} y={cimkeY[2] + 4} hu="Tényleges érték" kicsi="Actual firm value" className={felirat} />
                {/* a két rés felirata */}
                {s.Tc > 0.02 && tsPx > 14 && <Felirat x={x(L14_DMAX * 0.3)} y={tsMid + 4} hu="PV(adómegtakarítás)" anchor="middle" className={felirat} />}
                {e.nehezseg > 0 && nehezPx > 26 && <Felirat x={x(L14_DMAX) - 8} y={nehezMid - 2} hu="PV(pénzügyi nehézségek)" kicsi="szemléltető" anchor="end" className={felirat} />}
                {/* D*: szaggatott lehúzás a csúcsból a D tengelyre */}
                {e.belso && (
                  <>
                    <line className="dias-szaggatott" x1={x(e.dOpt)} x2={x(e.dOpt)} y1={y(e.vOpt)} y2={bh} />
                    <SvgMatek szoveg="D*" className={`svg-matek ${felirat}`} x={x(e.dOpt)} y={bh + 32} textAnchor="middle" />
                    <Pont x={x(e.dOpt)} y={y(e.vOpt)} r={4} className="dias-pont tomor" />
                  </>
                )}
                <line className="dias-szaggatott" x1={px} x2={px} y1={y(e.V)} y2={bh} />
                <Pont x={px} y={y(e.VL)} r={4} className={dias ? 'dias-pont tomor' : 'nagy'} cimke={`V_L = ${sz(e.VL, 1)}`} cimkeIrany={s.D > L14_DMAX * 0.7 ? 'bal' : 'jobb'} />
                <Pont x={px} y={y(e.V)} r={5} className={dias ? 'dias-pont tomor' : 'fokusz'} cimke={`V = ${sz(e.V, 1)}`} cimkeIrany={s.D > L14_DMAX * 0.7 ? 'bal' : 'jobb'} />
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

function tanulsag(s: L14, e: Ok): string {
  if (s.bovitett && s.Tc < 0.0005) return 'adó nélkül nincs adómegtakarítás, csak a nehézségek költsége marad: minden adósság rontja az értéket'
  if (e.nehezseg <= 0) return 'nehézségek költsége nélkül az érték végig V_L-en fut: minden újabb adósság nyereség (ez a 8.6 egyoldalú világa)'
  if (!e.belso) return 'ezzel a beállítással nincs belső optimum: az érték egyirányban változik'
  if (Math.abs(s.D - e.dOpt) <= 1) return `éppen az optimumnál vagy: D* ≈ ${musd(e.dOpt, 0)}, itt a legnagyobb a vállalat értéke`
  return s.D < e.dOpt
    ? `D* előtt az adómegtakarítás nyer: további adósság még növeli az értéket (D* ≈ ${musd(e.dOpt, 0)})`
    : `D* fölött a pénzügyi nehézségek költsége gyorsabban nő, mint az adómegtakarítás, ezért az érték csökken (D* ≈ ${musd(e.dOpt, 0)})`
}

export function Lecke14() {
  const [s, setS] = useState<L14>(L14_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const bovitett = nezet === 'bovitett'
  const sx: L14 = { ...s, bovitett }
  const e = l14(sx)
  const ok = e.hiba === undefined ? e : null
  const set = (p: Partial<L14>) => setS((v) => ({ ...v, ...p }))
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const kiemeles = bovitett
    ? aktiv === 'nehezseg' ? ['PV(\\text{pénzügyi nehézségek})'] : aktiv === 'VU' ? ['V_U'] : aktiv === 'Tc' || aktiv === 'D' ? ['PV(\\text{adómegtakarítás})'] : undefined
    : aktiv === 'Tc' ? ['T_C'] : aktiv === 'D' ? ['D'] : aktiv === 'VU' ? ['V_U'] : undefined
  const vItt = (D: number) => {
    const r = l14({ ...sx, D })
    return r.hiba === undefined ? r.V : undefined
  }

  return (
    <LeckeKeret
      szam={14}
      cim="Adómegtakarítás és optimális tőkeszerkezet"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId={bovitett ? '8.10' : '8.6'} kiemelt={kiemeles} />}
      kijelzo={<EloKijelzo cimke={`V, D = ${sz(s.D, 0)} M USD`} ertek={ok ? musd(ok.V) : '–'} alcim={ok ? `V_L ${musd(ok.VL)} · PV(TS) ${musd(ok.pvTS)}` : undefined} />}
      fejlecCsuszka={
        <FejlecCsuszka
          cimke="D, az adósság (M USD)"
          ertek={s.D}
          min={0}
          max={L14_DMAX}
          lepes={1}
          formaz={(v) => musd(v, 0)}
          skalaPontok={[0, 40, 80, 120, 160, 200].map((v) => {
            const V = vItt(v)
            return { ertek: v, cimke: sz(v, 0), alcimke: V === undefined ? undefined : `V ${sz(V, 0)}` }
          })}
          onValtozik={(D) => set({ D })}
          onAktiv={aktival('D')}
        />
      }
      abra={ok ? <L14Abra s={sx} e={ok} nezet={nezet} /> : <ErvenytelenUzenet>{e.hiba}</ErvenytelenUzenet>}
      tanulsag={ok && <Tanulsag>{tanulsag(sx, ok)}</Tanulsag>}
      kulcsSzamok={
        ok && (
          <KulcsSzamok
            sorok={[
              { cimke: 'PV(TS) = TC · D (8.4)', ertek: musd(ok.pvTS) },
              { cimke: 'VL = VU + TC · D (8.6)', ertek: musd(ok.VL) },
              { cimke: 'PV(pénzügyi nehézségek), szemléltető', ertek: musd(ok.pvNehez) },
              { cimke: 'V (8.10)', ertek: musd(ok.V), kiemelt: true },
              { cimke: 'D*, az optimális adósság', ertek: ok.belso ? musd(ok.dOpt, 1) : 'nincs belső optimum' },
              { cimke: 'V(D*)', ertek: musd(ok.vOpt) },
            ]}
          />
        )
      }
      bemenetek={
        <>
          <CsuszkaMezo cimke={<>T<sub>C</sub>, társasági adókulcs</>} ertek={s.Tc} min={0} max={0.5} lepes={0.005} szazalek onValtozik={(Tc) => set({ Tc })} onAktiv={aktival('Tc')} />
          <VuMezo cimke={<>V<sub>U</sub>, csak saját tőkés érték</>} ertek={s.VU} onValtozik={(VU) => set({ VU })} onAktiv={aktival('VU')} />
          {bovitett ? (
            <>
              <CsuszkaMezo
                cimke="A pénzügyi nehézségek költsége D = 200-nál (szemléltető)"
                ertek={s.nehezseg}
                min={0}
                max={200}
                lepes={5}
                tizedes={0}
                egyseg="M USD"
                onValtozik={(nehezseg) => set({ nehezseg })}
                onAktiv={aktival('nehezseg')}
              />
              <p className="megjegyzes">
                A diák (26–28.) nem adnak képletet a nehézségek költségére, ezért az alakja szemléltető: PV = N · (D / 200)³, kis D-nél alig számít, később gyorsan nő. A V értékét a 8.10 adja.
              </p>
            </>
          ) : (
            <p className="megjegyzes">Alapértékek: szem. adó 1 (V_U = 288, T_C = 40%, D = 80 → PV(TS) = 32, V_L = 320). A nehézségek görbéje szemléltető; méretét a bővített nézetben állíthatod.</p>
          )}
        </>
      }
      onAlaphelyzet={() => setS(L14_ALAP)}
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: 'Told D-t 160-ra (az alapérték duplájára). Mi történik PV(TS)-sel?',
              kesz: !!ok?.probak[0],
              keszSzoveg: ok && `Sikerült: PV(TS) = T_C · D = ${musd(ok.pvTS)}, kétszer annyi, mint D = 80-nál: az adómegtakarítás lineárisan nő az adóssággal.`,
            },
            {
              szoveg: 'Vidd D-t az optimum (D*) fölé. Hogyan változik V?',
              kesz: !!ok?.probak[1],
              keszSzoveg: ok && `Sikerült: D* ≈ ${musd(ok.dOpt, 0)}, fölötte V csökken (${musd(ok.V)} a csúcs ${musd(ok.vOpt)} helyett), bár V_L még emelkedik.`,
            },
            {
              szoveg: 'Bővített nézet: állítsd a nehézségek költségét 0-ra.',
              kesz: !!ok?.probak[2],
              keszSzoveg: 'Nehézségek nélkül a tényleges érték egybeesik V_L-lel, és nincs belső optimum: a 8.6 önmagában a minél több adósságot szeretné.',
            },
            {
              szoveg: 'Bővített nézet: állítsd T_C-t 0-ra, és told D-t jobbra.',
              kesz: !!ok?.probak[3],
              keszSzoveg: ok && `Sikerült: adó nélkül V_L = V_U, és a tényleges érték V_U alá esik (${musd(ok.V)} < ${musd(sx.VU)}): csak a nehézségek költsége maradt.`,
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('8.4')}>8.4</a>, <a href={link.keplet('8.6')}>8.6</a>, <a href={link.keplet('8.10')}>8.10</a> · Gyakorlás: <a href={link.gyakorlo('adopajzs-orok')}>Adómegtakarítás örökjáradékként</a> · Az előző lecke:{' '}
          <a href={link.lecke(13)}>13. lecke</a>
        </>
      }
    />
  )
}

/** A V_U mező: pénzösszeg, ezres tagolással. */
function VuMezo(props: { cimke: React.ReactNode; ertek: number; onValtozik: (v: number) => void; onAktiv: (b: boolean) => void }) {
  return <SzamBevitel cimke={props.cimke} ertek={props.ertek} min={1} max={10000} tizedes={0} ezres egyseg="M USD" onValtozik={props.onValtozik} onAktiv={props.onAktiv} />
}

export function Elonezet14() {
  const e = l14(L14_ALAP)
  return e.hiba === undefined ? <L14Abra s={L14_ALAP} e={e} nezet="dias" kicsi /> : null
}
