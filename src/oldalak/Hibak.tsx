import { DIAHIBAK, diahibaKor, nyitott } from '../content/diahibak.ts'
import { KT } from '../content/kepletter.ts'
import { korbaTartozik, useKor } from '../kor.ts'
import { Blokkok } from '../ui/Blokkok.tsx'
import { Inline } from '../ui/Inline.tsx'

export function Hibak() {
  const blokkok = KT.hibak.blokkok
  const valasztas = useKor()
  const t = blokkok.findIndex((b) => b.tipus === 'tabla')
  return (
    <article className="oldal oldal-szeles">
      <header className="oldal-fej">
        <h1>{KT.hibak.cim}</h1>
      </header>
      <Blokkok blokkok={blokkok.slice(0, t)} />
      <div className="tabla-keret">
        <table className="diahiba-tabla">
          <thead>
            <tr>
              <th>Hol</th>
              <th>A dián</th>
              <th>Helyesen</th>
              <th>Státusz</th>
            </tr>
          </thead>
          <tbody>
            {DIAHIBAK.filter((h) => korbaTartozik(valasztas, diahibaKor(h))).map((h) => (
              <tr key={h.hol}>
                <td data-cimke="Hol">
                  <Inline szoveg={h.hol} />
                </td>
                <td data-cimke="A dián">
                  <Inline szoveg={h.dian} />
                </td>
                <td data-cimke="Helyesen">
                  <Inline szoveg={h.helyesen} />
                </td>
                <td data-cimke="Státusz">
                  <span className={`statusz ${nyitott(h) ? 'nyitott' : 'igazolt'}`}>{h.statusz}</span>
                  {h.indok && (
                    <span className="statusz-indok">
                      <Inline szoveg={h.indok} />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Blokkok blokkok={blokkok.slice(t + 1)} />
    </article>
  )
}
