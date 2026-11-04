import type { ReactNode } from 'react'
import { Lecke01 } from '../leckek/l01-atlagok.tsx'
import { Lecke02 } from '../leckek/l02-normalis.tsx'
import { Lecke03 } from '../leckek/l03-allapotok.tsx'
import { Lecke04 } from '../leckek/l04-portfolio.tsx'
import { Lecke05 } from '../leckek/l05-diverzifikacio.tsx'
import { Lecke06 } from '../leckek/l06-cal.tsx'
import { Lecke07 } from '../leckek/l07-karakterisztikus.tsx'
import { Lecke08 } from '../leckek/l08-sml.tsx'
import { Lecke09 } from '../leckek/l09-gordon.tsx'
import { Lecke10 } from '../leckek/l10-npv.tsx'
import { Lecke11 } from '../leckek/l11-wacc.tsx'
import { Lecke12 } from '../leckek/l12-wacc-capm.tsx'
import { Lecke13 } from '../leckek/l13-mm.tsx'
import { Lecke14 } from '../leckek/l14-trade-off.tsx'
import { LECKEK } from '../leckek/leckek.ts'
import { LeckeNavigator } from '../leckek/ui/keret.tsx'
import { link } from '../router.ts'

const OLDALAK: Record<number, () => ReactNode> = {
  1: () => <Lecke01 />,
  2: () => <Lecke02 />,
  3: () => <Lecke03 />,
  4: () => <Lecke04 />,
  5: () => <Lecke05 />,
  6: () => <Lecke06 />,
  7: () => <Lecke07 />,
  8: () => <Lecke08 />,
  9: () => <Lecke09 />,
  10: () => <Lecke10 />,
  11: () => <Lecke11 />,
  12: () => <Lecke12 />,
  13: () => <Lecke13 />,
  14: () => <Lecke14 />,
}

export function LeckeOldal({ szam }: { szam: number }) {
  const oldal = OLDALAK[szam]
  if (oldal) return <>{oldal()}</>
  const info = LECKEK.find((l) => l.szam === szam)
  return (
    <article className="oldal oldal-szeles leckek-oldal">
      <LeckeNavigator aktiv={szam} />
      <h1>{info ? `${szam}. ${info.cim}` : 'Nincs ilyen lecke'}</h1>
      <p>
        Ez a lecke még nem készült el. <a href={link.leckek}>Vissza a leckékhez</a>
      </p>
    </article>
  )
}
