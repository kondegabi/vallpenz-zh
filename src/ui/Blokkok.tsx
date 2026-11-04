import { WarningIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { JELEK } from '../content/jelek.ts'
import type { Blokk } from '../content/parse.ts'
import { Inline } from './Inline.tsx'
import { Katex } from './Katex.tsx'

type Tabla = Extract<Blokk, { tipus: 'tabla' }>
type Pont = Extract<Blokk, { tipus: 'pont' }>

export type JelKiemeles = {
  kepletId: string
  aktiv: number | null
  beallit: (i: number | null) => void
}

const PELDA_CIMKE = /^Példa|\((\d+\. ea|videó|jegyzet[^)]*)\)/

function pontOsztaly(p: Pont): string {
  if (p.cimke?.startsWith('Csapda')) return 'pont pont-csapda'
  if (p.cimke && PELDA_CIMKE.test(p.cimke)) return 'pont pont-pelda'
  return 'pont'
}

function PontElem({ p }: { p: Pont }) {
  const csapda = p.cimke?.startsWith('Csapda')
  return (
    <li className={pontOsztaly(p)}>
      {csapda && <WarningIcon className="pont-ikon" size={18} weight="bold" aria-hidden />}
      <div>
        {p.cimke && (
          <strong className="pont-cimke">
            <Inline szoveg={p.cimke} />:
          </strong>
        )}{' '}
        <Inline szoveg={p.szoveg} />
        {p.alpontok.length > 0 && (
          <ol className="alpontok">
            {p.alpontok.map((a, i) => (
              <li key={i}>
                <Inline szoveg={a.replace(/^\d+\.\s*/, '')} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </li>
  )
}

function SimaTabla({ t }: { t: Tabla }) {
  return (
    <div className="tabla-keret">
      <table>
        <thead>
          <tr>
            {t.fejlec.map((f, i) => (
              <th key={i}>
                <Inline szoveg={f} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.sorok.map((s, i) => (
            <tr key={i}>
              {s.map((c, j) => (
                <td key={j}>
                  <Inline szoveg={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function JelTabla({ t, jk }: { t: Tabla; jk: JelKiemeles }) {
  const megf = JELEK[jk.kepletId]
  return (
    <div className="tabla-keret">
      <p className="tabla-sugo">Mutass egy jelre, és a képletben is kiemelődik.</p>
      <table className="jeltabla">
        <thead>
          <tr>
            {t.fejlec.map((f, i) => (
              <th key={i}>{f}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.sorok.map((s, i) => (
            <tr
              key={i}
              tabIndex={0}
              className={jk.aktiv === i ? 'aktiv' : undefined}
              onMouseEnter={() => jk.beallit(i)}
              onMouseLeave={() => jk.beallit(null)}
              onFocus={() => jk.beallit(i)}
              onBlur={() => jk.beallit(null)}
              onClick={() => jk.beallit(jk.aktiv === i ? null : i)}
            >
              {s.map((c, j) => (
                <td key={j} className={j === 0 ? 'jel-cella' : undefined}>
                  {j === 0 && megf?.[i] ? <Katex latex={megf[i].megj} /> : <Inline szoveg={c} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Blokkok({ blokkok, jk }: { blokkok: Blokk[]; jk?: JelKiemeles }) {
  const kiemelt = jk && jk.aktiv !== null ? JELEK[jk.kepletId]?.[jk.aktiv]?.mintak : undefined
  const ki: ReactNode[] = []
  let pontok: Pont[] = []
  const pontokLezarasa = () => {
    if (!pontok.length) return
    ki.push(
      <ul className="pontok" key={`p${ki.length}`}>
        {pontok.map((p, i) => (
          <PontElem p={p} key={i} />
        ))}
      </ul>,
    )
    pontok = []
  }
  blokkok.forEach((b, i) => {
    if (b.tipus === 'pont') {
      pontok.push(b)
      return
    }
    pontokLezarasa()
    switch (b.tipus) {
      case 'latex':
        ki.push(<Katex key={i} latex={b.forras} display kiemelt={kiemelt} />)
        break
      case 'kod':
        ki.push(
          <pre key={i} className="kod">
            <Inline szoveg={b.forras} />
          </pre>,
        )
        break
      case 'magyarul':
        ki.push(
          <p key={i} className="magyarul">
            <strong>Magyarul:</strong> <Inline szoveg={b.szoveg} />
          </p>,
        )
        break
      case 'tabla':
        ki.push(
          jk && b.fejlec[0] === 'Jel' && JELEK[jk.kepletId] ? (
            <JelTabla key={i} t={b} jk={jk} />
          ) : (
            <SimaTabla key={i} t={b} />
          ),
        )
        break
      case 'bekezdes':
        ki.push(
          <p key={i} className="bekezdes">
            <Inline szoveg={b.szoveg} />
          </p>,
        )
        break
    }
  })
  pontokLezarasa()
  return <>{ki}</>
}
