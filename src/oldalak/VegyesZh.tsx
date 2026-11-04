import { CheckCircleIcon, TimerIcon, XCircleIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { type Feladat, ujFeladat } from '../gyakorlas/motor.ts'
import { rng, ujSeed } from '../lib/rng.ts'
import { SABLONOK, sablonKor } from '../gyakorlas/sablonok/index.ts'
import { korbaTartozik, korValasztas } from '../kor.ts'
import { feladatBeallitas } from '../gyakorlas/beallitasok.ts'
import { type Eredmeny, FeladatFuttato } from '../gyakorlas/ui/FeladatFuttato.tsx'
import { link } from '../router.ts'

/** Véletlen feladatsor: a sablonokat keverve sorra vesszük, hogy minél több típus előforduljon. */
function zhSorsol(db: number): Feladat[] {
  const r = rng(ujSeed())
  const valasztas = korValasztas()
  const kevert = r.kever(SABLONOK.filter((s) => korbaTartozik(valasztas, sablonKor(s))))
  return Array.from({ length: db }, (_, i) => ujFeladat(kevert[i % kevert.length], ujSeed(), feladatBeallitas()))
}

function ido(mp: number): string {
  const m = Math.floor(mp / 60)
  const s = Math.floor(mp % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function Menet({ db, perc, ujra }: { db: number; perc: number; ujra: () => void }) {
  const [feladatok] = useState(() => zhSorsol(db))
  const [idx, setIdx] = useState(0)
  const [eredmenyek, setEredmenyek] = useState<(Eredmeny | null)[]>(() => feladatok.map(() => null))
  const [kezdet] = useState(() => Date.now())
  const [most, setMost] = useState(() => Date.now())
  const [vege, setVege] = useState(false)

  const eltelt = (most - kezdet) / 1000
  const maradek = perc > 0 ? Math.max(0, perc * 60 - eltelt) : null

  useEffect(() => {
    if (vege) return
    const t = setInterval(() => setMost(Date.now()), 1000)
    return () => clearInterval(t)
  }, [vege])

  useEffect(() => {
    if (maradek === 0 && !vege) setVege(true)
  }, [maradek, vege])

  if (vege) {
    const kesz = eredmenyek.filter((e): e is Eredmeny => e !== null)
    const felJo = kesz.reduce((s, e) => s + e.felismeres.filter(Boolean).length, 0)
    const felOssz = kesz.reduce((s, e) => s + e.felismeres.length, 0)
    const lepJo = kesz.reduce((s, e) => s + e.lepesek.filter((l) => l.elsoreJo).length, 0)
    const lepOssz = kesz.reduce((s, e) => s + e.lepesek.length, 0)
    return (
      <section className="zh-osszegzes">
        <h2>{maradek === 0 ? 'Lejárt az idő' : 'A ZH véget ért'}</h2>
        <div className="zh-szamok">
          <div>
            <span className="nagy-szam">
              {kesz.length}/{db}
            </span>
            <span>befejezett feladat</span>
          </div>
          <div>
            <span className="nagy-szam">
              {felJo}/{felOssz}
            </span>
            <span>jó felismerés</span>
          </div>
          <div>
            <span className="nagy-szam">
              {lepJo}/{lepOssz}
            </span>
            <span>elsőre jó lépés</span>
          </div>
          <div>
            <span className="nagy-szam">{ido(eltelt)}</span>
            <span>eltelt idő</span>
          </div>
        </div>
        <div className="tabla-keret">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Feladattípus</th>
                <th>Felismerés</th>
                <th>Elsőre jó lépés</th>
              </tr>
            </thead>
            <tbody>
              {feladatok.map((f, i) => {
                const e = eredmenyek[i]
                return (
                  <tr key={i}>
                    <td>{i + 1}.</td>
                    <td>{f.sablon.cim}</td>
                    {e ? (
                      <>
                        <td>
                          {e.felismeres.every(Boolean) ? (
                            <CheckCircleIcon className="ikon-jo" size={18} weight="fill" aria-label="jó" />
                          ) : (
                            <XCircleIcon className="ikon-rossz" size={18} weight="fill" aria-label="hibás" />
                          )}
                        </td>
                        <td>
                          {e.lepesek.filter((l) => l.elsoreJo).length} / {e.lepesek.length}
                        </td>
                      </>
                    ) : (
                      <td colSpan={2} className="nem-kesz">
                        nem fejezted be
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="zaro-gombok">
          <button className="gomb" onClick={ujra}>
            Új ZH ugyanígy
          </button>
          <a className="gomb gomb-masodlagos" href={link.gyakorlas}>
            Vissza a gyakorláshoz
          </a>
          <a className="gomb-szoveg" href={link.statisztika}>
            Statisztika
          </a>
        </div>
      </section>
    )
  }

  const utolso = idx === feladatok.length - 1
  return (
    <>
      <div className="zh-sav">
        <span>
          {idx + 1}. / {feladatok.length}. feladat
        </span>
        <span className={`ora ${maradek !== null && maradek < 60 ? 'surgos' : ''}`} aria-live="off">
          <TimerIcon size={18} aria-hidden />
          {maradek !== null ? `${ido(maradek)} van hátra` : ido(eltelt)}
        </span>
        <button className="gomb-szoveg" onClick={() => setVege(true)}>
          ZH befejezése
        </button>
      </div>
      <FeladatFuttato
        key={idx}
        feladat={feladatok[idx]}
        onKesz={(e) => setEredmenyek((es) => es.map((x, i) => (i === idx ? e : x)))}
        zarogombok={
          <button className="gomb" onClick={() => (utolso ? setVege(true) : setIdx(idx + 1))} autoFocus>
            {utolso ? 'ZH lezárása' : 'Következő feladat'}
          </button>
        }
      />
    </>
  )
}

export function VegyesZh({ db, perc }: { db: number; perc: number }) {
  const [menet, setMenet] = useState(0)
  return (
    <article className="oldal oldal-szeles">
      <header className="oldal-fej gyakorlo-fej">
        <a className="morzsa" href={link.gyakorlas}>
          Gyakorlás
        </a>
        <h1>Vegyes gyakorlás</h1>
      </header>
      <Menet key={menet} db={db} perc={perc} ujra={() => setMenet((m) => m + 1)} />
    </article>
  )
}
