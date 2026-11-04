import { Fragment, type ReactNode } from 'react'
import { korCsoportok, useKor } from '../kor.ts'
import { Elonezet01 } from '../leckek/l01-atlagok.tsx'
import { Elonezet02 } from '../leckek/l02-normalis.tsx'
import { Elonezet03 } from '../leckek/l03-allapotok.tsx'
import { Elonezet04 } from '../leckek/l04-portfolio.tsx'
import { Elonezet05 } from '../leckek/l05-diverzifikacio.tsx'
import { Elonezet06 } from '../leckek/l06-cal.tsx'
import { Elonezet07 } from '../leckek/l07-karakterisztikus.tsx'
import { Elonezet08 } from '../leckek/l08-sml.tsx'
import { Elonezet09 } from '../leckek/l09-gordon.tsx'
import { Elonezet10 } from '../leckek/l10-npv.tsx'
import { Elonezet11 } from '../leckek/l11-wacc.tsx'
import { Elonezet12 } from '../leckek/l12-wacc-capm.tsx'
import { Elonezet13 } from '../leckek/l13-mm.tsx'
import { Elonezet14 } from '../leckek/l14-trade-off.tsx'
import { leckeKor, LECKEK } from '../leckek/leckek.ts'
import { LeckeNavigator } from '../leckek/ui/keret.tsx'
import { link } from '../router.ts'
import { KorFejlec } from '../ui/KorJeloles.tsx'

/** A függőségi térkép sorrendje: fő ág 1 → … → 8 → 12, mellékágon 9 → 11 és 10. */
const SORREND = [1, 2, 3, 4, 5, 6, 7, 8, 12, 9, 11, 10, 13, 14]

const ELONEZETEK: Record<number, () => ReactNode> = {
  1: () => <Elonezet01 />,
  2: () => <Elonezet02 />,
  3: () => <Elonezet03 />,
  4: () => <Elonezet04 />,
  5: () => <Elonezet05 />,
  6: () => <Elonezet06 />,
  7: () => <Elonezet07 />,
  8: () => <Elonezet08 />,
  9: () => <Elonezet09 />,
  10: () => <Elonezet10 />,
  11: () => <Elonezet11 />,
  12: () => <Elonezet12 />,
  13: () => <Elonezet13 />,
  14: () => <Elonezet14 />,
}

/** „Minden együtt”: az összes lecke kis élő előnézettel (diás nézet, alapértékekkel). */
export function Leckek() {
  const valasztas = useKor()
  return (
    <article className="oldal oldal-szeles leckek-oldal">
      <LeckeNavigator aktiv={0} />
      <header className="oldal-fej">
        <h1>Leckék: minden együtt</h1>
        <p className="bevezeto-szoveg">
          Minden lecke egy fogalmat mutat meg egy grafikonon, amelynek bemeneteit csúszkákkal változtathatod. A gyakorlást előkészíti, nem pótolja. A sorrend a
          függőségi térképé.
        </p>
      </header>
      {korCsoportok(valasztas).map((kor) => (
        <Fragment key={kor}>
          <KorFejlec kor={kor} valasztas={valasztas} />
      <ol className="elonezet-racs">
        {SORREND.map((n) => LECKEK.find((x) => x.szam === n)!).filter((l) => leckeKor(l) === kor).map((l) => {
          const n = l.szam
          const el = ELONEZETEK[n]
          return (
            <li key={n} className={l.kesz ? undefined : 'nincs-kesz'}>
              <div className="elonezet-fej">
                <span className="lecke-lista-szam">{n}</span>
                {l.kesz ? <a href={link.lecke(n)}>{l.cim}</a> : <span>{l.cim}</span>}
              </div>
              {el ? (
                <a href={link.lecke(n)} className="elonezet-abra" aria-label={`${n}. lecke megnyitása`}>
                  {el()}
                </a>
              ) : (
                <div className="elonezet-hely">még nem készült el</div>
              )}
              <span className="lecke-lista-kepletek">{l.kepletek.join(', ')}</span>
            </li>
          )
        })}
      </ol>
        </Fragment>
      ))}
      <p className="megjegyzes">
        <a href={link.leckeMinta}>Komponens-minta</a> (a közös elemek bemutatója)
      </p>
    </article>
  )
}
