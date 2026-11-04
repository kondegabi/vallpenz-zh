import { MonitorIcon, MoonIcon, SunIcon } from '@phosphor-icons/react'
import { type ComponentType, lazy, Suspense } from 'react'
import { korBeallit, korBeolvas, KOR_OPCIOK, useKor } from './kor.ts'
import { KEPLET_ALMENU, kepletOldal, MENU } from './menu.ts'
import { Kezdolap } from './oldalak/Kezdolap.tsx'
import { link, useUtvonal } from './router.ts'
import { useTema } from './tema.ts'

// A kezdőoldalon kívül minden oldal külön chunkban, lustán töltődik: a kezdőoldalhoz nem kell sem a
// képlettár, sem a KaTeX, sem a feladatsablonok, sem a d3.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lusta<K extends string>(betolt: () => Promise<Record<K, ComponentType<any>>>, nev: K) {
  return lazy(() => betolt().then((m) => ({ default: m[nev] })))
}

const Oldalsav = lusta(() => import('./oldalak/Oldalsav.tsx'), 'Oldalsav')
const KepletLista = lusta(() => import('./oldalak/Fooldal.tsx'), 'Fooldal')
const KepletOldal = lusta(() => import('./oldalak/KepletOldal.tsx'), 'KepletOldal')
const Terkep = lusta(() => import('./oldalak/Terkep.tsx'), 'Terkep')
const Felismero = lusta(() => import('./oldalak/Felismero.tsx'), 'Felismero')
const Hibak = lusta(() => import('./oldalak/Hibak.tsx'), 'Hibak')
const Gyakorlas = lusta(() => import('./oldalak/Gyakorlas.tsx'), 'Gyakorlas')
const GyakorloOldal = lusta(() => import('./oldalak/GyakorloOldal.tsx'), 'GyakorloOldal')
const VegyesZh = lusta(() => import('./oldalak/VegyesZh.tsx'), 'VegyesZh')
const Statisztika = lusta(() => import('./oldalak/Statisztika.tsx'), 'Statisztika')
// a leckék (d3 + SVG) és a ZH-szimuláció (kérdésbankok) is külön chunk
const LeckeMinta = lusta(() => import('./oldalak/LeckeMinta.tsx'), 'LeckeMinta')
const LeckeOldal = lusta(() => import('./oldalak/LeckeOldal.tsx'), 'LeckeOldal')
const Leckek = lusta(() => import('./oldalak/Leckek.tsx'), 'Leckek')
const ZhSzimulacio = lusta(() => import('./oldalak/ZhSzimulacio.tsx'), 'ZhSzimulacio')

const TEMA_FELIRAT = { rendszer: 'Téma: rendszer', vilagos: 'Téma: világos', sotet: 'Téma: sötét' }

export function App() {
  const u = useUtvonal()
  const [tema, temaValt] = useTema()
  const kor = useKor()
  const TemaIkon = tema === 'rendszer' ? MonitorIcon : tema === 'vilagos' ? SunIcon : MoonIcon
  const szeles = u.oldal !== 'kepletek' && u.oldal !== 'keplet' && u.oldal !== 'hibak'
  const betoltes = <p className="betoltes">Betöltés…</p>

  return (
    <div className="keret">
      <header className="fejlec">
        <a className="marka" href={link.kezdolap}>
          <span className="marka-nev">Vállalati pénzügyek II</span>
          <span className="marka-al">ZH gyakorló</span>
        </a>
        <nav className="menu" aria-label="Fő menü">
          {MENU.map((m) => (
            <a key={m.href} href={m.href} aria-current={m.aktiv(u) ? 'page' : undefined}>
              {m.rovid ? (
                <>
                  <span className="menu-hosszu">{m.cim}</span>
                  <span className="menu-rovid">{m.rovid}</span>
                </>
              ) : (
                m.cim
              )}
            </a>
          ))}
        </nav>
        <select className="kor-valaszto" aria-label="Melyik ZH anyagát mutassa" title="Melyik ZH anyagát mutassa" value={String(kor)} onChange={(e) => korBeallit(korBeolvas(e.target.value))}>
          {KOR_OPCIOK.map((o) => (
            <option key={o.ertek} value={String(o.ertek)}>
              {o.cim}
            </option>
          ))}
        </select>
        <button className="tema-gomb" onClick={temaValt} title={TEMA_FELIRAT[tema]} aria-label={TEMA_FELIRAT[tema]}>
          <TemaIkon size={18} aria-hidden />
        </button>
      </header>

      <div className={szeles ? 'tartalom tartalom-szeles' : 'tartalom'}>
        {!szeles && (
          <Suspense fallback={<nav className="oldalsav" aria-label="Képletek" />}>
            <Oldalsav aktivId={u.oldal === 'keplet' ? u.id : undefined} />
          </Suspense>
        )}
        <main>
          {/* a Képletek almenüje: képletlista, térkép, felismerő tábla, diahibák */}
          {kepletOldal(u) && (
            <nav className="almenu" aria-label="Képletek almenü">
              {KEPLET_ALMENU.map((a) => (
                <a key={a.href} href={a.href} aria-current={u.oldal === a.oldal ? 'page' : undefined}>
                  {a.cim}
                </a>
              ))}
            </nav>
          )}
          {u.oldal === 'kezdolap' && <Kezdolap />}
          <Suspense fallback={betoltes}>
            {u.oldal === 'kepletek' && <KepletLista />}
            {u.oldal === 'keplet' && <KepletOldal key={u.id} id={u.id} />}
            {u.oldal === 'terkep' && <Terkep />}
            {u.oldal === 'felismero' && <Felismero />}
            {u.oldal === 'hibak' && <Hibak />}
            {u.oldal === 'gyakorlas' && <Gyakorlas />}
            {u.oldal === 'gyakorlo' && <GyakorloOldal key={u.cel} cel={u.cel} />}
            {u.oldal === 'zh' && <VegyesZh key={`${u.db}-${u.perc}`} db={u.db} perc={u.perc} />}
            {u.oldal === 'statisztika' && <Statisztika />}
            {u.oldal === 'zhSzimulacio' && <ZhSzimulacio />}
            {u.oldal === 'leckek' && <Leckek />}
            {u.oldal === 'leckeMinta' && <LeckeMinta />}
            {u.oldal === 'lecke' && <LeckeOldal key={u.szam} szam={u.szam} />}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
