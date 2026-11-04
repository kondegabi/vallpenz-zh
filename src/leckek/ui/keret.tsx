// A lecke oldalszerkezete és a lecke-navigátor.

import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { korbaTartozik, useKor } from '../../kor.ts'
import { link } from '../../router.ts'
import { leckeKor, LECKEK } from '../leckek.ts'
import { type Nezet, NezetKapcsolo } from './vezerlok.tsx'

export function LeckeNavigator({ aktiv }: { aktiv?: number }) {
  const valasztas = useKor()
  return (
    <nav className="lecke-navigator" aria-label="Leckék">
      {LECKEK.filter((l) => l.szam === aktiv || korbaTartozik(valasztas, leckeKor(l))).map((l) =>
        l.kesz ? (
          <a key={l.szam} href={link.lecke(l.szam)} className="lecke-chip" aria-current={aktiv === l.szam ? 'page' : undefined} title={l.cim}>
            {l.szam}
          </a>
        ) : (
          <span key={l.szam} className="lecke-chip nincs-kesz" title={`${l.cim} (még nem készült el)`}>
            {l.szam}
          </span>
        ),
      )}
      <a href={link.leckek} className="lecke-chip lecke-chip-szeles" aria-current={aktiv === 0 ? 'page' : undefined}>
        Minden együtt
      </a>
    </nav>
  )
}

/**
 * Egy lecke elrendezése: fejléc (navigátor, cím, nézetkapcsoló), képlet + élő kijelző, a fő
 * csúszka, az ábra a tanulsággal, oldalt a kulcsszámok és a bemenetek, alul a „Próbáld ki”.
 * Mobilon minden egymás alá kerül, a csúszkák az ábra alá.
 */
export function LeckeKeret(props: {
  szam: number
  cim: string
  nezet: Nezet
  onNezet: (n: Nezet) => void
  keplet: ReactNode
  kijelzo: ReactNode
  fejlecCsuszka?: ReactNode
  abra: ReactNode
  tanulsag?: ReactNode
  kulcsSzamok?: ReactNode
  bemenetek?: ReactNode
  onAlaphelyzet: () => void
  extra?: ReactNode
  probaldKi?: ReactNode
  kapcsolodik?: ReactNode
}) {
  return (
    <article className={`lecke lecke-${props.nezet}`}>
      <LeckeNavigator aktiv={props.szam} />
      <header className="lecke-fej">
        <div>
          <p className="lecke-szam">{props.szam}. lecke</p>
          <h1>{props.cim}</h1>
        </div>
        <NezetKapcsolo nezet={props.nezet} onValtozik={props.onNezet} />
      </header>

      <div className="lecke-fejsor">
        {props.keplet}
        {props.kijelzo}
      </div>
      {props.fejlecCsuszka}

      <div className="lecke-test">
        <div className="lecke-abra">
          {props.abra}
          {props.tanulsag}
        </div>
        <aside className="lecke-oldal">
          {props.kulcsSzamok}
          {props.bemenetek && <div className="lecke-bemenetek">{props.bemenetek}</div>}
          <button className="gomb gomb-masodlagos alaphelyzet" onClick={props.onAlaphelyzet}>
            <ArrowCounterClockwiseIcon size={16} aria-hidden /> Vissza a diás példához
          </button>
        </aside>
      </div>

      {props.extra}
      {props.probaldKi}
      {props.kapcsolodik && <footer className="lecke-kapcsolodik">{props.kapcsolodik}</footer>}
    </article>
  )
}
