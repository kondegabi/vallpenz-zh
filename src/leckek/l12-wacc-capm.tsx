// 12. lecke: WACC vagy projekt-CAPM (7.5).
// Diás nézet: az 5. ea 13. diája (Ross 14.1): SML r_f-ből, vízszintes WACC-vonal, A és B projekt,
// a „téves elutasítás” és a „téves elfogadás” tartomány. Magyar feliratok, alattuk kicsiben az
// angol eredeti. Bővített: kiemelt SML, húzható projektpontok, színezett döntések.

import { scaleLinear } from 'd3-scale'
import { useState } from 'react'
import { capm } from '../calc/capm.ts'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { formatSzam } from '../lib/szam.ts'
import { link } from '../router.ts'
import { L12_ALAP, l12, type L12 } from './szamitas/l12.ts'
import { Abra, Gorbe, NyilDef, Pont, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'rf' | 'MRP' | 'beta' | 'projekt' | null

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`
const szam = (v: number) => sz(v * 100, 1)

/** Magyar felirat, alatta kicsiben az angol eredeti (a dia Ross-ábrája angol). */
function KetNyelvu({ x, y, hu, en, anchor = 'start', className = 'dias-felirat' }: { x: number; y: number; hu: string; en: string; anchor?: 'start' | 'middle' | 'end'; className?: string }) {
  return (
    <text className={className} x={x} y={y} textAnchor={anchor}>
      <tspan>{hu}</tspan>
      <tspan className="eredeti-felirat" x={x} dy={13}>
        {en}
      </tspan>
    </text>
  )
}

export function L12Abra({
  s,
  nezet,
  onProjekt,
  onAktiv,
  kicsi,
}: {
  s: L12
  nezet: Nezet
  onProjekt?: (i: number, beta: number, E: number) => void
  onAktiv?: (i: number) => void
  kicsi?: boolean
}) {
  const e = l12(s)
  const dias = nezet === 'dias'
  const bMax = Math.max(1.6, ...s.projektek.map((p) => p.beta * 1.15), s.betaCeg * 1.3)
  const yMax = Math.max(capm(s.rf, bMax, s.MRP), e.WACC, ...s.projektek.map((p) => p.E)) * 1.12
  return (
    <Abra
      cim="Projektek a béta–várható hozam síkon: SML és a cég WACC-ja"
      dias={dias}
      arany={kicsi ? 0.75 : 0.6}
      minH={kicsi ? 180 : 300}
      margo={{ bal: kicsi ? 30 : 62, jobb: kicsi ? 14 : 96, fent: 22, lent: kicsi ? 26 : 80 }}
    >
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, bMax]).range([0, bw])
        const y = scaleLinear().domain([0, yMax]).range([bh, 0])
        const sml = (b: number) => capm(s.rf, b, s.MRP)
        const xc = x(s.betaCeg)
        const yw = y(e.WACC)
        const elutasitas = `M${x(0)},${y(s.rf)} L${xc},${yw} L${x(0)},${yw} Z`
        const elfogadas = `M${xc},${yw} L${x(bMax)},${yw} L${x(bMax)},${y(sml(bMax))} Z`
        // a meredekség-háromszög az SML elején, a vonal alatt (Δβ = 0,25 → ΔE = 0,25 · MRP)
        const t0 = 0.12
        const dt = 0.25
        return (
          <>
            <NyilDef />
            <path className={dias ? 'dias-terulet-teves-el' : 'terulet-pozitiv'} d={elutasitas} />
            <path className={dias ? 'dias-terulet-teves-fo' : 'terulet-negativ'} d={elfogadas} />
            <Tengely skala={x} irany="x" poz={bh} tickek={dias || kicsi ? [] : [0, 0.5, 1, 1.5, 2].filter((b) => b <= bMax)} formaz={(v) => sz(v, 1)} nyil={dias} racs={dias ? undefined : -bh} />
            <Tengely
              skala={y}
              irany="y"
              poz={0}
              tickek={dias ? [s.rf, e.WACC, ...s.projektek.map((p) => p.E)] : 5}
              formaz={dias ? szam : pctTengely}
              nyil={dias}
              racs={dias ? undefined : bw}
            />
            {/* a cég bétája és a projektek vetületei */}
            <line className="dias-szaggatott" x1={xc} x2={xc} y1={yw} y2={bh} />
            {e.projektek.map((p) => (
              <g key={p.nev}>
                <line className="dias-szaggatott" x1={x(p.beta)} x2={x(p.beta)} y1={y(p.E)} y2={bh} />
                <line className="dias-szaggatott" x1={0} x2={x(p.beta)} y1={y(p.E)} y2={y(p.E)} />
              </g>
            ))}
            <Gorbe pontok={[[x(0), y(s.rf)], [x(bMax), y(sml(bMax))]]} className={dias ? 'dias-vonal sml-dias' : 'fokusz'} />
            <line className={dias ? 'wacc-vonal dias' : 'wacc-vonal'} x1={0} x2={x(bMax)} y1={yw} y2={yw} />
            {!kicsi && (
              <>
                <path className="egyseg-haromszog" d={`M${x(t0)},${y(sml(t0))} L${x(t0 + dt)},${y(sml(t0))} L${x(t0 + dt)},${y(sml(t0 + dt))}`} />
                <text className={dias ? 'dias-felirat' : 'mono-felirat'} x={x(t0 + dt) + 4} y={(y(sml(t0)) + y(sml(t0 + dt))) / 2 + 4}>
                  = {pct(s.MRP, 1)}
                </text>
                <text className={dias ? 'dias-felirat' : 'mono-felirat fokusz-szoveg'} x={x(bMax) + 6} y={y(sml(bMax)) + 4}>
                  SML
                </text>
                <text className={dias ? 'dias-felirat' : 'mono-felirat'} x={x(bMax) + 6} y={yw + 4}>
                  WACC = {pct(e.WACC, 1)}
                </text>
                <KetNyelvu x={x(0) + 8} y={(y(s.rf) + yw) / 2 - 6} hu="Téves elutasítás" en="Incorrect rejection" className={dias ? 'dias-felirat' : 'mono-felirat'} />
                <KetNyelvu x={x(bMax) - 6} y={yw - 50} hu="Téves elfogadás" en="Incorrect acceptance" anchor="end" className={dias ? 'dias-felirat' : 'mono-felirat'} />
                {/* tengelyfeliratok: magyarul, kicsiben az eredeti */}
                <KetNyelvu x={-50} y={-6} hu="Várható hozam (%)" en="Expected return (%)" className="dias-felirat tengely-felirat-kicsi" />
                <KetNyelvu x={bw / 2} y={bh + 62} hu="Béta" en="Beta" anchor="middle" className="dias-felirat tengely-felirat-kicsi" />
                {dias && <SvgMatek szoveg="r_f" className="svg-matek tengely-belso" x={-34} y={y(s.rf) + 4} textAnchor="end" />}
              </>
            )}
            {/* a béta-feliratok lépcsőzve: ha két felirat 80 px-nél közelebb van, a második egy sorral lejjebb kerül */}
            {dias &&
              !kicsi &&
              [{ szoveg: `β_{cég} = ${formatSzam(s.betaCeg, 1)}`, b: s.betaCeg }, ...s.projektek.map((p) => ({ szoveg: `β_${p.nev} = ${formatSzam(p.beta, 2)}`, b: p.beta }))]
                .sort((a, b) => a.b - b.b)
                .reduce<{ szoveg: string; px: number; sor: number }[]>((acc, f) => {
                  const px = x(f.b)
                  // az első olyan sor, amelyet egyetlen 80 px-en belüli korábbi felirat sem foglal
                  const foglalt = new Set(acc.filter((a) => px - a.px < 80).map((a) => a.sor))
                  let sor = 0
                  while (foglalt.has(sor)) sor++
                  acc.push({ szoveg: f.szoveg, px, sor })
                  return acc
                }, [])
                .map((f) => <SvgMatek key={f.szoveg} szoveg={f.szoveg} className="svg-matek tengely-belso" x={f.px} y={bh + 16 + f.sor * 15} textAnchor="middle" />)}
            <Pont x={x(0)} y={y(s.rf)} r={3.5} className="dias-pont tomor" />
            <Pont x={xc} y={yw} r={3.5} className="dias-pont tomor" />
            {e.projektek.map((p, i) => (
              <g key={p.nev}>
                <Pont
                  x={x(p.beta)}
                  y={y(p.E)}
                  r={dias ? 4 : 7}
                  className={dias ? 'dias-pont tomor' : p.teves ? 'negativ' : 'pozitiv'}
                  cimke={kicsi ? undefined : dias ? p.nev : `${p.nev}: ${p.tipus}`}
                  cimkeIrany={p.beta < s.betaCeg ? 'jobb' : 'bal'}
                  onHuz={
                    onProjekt
                      ? (px, py) => {
                          onAktiv?.(i)
                          onProjekt(i, Math.min(bMax, Math.max(0.05, Math.round(x.invert(px) * 20) / 20)), Math.min(yMax, Math.max(0, Math.round(y.invert(py) * 1000) / 1000)))
                        }
                      : undefined
                  }
                  onLep={onProjekt ? (dx, dy) => (onAktiv?.(i), onProjekt(i, Math.max(0.05, p.beta + dx * 0.05), Math.max(0, p.E + dy * 0.001))) : undefined}
                  ariaLabel={`${p.nev} projekt: β ${sz(p.beta, 2)}, várható hozam ${pct(p.E, 1)}`}
                />
              </g>
            ))}
          </>
        )
      }}
    </Abra>
  )
}

function dontesSzoveg(d: 'elfogadjuk' | 'elutasítjuk', felt: boolean, hozam: number, kuszob: number): string {
  const jel = hozam > kuszob ? '>' : hozam < kuszob ? '<' : '='
  return `${felt ? (d === 'elfogadjuk' ? 'elfogadná' : 'elutasítaná') : d === 'elfogadjuk' ? 'elfogadni' : 'elutasítani'} (${pct(hozam, 1)} ${jel} ${pct(kuszob, 1)})`
}

/** A 7.5 táblázata élőben, a képlettár oszlopfejléceivel. */
function DontesTabla({ s }: { s: L12 }) {
  const e = l12(s)
  return (
    <div className="tabla-keret">
      <table>
        <thead>
          <tr>
            <th>Projekt</th>
            <th>Várható hozam</th>
            <th>β</th>
            <th>CAPM szerinti elvárt</th>
            <th>WACC szerint</th>
            <th>Helyes döntés</th>
          </tr>
        </thead>
        <tbody>
          {e.projektek.map((p) => (
            <tr key={p.nev} className={p.teves ? 'teves-sor' : undefined}>
              <td>{p.nev}</td>
              <td>{pct(p.E, 1)}</td>
              <td>{sz(p.beta, 2)}</td>
              <td>{pct(p.elvart, 1)}</td>
              <td>{dontesSzoveg(p.waccDontes, true, p.E, e.WACC)}</td>
              <td>{dontesSzoveg(p.capmDontes, false, p.E, p.elvart)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function tanulsag(s: L12): string {
  const e = l12(s)
  if (e.tevesek === 0) return 'most minden projektnél ugyanazt dönti a két szabály'
  const tipusok = new Set(e.projektek.filter((p) => p.teves).map((p) => p.tipus))
  if (tipusok.size === 2) return 'a céges WACC az alacsony kockázatú jó projektet elvetné, a magas kockázatú rosszat elfogadná: minden projektet a saját bétájával kell mérni'
  const p = e.projektek.find((x) => x.teves)!
  return p.tipus === 'téves elutasítás'
    ? `${p.nev}: a WACC elvetné, pedig többet hoz (${pct(p.E, 1)}), mint amit a bétája alapján elvárunk (${pct(p.elvart, 1)})`
    : `${p.nev}: a WACC elfogadná, pedig kevesebbet hoz (${pct(p.E, 1)}), mint amit a bétája alapján elvárunk (${pct(p.elvart, 1)})`
}

export function Lecke12() {
  const [s, setS] = useState<L12>(L12_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const [aktivProjekt, setAktivProjekt] = useState(0)
  const e = l12(s)
  const set = (p: Partial<L12>) => setS((v) => ({ ...v, ...p }))
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const projekt = (i: number, beta: number, E: number) => setS((v) => ({ ...v, projektek: v.projektek.map((p, j) => (j === i ? { ...p, beta, E } : p)) }))
  const kiemeles = aktiv === 'rf' ? ['r_f'] : aktiv === 'MRP' ? ['E(r_M) - r_f'] : aktiv === 'projekt' ? ['\\beta_i', 'E(r_i)'] : undefined
  const ap = e.projektek[aktivProjekt]

  return (
    <LeckeKeret
      szam={12}
      cim="WACC vagy projekt-CAPM"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="5.1" kiemelt={kiemeles} />}
      kijelzo={<EloKijelzo cimke="ahol a WACC-szabály téved" ertek={`${e.tevesek} / ${e.projektek.length}`} alcim={`WACC ${pct(e.WACC, 1)} · ${ap.nev}: CAPM ${pct(ap.elvart, 1)}`} />}
      fejlecCsuszka={
        <FejlecCsuszka
          cimke="β_cég, a cég bétája (tisztán saját tőkés cég: WACC = rE)"
          ertek={s.betaCeg}
          min={0.2}
          max={2}
          lepes={0.05}
          formaz={(b) => sz(b, 2)}
          skalaPontok={[0.5, 1, 1.5, 2].map((b) => ({ ertek: b, cimke: sz(b, 1), alcimke: `WACC ${pct(capm(s.rf, b, s.MRP), 1)}` }))}
          onValtozik={(betaCeg) => set({ betaCeg })}
          onAktiv={aktival('beta')}
        />
      }
      abra={<L12Abra s={s} nezet={nezet} onProjekt={projekt} onAktiv={(i) => (setAktivProjekt(i), setAktiv('projekt'))} />}
      tanulsag={<Tanulsag>{tanulsag(s)}</Tanulsag>}
      kulcsSzamok={
        <KulcsSzamok
          sorok={[
            { cimke: 'WACC = rf + βcég · MRP', ertek: pct(e.WACC, 2) },
            ...e.projektek.map((p, i) => ({
              cimke: `${p.nev}: E ${pct(p.E, 1)}, CAPM ${pct(p.elvart, 1)}`,
              ertek: p.tipus,
              kiemelt: i === aktivProjekt,
            })),
          ]}
        />
      }
      bemenetek={
        <>
          <CsuszkaMezo cimke={<>r<sub>f</sub>, kockázatmentes hozam</>} ertek={s.rf} min={0} max={0.15} lepes={0.0025} szazalek onValtozik={(rf) => set({ rf })} onAktiv={aktival('rf')} />
          <CsuszkaMezo cimke="MRP, piaci kockázati prémium" ertek={s.MRP} min={0.01} max={0.15} lepes={0.0025} szazalek onValtozik={(MRP) => set({ MRP })} onAktiv={aktival('MRP')} />
          <div className="eszkozadatok-racs">
            {s.projektek.map((p, i) => (
              <div key={p.nev} className="eszkoz-sor">
                <SzamBevitel cimke={`β ${p.nev}`} ertek={p.beta} min={0.05} max={3} onValtozik={(b) => (setAktivProjekt(i), projekt(i, b, p.E))} onAktiv={(b) => setAktiv(b ? 'projekt' : null)} />
                <SzamBevitel cimke={`E(r) ${p.nev}`} ertek={p.E} szazalek min={0} max={0.5} onValtozik={(v) => (setAktivProjekt(i), projekt(i, p.beta, v))} onAktiv={(b) => setAktiv(b ? 'projekt' : null)} />
              </div>
            ))}
          </div>
          <p className="megjegyzes">A projektpontokat húzhatod is (vagy fókuszálj rájuk, és használd a nyilakat).</p>
        </>
      }
      onAlaphelyzet={() => (setS(L12_ALAP), setAktivProjekt(0))}
      extra={
        <section className="lecke-kiegeszito">
          <h2>A döntés táblázatban (7.5)</h2>
          <DontesTabla s={s} />
          <p className="megjegyzes">Az alapértékekkel ez szóról szóra a képlettár 7.5-ös táblázata (5. ea).</p>
        </section>
      }
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: 'Húzd A-t (vagy írd át az adatait) úgy, hogy a két szabály ugyanazt döntse.',
              kesz: e.probak[0],
              keszSzoveg: `Sikerült: A most ${e.projektek[0]?.tipus}. Ha a hozama a WACC fölött van, mindkét szabály elfogadja; ha az SML alatt, mindkettő elveti.`,
            },
            {
              szoveg: 'Vidd B-t a „téves elutasítás” tartományba.',
              kesz: e.probak[1],
              keszSzoveg: 'Sikerült: B bétája most a cégé alatt van, a hozama az SML fölött, de a WACC alatt. A WACC elvetné, a CAPM szerint jó projekt.',
            },
            {
              szoveg: 'Állítsd egy projekt bétáját a cég bétájára (alapból 1,0).',
              kesz: e.probak[2],
              keszSzoveg: 'Itt a két szabály mindig egyezik: a cégével azonos bétájú projekt elvárt hozama éppen a WACC.',
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('7.5')}>7.5</a>, <a href={link.keplet('5.1')}>5.1</a>, <a href={link.keplet('7.4')}>7.4</a> · Az SML részletesen: <a href={link.lecke(8)}>8. lecke</a> ·
          Gyakorlás: <a href={link.gyakorlo('wacc-vagy-capm')}>WACC vagy projekt-CAPM: melyik projekt jó?</a>
        </>
      }
    />
  )
}

export function Elonezet12() {
  return <L12Abra s={L12_ALAP} nezet="dias" kicsi />
}

