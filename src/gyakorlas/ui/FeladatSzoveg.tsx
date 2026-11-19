import type { FeladatSzoveg as Szoveg } from '../tipusok.ts'

/**
 * `rejtettKerdes`: ha a kérdést szándékosan nem mutatjuk (felismerésnél), ez a megjegyzés áll a helyén.
 * `kitoltott`: a kitöltendő táblázat már megoldott cellái (lépéskulcs → kiírt érték); `aktivKulcs`: az éppen kérdezett cella.
 */
export function FeladatSzoveg({
  szoveg,
  rejtettKerdes,
  kitoltott = {},
  aktivKulcs,
}: {
  szoveg: Szoveg
  rejtettKerdes?: string
  kitoltott?: Record<string, string>
  aktivKulcs?: string
}) {
  return (
    <div className="feladat-szoveg">
      {szoveg.bekezdesek.map((b, i) => (
        <p key={i}>{b}</p>
      ))}
      {szoveg.tabla && (
        <div className="tabla-keret">
          <table className="adat-tabla">
            <thead>
              <tr>
                {szoveg.tabla.fejlec.map((f, i) => (
                  <th key={i}>{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {szoveg.tabla.sorok.map((s, i) => (
                <tr key={i}>
                  {s.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {szoveg.kitoltendo && (
        <div className="tabla-keret">
          <table className="adat-tabla kitoltendo-tabla">
            <thead>
              <tr>
                {szoveg.kitoltendo.fejlec.map((f, i) => (
                  <th key={i}>{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {szoveg.kitoltendo.sorok.map((s, i) => (
                <tr key={i}>
                  <th scope="row">{s.cimke}</th>
                  {s.cellak.map((c, j) =>
                    typeof c === 'string' ? (
                      <td key={j}>{c}</td>
                    ) : kitoltott[c.kulcs] !== undefined ? (
                      <td key={j} className="kitoltve">
                        {kitoltott[c.kulcs]}
                      </td>
                    ) : (
                      <td key={j} className={c.kulcs === aktivKulcs ? 'kitoltendo aktiv' : 'kitoltendo'}>
                        ?
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {szoveg.kerdesek.length > 0 && (
        <ul className="feladat-kerdesek">
          {szoveg.kerdesek.map((k, i) => (
            <li key={i}>{k}</li>
          ))}
        </ul>
      )}
      {rejtettKerdes && <p className="kerdes-rejtve">{rejtettKerdes}</p>}
    </div>
  )
}
