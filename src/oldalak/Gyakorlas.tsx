import { ArrowRightIcon, ChartBarIcon, ExamIcon, TimerIcon } from '@phosphor-icons/react'
import { Fragment, useState } from 'react'
import { CSALADOK, csaladSablonjai } from '../gyakorlas/sablonok/index.ts'
import { korCsoportok, useKor } from '../kor.ts'
import { useStat } from '../gyakorlas/statisztika.ts'
import { HaladoKapcsolo } from '../gyakorlas/ui/HaladoKapcsolo.tsx'
import { link } from '../router.ts'
import { KorFejlec } from '../ui/KorJeloles.tsx'

const DB_OPCIOK = [3, 5, 8] as const
const PERC_OPCIOK = [0, 15, 30, 45] as const

export function Gyakorlas() {
  const stat = useStat()
  const valasztas = useKor()
  const [db, setDb] = useState<number>(5)
  const [perc, setPerc] = useState<number>(30)

  return (
    <article className="oldal oldal-szeles gyakorlas">
      <header className="oldal-fej">
        <h1>Gyakorlás</h1>
        <p className="bevezeto-szoveg">
          Itt egy-egy feladattípust gyakorolsz. Minden feladat a felismeréssel indul (melyik képletlánc kell?), utána lépésenként számolsz,
          és minden lépésre azonnal visszajelzést kapsz.
        </p>
        <ul className="modok">
          <li>
            <strong>Egy típus vagy egy témakör</strong>: válassz lent egy feladattípust, vagy egy témakört vegyesen.
          </li>
          <li>
            <strong>Vegyes gyakorlás</strong> (az oldal alján): véletlen típusok egymás után, ha kéred, időre, a végén összesítéssel.
          </li>
          <li>
            <strong>ZH-szimuláció</strong>: a valódi ZH formátuma; itt visszajelzés csak a beadás után van.
          </li>
        </ul>
        <p className="megjegyzes">
          A képletláncok táblázata (melyik adat és kérdés melyik lánchoz tartozik) a <a href={link.felismero}>Képletek › Felismerő tábla</a> alatt van.
        </p>
      </header>

      <a className="zh-szimulacio-kartya" href={link.zhSzimulacio}>
        <span className="zh-szimulacio-ikon">
          <ExamIcon size={26} aria-hidden />
        </span>
        <span>
          <strong>ZH-szimuláció</strong>
          <span>25 perc, 8 igaz-hamis, 8 feleletválasztós és 4 számítási példa, 50 pont, a valódi pontozással. Visszajelzés csak a beadás után.</span>
        </span>
        <ArrowRightIcon size={20} aria-hidden />
      </a>

      {korCsoportok(valasztas).map((kor) => (
        <Fragment key={kor}>
          <KorFejlec kor={kor} valasztas={valasztas} />
      <section className="csaladok">
        {CSALADOK.filter((c) => c.kor === kor).map((c) => (
          <div key={c.id} className={`csalad csalad-${c.id}`}>
            <div className="csalad-fej">
              <h2>{c.cim}</h2>
            </div>
            <ul>
              {csaladSablonjai(c.id).map((s) => {
                const st = stat.sablonok[s.id]
                return (
                  <li key={s.id}>
                    <a href={link.gyakorlo(s.id)}>
                      <span>{s.cim}</span>
                      {st && (
                        <span className="sablon-stat">
                          {st.hibatlan}/{st.ossz} hibátlan
                        </span>
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
            {csaladSablonjai(c.id).length > 1 && (
              <a className="gomb csalad-gomb" href={link.gyakorlo(`csalad-${c.id}`)}>
                Vegyesen a családból <ArrowRightIcon size={16} aria-hidden />
              </a>
            )}
          </div>
        ))}
      </section>
        </Fragment>
      ))}

      <section className="zh-beallitas">
        <div>
          <h2>
            <TimerIcon size={22} aria-hidden /> Vegyes gyakorlás
          </h2>
          <p>Véletlen feladattípusok a kiválasztott anyagból egymás után, lépésenként, azonnali visszajelzéssel; ha kéred, időre. A végén összesítést kapsz.</p>
        </div>
        <div className="zh-mezok">
          <fieldset>
            <legend>Feladatok száma</legend>
            <div className="szegmens">
              {DB_OPCIOK.map((n) => (
                <button key={n} aria-pressed={db === n} onClick={() => setDb(n)}>
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Időkorlát</legend>
            <div className="szegmens">
              {PERC_OPCIOK.map((n) => (
                <button key={n} aria-pressed={perc === n} onClick={() => setPerc(n)}>
                  {n === 0 ? 'nincs' : `${n} perc`}
                </button>
              ))}
            </div>
          </fieldset>
          <a className="gomb" href={link.zh(db, perc)}>
            Indítás
          </a>
        </div>
      </section>

      <section className="gyakorlas-beallitas">
        <h2>Beállítás</h2>
        <HaladoKapcsolo />
      </section>

      <a className="stat-link" href={link.statisztika}>
        <ChartBarIcon size={18} aria-hidden /> Statisztika képletenként
      </a>
    </article>
  )
}
