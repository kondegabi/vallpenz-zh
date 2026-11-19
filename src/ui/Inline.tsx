import { Fragment, type ReactNode } from 'react'
import { KEPLET_IDK } from '../content/kepletter.ts'
import { KEPLET_ID_MINTA } from '../content/parse.ts'
import { link } from '../router.ts'

// A képlettár soron belüli jelölései: **félkövér**, `kód`, \_ ; a képlet-id-k linkek lesznek.

function linkesit(szoveg: string, kulcs: string): ReactNode[] {
  const ki: ReactNode[] = []
  let poz = 0
  for (const m of szoveg.matchAll(KEPLET_ID_MINTA)) {
    if (!KEPLET_IDK.has(m[1])) continue
    const i = m.index!
    ki.push(szoveg.slice(poz, i))
    ki.push(
      <a key={`${kulcs}-${i}`} className="idlink" href={link.keplet(m[1])}>
        {m[1]}
      </a>,
    )
    poz = i + m[1].length
  }
  ki.push(szoveg.slice(poz))
  return ki
}

/** A \* escape-elt csillag helye a félkövér-jelölés keresése alatt (hogy ne legyen belőle **). */
const CSILLAG = ''

export function Inline({ szoveg, linkek = true }: { szoveg: string; linkek?: boolean }) {
  const t = szoveg.replace(/\\_/g, '_').replace(/\\\*/g, CSILLAG)
  const vissza = (s: string) => s.replaceAll(CSILLAG, '*')
  const darabok: ReactNode[] = []
  let poz = 0
  let n = 0
  for (const m of t.matchAll(/\*\*(.+?)\*\*|`([^`]+)`/g)) {
    const i = m.index!
    const elotte = vissza(t.slice(poz, i))
    darabok.push(<Fragment key={n++}>{linkek ? linkesit(elotte, `t${n}`) : elotte}</Fragment>)
    if (m[1] !== undefined) darabok.push(<strong key={n++}>{linkek ? linkesit(vissza(m[1]), `b${n}`) : vissza(m[1])}</strong>)
    else darabok.push(<code key={n++}>{vissza(m[2])}</code>)
    poz = i + m[0].length
  }
  const vege = vissza(t.slice(poz))
  darabok.push(<Fragment key={n++}>{linkek ? linkesit(vege, `v${n}`) : vege}</Fragment>)
  return <>{darabok}</>
}
