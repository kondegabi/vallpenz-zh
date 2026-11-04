import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { erreEpul, felismeroSorai, kellHozza, keplet, kepletKor, KEPLETEK, KT } from '../content/kepletter.ts'
import { korbaTartozik, useKor } from '../kor.ts'
import { link } from '../router.ts'
import { Blokkok } from '../ui/Blokkok.tsx'
import { Inline } from '../ui/Inline.tsx'
import { KorCimke } from '../ui/KorJeloles.tsx'

function KepletLink({ id, feltetel }: { id: string; feltetel?: string }) {
  const k = keplet(id)
  return (
    <li>
      <a href={link.keplet(id)}>
        <span className="kid">{id}</span> {k?.cim}
      </a>
      {feltetel && <span className="feltetel">{feltetel}</span>}
    </li>
  )
}

export function KepletOldal({ id }: { id: string }) {
  const k = keplet(id)
  const [aktiv, setAktiv] = useState<number | null>(null)
  const valasztas = useKor()
  if (!k) {
    return (
      <article className="oldal">
        <h1>Nincs ilyen képlet: {id}</h1>
        <p>
          <a href={link.kepletek}>Vissza a képletekhez</a>
        </p>
      </article>
    )
  }
  const fejezet = KT.fejezetek.find((f) => f.szam === k.fejezet)!
  // lapozás a kiválasztott anyagon belül; ha a képlet más ZH-é, az egész listán
  const lista = korbaTartozik(valasztas, kepletKor(id)) ? KEPLETEK.filter((x) => korbaTartozik(valasztas, kepletKor(x.id))) : KEPLETEK
  const idx = lista.indexOf(k)
  const elozo = lista[idx - 1]
  const kovetkezo = lista[idx + 1]
  const kell = kellHozza(id)
  const epul = erreEpul(id)
  const sorok = felismeroSorai(id)

  return (
    <article className="oldal keplet-oldal" key={id}>
      <header className="oldal-fej">
        <a className="morzsa" href={`${link.kepletek}`}>
          {fejezet.szam}. {fejezet.cim}
        </a>
        <KorCimke kor={kepletKor(id)} />
        <h1>
          <span className="kid-nagy">{k.id}</span> {k.cim}
        </h1>
      </header>

      <div className="keplet-racs">
        <div className="keplet-torzs">
          <Blokkok blokkok={k.blokkok} jk={{ kepletId: id, aktiv, beallit: setAktiv }} />
        </div>

        <aside className="keplet-oldalsav" aria-label="Kapcsolódó képletek">
          <section>
            <h2>Kell hozzá</h2>
            {kell.length ? (
              <ul className="kapcsolat">
                {kell.map((f) => (
                  <KepletLink key={f.id} {...f} />
                ))}
              </ul>
            ) : (
              <p className="ures">Közvetlenül a feladat adataiból számolható.</p>
            )}
          </section>
          {epul.length > 0 && (
            <section>
              <h2>Erre épül</h2>
              <ul className="kapcsolat">
                {epul.map((f) => (
                  <KepletLink key={f.id} {...f} />
                ))}
              </ul>
            </section>
          )}
          {sorok.length > 0 && (
            <section>
              <h2>A felismerőben</h2>
              <ul className="felismero-mini">
                {sorok.map((s) => (
                  <li key={s.id}>
                    <span className="fm-adja">
                      <Inline szoveg={s.adja} linkek={false} />
                    </span>
                    <span className="fm-kerdezi">
                      <Inline szoveg={s.kerdezi} linkek={false} />
                    </span>
                    <span className="fm-lanc">
                      <Inline szoveg={s.lanc} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <nav className="lapozo" aria-label="Lapozás a képletek között">
        {elozo ? (
          <a href={link.keplet(elozo.id)}>
            <ArrowLeftIcon size={18} aria-hidden />
            <span>
              <span className="kid">{elozo.id}</span> {elozo.cim}
            </span>
          </a>
        ) : (
          <span />
        )}
        {kovetkezo && (
          <a href={link.keplet(kovetkezo.id)} className="jobbra">
            <span>
              <span className="kid">{kovetkezo.id}</span> {kovetkezo.cim}
            </span>
            <ArrowRightIcon size={18} aria-hidden />
          </a>
        )}
      </nav>
    </article>
  )
}
