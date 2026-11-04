// Kijelzők és szöveges elemek: keretezett képlet, nagy élő szám, kulcsszámok, tanulság,
// „Próbáld ki”, hibaüzenet, komponenssávok, panelpár.

import { CheckCircleIcon, CircleIcon, WarningIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { keplet } from '../../content/kepletter.ts'
import { link } from '../../router.ts'
import { Katex } from '../../ui/Katex.tsx'

/**
 * Keretezett képlet a képlettárból (szó szerint). A `kiemelt` mintákra illeszkedő tag a kiemelőszínt
 * kapja: ezt a paramétert mozgatja éppen a felhasználó.
 */
export function KepletFejlec({ kepletId, latexIdx = 0, kiemelt }: { kepletId: string; latexIdx?: number; kiemelt?: string[] }) {
  const k = keplet(kepletId)
  const latex = k?.latex[latexIdx]
  // képlet nélküli szakasznál (pl. 2.4) az első pont szövege, szó szerint
  const szabaly = !latex ? k?.blokkok.find((b) => b.tipus === 'pont') : undefined
  if (!k || (!latex && !szabaly)) return null
  return (
    <figure className="keplet-fejlec">
      {latex ? (
        <Katex latex={latex} display kiemelt={kiemelt} osztaly="lecke-kiemelt" />
      ) : (
        szabaly?.tipus === 'pont' && <p className="keplet-fejlec-szabaly">{kiemelSzoveg(szabaly.szoveg, kiemelt ?? [])}</p>
      )}
      <figcaption>
        <a href={link.keplet(k.id)}>
          <span className="kid">{k.id}</span> {k.cim}
        </a>
      </figcaption>
    </figure>
  )
}

/** Sima szövegben a mintákra illeszkedő részek kiemelése (a KaTeX-es `kiemel` párja). */
function kiemelSzoveg(szoveg: string, mintak: string[]): ReactNode {
  const jo = mintak.filter(Boolean)
  if (!jo.length) return szoveg
  const re = new RegExp(`(${jo.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  return szoveg.split(re).map((d, i) =>
    jo.includes(d) ? (
      <span key={i} className="lecke-kiemelt">
        {d}
      </span>
    ) : (
      d
    ),
  )
}

export function EloKijelzo({ cimke, ertek, alcim }: { cimke: string; ertek: string; alcim?: string }) {
  return (
    <div className="elo-kijelzo" aria-live="polite">
      <span className="elo-cimke">{cimke}</span>
      <span className="elo-ertek">{ertek}</span>
      {alcim && <span className="elo-alcim">{alcim}</span>}
    </div>
  )
}

export function KulcsSzamok({ sorok }: { sorok: { cimke: ReactNode; ertek: string; kiemelt?: boolean }[] }) {
  return (
    <dl className="kulcs-szamok">
      {sorok.map((s, i) => (
        <div key={i} className={s.kiemelt ? 'kiemelt' : undefined}>
          <dt>{s.cimke}</dt>
          <dd>{s.ertek}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Tanulsag({ children }: { children: ReactNode }) {
  return <p className="lecke-tanulsag">{children}</p>
}

export type ProbaFeladat = { szoveg: ReactNode; kesz: boolean; keszSzoveg?: ReactNode }

export function ProbaldKi({ feladatok }: { feladatok: ProbaFeladat[] }) {
  return (
    <section className="probald-ki" aria-label="Próbáld ki">
      <h2>Próbáld ki</h2>
      <ol>
        {feladatok.map((f, i) => (
          <li key={i} className={f.kesz ? 'kesz' : undefined}>
            {f.kesz ? (
              <CheckCircleIcon className="proba-ikon" size={20} weight="fill" aria-label="sikerült" />
            ) : (
              <CircleIcon className="proba-ikon" size={20} aria-hidden />
            )}
            <div>
              <p>{f.szoveg}</p>
              {f.kesz && f.keszSzoveg && <p className="proba-kesz">{f.keszSzoveg}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Érvénytelen bemenetnél a grafikon helyén jelenik meg, azonos magassággal. */
export function ErvenytelenUzenet({ children, magassag = 280 }: { children: ReactNode; magassag?: number }) {
  return (
    <div className="ervenytelen" style={{ minHeight: magassag }} role="status">
      <WarningIcon size={22} weight="bold" aria-hidden />
      <p>{children}</p>
    </div>
  )
}

/** Vízszintes sávok: egy szám részekből, az értékek a sor végén. */
export function KomponensSavok(props: {
  sorok: { cimke: ReactNode; reszek: { ertek: number; osztaly: string; cimke: string }[]; osszeg: string; halvany?: boolean }[]
  max: number
}) {
  return (
    <div className="komponens-savok">
      {props.sorok.map((s, i) => (
        <div key={i} className={`komponens-sor ${s.halvany ? 'halvany' : ''}`}>
          <div className="komponens-cimke">{s.cimke}</div>
          <div className="komponens-sav">
            {s.reszek.map((r, j) => (
              <span key={j} className={`komponens-resz ${r.osztaly}`} style={{ width: `${(Math.max(0, r.ertek) / props.max) * 100}%` }} title={r.cimke}>
                <span className="komponens-resz-cimke">{r.cimke}</span>
              </span>
            ))}
          </div>
          <div className="komponens-osszeg">{s.osszeg}</div>
        </div>
      ))}
      <ul className="komponens-jelmagyarazat">
        {props.sorok[0]?.reszek
          .filter((r) => r.cimke)
          .map((r, j) => (
            <li key={j}>
              <span className={`komponens-resz ${r.osztaly} jel`} />
              {r.cimke}
            </li>
          ))}
      </ul>
    </div>
  )
}

export function PanelPar(props: { balCim: ReactNode; jobbCim: ReactNode; bal: ReactNode; jobb: ReactNode }) {
  return (
    <div className="panel-par">
      <figure>
        <figcaption>{props.balCim}</figcaption>
        {props.bal}
      </figure>
      <figure>
        <figcaption>{props.jobbCim}</figcaption>
        {props.jobb}
      </figure>
    </div>
  )
}
