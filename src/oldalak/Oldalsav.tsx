import { Fragment, useEffect, useRef } from 'react'
import { KT } from '../content/kepletter.ts'
import { KOR_CIM, korCsoportok, useKor } from '../kor.ts'
import { link } from '../router.ts'

// A képletoldalak bal oldali listája (lustán töltődik a képlettárral együtt).

export function Oldalsav({ aktivId }: { aktivId?: string }) {
  const nav = useRef<HTMLElement>(null)
  const valasztas = useKor()
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
  }, [aktivId])
  return (
    <nav className="oldalsav" aria-label="Képletek" ref={nav}>
      {korCsoportok(valasztas).map((kor) => (
        <Fragment key={kor}>
          {valasztas === 'mind' && <div className={`oldalsav-kor kor-${kor}`}>{KOR_CIM[kor]}</div>}
          {KT.fejezetek
            .filter((f) => f.kor === kor)
            .map((f) => (
        <div key={f.szam} className="oldalsav-fejezet">
          <div className="oldalsav-cim">
            {f.szam}. {f.cim}
          </div>
          <ul>
            {f.kepletek.map((k) => (
              <li key={k.id}>
                <a href={link.keplet(k.id)} aria-current={k.id === aktivId ? 'page' : undefined}>
                  <span className="kid">{k.id}</span>
                  <span>{k.cim}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
            ))}
        </Fragment>
      ))}
    </nav>
  )
}
