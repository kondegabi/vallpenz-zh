// 11. lecke: a WACC összetétele (7.3–7.4).
// A diákon ehhez nincs ábra (5. ea csak szöveg), ezért a diás nézet egyszerű oszlopdiagram a dia
// képletének két tagjával. Bővített: a WACC az E/V súly függvényében, adópajzzsal és nélküle, alatta
// a két tag vízszintes sávokon.

import { scaleBand, scaleLinear } from 'd3-scale'
import { useState } from 'react'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { L11_5EA, L11_ALAP, L11_VIDEO, l11, type L11, type L11Eredmeny } from './szamitas/l11.ts'
import { Abra, Gorbe, NyilDef, Pont, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KomponensSavok, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet } from './ui/vezerlok.tsx'

type Param = 'wE' | 'rE' | 'rD' | 'Tc' | null
type Ok = Extract<L11Eredmeny, { hiba: undefined }>

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`

/** Diás nézet: r_E, a WACC két tagja egymásra rakva, és az adózás utáni r_D. */
export function L11OszlopAbra({ s, e, kicsi }: { s: L11; e: L11Eredmeny; kicsi?: boolean }) {
  if (e.hiba !== undefined) return <ErvenytelenUzenet magassag={kicsi ? 180 : 280}>{e.hiba}</ErvenytelenUzenet>
  const yMax = Math.max(s.rE, e.WACC, e.rDu) * 1.18
  const oszlopok = ['rE', 'WACC', 'rD']
  return (
    <Abra cim="A WACC a két tagjával, a saját tőke és a hitel költsége között" dias arany={kicsi ? 0.75 : 0.55} minH={kicsi ? 180 : 280} margo={{ bal: kicsi ? 14 : 20, fent: 26, lent: kicsi ? 26 : 50 }}>
      {({ bw, bh }) => {
        const x = scaleBand().domain(oszlopok).range([0, bw]).padding(0.35)
        const y = scaleLinear().domain([0, yMax]).range([bh, 0])
        const w = x.bandwidth()
        const oszlop = (nev: string, also: number, felso: number, cls: string) => (
          <rect className={cls} x={x(nev)} width={w} y={y(felso)} height={y(also) - y(felso)} />
        )
        const felirat = (nev: string, v: number, szoveg: string) => (
          <text className="dias-felirat" x={x(nev)! + w / 2} y={y(v) - 8} textAnchor="middle">
            {szoveg}
          </text>
        )
        return (
          <>
            <line className="tengelyvonal" x1={0} x2={bw} y1={bh} y2={bh} />
            {oszlop('rE', 0, s.rE, 'wacc-oszlop')}
            {oszlop('WACC', 0, e.tagE, 'wacc-oszlop')}
            {oszlop('WACC', e.tagE, e.WACC, 'wacc-oszlop felso')}
            {oszlop('rD', 0, e.rDu, 'wacc-oszlop')}
            {!kicsi && (
              <>
                {felirat('rE', s.rE, pct(s.rE, 2))}
                {felirat('WACC', e.WACC, pct(e.WACC, 2))}
                {felirat('rD', e.rDu, pct(e.rDu, 2))}
                {w >= 120 && <SvgMatek szoveg={`E/V · r_E = ${pct(e.tagE, 2)}`} className="svg-matek wacc-tag-felirat" x={x('WACC')! + w / 2} y={(y(0) + y(e.tagE)) / 2 + 4} textAnchor="middle" />}
                {w >= 120 && e.tagD > 0.004 && (
                  <SvgMatek szoveg={`D/V · r_D(1 − T_C)`} className="svg-matek wacc-tag-felirat" x={x('WACC')! + w + 6} y={(y(e.tagE) + y(e.WACC)) / 2 + 4} />
                )}
              </>
            )}
            {oszlopok.map((n) => (
              <SvgMatek
                key={n}
                szoveg={n === 'rE' ? 'r_E' : n === 'rD' ? 'r_D(1 − T_C)' : 'WACC'}
                className="svg-matek dias-felirat"
                x={x(n)! + w / 2}
                y={bh + 20}
                textAnchor="middle"
              />
            ))}
          </>
        )
      }}
    </Abra>
  )
}

/** Bővített nézet: a WACC az E/V függvényében, adópajzzsal és nélküle. */
function L11GorbeAbra({ s, e }: { s: L11; e: Ok }) {
  const yMax = Math.max(s.rE, s.rD, e.waccAdoNelkul) * 1.08
  // a tengely nem 0-ról indul, hogy a két vonal közötti rés (az adópajzs) látsszon
  const yMin = Math.max(0, Math.min(e.rDu, s.rE) * 0.85)
  return (
    <Abra cim="A WACC a saját tőke súlyának függvényében" arany={0.58} minH={280} margo={{ bal: 50, fent: 22, jobb: 20, lent: 40 }}>
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, 1]).range([0, bw])
        const y = scaleLinear().domain([yMin, yMax]).range([bh, 0])
        const px = x(s.wE)
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={[0, 0.25, 0.5, 0.75, 1]} formaz={pctTengely} cimke="E/V" racs={-bh} />
            <Tengely skala={y} irany="y" poz={0} tickek={4} formaz={pctTengely} cimke="WACC" racs={bw} />
            <Gorbe pontok={e.gorbeAdoNelkul.map(([w, v]) => [x(w), y(v)])} className="masodlagos halvanyabb" szaggatott />
            <Gorbe pontok={e.gorbe.map(([w, v]) => [x(w), y(v)])} className="fokusz" />
            {/* az adópajzs a választott súlynál: a két vonal közötti rés */}
            <line className="hiany-vonal" x1={px} x2={px} y1={y(e.waccAdoNelkul)} y2={y(e.WACC)} />
            <line className="vetulet" x1={px} x2={px} y1={y(e.WACC)} y2={bh} />
            <Pont x={px} y={y(e.WACC)} r={6} className="fokusz nagy" />
            <SvgMatek szoveg="adópajzs nélkül (T_C = 0)" className="mono-felirat" x={x(0) + 6} y={y(e.gorbeAdoNelkul[0][1]) - 24} />
            <SvgMatek szoveg={`r_D(1 − T_C) = ${pct(e.rDu, 2)}`} className="mono-felirat fokusz-szoveg" x={x(0) + 6} y={y(e.gorbe[0][1]) + 16} />
            <SvgMatek szoveg={`r_E = ${pct(s.rE, 2)}`} className="mono-felirat" x={x(1) - 6} y={y(s.rE) - 10} textAnchor="end" />
          </>
        )
      }}
    </Abra>
  )
}

function tanulsag(s: L11, e: Ok): string {
  if (s.wE > 0.9995) return 'nincs adósság: a WACC egyenlő a saját tőke költségével'
  if (s.Tc < 0.0005) return 'adópajzs nélkül a hitel a teljes rD-vel számít; adóval csak rD(1 − TC)-vel, mert a kamat csökkenti az adóalapot (7.3)'
  return `a WACC a két költség súlyozott átlaga: ${pct(e.tagE, 2)} a saját tőkéből, ${pct(e.tagD, 2)} a hitelből; az adópajzs ${sz(e.adopajzs * 100, 2)} százalékponttal csökkenti`
}

export function Lecke11() {
  const [s, setS] = useState<L11>(L11_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const e = l11(s)
  const ok = e.hiba === undefined ? e : undefined
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const set = (p: Partial<L11>) => setS((v) => ({ ...v, ...p }))
  const kiemeles =
    aktiv === 'wE' ? ['\\frac{E}{V}', '\\frac{D}{V}'] : aktiv === 'rE' ? ['r_E'] : aktiv === 'rD' ? ['r_D'] : aktiv === 'Tc' ? ['T_C'] : undefined
  const alap = s.eset === '5ea' ? L11_5EA : L11_VIDEO
  const alapE = l11(L11_5EA)
  const alapWacc = alapE.hiba === undefined ? alapE.WACC : NaN

  return (
    <LeckeKeret
      szam={11}
      cim="WACC összetétele"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="7.4" kiemelt={kiemeles} />}
      kijelzo={<EloKijelzo cimke="WACC" ertek={ok ? pct(ok.WACC, 2) : '–'} alcim={ok ? `adópajzs nélkül ${pct(ok.waccAdoNelkul, 2)}` : undefined} />}
      fejlecCsuszka={
        <>
          <div className="eset-valaszto">
            <span>Példa:</span>
            <div className="szegmens" role="group" aria-label="Példa">
              <button aria-pressed={s.eset === '5ea'} onClick={() => setS(L11_5EA)}>
                5. ea: teljes lánc
              </button>
              <button aria-pressed={s.eset === 'video'} onClick={() => setS(L11_VIDEO)}>
                videó
              </button>
            </div>
          </div>
          <FejlecCsuszka
            cimke="E/V, a saját tőke súlya (D/V = 1 − E/V)"
            ertek={s.wE}
            min={0}
            max={1}
            lepes={0.0001}
            formaz={(w) => `${sz(w, 4)} / ${sz(1 - w, 4)}`}
            skalaPontok={[0, 0.25, 0.5, 0.75, 1].map((w) => ({ ertek: w, cimke: pct(w, 0), alcimke: ok ? `WACC ${pct(ok.gorbe[Math.round(w * 100)][1], 1)}` : undefined }))}
            onValtozik={(wE) => set({ wE })}
            onAktiv={aktival('wE')}
          />
        </>
      }
      abra={nezet === 'dias' ? <L11OszlopAbra s={s} e={e} /> : ok ? <L11GorbeAbra s={s} e={ok} /> : <ErvenytelenUzenet>{e.hiba}</ErvenytelenUzenet>}
      tanulsag={ok && <Tanulsag>{tanulsag(s, ok)}</Tanulsag>}
      kulcsSzamok={
        ok && (
          <KulcsSzamok
            sorok={[
              { cimke: 'E/V · rE', ertek: pct(ok.tagE, 2) },
              { cimke: 'rD(1 − TC) (7.3)', ertek: pct(ok.rDu, 2) },
              { cimke: 'D/V · rD(1 − TC)', ertek: pct(ok.tagD, 2) },
              { cimke: 'WACC (7.4)', ertek: pct(ok.WACC, 2), kiemelt: true },
              { cimke: 'adópajzs: D/V · rD · TC', ertek: `${sz(ok.adopajzs * 100, 2)} százalékpont` },
            ]}
          />
        )
      }
      bemenetek={
        <>
          <CsuszkaMezo cimke="rE, a saját tőke költsége" ertek={s.rE} min={0} max={0.3} lepes={0.0001} szazalek tizedes={2} onValtozik={(rE) => set({ rE })} onAktiv={aktival('rE')} />
          <CsuszkaMezo cimke="rD, adózás előtti hitelköltség (YTM)" ertek={s.rD} min={0} max={0.2} lepes={0.0005} szazalek tizedes={2} onValtozik={(rD) => set({ rD })} onAktiv={aktival('rD')} />
          <CsuszkaMezo cimke="TC, társasági adókulcs" ertek={s.Tc} min={0} max={0.5} lepes={0.005} szazalek onValtozik={(Tc) => set({ Tc })} onAktiv={aktival('Tc')} />
          <p className="megjegyzes">
            A valóságban rE is függ a tőkeszerkezettől (több adósság → kockázatosabb saját tőke); ez a lecke rE-t rögzítettnek veszi, ezt nem modellezi.
          </p>
        </>
      }
      onAlaphelyzet={() => setS(alap)}
      extra={
        nezet === 'bovitett' &&
        ok && (
          <section className="lecke-kiegeszito">
            <h2>A két tag</h2>
            <KomponensSavok
              max={Math.max(ok.waccAdoNelkul, ok.WACC) * 1.05}
              sorok={[
                {
                  cimke: 'WACC',
                  reszek: [
                    { ertek: ok.tagE, osztaly: 'masodlagos', cimke: 'E/V · rE' },
                    { ertek: ok.tagD, osztaly: 'fokusz', cimke: 'D/V · rD(1 − TC)' },
                  ],
                  osszeg: pct(ok.WACC, 2),
                },
                {
                  cimke: 'adópajzs nélkül',
                  reszek: [
                    { ertek: ok.tagE, osztaly: 'masodlagos', cimke: 'E/V · rE' },
                    { ertek: ok.waccAdoNelkul - ok.tagE, osztaly: 'semleges', cimke: 'D/V · rD' },
                  ],
                  osszeg: pct(ok.waccAdoNelkul, 2),
                  halvany: true,
                },
              ]}
            />
          </section>
        )
      }
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: '5. ea példa: állítsd az adókulcsot 0-ra. Mennyivel nő a WACC?',
              kesz: !!ok?.probak[0],
              keszSzoveg: ok && `A WACC ${pct(ok.WACC, 2)} lesz, ${sz((ok.WACC - alapWacc) * 100, 2)} százalékponttal több: ennyi volt az adópajzs, D/V · rD · TC = 0,1424 × 11% × 21%.`,
            },
            {
              szoveg: '5. ea példa: keresd meg azt az E/V súlyt, amelynél a WACC 12%.',
              kesz: !!ok?.probak[1],
              keszSzoveg: `Sikerült: E/V ≈ ${sz(s.wE, 3)}. Több adósság olcsóbb WACC-ot ad, de csak akkor, ha rE nem változik (lásd a megjegyzést).`,
            },
            {
              szoveg: 'Állítsd E/V-t 100%-ra.',
              kesz: !!ok?.probak[2],
              keszSzoveg: 'Adósság nélkül a WACC éppen rE: a második tag eltűnik.',
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('7.3')}>7.3</a>, <a href={link.keplet('7.4')}>7.4</a> · Gyakorlás: <a href={link.gyakorlo('wacc')}>WACC teljes lánc</a>
        </>
      }
    />
  )
}

export function Elonezet11() {
  return <L11OszlopAbra s={L11_ALAP} e={l11(L11_ALAP)} kicsi />
}
