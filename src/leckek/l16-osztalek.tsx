// 16. lecke: osztalék, visszaforgatás és árfolyam (10.1, 10.3).
// Az Osztalékpolitika diasor 13. és 25. diája: a döntő a piaci várható hozam (r) és a ROE viszonya. Ha ROE > r, a
// nyereség visszatartása emeli az árfolyamot, ha ROE = r, nem számít, ha ROE < r, a kifizetés emeli.
// Az ábra P_0-t mutatja a kifizetési ráta (dp) függvényében: P_0 = DIV_1 / (r − g), g = ROE · (1 − dp), DIV_1 = dp · EPS_1.
// A diákon nincs számpélda, az alapértékek szemléltetők.

import { scaleLinear } from 'd3-scale'
import { useState } from 'react'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { L16_ALAP, arDpbol, l16, type L16, type L16Eredmeny } from './szamitas/l16.ts'
import { Abra, Gorbe, NyilDef, Pont, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Ok = Exclude<L16Eredmeny, { hiba: string }>

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`

export function L16Abra({ s, e, nezet, kicsi }: { s: L16; e: Ok; nezet: Nezet; kicsi?: boolean }) {
  const dias = nezet === 'dias'
  const felirat = dias ? 'dias-felirat' : 'mono-felirat'
  const hatarBent = e.dpHatar > 0.005 && e.dpHatar < 1
  return (
    <Abra
      cim="Az árfolyam (P_0) az osztalék-kifizetési ráta (dp) függvényében"
      dias={dias}
      arany={kicsi ? 0.75 : 0.55}
      minH={kicsi ? 180 : 300}
      margo={{ bal: kicsi ? 14 : 58, jobb: kicsi ? 14 : 24, fent: 22, lent: kicsi ? 14 : 48 }}
    >
      {({ bw, bh }) => {
        const x = scaleLinear().domain([0, 1]).range([0, bw])
        const y = scaleLinear().domain([0, e.yMax]).range([bh, 0])
        const vonal = (p: [number, number][]) => p.map(([dp, P]) => [x(dp), y(P)] as [number, number])
        const jelzo = [
          { c: e.gorbek[0], osztaly: 'masodlagos', dy: -8 },
          { c: e.gorbek[1], osztaly: 'osszesito', dy: -8 },
          { c: e.gorbek[2], osztaly: 'masodlagos', dy: 18 },
        ]
        return (
          <>
            <NyilDef />
            <Tengely skala={x} irany="x" poz={bh} tickek={kicsi ? [] : [0, 0.2, 0.4, 0.6, 0.8, 1]} formaz={pctTengely} nyil={dias} racs={dias || kicsi ? undefined : -bh} cimke={kicsi ? undefined : 'dp, az osztalék-kifizetési ráta'} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [e.P0Ketto] : 5} formaz={(v) => sz(v, 0)} nyil={dias} racs={dias ? undefined : bw} cimke={kicsi ? undefined : 'P_0'} />
            {/* a g = r határ: ettől balra nincs véges ár */}
            {hatarBent && !kicsi && (
              <>
                <line className="dias-szaggatott" x1={x(e.dpHatar)} x2={x(e.dpHatar)} y1={0} y2={bh} />
                <SvgMatek szoveg="g = r" className={`svg-matek ${felirat}`} x={x(e.dpHatar) - 6} y={14} textAnchor="end" />
              </>
            )}
            {/* bővített: a három ROE-görbe (r fölött, r-rel egyenlő, r alatt) */}
            {!dias &&
              jelzo.map(({ c, osztaly, dy }) => {
                const p = vonal(c.pontok)
                const k = p[Math.floor(p.length * 0.3)]
                return (
                  <g key={c.nev}>
                    <Gorbe pontok={p} className={osztaly} />
                    {k && !kicsi && (
                      <text className={felirat} x={k[0] + 6} y={k[1] + dy}>
                        {`${c.nev} (ROE = ${sz(c.ROE * 100, 1)}%)`}
                      </text>
                    )}
                  </g>
                )
              })}
            <Gorbe pontok={vonal(e.gorbe)} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            {e.P0 !== undefined && e.P0 <= e.yMax && (
              <>
                {!kicsi && <line className="dias-szaggatott" x1={x(s.dp)} x2={x(s.dp)} y1={y(e.P0)} y2={bh} />}
                <Pont x={x(s.dp)} y={y(e.P0)} r={5} className={dias ? 'dias-pont tomor' : 'fokusz'} cimke={kicsi ? undefined : `P_0 = ${sz(e.P0, 2)}`} cimkeIrany={s.dp > 0.7 ? 'bal' : 'fent'} />
              </>
            )}
            {!kicsi && (
              <>
                <line className="dias-szaggatott" x1={0} x2={bw} y1={y(e.P0Ketto)} y2={y(e.P0Ketto)} />
                <text className={felirat} x={bw - 4} y={y(e.P0Ketto) - 6} textAnchor="end">
                  {`EPS_1 / r = ${sz(e.P0Ketto, 2)}`}
                </text>
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

function tanulsag(s: L16, e: Ok): string {
  if (Math.abs(s.ROE - s.r) < 0.0005) return `ROE = r: a visszatartott pénz éppen az elvárt hozamot hozza, ezért a kifizetési ráta nem számít, P_0 = EPS_1 / r = ${sz(e.P0Ketto, 2)} minden dp-nél`
  return s.ROE > s.r
    ? 'ROE > r: a cég a visszatartott nyereséget az elvárt hozamnál jobban kamatoztatja, ezért minél kevesebbet fizet ki (kisebb dp), annál nagyobb az árfolyam'
    : 'ROE < r: a visszatartott nyereség az elvárt hozam alatt kamatozik, ezért a részvényes jobban jár, ha kifizetik neki (nagyobb dp, nagyobb árfolyam)'
}

export function Lecke16() {
  const [s, setS] = useState<L16>(L16_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const bovitett = nezet === 'bovitett'
  const sx: L16 = { ...s, bovitett }
  const e = l16(sx)
  const ok = e.hiba === undefined ? e : null
  const set = (p: Partial<L16>) => setS((v) => ({ ...v, ...p }))
  const arItt = (dp: number) => arDpbol(s.ROE, dp, s.r, s.EPS1)

  return (
    <LeckeKeret
      szam={16}
      cim="Osztalék, visszaforgatás és árfolyam"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId={bovitett ? '10.3' : '10.1'} />}
      kijelzo={
        <EloKijelzo
          cimke={`P_0, dp = ${pct(s.dp, 0)}`}
          ertek={ok && ok.P0 !== undefined ? sz(ok.P0, 2) : '–'}
          alcim={ok ? (ok.veges ? `g ${pct(ok.g, 2)} · DIV_1 ${sz(ok.DIV1, 2)}` : `g ${pct(ok.g, 2)} ≥ r: nincs véges ár`) : undefined}
        />
      }
      fejlecCsuszka={
        <FejlecCsuszka
          cimke="dp, az osztalék-kifizetési ráta (a maradék visszaforog)"
          ertek={s.dp}
          min={0}
          max={1}
          lepes={0.01}
          formaz={(v) => `${pct(v, 0)} · visszaforgatás ${pct(1 - v, 0)}`}
          skalaPontok={[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => {
            const P = arItt(v)
            return { ertek: v, cimke: pct(v, 0), alcimke: P === null ? 'nincs ár' : `P_0 ${sz(P, 1)}` }
          })}
          onValtozik={(dp) => set({ dp })}
        />
      }
      abra={
        ok ? (
          ok.veges ? (
            <L16Abra s={sx} e={ok} nezet={nezet} />
          ) : (
            <ErvenytelenUzenet>
              {`g = ROE · (1 − dp) = ${pct(ok.g, 2)}, ami nem kisebb, mint r = ${pct(s.r, 2)}: az állandó növekedésű modell (10.1) ilyenkor nem ad véges árfolyamot, mert r − g nem pozitív. Növeld a kifizetési rátát ${pct(ok.dpHatar, 1)} fölé, vagy csökkentsd a ROE-t.`}
            </ErvenytelenUzenet>
          )
        ) : (
          <ErvenytelenUzenet>{e.hiba}</ErvenytelenUzenet>
        )
      }
      tanulsag={ok && ok.veges && <Tanulsag>{tanulsag(sx, ok)}</Tanulsag>}
      kulcsSzamok={
        ok && (
          <KulcsSzamok
            sorok={[
              { cimke: 'g = ROE · (1 − dp) (10.3)', ertek: pct(ok.g, 2) },
              { cimke: 'DIV_1 = dp · EPS_1', ertek: sz(ok.DIV1, 2) },
              { cimke: 'P_0 = DIV_1 / (r − g) (10.1)', ertek: ok.P0 === undefined ? 'nincs véges ár' : sz(ok.P0, 2), kiemelt: true },
              { cimke: 'EPS_1 / r (P_0, ha ROE = r)', ertek: sz(ok.P0Ketto, 2) },
              { cimke: 'dp, ahol g = r', ertek: ok.dpHatar > 0 ? pct(ok.dpHatar, 1) : 'nincs (ROE ≤ r)' },
            ]}
          />
        )
      }
      bemenetek={
        <>
          <CsuszkaMezo cimke="ROE, a megtartott nyereség hozama" ertek={s.ROE} min={0.01} max={0.4} lepes={0.0025} szazalek onValtozik={(ROE) => set({ ROE })} />
          <CsuszkaMezo cimke={<>r, a részvényesek elvárt hozama</>} ertek={s.r} min={0.02} max={0.3} lepes={0.0025} szazalek onValtozik={(r) => set({ r })} />
          <SzamBevitel cimke={<>EPS<sub>1</sub>, a jövő évi egy részvényre jutó nyereség</>} ertek={s.EPS1} min={0.01} tizedes={2} onValtozik={(EPS1) => set({ EPS1 })} />
          <p className="megjegyzes">
            Szemléltető alapértékek (a diákon nincs számpélda): ROE = 15%, r = 12%, dp = 40%, EPS_1 = 5 → g = 9%, DIV_1 = 2, P_0 = 66,67.
            {bovitett ? ' A három görbe a mostani r-hez képest 25%-kal nagyobb, ugyanakkora és 25%-kal kisebb ROE-t mutat.' : ' A bővített nézet három ROE-görbét rajzol egymás mellé.'}
          </p>
        </>
      }
      onAlaphelyzet={() => setS(L16_ALAP)}
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: 'ROE = 15% > r = 12%. Csökkentsd dp-t 30%-ra vagy kisebbre. Mi történik P_0-lal?',
              kesz: !!ok?.probak[0],
              keszSzoveg: ok && ok.P0 !== undefined && `Sikerült: P_0 = ${sz(ok.P0, 2)}, magasabb, mint dp = 40%-nál: ha a vállalat az elvárt hozamnál jobban forgat vissza, érdemes visszatartani a nyereséget.`,
            },
            {
              szoveg: 'Állítsd ROE-t r-rel egyenlőre (12%), és told dp-t máshová, legalább 10 százalékponttal.',
              kesz: !!ok?.probak[1],
              keszSzoveg: ok && ok.P0 !== undefined && `Sikerült: P_0 = ${sz(ok.P0, 2)} = EPS_1 / r, a kifizetési ráta nem számít.`,
            },
            {
              szoveg: 'Állítsd ROE-t r alá (pl. 9%), és told dp-t 60% fölé. Mi történik P_0-lal?',
              kesz: !!ok?.probak[2],
              keszSzoveg: ok && ok.P0 !== undefined && `Sikerült: P_0 = ${sz(ok.P0, 2)}, magasabb, mint dp = 40%-nál: itt a kifizetés ér többet a visszatartásnál.`,
            },
            {
              szoveg: 'ROE = 15%, r = 12% mellett vidd dp-t 20% alá. Mi történik?',
              kesz: !!ok?.probak[3],
              keszSzoveg: ok && `Sikerült: g = ${pct(ok.g, 2)} ≥ r, ezért r − g nem pozitív, és a 10.1 nem ad véges árfolyamot: a növekedés nem lehet tartósan gyorsabb az elvárt hozamnál.`,
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('10.1')}>10.1</a>, <a href={link.keplet('10.3')}>10.3</a> · Gyakorlás: <a href={link.gyakorlo('osztalek-novekedes')}>Fenntartható növekedés és árfolyam</a> · Az előző lecke:{' '}
          <a href={link.lecke(15)}>15. lecke</a>
        </>
      }
    />
  )
}

export function Elonezet16() {
  const e = l16(L16_ALAP)
  return e.hiba === undefined && e.veges ? <L16Abra s={L16_ALAP} e={e} nezet="dias" kicsi /> : null
}
