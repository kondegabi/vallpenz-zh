import { felismeroSorKor, KT } from '../content/kepletter.ts'
import { korbaTartozik, useKor } from '../kor.ts'
import { Blokkok } from '../ui/Blokkok.tsx'
import { Inline } from '../ui/Inline.tsx'

export function Felismero() {
  const f = KT.felismero
  const valasztas = useKor()
  const sorok = f.sorok.filter((s) => korbaTartozik(valasztas, felismeroSorKor(s)))
  const tabla = f.blokkok.find((b) => b.tipus === 'tabla')
  const elotte = f.blokkok.slice(0, f.blokkok.indexOf(tabla!))
  const utana = f.blokkok.slice(f.blokkok.indexOf(tabla!) + 1)
  return (
    <article className="oldal oldal-szeles">
      <header className="oldal-fej">
        <h1>{f.cim}</h1>
      </header>
      <Blokkok blokkok={elotte} />
      {tabla?.tipus === 'tabla' && (
        <div className="tabla-keret">
          <table className="felismero-tabla">
            <thead>
              <tr>
                {tabla.fejlec.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorok.map((s) => (
                <tr key={s.id}>
                  <td data-cimke={tabla.fejlec[0]}>
                    <Inline szoveg={s.adja} />
                  </td>
                  <td data-cimke={tabla.fejlec[1]}>
                    <Inline szoveg={s.kerdezi} />
                  </td>
                  <td data-cimke={tabla.fejlec[2]} className="lanc">
                    <Inline szoveg={s.lanc} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Blokkok blokkok={utana} />
    </article>
  )
}
