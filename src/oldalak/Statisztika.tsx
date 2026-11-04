import { useState } from 'react'
import { kepletKor, KEPLETEK } from '../content/kepletter.ts'
import { SABLONOK, sablonKor } from '../gyakorlas/sablonok/index.ts'
import { leggyakoribbHiba, statTorles, useStat } from '../gyakorlas/statisztika.ts'
import { korbaTartozik, korEredmenyei, useKor } from '../kor.ts'
import { link } from '../router.ts'
import { useZhEredmenyek, zhEredmenyekTorlese } from '../zh/eredmenyek.ts'
import { MAX } from '../zh/pontozas.ts'

function arany(jo: number, ossz: number) {
  if (!ossz) return <span className="ures-ertek">nincs adat</span>
  const p = Math.round((jo / ossz) * 100)
  return (
    <span className="arany">
      <span className={p >= 80 ? 'jo' : p >= 50 ? 'kozepes' : 'gyenge'}>{p}%</span>
      <span className="arany-db">
        {jo}/{ossz}
      </span>
    </span>
  )
}

export function Statisztika() {
  const stat = useStat()
  const [torolKerdes, setTorolKerdes] = useState(false)
  const valasztas = useKor()
  const sorok = KEPLETEK.filter((k) => stat.kepletek[k.id] && korbaTartozik(valasztas, kepletKor(k.id)))
  const sablonok = SABLONOK.filter((s) => stat.sablonok[s.id] && korbaTartozik(valasztas, sablonKor(s)))
  const zhk = korEredmenyei(useZhEredmenyek(), valasztas)

  return (
    <article className="oldal oldal-szeles">
      <header className="oldal-fej">
        <a className="morzsa" href={link.gyakorlas}>
          Gyakorlás
        </a>
        <h1>Statisztika</h1>
      </header>

      {zhk.length > 0 && (
        <section className="zh-statisztika">
          <h2 className="alcim-kicsi">ZH-szimulációk</h2>
          <div className="tabla-keret">
            <table className="stat-tabla">
              <thead>
                <tr>
                  <th>Dátum</th>
                  {valasztas === 'mind' && <th>Anyag</th>}
                  <th>Összesen</th>
                  <th>Igaz-hamis</th>
                  <th>Feleletválasztós</th>
                  <th>Számítási</th>
                  <th>Idő</th>
                </tr>
              </thead>
              <tbody>
                {[...zhk].reverse().map((z) => (
                  <tr key={z.datum}>
                    <td>{new Date(z.datum).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    {valasztas === 'mind' && <td>{z.kor === 'mind' ? 'Összes' : `${z.kor ?? 1}. ZH`}</td>}
                    <td>
                      <strong>{z.pont.ossz}</strong> / {MAX.ossz}
                    </td>
                    <td>
                      {z.pont.ih} / {MAX.ih}
                    </td>
                    <td>
                      {z.pont.mc} / {MAX.mc}
                    </td>
                    <td>
                      {z.pont.sz} / {MAX.sz}
                    </td>
                    <td>
                      {Math.floor(z.mp / 60)}:{String(z.mp % 60).padStart(2, '0')}
                      {z.lejart ? ' (lejárt)' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="gomb-szoveg" onClick={zhEredmenyekTorlese}>
            ZH-eredmények törlése
          </button>
        </section>
      )}

      {sorok.length === 0 ? (
        <div className="ures-allapot">
          <p>Még nincs adat. Oldj meg egy feladatot, és itt látod képletenként, mi megy jól és hol hibázol.</p>
          <a className="gomb" href={link.gyakorlas}>
            Gyakorlás
          </a>
        </div>
      ) : (
        <>
          <h2 className="alcim-kicsi">Képletenként</h2>
          <div className="tabla-keret">
            <table className="stat-tabla">
              <thead>
                <tr>
                  <th>Képlet</th>
                  <th>Felismerés</th>
                  <th>Számolás elsőre</th>
                  <th>Leggyakoribb hiba</th>
                </tr>
              </thead>
              <tbody>
                {sorok.map((k) => {
                  const s = stat.kepletek[k.id]
                  const h = leggyakoribbHiba(s)
                  return (
                    <tr key={k.id}>
                      <td data-cimke="Képlet">
                        <a href={link.keplet(k.id)}>
                          <span className="kid">{k.id}</span> {k.cim}
                        </a>
                      </td>
                      <td data-cimke="Felismerés">{arany(s.felJo, s.felOssz)}</td>
                      <td data-cimke="Számolás elsőre">{arany(s.szamJo, s.szamOssz)}</td>
                      <td data-cimke="Leggyakoribb hiba">
                        {h ? (
                          <>
                            {h.kerdes} <span className="arany-db">{h.db}×</span>
                          </>
                        ) : (
                          <span className="ures-ertek">nincs adat</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <h2 className="alcim-kicsi">Feladattípusonként</h2>
          <ul className="sablon-statok">
            {sablonok.map((s) => {
              const st = stat.sablonok[s.id]
              return (
                <li key={s.id}>
                  <a href={link.gyakorlo(s.id)}>{s.cim}</a>
                  <span>
                    {st.hibatlan}/{st.ossz} hibátlan
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="torles">
            {torolKerdes ? (
              <>
                <span>Biztosan törlöd az összes statisztikát?</span>
                <button
                  className="gomb gomb-veszely"
                  onClick={() => {
                    statTorles()
                    setTorolKerdes(false)
                  }}
                >
                  Igen, törlöm
                </button>
                <button className="gomb-szoveg" onClick={() => setTorolKerdes(false)}>
                  Mégse
                </button>
              </>
            ) : (
              <button className="gomb-szoveg" onClick={() => setTorolKerdes(true)}>
                Statisztika törlése
              </button>
            )}
          </div>
        </>
      )}
    </article>
  )
}
