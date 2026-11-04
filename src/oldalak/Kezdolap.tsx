import { ArrowRightIcon, BookOpenIcon, ExamIcon, PencilLineIcon } from '@phosphor-icons/react'
import { korEredmenyei, useKor } from '../kor.ts'
import { link } from '../router.ts'
import { useZhEredmenyek } from '../zh/eredmenyek.ts'
import { IRANYOK, legutobbiZh } from './kezdolapAdat.ts'

const IKONOK = [BookOpenIcon, PencilLineIcon, ExamIcon]

function ido(mp: number): string {
  return `${Math.floor(mp / 60)}:${String(Math.round(mp % 60)).padStart(2, '0')}`
}

export function Kezdolap() {
  const zh = legutobbiZh(korEredmenyei(useZhEredmenyek(), useKor()))
  return (
    <article className="oldal oldal-szeles kezdolap">
      <header className="oldal-fej">
        <h1>Vállalati pénzügyek II</h1>
        <p className="bevezeto-szoveg">ZH-gyakorló az előadások képletei és példái alapján. Honnan indulsz?</p>
      </header>

      <div className="iranyok">
        {IRANYOK.map((ir, i) => {
          const Ikon = IKONOK[i]
          return (
            <section key={ir.cim} className="irany">
              <div className="irany-fej">
                <span className="irany-ikon">
                  <Ikon size={24} aria-hidden />
                </span>
                <div>
                  <h2>{ir.cim}</h2>
                  <p className="irany-alcim">{ir.alcim}</p>
                </div>
              </div>
              <p>{ir.leiras}</p>
              <div className="irany-linkek">
                {ir.linkek.map((l) => (
                  <a key={l.href} className={l.fo ? 'gomb' : 'gomb gomb-masodlagos'} href={l.href}>
                    {l.cim} {l.fo && <ArrowRightIcon size={16} aria-hidden />}
                  </a>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section className="legutobbi-zh">
        <h2>Legutóbbi ZH-szimuláció</h2>
        {zh ? (
          <p>
            <strong className="nagy-szam">{zh.pont.ossz}</strong> / 50 pont
            <span className="legutobbi-reszek">
              igaz-hamis {zh.pont.ih}, feleletválasztós {zh.pont.mc}, számítási {zh.pont.sz} · {ido(zh.mp)}
              {zh.lejart ? ' (lejárt az idő)' : ''} · {new Date(zh.datum).toLocaleDateString('hu-HU')}
            </span>
            <a href={link.statisztika}>Összes eredmény</a>
          </p>
        ) : (
          <p>
            Még nincs beadott ZH. <a href={link.zhSzimulacio}>Az első ZH-szimuláció indítása</a>
          </p>
        )}
      </section>
    </article>
  )
}
