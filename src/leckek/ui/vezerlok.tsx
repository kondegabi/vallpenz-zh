// Bemenetek: csúszka + szám mező (egy állapotra kötve), a fejléc nagy csúszkája saját skálával,
// és a diás / bővített nézet kapcsolója.

import { type ReactNode, useEffect, useId, useState } from 'react'
import { beolvas, formatSzam } from '../../lib/szam.ts'

export type Nezet = 'dias' | 'bovitett'

function kijelzett(v: number, szazalek: boolean): number {
  return szazalek ? v * 100 : v
}

/** Csúszka és mellette szám mező. Százalékos paraméternél a mező és a skála %-ban mutat. */
export function CsuszkaMezo(props: {
  cimke: ReactNode
  ertek: number
  min: number
  max: number
  lepes: number
  szazalek?: boolean
  tizedes?: number
  egyseg?: string
  onValtozik: (v: number) => void
  /** igaz, amíg a felhasználó ezt a paramétert mozgatja (a képletben ilyenkor kiemelődik a tag) */
  onAktiv?: (aktiv: boolean) => void
}) {
  const id = useId()
  const cimkeId = useId()
  const sz = !!props.szazalek
  const tizedes = props.tizedes ?? (sz ? 1 : 2)
  const [szoveg, setSzoveg] = useState(formatSzam(kijelzett(props.ertek, sz), tizedes))
  const [szerkeszt, setSzerkeszt] = useState(false)
  useEffect(() => {
    if (!szerkeszt) setSzoveg(formatSzam(kijelzett(props.ertek, sz), tizedes))
  }, [props.ertek, sz, tizedes, szerkeszt])

  const veglegesit = () => {
    setSzerkeszt(false)
    props.onAktiv?.(false)
    const b = beolvas(szoveg)
    if (!b) {
      setSzoveg(formatSzam(kijelzett(props.ertek, sz), tizedes))
      return
    }
    const v = sz ? b.ertek / 100 : b.ertek
    props.onValtozik(Math.min(props.max, Math.max(props.min, v)))
  }

  return (
    <div className="csuszka-mezo">
      <label htmlFor={id} id={cimkeId}>
        {props.cimke}
      </label>
      <div className="csuszka-sor">
        <input
          type="range"
          aria-labelledby={cimkeId}
          min={kijelzett(props.min, sz)}
          max={kijelzett(props.max, sz)}
          step={kijelzett(props.lepes, sz)}
          value={kijelzett(props.ertek, sz)}
          onChange={(e) => props.onValtozik(sz ? Number(e.target.value) / 100 : Number(e.target.value))}
          onPointerDown={() => props.onAktiv?.(true)}
          onPointerUp={() => props.onAktiv?.(false)}
          onFocus={() => props.onAktiv?.(true)}
          onBlur={() => props.onAktiv?.(false)}
        />
        <div className="szam-mezo">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={szoveg}
            onFocus={() => {
              setSzerkeszt(true)
              props.onAktiv?.(true)
            }}
            onChange={(e) => setSzoveg(e.target.value)}
            onBlur={veglegesit}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
          {(sz || props.egyseg) && <span className="szam-egyseg">{sz ? '%' : props.egyseg}</span>}
        </div>
      </div>
    </div>
  )
}

/**
 * A fejlécbe épített fő csúszka saját skálával: a skálapontoknál felirat és alfelirat
 * (pl. korreláció −1 … 0 … +1, alattuk a hozzájuk tartozó portfólió-szórás).
 */
export function FejlecCsuszka(props: {
  cimke: ReactNode
  ertek: number
  min: number
  max: number
  lepes: number
  formaz: (v: number) => string
  skalaPontok: { ertek: number; cimke: string; alcimke?: string }[]
  onValtozik: (v: number) => void
  onAktiv?: (aktiv: boolean) => void
}) {
  const id = useId()
  const hely = (v: number) => ((v - props.min) / (props.max - props.min)) * 100
  return (
    <div className="fejlec-csuszka">
      <div className="fejlec-csuszka-fej">
        <label htmlFor={id}>{props.cimke}</label>
        <output htmlFor={id} className="fejlec-csuszka-ertek">
          {props.formaz(props.ertek)}
        </output>
      </div>
      <div className="fejlec-csuszka-sav">
        <input
          id={id}
          type="range"
          min={props.min}
          max={props.max}
          step={props.lepes}
          value={props.ertek}
          onChange={(e) => props.onValtozik(Number(e.target.value))}
          onPointerDown={() => props.onAktiv?.(true)}
          onPointerUp={() => props.onAktiv?.(false)}
          onFocus={() => props.onAktiv?.(true)}
          onBlur={() => props.onAktiv?.(false)}
        />
        <div className="skalapontok" aria-hidden>
          {props.skalaPontok.map((p) => (
            <button
              key={p.ertek}
              type="button"
              tabIndex={-1}
              className="skalapont"
              style={{ left: `${hely(p.ertek)}%` }}
              onClick={() => props.onValtozik(p.ertek)}
            >
              <span className="skalapont-jel" />
              <span className="skalapont-cimke">{p.cimke}</span>
              {p.alcimke && <span className="skalapont-alcimke">{p.alcimke}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Csúszka nélküli szám mező (pl. eszközadatok, pénzáramlások); Enterre vagy elhagyáskor rögzít. */
export function SzamBevitel(props: {
  cimke: ReactNode
  ertek: number
  szazalek?: boolean
  tizedes?: number
  egyseg?: string
  min?: number
  max?: number
  /** ezres tagolás (pénzösszegeknél) */
  ezres?: boolean
  onValtozik: (v: number) => void
  onAktiv?: (aktiv: boolean) => void
}) {
  const id = useId()
  const sz = !!props.szazalek
  const tizedes = props.tizedes ?? (sz ? 1 : 2)
  const formaz = (v: number) => formatSzam(kijelzett(v, sz), tizedes, props.ezres)
  const [szoveg, setSzoveg] = useState(formaz(props.ertek))
  const [szerkeszt, setSzerkeszt] = useState(false)
  useEffect(() => {
    if (!szerkeszt) setSzoveg(formatSzam(kijelzett(props.ertek, sz), tizedes, props.ezres))
  }, [props.ertek, sz, tizedes, szerkeszt, props.ezres])
  return (
    <div className={`szam-bevitel ${props.egyseg && props.egyseg.length > 1 ? 'hosszu-egyseg' : ''}`}>
      <label htmlFor={id}>{props.cimke}</label>
      <div className="szam-mezo">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={szoveg}
          onFocus={() => {
            setSzerkeszt(true)
            props.onAktiv?.(true)
          }}
          onChange={(e) => setSzoveg(e.target.value)}
          onBlur={() => {
            setSzerkeszt(false)
            props.onAktiv?.(false)
            const b = beolvas(szoveg)
            if (!b) return setSzoveg(formaz(props.ertek))
            let v = sz ? b.ertek / 100 : b.ertek
            if (props.min !== undefined) v = Math.max(props.min, v)
            if (props.max !== undefined) v = Math.min(props.max, v)
            props.onValtozik(v)
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        {(sz || props.egyseg) && <span className="szam-egyseg">{sz ? '%' : props.egyseg}</span>}
      </div>
    </div>
  )
}

export function NezetKapcsolo({ nezet, onValtozik }: { nezet: Nezet; onValtozik: (n: Nezet) => void }) {
  return (
    <div className="szegmens nezet-kapcsolo" role="group" aria-label="Nézet">
      <button aria-pressed={nezet === 'dias'} onClick={() => onValtozik('dias')}>
        Diás nézet
      </button>
      <button aria-pressed={nezet === 'bovitett'} onClick={() => onValtozik('bovitett')}>
        Bővített nézet
      </button>
    </div>
  )
}
