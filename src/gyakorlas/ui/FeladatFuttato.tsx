import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Inline } from '../../ui/Inline.tsx'
import { feladatEllenoriz, tipikusHiba } from '../ellenorzes.ts'
import { eredmeny as kiir } from '../formaz.ts'
import { FELISMERO_KERDES, felismeroSzoveg } from '../felismeres.ts'
import { type Feladat, felismeroSor, lancNevekkel, szakaszKepletei, tervKeszit } from '../motor.ts'
import { feladatRogzit, felismeresRogzit, lepesRogzit, statFrissit } from '../statisztika.ts'
import type { Lepes } from '../tipusok.ts'
import { FeladatSzoveg } from './FeladatSzoveg.tsx'
import { LancKepletek } from './LancKepletek.tsx'
import { Tipp } from './Tipp.tsx'

export type Eredmeny = {
  sablonId: string
  cim: string
  felismeres: boolean[]
  lepesek: { kerdes: string; elsoreJo: boolean }[]
  hibatlan: boolean
}

type LepesAllapot = {
  bevitel: string
  probak: number
  statusz: 'nyitott' | 'jo' | 'hibas'
  tipp: boolean
  uzenet?: string
}

const EGYSEG_FELIRAT = { '%': '%', tizedes: '', USD: 'USD', 'M USD': 'M USD' } as const

function helyesSzoveg(l: Lepes<unknown>, v: number | string): string {
  return l.tipus === 'szam' ? kiir(v as number, l.egyseg) : String(v)
}

// ---------------- Felismerés ----------------

function FelismeresKartya(props: {
  opciok: string[]
  helyes: string
  valasz: string | null
  aktiv: boolean
  valaszt: (id: string) => void
  tovabb: () => void
}) {
  const { opciok, helyes, valasz, aktiv } = props
  const helyesSor = felismeroSor(helyes)
  return (
    <section className={`munka-kartya felismeres ${aktiv ? 'aktiv' : ''}`}>
      <h3>{FELISMERO_KERDES}</h3>
      <div className="opciok" role="radiogroup">
        {opciok.map((id) => {
          const allapot = valasz === null ? '' : id === helyes ? 'helyes' : id === valasz ? 'rossz' : 'halvany'
          return (
            <button
              key={id}
              className={`opcio ${allapot}`}
              role="radio"
              aria-checked={valasz === id}
              disabled={valasz !== null}
              onClick={() => props.valaszt(id)}
            >
              {/* a lánc a képletekkel: a nevük szó szerint a kérdésből jönne (NPV, WACC…) */}
              <span className="opcio-lanc">
                <LancKepletek sorId={id} />
              </span>
            </button>
          )
        })}
      </div>
      {valasz !== null && (
        <div className={`visszajelzes ${valasz === helyes ? 'jo' : 'rossz'}`}>
          <p className="visszajelzes-fej">
            {valasz === helyes ? <CheckCircleIcon size={18} weight="fill" aria-hidden /> : <XCircleIcon size={18} weight="fill" aria-hidden />}
            {valasz === helyes ? 'Jó felismerés.' : 'Nem ez a lánc.'}
          </p>
          <p className="felismero-indok">
            Ha a feladat ezt adja: <Inline szoveg={helyesSor.adja} linkek={false} />; és ezt kérdezi: <Inline szoveg={helyesSor.kerdezi} linkek={false} />,
            akkor a lánc: <Inline szoveg={lancNevekkel(helyesSor.lanc)} linkek={false} />
          </p>
          {aktiv && (
            <button className="gomb" onClick={props.tovabb} autoFocus>
              Tovább a számoláshoz
            </button>
          )}
        </div>
      )}
    </section>
  )
}

// ---------------- Számolási lépés ----------------

function LepesKartya(props: {
  l: Lepes<unknown>
  sorszam: number
  helyes: number | string
  levezetes: string
  a: LepesAllapot
  aktiv: boolean
  bevitel: (s: string) => void
  ellenoriz: (bevitel?: string) => void
  megoldas: () => void
  tovabb: () => void
}) {
  const { l, a, helyes } = props
  const id = `lepes-${props.sorszam}`
  const lezart = a.statusz !== 'nyitott'
  return (
    <section className={`munka-kartya lepes ${a.statusz} ${props.aktiv ? 'aktiv' : ''}`}>
      <div className="lepes-fej">
        <span className="lepes-szam">{props.sorszam}.</span>
        <label htmlFor={id}>{l.kerdes}</label>
        {a.statusz === 'jo' && <CheckCircleIcon className="lepes-ikon jo" size={20} weight="fill" aria-label="jó" />}
        {a.statusz === 'hibas' && <XCircleIcon className="lepes-ikon rossz" size={20} weight="fill" aria-label="hibás" />}
      </div>

      {!lezart && l.tipus === 'szam' && (
        <form
          className="bevitel-sor"
          onSubmit={(e) => {
            e.preventDefault()
            props.ellenoriz()
          }}
        >
          <div className="bevitel-mezo">
            <input
              id={id}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              value={a.bevitel}
              onChange={(e) => props.bevitel(e.target.value)}
              aria-describedby={a.uzenet ? `${id}-uzenet` : undefined}
            />
            {EGYSEG_FELIRAT[l.egyseg] && <span className="egyseg">{EGYSEG_FELIRAT[l.egyseg]}</span>}
          </div>
          <button type="submit" className="gomb">
            Ellenőrzés
          </button>
        </form>
      )}

      {!lezart && l.tipus === 'valasztas' && (
        <div className="valaszto">
          {l.opciok.map((o) => (
            <button key={o} className="gomb gomb-masodlagos" onClick={() => props.ellenoriz(o)}>
              {o}
            </button>
          ))}
        </div>
      )}

      {a.uzenet && (
        <p id={`${id}-uzenet`} className="uzenet" role="status">
          {a.uzenet}
        </p>
      )}

      {!lezart && a.tipp && (
        <>
          <Tipp formulaId={l.formulaId} latexIdx={l.latexIdx} />
          <button className="gomb-szoveg" onClick={props.megoldas}>
            Mutasd a megoldást
          </button>
        </>
      )}

      {lezart && (
        <div className="lepes-eredmeny">
          <p>
            {a.statusz === 'jo' ? 'Jó: ' : 'A helyes érték: '}
            <strong>{helyesSzoveg(l, helyes)}</strong>
            {a.statusz === 'hibas' && a.bevitel && <span className="te-irtad"> (te: {a.bevitel})</span>}
          </p>
          {a.statusz === 'hibas' ? (
            <p className="levezetes">{props.levezetes}</p>
          ) : (
            <details>
              <summary>Levezetés</summary>
              <p className="levezetes">{props.levezetes}</p>
            </details>
          )}
          {a.statusz === 'hibas' && props.aktiv && (
            <button className="gomb" onClick={props.tovabb} autoFocus>
              Tovább
            </button>
          )}
        </div>
      )}
    </section>
  )
}

// ---------------- A futtató ----------------

export function FeladatFuttato({
  feladat,
  onKesz,
  zarogombok,
}: {
  feladat: Feladat
  onKesz?: (e: Eredmeny) => void
  /** a feladat végén megjelenő gombok (új feladat, következő ZH-feladat stb.) */
  zarogombok: ReactNode
}) {
  const terv = useMemo(() => tervKeszit(feladat), [feladat])
  const [poz, setPoz] = useState(0)
  const [felismeres, setFelismeres] = useState<(string | null)[]>(() => feladat.felismeresek.map(() => null))
  const [lepesek, setLepesek] = useState<LepesAllapot[]>(() =>
    feladat.lepesek.map(() => ({ bevitel: '', probak: 0, statusz: 'nyitott', tipp: false })),
  )
  const kesz = poz >= terv.length
  const aktivRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    aktivRef.current?.scrollIntoView({ block: 'nearest' })
  }, [poz])

  const getter = (k: string) => feladat.ertekek[k] as number

  const lepesFrissit = (i: number, f: (a: LepesAllapot) => LepesAllapot) =>
    setLepesek((ls) => ls.map((a, j) => (j === i ? f(a) : a)))

  const lezar = (i: number, jo: boolean, bevitel: string, celzott?: string) => {
    const l = feladat.lepesek[i]
    const elsoreJo = jo && lepesek[i].probak === 0
    statFrissit((s) => lepesRogzit(s, l.formulaId, l.kerdes, elsoreJo))
    lepesFrissit(i, (a) => ({ ...a, bevitel, statusz: jo ? 'jo' : 'hibas', probak: a.probak + 1, uzenet: celzott }))
    if (jo) setPoz((p) => p + 1)
  }

  const lepesEllenoriz = (i: number, valasztott?: string) => {
    const l = feladat.lepesek[i]
    const a = lepesek[i]
    const helyes = feladat.ertekek[l.key]
    let jo: boolean
    let bevitel = a.bevitel
    let celzott: string | undefined
    if (l.tipus === 'szam') {
      const e = feladatEllenoriz(feladat, l.key, a.bevitel)
      if (!e.ok && e.ertek === undefined) {
        lepesFrissit(i, (x) => ({ ...x, uzenet: e.uzenet }))
        return
      }
      jo = e.ok
      if (!e.ok && e.ertek !== undefined) celzott = tipikusHiba(e.ertek, feladat.tipikusHibak[l.key] ?? [], l.egyseg, feladat.turesek[l.key])
      // nyitott diahiba: a visszajelzés jelzi, hogy a dia mást mutat
      if (e.nyitott) celzott = celzott ? `${celzott} ${e.nyitott}` : e.nyitott
    } else {
      bevitel = valasztott ?? ''
      jo = valasztott === helyes
      // a célzott üzenet csak akkor, ha a hibás gondolatmenet más választ ad, mint a helyes
      if (!jo) celzott = (feladat.tipikusValaszok[l.key] ?? []).find((t) => t.valasz === valasztott && t.valasz !== helyes)?.uzenet
    }
    if (jo || a.probak >= 1) {
      lezar(i, jo, bevitel, celzott)
      return
    }
    lepesFrissit(i, (x) => ({
      ...x,
      bevitel,
      probak: x.probak + 1,
      tipp: true,
      uzenet: celzott ? `Nem jó. ${celzott}` : 'Nem jó. Nézd meg a tippet, és próbáld újra.',
    }))
  }

  const felismeresValaszt = (j: number, id: string) => {
    const jo = id === feladat.felismeresek[j].helyes
    const elemPoz = terv.findIndex((t) => t.tipus === 'felismeres' && t.i === j)
    statFrissit((s) => felismeresRogzit(s, szakaszKepletei(feladat, terv, elemPoz), jo))
    setFelismeres((f) => f.map((x, k) => (k === j ? id : x)))
  }

  // a feladat vége: egyszer rögzítjük és jelezzük
  const lezarva = useRef(false)
  useEffect(() => {
    if (!kesz || lezarva.current) return
    lezarva.current = true
    const e: Eredmeny = {
      sablonId: feladat.sablon.id,
      cim: feladat.sablon.cim,
      felismeres: feladat.felismeresek.map((f, j) => felismeres[j] === f.helyes),
      lepesek: feladat.lepesek.map((l, i) => ({ kerdes: l.kerdes, elsoreJo: lepesek[i].statusz === 'jo' && lepesek[i].probak === 1 })),
      hibatlan: false,
    }
    e.hibatlan = e.felismeres.every(Boolean) && e.lepesek.every((l) => l.elsoreJo)
    statFrissit((s) => feladatRogzit(s, e.sablonId, e.hibatlan))
    onKesz?.(e)
  }, [kesz, feladat, felismeres, lepesek, onKesz])

  // amíg egy felismerés megválaszolatlan, a kérdezett mennyiség nem látszik (elárulná a láncot)
  const aktivElem = terv[poz]
  const nyitottFelismeres = aktivElem?.tipus === 'felismeres' && felismeres[aktivElem.i] === null ? feladat.felismeresek[aktivElem.i] : undefined
  const latottSzoveg = nyitottFelismeres ? felismeroSzoveg(feladat.szoveg, nyitottFelismeres) : feladat.szoveg

  const elsoreJo = lepesek.filter((a) => a.statusz === 'jo' && a.probak === 1).length
  let lepesSorszam = 0

  return (
    <div className="futtato">
      <div className="futtato-feladat">
        <div className="feladat-kartya">
          {/* a feladattípus neve elárulná a láncot, ezért csak az első felismerés után látszik */}
          <p className="feladat-cimke">{felismeres[0] !== null || !feladat.felismeresek.length ? feladat.sablon.cim : 'Feladat'}</p>
          <FeladatSzoveg
            szoveg={latottSzoveg}
            rejtettKerdes={nyitottFelismeres ? 'A feladat (további) kérdése a felismerés után jelenik meg.' : undefined}
          />
        </div>
      </div>

      <div className="futtato-munka">
        {terv.slice(0, Math.min(poz + 1, terv.length)).map((t, idx) => {
          const aktiv = idx === poz
          if (t.tipus === 'felismeres') {
            const f = feladat.felismeresek[t.i]
            return (
              <div key={`f${t.i}`} ref={aktiv ? aktivRef : undefined}>
                <FelismeresKartya
                  opciok={f.opciok}
                  helyes={f.helyes}
                  valasz={felismeres[t.i]}
                  aktiv={aktiv}
                  valaszt={(id) => felismeresValaszt(t.i, id)}
                  tovabb={() => setPoz((p) => p + 1)}
                />
              </div>
            )
          }
          const l = feladat.lepesek[t.i]
          lepesSorszam++
          return (
            <div key={`l${t.i}`} ref={aktiv ? aktivRef : undefined}>
              <LepesKartya
                l={l}
                sorszam={lepesSorszam}
                helyes={feladat.ertekek[l.key]}
                levezetes={l.levezetes(feladat.p, getter)}
                a={lepesek[t.i]}
                aktiv={aktiv}
                bevitel={(s) => lepesFrissit(t.i, (a) => ({ ...a, bevitel: s, uzenet: undefined }))}
                ellenoriz={(v) => lepesEllenoriz(t.i, v)}
                megoldas={() => lezar(t.i, false, lepesek[t.i].bevitel)}
                tovabb={() => setPoz((p) => p + 1)}
              />
            </div>
          )
        })}

        {kesz && (
          <div ref={aktivRef}>
          <section className="munka-kartya osszegzes">
            <h3>Kész</h3>
            <p>
              Felismerés: {feladat.felismeresek.filter((f, j) => felismeres[j] === f.helyes).length} / {feladat.felismeresek.length}
              {' · '}Elsőre jó lépés: {elsoreJo} / {feladat.lepesek.length}
            </p>
            <h4>Teljes levezetés</h4>
            <ol className="teljes-levezetes">
              {feladat.lepesek.map((l, i) => (
                <li key={i} className={lepesek[i].statusz === 'jo' && lepesek[i].probak === 1 ? 'jo' : 'rossz'}>
                  <span className="tl-kerdes">{l.kerdes}</span>
                  <span className="levezetes">{l.levezetes(feladat.p, getter)}</span>
                </li>
              ))}
            </ol>
            <div className="zaro-gombok">{zarogombok}</div>
          </section>
          </div>
        )}
      </div>
    </div>
  )
}
