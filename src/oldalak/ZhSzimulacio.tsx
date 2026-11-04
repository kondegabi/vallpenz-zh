// ZH-szimuláció a tantárgy formátumában: 25 perc, 8 igaz-hamis, 8 feleletválasztós, 4 számítási
// példa (csak végeredmény), 50 pont. Visszajelzés csak a beadás után.

import { CheckCircleIcon, TimerIcon, XCircleIcon } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { eredmeny } from '../gyakorlas/formaz.ts'
import { kiertekelo } from '../gyakorlas/motor.ts'
import type { Egyseg, Getter } from '../gyakorlas/tipusok.ts'
import { FeladatSzoveg } from '../gyakorlas/ui/FeladatSzoveg.tsx'
import { LancKepletek } from '../gyakorlas/ui/LancKepletek.tsx'
import { KOR_OPCIOK, korValasztas, type KorValasztas, useKor } from '../kor.ts'
import { ujSeed } from '../lib/rng.ts'
import { Inline } from '../ui/Inline.tsx'
import { link } from '../router.ts'
import { elozoValtozatok, valtozatokMentes, zhEredmenyRogzit } from '../zh/eredmenyek.ts'
import { kiertekel, MAX, uresValaszok, type Kiertekeles, type Valaszok } from '../zh/pontozas.ts'
import { IH_DB, MC_DB, SZ_DB, valtozatKulcsok, ZH_PERC, zhOsszeallit, type Zh } from '../zh/sorsolas.ts'
import { feltetelezettSzabalyok, SZABALYOK } from '../zh/szabalyok.ts'
import { idoJovair, kerdesKulcs, type Resz, tempoOsszesit } from '../zh/tempo.ts'

const BETUK = ['A', 'B', 'C', 'D']
const EGYSEG: Record<Egyseg, string> = { '%': '%', tizedes: '', USD: 'USD', 'M USD': 'M USD' }

function ido(mp: number): string {
  const m = Math.floor(mp / 60)
  const s = Math.floor(mp % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function megvalaszolt(zh: Zh, v: Valaszok): number {
  const sz = zh.szamitas.filter((p, i) => p.kulcsok.every((k) => (v.sz[i][k] ?? '').trim() !== '')).length
  return v.ih.filter((x) => x !== null).length + v.mc.filter((x) => x !== null).length + sz
}

// ---------- Kezdőképernyő ----------

function Kezdo({ indit }: { indit: () => void }) {
  const valasztas = useKor()
  return (
    <section className="zh-kezdo">
      <p className="zh-anyag">
        Anyag: <strong>{KOR_OPCIOK.find((o) => o.ertek === valasztas)?.cim}</strong>
        {valasztas !== 1 && ' (a 2. ZH-ból eddig a tőkeszerkezet van feltöltve)'}. Másik anyaghoz használd a fejléc választóját.
      </p>
      <p className="bevezeto-szoveg">A valódi ZH formátuma: {ZH_PERC} perc, összesen {MAX.ossz} pont. Közben nincs visszajelzés; a pontokat és a megoldásokat a beadás után látod.</p>
      <div className="tabla-keret">
        <table>
          <thead>
            <tr>
              <th>Rész</th>
              <th>Darab</th>
              <th>Pontozás</th>
              <th>Max.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>I. Igaz-hamis</td>
              <td>{IH_DB}</td>
              <td>
                {SZABALYOK.igazHamis.kuszob} vagy kevesebb jó: 0 pont; {SZABALYOK.igazHamis.kuszob + 1} jó: {SZABALYOK.igazHamis.pontPerJo} pont; minden további jó +
                {SZABALYOK.igazHamis.pontPerJo} pont
              </td>
              <td>{MAX.ih}</td>
            </tr>
            <tr>
              <td>II. Feleletválasztós</td>
              <td>{MC_DB}</td>
              <td>jó válasz {SZABALYOK.valasztos.pont} pont (elméleti vagy számítási kérdés)</td>
              <td>{MAX.mc}</td>
            </tr>
            <tr>
              <td>III. Számítási példa</td>
              <td>{SZ_DB}</td>
              <td>jó megoldás {SZABALYOK.szamitas.pont} pont; elég a végeredmény</td>
              <td>{MAX.sz}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="zh-feltetelezett">
        <strong>Feltételezett szabályok, a valódi ZH eltérhet:</strong> {feltetelezettSzabalyok().join('; ')}.
      </p>
      {valasztas !== 1 && <p className="zh-feltetelezett">A 2. ZH formátuma tudomásunk szerint ugyanaz, mint az 1. ZH-é, ezért ugyanezzel a pontozással számolunk.</p>}
      <p className="megjegyzes">Számoknál tizedesvesszőt vagy pontot is írhatsz; a százalékokat százalékban add meg (pl. 13,18).</p>
      <button className="gomb" onClick={indit} autoFocus>
        <TimerIcon size={18} aria-hidden /> ZH indítása ({ZH_PERC} perc)
      </button>
    </section>
  )
}

// ---------- Kérdéskártyák ----------

function IgazHamisKartya({ zh, v, setV, e, ido }: { zh: Zh; v: Valaszok; setV: (f: (v: Valaszok) => Valaszok) => void; e?: Kiertekeles; ido?: Record<string, number> }) {
  return (
    <section className="zh-resz">
      <h2>
        I. Igaz-hamis <span className="zh-resz-pont">{e ? `${e.pont.ih} / ${MAX.ih} pont` : `max. ${MAX.ih} pont`}</span>
      </h2>
      <ol className="zh-lista">
        {zh.igazHamis.map((k, i) => {
          const valasz = v.ih[i]
          const jo = e?.ih[i]
          return (
            <li key={i} className={`zh-kartya ${e ? (jo ? 'jo' : 'rossz') : ''}`} data-kerdes={kerdesKulcs('ih', i)}>
              <span className="zh-sorszam">
                {i + 1}.{ido && <IdoCimke mp={ido[kerdesKulcs('ih', i)]} />}
              </span>
              <div className="zh-kartya-test zh-ih-test">
                <p className="zh-allitas">{k.szoveg}</p>
                <div className="zh-ih-gombok" role="group" aria-label={`${i + 1}. állítás`}>
                  {[true, false].map((b) => (
                    <button
                      key={String(b)}
                      className={`gomb gomb-masodlagos ${e && k.igaz === b ? 'helyes-valasz' : ''}`}
                      aria-pressed={valasz === b}
                      disabled={!!e}
                      onClick={() => setV((x) => ({ ...x, ih: x.ih.map((y, j) => (j === i ? (y === b ? null : b) : y)) }))}
                    >
                      {b ? 'Igaz' : 'Hamis'}
                    </button>
                  ))}
                </div>
                {e && (
                  <p className="zh-indok">
                    <Jel jo={!!jo} /> {k.igaz ? 'Az állítás igaz.' : <>Az állítás hamis. Helyesen: {k.allitas.igaz}</>}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** A kérdésre fordított idő a kiértékelésben; a küszöb fölött jelölve. */
function IdoCimke({ mp = 0 }: { mp?: number }) {
  const lassu = mp > SZABALYOK.lassuKuszobMp
  return (
    <span className={`zh-kerdes-ido ${lassu ? 'lassu' : ''}`} title={lassu ? `${SZABALYOK.lassuKuszobMp} másodpercnél tovább tartott` : 'erre a kérdésre fordított idő'}>
      {ido(mp)}
    </span>
  )
}

function Tempo({ ido: mp }: { ido: Record<string, number> }) {
  const o = tempoOsszesit(mp)
  const db: Record<Resz, number> = { ih: IH_DB, mc: MC_DB, sz: SZ_DB }
  return (
    <section className="zh-tempo">
      <h2>Tempó</h2>
      <p className="megjegyzes">
        Az időt az a kérdés kapja, amelyikhez utoljára hozzányúltál. Egy kérdésre átlagosan {SZABALYOK.lassuKuszobMp} másodperc jut ({ZH_PERC} perc /{' '}
        {IH_DB + MC_DB + SZ_DB} kérdés); az ennél hosszabbakat jelöljük.
      </p>
      <div className="tabla-keret">
        <table>
          <thead>
            <tr>
              <th>Szakasz</th>
              <th>Idő</th>
              <th>Átlag / kérdés</th>
            </tr>
          </thead>
          <tbody>
            {o.szakaszok.map((s) => (
              <tr key={s.resz}>
                <td>{s.cim}</td>
                <td>{ido(s.mp)}</td>
                <td>{ido(s.mp / db[s.resz])}</td>
              </tr>
            ))}
            {o.egyeb >= 1 && (
              <tr>
                <td>Olvasás, görgetés (egyik kérdéshez sem)</td>
                <td>{ido(o.egyeb)}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {o.lassuk.length > 0 ? (
        <p>
          <strong>{SZABALYOK.lassuKuszobMp} másodpercnél tovább tartott:</strong> {o.lassuk.map((l) => `${l.sorszam}. kérdés (${ido(l.mp)})`).join(', ')}
        </p>
      ) : (
        <p>Egyik kérdés sem tartott {SZABALYOK.lassuKuszobMp} másodpercnél tovább.</p>
      )}
    </section>
  )
}

function Jel({ jo }: { jo: boolean }) {
  return jo ? <CheckCircleIcon className="zh-jel jo" size={18} weight="fill" aria-label="jó" /> : <XCircleIcon className="zh-jel rossz" size={18} weight="fill" aria-label="hibás" />
}

function ValasztosKartya({ zh, v, setV, e, ido }: { zh: Zh; v: Valaszok; setV: (f: (v: Valaszok) => Valaszok) => void; e?: Kiertekeles; ido?: Record<string, number> }) {
  return (
    <section className="zh-resz">
      <h2>
        II. Feleletválasztós <span className="zh-resz-pont">{e ? `${e.pont.mc} / ${MAX.mc} pont` : `max. ${MAX.mc} pont`}</span>
      </h2>
      <ol className="zh-lista">
        {zh.valasztos.map((k, i) => {
          const valasz = v.mc[i]
          const jo = e?.mc[i]
          return (
            <li key={i} className={`zh-kartya ${e ? (jo ? 'jo' : 'rossz') : ''}`} data-kerdes={kerdesKulcs('mc', i)}>
              <span className="zh-sorszam">
                {IH_DB + i + 1}.{ido && <IdoCimke mp={ido[kerdesKulcs('mc', i)]} />}
              </span>
              <div className="zh-kartya-test">
                {k.szoveg && (
                  <FeladatSzoveg
                    szoveg={k.szoveg}
                    rejtettKerdes={k.fajta === 'felismeres' ? 'A feladat kérdését itt nem mutatjuk: a láncot az adatokból kell felismerni.' : undefined}
                  />
                )}
                <p className="zh-kerdes">{k.kerdes}</p>
                <div className="zh-opciok" role="radiogroup" aria-label={`${IH_DB + i + 1}. kérdés`}>
                  {k.opciok.map((o, j) => {
                    const allapot = e ? (j === k.helyes ? 'helyes' : j === valasz ? 'rossz' : 'halvany') : ''
                    return (
                      <button
                        key={j}
                        className={`zh-opcio ${allapot}`}
                        role="radio"
                        aria-checked={valasz === j}
                        disabled={!!e}
                        onClick={() => setV((x) => ({ ...x, mc: x.mc.map((y, m) => (m === i ? j : y)) }))}
                      >
                        <span className="zh-betu">{BETUK[j]}</span>
                        <span>{k.lancok ? <LancKepletek sorId={k.lancok[j]} /> : <Inline szoveg={o} linkek={false} />}</span>
                      </button>
                    )
                  })}
                </div>
                {e && (
                  <p className="zh-indok">
                    <Jel jo={!!jo} /> {jo ? 'Jó válasz.' : `A helyes válasz: ${BETUK[k.helyes]}.`} {k.indok && <Inline szoveg={k.indok} linkek={false} />}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function SzamitasKartya({ zh, v, setV, e, ido }: { zh: Zh; v: Valaszok; setV: (f: (v: Valaszok) => Valaszok) => void; e?: Kiertekeles; ido?: Record<string, number> }) {
  return (
    <section className="zh-resz">
      <h2>
        III. Számítási példák <span className="zh-resz-pont">{e ? `${e.pont.sz} / ${MAX.sz} pont` : `max. ${MAX.sz} pont`}</span>
      </h2>
      <ol className="zh-lista">
        {zh.szamitas.map((p, i) => {
          const get = kiertekelo(p.feladat.sablon, p.feladat.p) as Getter
          const er = e?.sz[i]
          return (
            <li key={i} className={`zh-kartya ${er ? (er.jo ? 'jo' : 'rossz') : ''}`} data-kerdes={kerdesKulcs('sz', i)}>
              <span className="zh-sorszam">
                {IH_DB + MC_DB + i + 1}.{ido && <IdoCimke mp={ido[kerdesKulcs('sz', i)]} />}
              </span>
              <div className="zh-kartya-test">
                {/* a kérdések a beviteli mezők címkéiben állnak, ezért a felsorolás nem kell */}
                <FeladatSzoveg szoveg={{ ...p.szoveg, kerdesek: [] }} />
                <div className="zh-bevitelek">
                  {p.kulcsok.map((key) => {
                    const l = p.feladat.lepesek.find((x) => x.key === key)!
                    const ertek = v.sz[i][key] ?? ''
                    const helyes = p.feladat.ertekek[key]
                    const allit = (s: string) => setV((x) => ({ ...x, sz: x.sz.map((y, j) => (j === i ? { ...y, [key]: s } : y)) }))
                    const id = `zh-${i}-${key}`
                    return (
                      <div key={key} className={`zh-bevitel ${er ? (er.kulcsok[key] ? 'jo' : 'rossz') : ''}`}>
                        <label htmlFor={id}>{l.kerdes}</label>
                        {l.tipus === 'szam' ? (
                          <div className="bevitel-mezo">
                            <input id={id} type="text" inputMode="decimal" autoComplete="off" value={ertek} disabled={!!e} onChange={(ev) => allit(ev.target.value)} />
                            {EGYSEG[l.egyseg] && <span className="egyseg">{EGYSEG[l.egyseg]}</span>}
                          </div>
                        ) : (
                          <div className="zh-ih-gombok" role="group" aria-labelledby={id}>
                            {/* a sablon eredeti sorrendjében, hogy egy példán belül minden döntésnél ugyanott legyenek */}
                            {(p.feladat.sablon.lepesek.find((x) => x.key === key && x.tipus === 'valasztas') as typeof l).opciok.map((o) => (
                              <button key={o} className="gomb gomb-masodlagos" aria-pressed={ertek === o} disabled={!!e} onClick={() => allit(ertek === o ? '' : o)}>
                                {o}
                              </button>
                            ))}
                          </div>
                        )}
                        {er && (
                          <p className="zh-indok">
                            <Jel jo={er.kulcsok[key]} /> Helyes: {l.tipus === 'szam' ? eredmeny(helyes as number, l.egyseg) : String(helyes)}
                            <span className="zh-levezetes">{l.levezetes(p.feladat.p, get)}</span>
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
                {er?.megjegyzes && <p className="nyitott-megjegyzes">{er.megjegyzes}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// ---------- A ZH menete ----------

function Menet({ ujra }: { ujra: () => void }) {
  const [seed] = useState(() => ujSeed())
  // a ZH közben a fejléc választója nem hat a már sorsolt feladatsorra
  const [kor] = useState<KorValasztas>(() => korValasztas())
  // az előző ZH szövegváltozatait kerüli; a mostaniakat elmentjük a következőnek
  const zh = useMemo(() => {
    const uj = zhOsszeallit(seed, elozoValtozatok(), kor)
    valtozatokMentes(valtozatKulcsok(uj))
    return uj
  }, [seed, kor])
  const [v, setV] = useState<Valaszok>(() => uresValaszok(zh))
  const [kezdet] = useState(() => Date.now())
  const [most, setMost] = useState(() => Date.now())
  const [e, setE] = useState<Kiertekeles | null>(null)
  const [megerosit, setMegerosit] = useState(false)
  const [lejart, setLejart] = useState(false)
  const rogzitve = useRef(false)
  // tempó: az idő az utoljára érintett kérdésé
  const aktivKerdes = useRef<string | null>(null)
  const utolsoMeres = useRef(Date.now())
  const idoRef = useRef<Record<string, number>>({})
  const [idoVegso, setIdoVegso] = useState<Record<string, number> | null>(null)
  const meres = () => {
    const most = Date.now()
    idoRef.current = idoJovair(idoRef.current, aktivKerdes.current, (most - utolsoMeres.current) / 1000)
    utolsoMeres.current = most
  }
  const erint = (cel: EventTarget) => {
    if (e || !(cel instanceof Element)) return
    const k = cel.closest('[data-kerdes]')?.getAttribute('data-kerdes') ?? null
    if (k === null || k === aktivKerdes.current) return
    meres()
    aktivKerdes.current = k
  }

  const eltelt = (most - kezdet) / 1000
  const maradek = Math.max(0, ZH_PERC * 60 - eltelt)
  const osszes = IH_DB + MC_DB + SZ_DB
  const kesz = megvalaszolt(zh, v)

  const bead = (idoLejart: boolean) => {
    if (rogzitve.current) return
    rogzitve.current = true
    const k = kiertekel(zh, v)
    meres()
    setIdoVegso(idoRef.current)
    setE(k)
    setLejart(idoLejart)
    setMegerosit(false)
    zhEredmenyRogzit({ datum: new Date().toISOString(), seed, pont: k.pont, mp: Math.round(Math.min(eltelt, ZH_PERC * 60)), lejart: idoLejart, kor })
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    if (e) return
    const t = setInterval(() => (meres(), setMost(Date.now())), 1000)
    return () => clearInterval(t)
  }, [e])

  useEffect(() => {
    if (maradek === 0 && !e) bead(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maradek, e])

  return (
    <div className="zh-menet">
      {e ? (
        <section className="zh-eredmeny" aria-live="polite">
          <p className="zh-eredmeny-cim">{lejart ? 'Lejárt az idő, a ZH-t beadtuk.' : 'A ZH-t beadtad.'}</p>
          <p className="zh-eredmeny-pont">
            <span className="nagy-szam">{e.pont.ossz}</span> / {MAX.ossz} pont
          </p>
          <ul className="zh-eredmeny-reszek">
            <li>Igaz-hamis: {e.pont.ih} / {MAX.ih}</li>
            <li>Feleletválasztós: {e.pont.mc} / {MAX.mc}</li>
            <li>Számítási: {e.pont.sz} / {MAX.sz}</li>
            <li>Idő: {ido(Math.min(eltelt, ZH_PERC * 60))}</li>
          </ul>
          {idoVegso && <Tempo ido={idoVegso} />}
          <div className="zh-gombok">
            <button className="gomb" onClick={ujra}>
              Új ZH
            </button>
            <a className="gomb gomb-masodlagos" href={link.statisztika}>
              Statisztika
            </a>
          </div>
        </section>
      ) : (
        <div className="zh-sav zh-szimulacio-sav">
          <span className={`zh-ido ${maradek < 180 ? 'figyel' : ''}`} aria-live="off">
            <TimerIcon size={18} aria-hidden /> {ido(maradek)}
          </span>
          <span className="zh-allapot">
            megválaszolva: {kesz} / {osszes}
          </span>
          {megerosit ? (
            <span className="zh-megerosit">
              {kesz < osszes ? `${osszes - kesz} kérdés még üres. ` : ''}Biztosan beadod?
              <button className="gomb" onClick={() => bead(false)}>
                Beadás
              </button>
              <button className="gomb-szoveg" onClick={() => setMegerosit(false)}>
                Vissza
              </button>
            </span>
          ) : (
            <button className="gomb" onClick={() => setMegerosit(true)}>
              Beadás
            </button>
          )}
        </div>
      )}
      <div onPointerDownCapture={(ev) => erint(ev.target)} onFocusCapture={(ev) => erint(ev.target)}>
        <IgazHamisKartya zh={zh} v={v} setV={setV} e={e ?? undefined} ido={idoVegso ?? undefined} />
        <ValasztosKartya zh={zh} v={v} setV={setV} e={e ?? undefined} ido={idoVegso ?? undefined} />
        <SzamitasKartya zh={zh} v={v} setV={setV} e={e ?? undefined} ido={idoVegso ?? undefined} />
      </div>
      {!e && (
        <div className="zh-gombok">
          <button className="gomb" onClick={() => (setMegerosit(true), window.scrollTo(0, 0))}>
            Beadás
          </button>
        </div>
      )}
    </div>
  )
}

export function ZhSzimulacio() {
  const [menet, setMenet] = useState(0)
  return (
    <article className="oldal oldal-szeles zh-oldal">
      <header className="oldal-fej">
        <a className="morzsa" href={link.gyakorlas}>
          Gyakorlás
        </a>
        <h1>ZH-szimuláció</h1>
      </header>
      {menet === 0 ? <Kezdo indit={() => setMenet(1)} /> : <Menet key={menet} ujra={() => (setMenet((m) => m + 1), window.scrollTo(0, 0))} />}
    </article>
  )
}
