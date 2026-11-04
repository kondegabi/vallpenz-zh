import { Fragment } from 'react'
import { Katex } from '../../ui/Katex.tsx'
import { lancReszek } from '../felismeres.ts'

/** Egy képletlánc opcióként: a képletek egymás után, a lánc kötőszavaival és nyilaival. */
export function LancKepletek({ sorId }: { sorId: string }) {
  return (
    <span className="lanc-kepletek">
      {lancReszek(sorId).map((r, i) => (
        <Fragment key={i}>
          {r.tipus === 'keplet' ? (
            <span className="lanc-keplet">
              <Katex latex={r.latex} />
            </span>
          ) : (
            <span className="lanc-szoveg">{r.szoveg}</span>
          )}
        </Fragment>
      ))}
    </span>
  )
}
