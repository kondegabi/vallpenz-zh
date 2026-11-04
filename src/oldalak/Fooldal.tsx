import { Fragment } from 'react'
import { KT } from '../content/kepletter.ts'
import { korCsoportok, useKor } from '../kor.ts'
import { link } from '../router.ts'
import { Blokkok } from '../ui/Blokkok.tsx'
import { Inline } from '../ui/Inline.tsx'
import { KorFejlec } from '../ui/KorJeloles.tsx'

export function Fooldal() {
  const valasztas = useKor()
  // a bevezető első sora a dátum és a szerző; azt kisebben mutatjuk
  const [elso, ...tobbi] = KT.bevezeto
  const meta = elso?.tipus === 'bekezdes' && elso.szoveg.includes('@')
  return (
    <article className="oldal">
      <header className="oldal-fej">
        <h1>{KT.cim}</h1>
        {meta && <p className="meta">{elso.szoveg}</p>}
      </header>
      <Blokkok blokkok={meta ? tobbi : KT.bevezeto} />

      {korCsoportok(valasztas).map((kor) => (
        <Fragment key={kor}>
          <KorFejlec kor={kor} valasztas={valasztas} />
          {KT.fejezetek
            .filter((f) => f.kor === kor)
            .map((f) => (
        <section key={f.szam} className="fejezet" id={`fejezet-${f.szam}`}>
          <h2>
            <span className="fejezet-szam">{f.szam}.</span> {f.cim}
          </h2>
          <Blokkok blokkok={f.bevezeto} />
          <ul className="kepletlista">
            {f.kepletek.map((k) => (
              <li key={k.id}>
                <a href={link.keplet(k.id)}>
                  <span className="kid">{k.id}</span>
                  <span className="kcim">{k.cim}</span>
                  {k.magyarul && (
                    <span className="kmagyarul">
                      <Inline szoveg={k.magyarul} linkek={false} />
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </section>
            ))}
        </Fragment>
      ))}
    </article>
  )
}
