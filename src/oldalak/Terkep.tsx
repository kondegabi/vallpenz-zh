import { useLayoutEffect, useRef, useState } from 'react'
import { FUGGOSEGEK } from '../content/fuggosegek.ts'
import { fejezetKor, keplet, KT } from '../content/kepletter.ts'
import { korbaTartozik, type KorValasztas, useKor } from '../kor.ts'
import { link } from '../router.ts'
import { Blokkok } from '../ui/Blokkok.tsx'

// Sávok fejezetenként. A 7. fejezet a 6. elé kerül, mert a fő lánc WACC → NPV (a térkép szerint),
// így szinte minden él lefelé mutat. A 2. ZH fejezetei utánuk jönnek.
const SAV_SORREND = [1, 2, 3, 4, 5, 7, 6, 8]

type El = { honnan: string; hova: string; feltetel?: string }
const ELEK: El[] = Object.entries(FUGGOSEGEK).flatMap(([hova, fs]) =>
  fs.map((f) => ({ honnan: f.id, hova, feltetel: f.feltetel })),
)

type Ut = El & { d: string }

function savIndex(id: string): number {
  return SAV_SORREND.indexOf(Number(id.split('.')[0]))
}

type Oldal = 'fent' | 'lent'

/** Melyik oldalán lép ki az él a forrásból és lép be a célba. */
function oldalak(e: El): [Oldal, Oldal] {
  const si = savIndex(e.honnan)
  const ti = savIndex(e.hova)
  if (si === ti) return ['fent', 'fent']
  return ti > si ? ['lent', 'fent'] : ['fent', 'lent']
}

function utvonal(e: El, s: DOMRect, t: DOMRect, sx: number, tx: number): string {
  const [so, to] = oldalak(e)
  const sy = so === 'fent' ? s.top : s.bottom
  const ty = to === 'fent' ? t.top - 2 : t.bottom + 2
  if (so === 'fent' && to === 'fent') {
    const h = 16 + Math.abs(tx - sx) * 0.12
    const y = Math.min(s.top, t.top)
    return `M ${sx} ${sy} C ${sx} ${y - h}, ${tx} ${y - h}, ${tx} ${ty}`
  }
  const dy = Math.abs(ty - sy) * 0.5
  const irany = so === 'lent' ? 1 : -1
  return `M ${sx} ${sy} C ${sx} ${sy + irany * dy}, ${tx} ${ty - irany * dy}, ${tx} ${ty}`
}

/** A végpontokat szétosztjuk a doboz szélességén, a másik vég vízszintes helye szerint rendezve. */
function vegpontok(rect: (id: string) => DOMRect | undefined): Map<string, [number, number]> {
  const csoportok = new Map<string, { el: El; vege: 0 | 1; masikX: number }[]>()
  for (const e of ELEK) {
    const s = rect(e.honnan)
    const t = rect(e.hova)
    if (!s || !t) continue
    const [so, to] = oldalak(e)
    const kozep = (r: DOMRect) => r.left + r.width / 2
    const add = (kulcs: string, v: { el: El; vege: 0 | 1; masikX: number }) =>
      csoportok.set(kulcs, [...(csoportok.get(kulcs) ?? []), v])
    add(`${e.honnan}|${so}`, { el: e, vege: 0, masikX: kozep(t) })
    add(`${e.hova}|${to}`, { el: e, vege: 1, masikX: kozep(s) })
  }
  const x = new Map<string, [number, number]>()
  for (const [kulcs, lista] of csoportok) {
    const r = rect(kulcs.split('|')[0])!
    lista.sort((a, b) => a.masikX - b.masikX)
    lista.forEach((v, i) => {
      const k = `${v.el.honnan}-${v.el.hova}`
      const pont = r.left + (r.width * (i + 1)) / (lista.length + 1)
      const eddig = x.get(k) ?? [0, 0]
      eddig[v.vege] = pont
      x.set(k, eddig)
    })
  }
  return x
}

export function Terkep() {
  // a választó váltásakor az éleket újra kell mérni
  const valasztas = useKor()
  return <TerkepAbra key={String(valasztas)} valasztas={valasztas} />
}

function TerkepAbra({ valasztas }: { valasztas: KorValasztas }) {
  const graf = useRef<HTMLDivElement>(null)
  const csucsok = useRef(new Map<string, HTMLAnchorElement>())
  const [utak, setUtak] = useState<Ut[]>([])
  const [aktiv, setAktiv] = useState<string | null>(null)

  useLayoutEffect(() => {
    const g = graf.current
    if (!g) return
    const szamol = () => {
      const alap = g.getBoundingClientRect()
      const rel = (el: HTMLElement) => {
        const r = el.getBoundingClientRect()
        return new DOMRect(r.left - alap.left, r.top - alap.top, r.width, r.height)
      }
      const rectek = new Map<string, DOMRect>()
      for (const [id, el] of csucsok.current) rectek.set(id, rel(el))
      const xek = vegpontok((id) => rectek.get(id))
      setUtak(
        ELEK.flatMap((e) => {
          const s = rectek.get(e.honnan)
          const t = rectek.get(e.hova)
          const x = xek.get(`${e.honnan}-${e.hova}`)
          return s && t && x ? [{ ...e, d: utvonal(e, s, t, x[0], x[1]) }] : []
        }),
      )
    }
    szamol()
    const ro = new ResizeObserver(szamol)
    ro.observe(g)
    document.fonts?.ready.then(szamol)
    return () => ro.disconnect()
  }, [])

  const kapcsolt = new Set(
    aktiv ? ELEK.filter((e) => e.honnan === aktiv || e.hova === aktiv).flatMap((e) => [e.honnan, e.hova]) : [],
  )
  const aktivKeplet = aktiv ? keplet(aktiv) : undefined
  // a képlettárban előbb az 1. ZH térképe és a magyarázata, utána a 2. ZH-é (a bevezető mondatával)
  const szoveg2 = KT.terkep.blokkok.findIndex((b, i) => i > 0 && b.tipus === 'bekezdes' && b.szoveg.startsWith('A 2. ZH anyaga'))
  const blokkok = valasztas === 1 ? KT.terkep.blokkok.slice(0, szoveg2) : valasztas === 2 ? KT.terkep.blokkok.slice(szoveg2 + 1) : KT.terkep.blokkok

  return (
    <article className="oldal oldal-szeles">
      <header className="oldal-fej">
        <h1>{KT.terkep.cim}</h1>
      </header>

      <div className="graf-jelmagyarazat" aria-hidden>
        <span>
          <svg width="36" height="10">
            <line x1="0" y1="5" x2="36" y2="5" className="el-minta" />
          </svg>
          mindig kell
        </span>
        <span>
          <svg width="36" height="10">
            <line x1="0" y1="5" x2="36" y2="5" className="el-minta feltetel" />
          </svg>
          csak bizonyos esetben
        </span>
      </div>
      <p className="graf-allapot" aria-live="polite">
        {aktivKeplet ? (
          <>
            <span className="kid">{aktivKeplet.id}</span> {aktivKeplet.cim}
            {(FUGGOSEGEK[aktivKeplet.id] ?? []).length > 0 && (
              <>
                {'. Kell hozzá: '}
                {FUGGOSEGEK[aktivKeplet.id].map((f) => (f.feltetel ? `${f.id} (${f.feltetel})` : f.id)).join(', ')}
              </>
            )}
          </>
        ) : (
          'Mutass egy képletre a kapcsolataiért, kattints a megnyitásához.'
        )}
      </p>

      <div className="graf-gorgeto">
        <div className="graf" ref={graf}>
          <svg className="graf-elek" width="100%" height="100%" aria-hidden>
            <defs>
              <marker id="nyil" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="nyilhegy" />
              </marker>
              <marker id="nyil-aktiv" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="nyilhegy aktiv" />
              </marker>
            </defs>
            {utak.map((u) => {
              const erintett = aktiv && (u.honnan === aktiv || u.hova === aktiv)
              const cls = ['el', u.feltetel ? 'feltetel' : '', erintett ? 'aktiv' : aktiv ? 'halvany' : ''].join(' ')
              return (
                <path
                  key={`${u.honnan}-${u.hova}`}
                  d={u.d}
                  className={cls}
                  markerEnd={erintett ? 'url(#nyil-aktiv)' : 'url(#nyil)'}
                />
              )
            })}
          </svg>
          {SAV_SORREND.filter((szam) => korbaTartozik(valasztas, fejezetKor(szam))).map((szam) => {
            const f = KT.fejezetek.find((x) => x.szam === szam)!
            return (
              <div className="sav" key={szam}>
                <div className="sav-cim">
                  {f.szam}. {f.cim}
                </div>
                <div className="sav-csucsok">
                  {f.kepletek.map((k) => (
                    <a
                      key={k.id}
                      href={link.keplet(k.id)}
                      ref={(el) => {
                        if (el) csucsok.current.set(k.id, el)
                        else csucsok.current.delete(k.id)
                      }}
                      className={[
                        'csucs',
                        aktiv === k.id ? 'aktiv' : '',
                        aktiv && aktiv !== k.id ? (kapcsolt.has(k.id) ? 'kapcsolt' : 'halvany') : '',
                      ].join(' ')}
                      onMouseEnter={() => setAktiv(k.id)}
                      onMouseLeave={() => setAktiv(null)}
                      onFocus={() => setAktiv(k.id)}
                      onBlur={() => setAktiv(null)}
                    >
                      <span className="kid">{k.id}</span>
                      <span className="csucs-cim">{k.cim}</span>
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <h2 className="alcim">A térkép a képlettárban</h2>
      <Blokkok blokkok={blokkok} />
    </article>
  )
}
