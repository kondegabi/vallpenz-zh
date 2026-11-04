// 7. lecke: karakterisztikus egyenes és kockázatfelbontás (4.1–4.3).
// Diás nézet: a 3. ea 19. diája (r_M–r_i pontfelhő, a tengelyek mentén az eloszlások, karakterisztikus
// egyenes az „1 / β_i” háromszöggel, β_i r_M és ε_i egy kiemelt ponton), alatta a dia képletei.
// Bővített: kiemelt egyenes, „a piac +1% → az eszköz +β%” sávok és a 4.3 kockázatfelbontása.
// A 4.1–4.3-hoz nincs diás számpélda: minden érték szemléltető, fix seedű mintával.

import { scaleLinear } from 'd3-scale'
import { useMemo, useState } from 'react'
import { normalisSuruseg } from '../calc/kockazat.ts'
import { keplet } from '../content/kepletter.ts'
import { pct, sz } from '../gyakorlas/formaz.ts'
import { link } from '../router.ts'
import { Inline } from '../ui/Inline.tsx'
import { Katex } from '../ui/Katex.tsx'
import { L07_ALAP, L07_EM, L07_N, l07, type L07, type L07Eredmeny } from './szamitas/l07.ts'
import { Abra, Gorbe, NyilDef, Pont, SvgMatek, Tengely } from './ui/abra.tsx'
import { LeckeKeret } from './ui/keret.tsx'
import { EloKijelzo, ErvenytelenUzenet, KepletFejlec, KomponensSavok, KulcsSzamok, ProbaldKi, Tanulsag } from './ui/kijelzok.tsx'
import { Pontfelho } from './ui/szimulalt.tsx'
import { CsuszkaMezo, FejlecCsuszka, type Nezet, SzamBevitel } from './ui/vezerlok.tsx'

type Param = 'beta' | 'sM' | 'sE' | null
type Ok = Extract<L07Eredmeny, { hiba: undefined }>

const pctTengely = (v: number) => `${sz(v * 100, 0)}%`

export function L07Abra({ s, e, nezet, kicsi }: { s: L07; e: L07Eredmeny; nezet: Nezet; kicsi?: boolean }) {
  if (e.hiba !== undefined) return <ErvenytelenUzenet magassag={kicsi ? 180 : 320}>{e.hiba}</ErvenytelenUzenet>
  const dias = nezet === 'dias'
  const xs = [...e.rM, 0]
  const ys = [...e.ri, 0]
  const padX = (Math.max(...xs) - Math.min(...xs)) * 0.08
  const padY = (Math.max(...ys) - Math.min(...ys)) * 0.08 || 0.05
  const xLo = Math.min(...xs) - padX
  const xHi = Math.max(...xs) + padX
  const yLo = Math.min(...ys) - padY
  const yHi = Math.max(...ys) + padY
  // diás nézetben a tengelyek mentén a két eloszlás (normális sűrűség, szemléltető) is kifér
  const savX = dias && !kicsi ? 60 : 0
  return (
    <Abra
      cim="Karakterisztikus egyenes: az eszköz hozama a piaci hozam függvényében"
      dias={dias}
      arany={kicsi ? 0.75 : 0.66}
      minH={kicsi ? 180 : 320}
      maxH={520}
      margo={{ bal: (dias ? 30 : 50) + savX, fent: 26, jobb: 20, lent: 38 + savX }}
    >
      {({ bw, bh }) => {
        const x = scaleLinear().domain([xLo, xHi]).range([0, bw])
        const y = scaleLinear().domain([yLo, yHi]).range([bh, 0])
        const egyenes: [number, number][] = [
          [x(xLo), y(s.beta * xLo)],
          [x(xHi), y(s.beta * xHi)],
        ]
        const k = e.kiemelt
        const kx = x(e.rM[k])
        // az „1 / β” háromszög a piaci átlagtól balra (jobbra a kiemelt pont felbontása van)
        const tx0 = e.atlagM - 1.9 * s.sM
        const dx = 0.5 * s.sM
        const sigmaI = e.szoras
        return (
          <>
            <NyilDef />
            {dias && !kicsi && (
              <>
                {/* a piaci hozam eloszlása az x tengely alatt, az eszközé az y tengelytől balra */}
                <Gorbe
                  className="dias-vonal"
                  pontok={Array.from({ length: 81 }, (_, i) => {
                    const v = xLo + (i / 80) * (xHi - xLo)
                    return [x(v), bh + 6 + (normalisSuruseg(v, L07_EM, s.sM) / normalisSuruseg(L07_EM, L07_EM, s.sM)) * (savX - 10)] as [number, number]
                  })}
                />
                {sigmaI > 0 && (
                  <Gorbe
                    className="dias-vonal"
                    pontok={Array.from({ length: 81 }, (_, i) => {
                      const v = yLo + (i / 80) * (yHi - yLo)
                      return [-6 - (normalisSuruseg(v, s.beta * L07_EM, sigmaI) / normalisSuruseg(s.beta * L07_EM, s.beta * L07_EM, sigmaI)) * (savX - 10), y(v)] as [number, number]
                    })}
                  />
                )}
                {e.rM.map((v, i) => (
                  <line key={`rx${i}`} className="rug" x1={x(v)} x2={x(v)} y1={bh} y2={bh + 5} />
                ))}
                {e.ri.map((v, i) => (
                  <line key={`ry${i}`} className="rug" x1={-5} x2={0} y1={y(v)} y2={y(v)} />
                ))}
              </>
            )}
            <Tengely skala={x} irany="x" poz={bh} tickek={dias ? [] : 5} formaz={pctTengely} cimke="r_M" nyil={dias} racs={dias ? undefined : -bh} />
            <Tengely skala={y} irany="y" poz={0} tickek={dias ? [] : 5} formaz={pctTengely} cimke="r_i" nyil={dias} racs={dias ? undefined : bw} />
            <line className="dias-szaggatott" x1={x(e.atlagM)} x2={x(e.atlagM)} y1={0} y2={bh} />
            <line className="dias-szaggatott" x1={0} x2={bw} y1={y(e.atlagI)} y2={y(e.atlagI)} />
            {dias ? (
              e.rM.map((v, i) => <circle key={i} className="dias-minta-pont" cx={x(v)} cy={y(e.ri[i])} r={kicsi ? 2.2 : 3.4} />)
            ) : (
              <Pontfelho pontok={e.rM.map((v, i) => [x(v), y(e.ri[i])] as [number, number])} />
            )}
            <Gorbe pontok={egyenes} className={dias ? 'dias-vonal vastag' : 'fokusz'} />
            {!kicsi && (
              <>
                {/* egységháromszög: vízszintesen 1 egység, függőlegesen β_i egység */}
                <path
                  className={dias ? 'egyseg-haromszog' : 'egyseg-haromszog bovitett'}
                  d={`M${x(tx0)},${y(s.beta * tx0)} L${x(tx0 + dx)},${y(s.beta * tx0)} L${x(tx0 + dx)},${y(s.beta * (tx0 + dx))}`}
                />
                <text className={dias ? 'dias-felirat' : 'mono-felirat'} x={x(tx0 + dx / 2)} y={y(s.beta * tx0) + 15} textAnchor="middle">
                  1
                </text>
                <SvgMatek szoveg="β_i" className={dias ? 'svg-matek dias-felirat' : 'svg-matek fokusz-matek'} x={x(tx0 + dx) + 6} y={(y(s.beta * tx0) + y(s.beta * (tx0 + dx))) / 2 + 4} />
                {/* a kiemelt pont felbontása: β_i r_M (az egyenesig) és ε_i (az egyenestől a pontig) */}
                <line className={dias ? 'felbontas-piaci dias' : 'felbontas-piaci'} x1={kx} x2={kx} y1={y(0)} y2={y(s.beta * e.rM[k])} />
                <line className={dias ? 'felbontas-egyedi dias' : 'felbontas-egyedi'} x1={kx} x2={kx} y1={y(s.beta * e.rM[k])} y2={y(e.ri[k])} />
                <Pont x={kx} y={y(e.ri[k])} r={dias ? 4 : 5.5} className={dias ? 'dias-pont tomor' : 'fokusz'} />
                <SvgMatek szoveg="β_i r_M" className={dias ? 'svg-matek dias-felirat' : 'svg-matek masodlagos-matek'} x={kx - 6} y={(y(0) + y(s.beta * e.rM[k])) / 2 + 4} textAnchor="end" />
                {Math.abs(e.eps[k]) > 1e-9 && (
                  <SvgMatek szoveg="ε_i" className={dias ? 'svg-matek dias-felirat' : 'svg-matek fokusz-matek'} x={kx - 6} y={(y(s.beta * e.rM[k]) + y(e.ri[k])) / 2 + 4} textAnchor="end" />
                )}
                {dias && (
                  <text className="dias-felirat" x={bw - 2} y={s.beta >= 0 ? Math.max(14, y(s.beta * xHi) - 12) : Math.min(bh - 6, y(s.beta * xHi) + 22)} textAnchor="end">
                    Karakterisztikus egyenes
                  </text>
                )}
              </>
            )}
          </>
        )
      }}
    </Abra>
  )
}

/** A 3. ea 19. diájának képletei, a képlettár alakjában (4.1, 4.3, 4.2) és a dia k_{M,ε} = 0 sorával. */
function DiaKepletei() {
  const l = (id: string, i = 0) => keplet(id)?.latex[i] ?? ''
  return (
    <figure className="dia-kepletei">
      <Katex latex={l('4.1')} display />
      <Katex latex={'k_{M,\\varepsilon_i} = 0'} display />
      <Katex latex={l('4.3')} display />
      <Katex latex={l('4.2')} display />
      <figcaption>A 3. ea 19. diájának képletei (4.1, 4.3, 4.2). Az ε nem korrelál a piaccal (4.1 jeltáblája).</figcaption>
    </figure>
  )
}

/** A 4.3 táblázata szó szerint a képlettárból. */
function FelbontoTabla() {
  const t = keplet('4.3')?.blokkok.find((b) => b.tipus === 'tabla' && b.fejlec[0] === 'Tag')
  if (!t || t.tipus !== 'tabla') return null
  return (
    <div className="tabla-keret">
      <table>
        <thead>
          <tr>
            {t.fejlec.map((f) => (
              <th key={f}>{f}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.sorok.map((sor, i) => (
            <tr key={i}>
              {sor.map((c, j) => (
                <td key={j}>
                  <Inline szoveg={c} linkek={false} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function tanulsag(s: L07, e: Ok): string {
  if (e.teljes < 1e-12) return 'β = 0 és σ(ε) = 0: az eszköz hozama nem ingadozik, nincs kockázat'
  if (s.sE < 0.0005) return 'nincs egyedi rész: minden pont az egyenesen van, a teljes kockázat piaci, a korreláció a piaccal 1'
  if (Math.abs(s.beta) < 0.005) return 'β = 0: a piac mozgása nem hat az eszközre, az egyenes vízszintes, minden kockázat egyedi'
  return `a variancia ${pct(e.piaci / e.teljes, 0)}-a piaci (β²σ²(rM)), ${pct(e.egyedi / e.teljes, 0)}-a egyedi (σ²(ε)); diverzifikációval csak az egyedi rész tüntethető el`
}

export function Lecke07() {
  const [s, setS] = useState<L07>(L07_ALAP)
  const [nezet, setNezet] = useState<Nezet>('dias')
  const [aktiv, setAktiv] = useState<Param>(null)
  const e = l07(s)
  const ok = e.hiba === undefined ? e : undefined
  const aktival = (p: Param) => (b: boolean) => setAktiv(b ? p : null)
  const set = (p: Partial<L07>) => setS((v) => ({ ...v, ...p }))
  const alapBecsles = useMemo(() => {
    const a = l07({ ...s, sE: L07_ALAP.sE })
    return a.hiba === undefined ? a.becsultBeta : NaN
  }, [s])
  const kiemeles = aktiv === 'beta' ? ['\\beta_i^2'] : aktiv === 'sM' ? ['\\sigma^2(r_M)'] : aktiv === 'sE' ? ['\\sigma^2(\\varepsilon_i)'] : undefined

  return (
    <LeckeKeret
      szam={7}
      cim="Karakterisztikus egyenes és kockázatfelbontás"
      nezet={nezet}
      onNezet={setNezet}
      keplet={<KepletFejlec kepletId="4.3" kiemelt={kiemeles} />}
      kijelzo={
        <EloKijelzo
          cimke="σ(ri), az eszköz szórása"
          ertek={ok ? pct(ok.szoras, 2) : '–'}
          alcim={ok ? (ok.teljes > 1e-12 ? `piaci ${pct(ok.piaci / ok.teljes, 0)} · egyedi ${pct(ok.egyedi / ok.teljes, 0)} (a varianciából)` : 'nincs kockázat') : undefined}
        />
      }
      fejlecCsuszka={
        <FejlecCsuszka
          cimke="β, a karakterisztikus egyenes meredeksége"
          ertek={s.beta}
          min={-0.5}
          max={2.5}
          lepes={0.05}
          formaz={(b) => sz(b, 2)}
          skalaPontok={[0, 0.5, 1, 1.2, 2].map((b) => ({
            ertek: b,
            cimke: b === 1 ? '1 (piac)' : sz(b, 1),
            alcimke: ok ? `σ ${pct(Math.sqrt(b * b * s.sM * s.sM + s.sE * s.sE), 1)}` : undefined,
          }))}
          onValtozik={(beta) => set({ beta })}
          onAktiv={aktival('beta')}
        />
      }
      abra={<L07Abra s={s} e={e} nezet={nezet} />}
      tanulsag={ok && <Tanulsag>{tanulsag(s, ok)}</Tanulsag>}
      kulcsSzamok={
        ok && (
          <KulcsSzamok
            sorok={[
              { cimke: 'β (beállítva)', ertek: sz(s.beta, 2) },
              { cimke: `β a ${L07_N} elemű mintából (4.2)`, ertek: sz(ok.becsultBeta, 3) },
              { cimke: 'piaci rész: β²σ²(rM)', ertek: sz(ok.piaci, 4) },
              { cimke: 'egyedi rész: σ²(ε)', ertek: sz(ok.egyedi, 4) },
              { cimke: 'σ²(ri) (4.3)', ertek: sz(ok.teljes, 4), kiemelt: true },
              { cimke: 'k(i, M) = β σ(rM) / σ(ri) (4.2)', ertek: sz(ok.korrelacio, 3) },
            ]}
          />
        )
      }
      bemenetek={
        <>
          <SzamBevitel cimke="β" ertek={s.beta} min={-0.5} max={2.5} onValtozik={(beta) => set({ beta })} onAktiv={aktival('beta')} />
          <CsuszkaMezo cimke="σ(rM), a piac szórása" ertek={s.sM} min={0.05} max={0.4} lepes={0.005} szazalek onValtozik={(sM) => set({ sM })} onAktiv={aktival('sM')} />
          <CsuszkaMezo cimke="σ(ε), az egyedi rész szórása" ertek={s.sE} min={0} max={0.6} lepes={0.005} szazalek onValtozik={(sE) => set({ sE })} onAktiv={aktival('sE')} />
          <p className="megjegyzes">
            Szemléltető: a 4.1–4.3-hoz nincs diás számpélda. {L07_N} szimulált megfigyelés (fix seed), a piac várható hozama {pct(L07_EM, 0)}; r_i = β r_M + ε (4.1).
          </p>
        </>
      }
      onAlaphelyzet={() => setS(L07_ALAP)}
      extra={
        nezet === 'dias' ? (
          <section className="lecke-kiegeszito">
            <h2>A dia képletei</h2>
            <DiaKepletei />
          </section>
        ) : (
          ok && (
            <section className="lecke-kiegeszito">
              <h2>A piac +1% → az eszköz +β%</h2>
              <KomponensSavok
                max={2.5}
                sorok={[0.5, 1, 2].map((b) => ({
                  cimke: `β = ${sz(b, 1)}`,
                  reszek: [{ ertek: b, osztaly: 'semleges', cimke: '' }],
                  osszeg: `+${sz(b, 1)}%`,
                  halvany: true,
                })).concat([
                  {
                    cimke: `most: β = ${sz(s.beta, 2)}`,
                    reszek: [{ ertek: Math.max(0, s.beta), osztaly: 'fokusz', cimke: '' }],
                    osszeg: `${s.beta >= 0 ? '+' : ''}${sz(s.beta, 2)}%`,
                    halvany: false,
                  },
                ])}
              />
              <h2 className="kozbulso-cim">Kockázatfelbontás (4.3)</h2>
              <KomponensSavok
                max={ok.teljes || 1}
                sorok={[
                  {
                    cimke: 'σ²(ri)',
                    reszek: [
                      { ertek: ok.piaci, osztaly: 'masodlagos', cimke: 'piaci: β²σ²(rM)' },
                      { ertek: ok.egyedi, osztaly: 'fokusz', cimke: 'egyedi: σ²(ε)' },
                    ],
                    osszeg: sz(ok.teljes, 4),
                  },
                ]}
              />
              <FelbontoTabla />
            </section>
          )
        )
      }
      probaldKi={
        <ProbaldKi
          feladatok={[
            {
              szoveg: 'Növeld σ(ε)-t legalább 40%-ra. Változik a mintából becsült béta?',
              kesz: !!ok?.probak[0],
              keszSzoveg: ok && `Alig: ${sz(ok.becsultBeta, 3)} (25%-nál ${sz(alapBecsles, 3)}). A pontok szórtabbak, a meredekség ugyanaz; csak az egyedi rész nőtt, most a variancia ${pct(ok.egyedi / ok.teljes, 0)}-a.`,
            },
            {
              szoveg: 'Állítsd σ(ε)-t 0-ra.',
              kesz: !!ok?.probak[1],
              keszSzoveg: 'Minden pont az egyenesen van: a teljes kockázat piaci, a korreláció a piaccal 1.',
            },
            {
              szoveg: 'Állítsd β-t 0-ra.',
              kesz: !!ok?.probak[2],
              keszSzoveg: 'Vízszintes egyenes: a piac mozgása nem hat az eszközre, minden kockázat egyedi, σ(ri) = σ(ε).',
            },
          ]}
        />
      }
      kapcsolodik={
        <>
          Képletek: <a href={link.keplet('4.1')}>4.1</a>, <a href={link.keplet('4.2')}>4.2</a>, <a href={link.keplet('4.3')}>4.3</a> · A béta az SML vízszintes tengelye:{' '}
          <a href={link.lecke(8)}>8. lecke</a> · Gyakorlás: <a href={link.gyakorlo('portfolio-beta')}>Portfólió béta, hiányzó béta vagy súly</a>
        </>
      }
    />
  )
}

export function Elonezet07() {
  return <L07Abra s={L07_ALAP} e={l07(L07_ALAP)} nezet="dias" kicsi />
}
