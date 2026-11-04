import { useState } from 'react'
import { type Feladat, ujFeladat } from '../gyakorlas/motor.ts'
import { ujSeed } from '../lib/rng.ts'
import { CSALADOK, csaladSablonjai, sablon } from '../gyakorlas/sablonok/index.ts'
import type { AnySablon } from '../gyakorlas/tipusok.ts'
import { feladatBeallitas } from '../gyakorlas/beallitasok.ts'
import { FeladatFuttato } from '../gyakorlas/ui/FeladatFuttato.tsx'
import { HaladoKapcsolo } from '../gyakorlas/ui/HaladoKapcsolo.tsx'
import { link } from '../router.ts'

function jeloltek(cel: string): AnySablon[] {
  const c = /^csalad-(\w+)$/.exec(cel)
  if (c) return csaladSablonjai(c[1] as AnySablon['csalad'])
  const s = sablon(cel)
  return s ? [s] : []
}

function sorsol(lista: AnySablon[], elozo?: string): Feladat {
  const valaszthato = lista.length > 1 ? lista.filter((s) => s.id !== elozo) : lista
  const s = valaszthato[Math.floor(Math.random() * valaszthato.length)]
  return ujFeladat(s, ujSeed(), feladatBeallitas())
}

export function GyakorloOldal({ cel }: { cel: string }) {
  const lista = jeloltek(cel)
  const [feladat, setFeladat] = useState<Feladat | null>(() => (lista.length ? sorsol(lista) : null))

  if (!feladat) {
    return (
      <article className="oldal">
        <h1>Nincs ilyen feladattípus</h1>
        <p>
          <a href={link.gyakorlas}>Vissza a gyakorláshoz</a>
        </p>
      </article>
    )
  }

  const csalad = /^csalad-(\w+)$/.exec(cel)
  const cim = csalad ? CSALADOK.find((c) => c.id === csalad[1])?.cim : undefined

  return (
    <article className="oldal oldal-szeles">
      <header className="oldal-fej gyakorlo-fej">
        <a className="morzsa" href={link.gyakorlas}>
          Gyakorlás
        </a>
        {cim && <h1>{cim}, vegyesen</h1>}
        {/* a kapcsoló a következő feladattól hat */}
        {lista.some((s) => s.halado) && <HaladoKapcsolo />}
      </header>
      <FeladatFuttato
        key={feladat.seed}
        feladat={feladat}
        zarogombok={
          <>
            <button className="gomb" onClick={() => setFeladat(sorsol(lista, feladat.sablon.id))} autoFocus>
              Új feladat
            </button>
            <a className="gomb gomb-masodlagos" href={link.gyakorlas}>
              Másik témakör
            </a>
            <a className="gomb-szoveg" href={link.statisztika}>
              Statisztika
            </a>
          </>
        }
      />
    </article>
  )
}
