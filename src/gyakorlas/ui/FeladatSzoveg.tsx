import type { FeladatSzoveg as Szoveg } from '../tipusok.ts'

/** `rejtettKerdes`: ha a kérdést szándékosan nem mutatjuk (felismerésnél), ez a megjegyzés áll a helyén. */
export function FeladatSzoveg({ szoveg, rejtettKerdes }: { szoveg: Szoveg; rejtettKerdes?: string }) {
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
