// Az ábrák SVG-alapjai: méretezés, tengely, görbe, sáv, pont. Pénzügyi képlet itt nincs:
// a pontokat a lecke a mag függvényeivel számolja ki, ez csak kirajzol.

import { line } from 'd3-shape'
import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from 'react'

export type Margo = { fent: number; jobb: number; lent: number; bal: number }
export type Meret = { w: number; h: number; m: Margo; bw: number; bh: number }
/** Lineáris vagy logaritmikus d3-skála (a tengelynek ennyi kell belőle). */
export type Skala = { (v: number): number; range(): number[]; ticks(n?: number): number[] }

export function useSzelesseg<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.getBoundingClientRect().width)
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

/** Reszponzív SVG-vászon: a szélesség a tárolóé, a magasság arányos (korlátok között). */
export function Abra(props: {
  cim: string
  arany?: number
  minH?: number
  maxH?: number
  margo?: Partial<Margo>
  dias?: boolean
  children: (m: Meret) => ReactNode
}) {
  const [ref, w] = useSzelesseg<HTMLDivElement>()
  const m: Margo = { fent: 16, jobb: 20, lent: 40, bal: 52, ...props.margo }
  const h = Math.round(Math.min(props.maxH ?? 440, Math.max(props.minH ?? 240, w * (props.arany ?? 0.62))))
  return (
    <div ref={ref} className={`abra ${props.dias ? 'abra-dias' : 'abra-bovitett'}`}>
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label={props.cim}>
          <g transform={`translate(${m.bal},${m.fent})`}>
            {props.children({ w, h, m, bw: Math.max(10, w - m.bal - m.jobb), bh: Math.max(10, h - m.fent - m.lent) })}
          </g>
        </svg>
      )}
    </div>
  )
}

/**
 * Egyszerű matematikai felirat SVG-ben: az „_x” vagy „_{xy}” alsó index lesz, dőlt KaTeX-betűvel,
 * mint a diákon (pl. „E(r_M)”, „σ(r_P)”).
 */
export function SvgMatek({ szoveg, ...rest }: { szoveg: string } & React.SVGProps<SVGTextElement>) {
  const darabok: ReactNode[] = []
  const re = /_\{([^}]*)\}|_(.)/g
  let poz = 0
  let n = 0
  for (const m of szoveg.matchAll(re)) {
    darabok.push(<tspan key={n++}>{szoveg.slice(poz, m.index)}</tspan>)
    darabok.push(
      <tspan key={n++} baselineShift="sub" fontSize="0.75em">
        {m[1] ?? m[2]}
      </tspan>,
    )
    poz = m.index! + m[0].length
  }
  darabok.push(<tspan key={n++}>{szoveg.slice(poz)}</tspan>)
  return (
    <text className="svg-matek" {...rest}>
      {darabok}
    </text>
  )
}

export function Tengely(props: {
  skala: Skala
  irany: 'x' | 'y'
  /** a tengelyvonal helye px-ben (x tengelynél az y koordináta, y tengelynél az x) */
  poz: number
  tickek?: number[] | number
  formaz?: (v: number) => string
  cimke?: string
  racs?: number
  nyil?: boolean
}) {
  const { skala, irany, poz } = props
  const [a, b] = skala.range()
  const tickek = Array.isArray(props.tickek) ? props.tickek : skala.ticks(props.tickek ?? 5)
  const fmt = props.formaz ?? ((v: number) => String(v))
  const x = irany === 'x'
  return (
    <g className="tengely" aria-hidden>
      {props.racs !== undefined &&
        tickek.map((t) => {
          const p = skala(t)
          return x ? (
            <line key={`r${t}`} className="racs" x1={p} x2={p} y1={0} y2={props.racs} />
          ) : (
            <line key={`r${t}`} className="racs" x1={0} x2={props.racs} y1={p} y2={p} />
          )
        })}
      {x ? (
        <line className="tengelyvonal" x1={Math.min(a, b)} x2={Math.max(a, b) + (props.nyil ? 8 : 0)} y1={poz} y2={poz} markerEnd={props.nyil ? 'url(#lecke-nyil)' : undefined} />
      ) : (
        <line className="tengelyvonal" x1={poz} x2={poz} y1={Math.max(a, b)} y2={Math.min(a, b) - (props.nyil ? 8 : 0)} markerEnd={props.nyil ? 'url(#lecke-nyil)' : undefined} />
      )}
      {tickek.map((t) => {
        const p = skala(t)
        return x ? (
          <g key={t} transform={`translate(${p},${poz})`}>
            <line className="tick" y2={4} />
            <text className="tick-felirat" y={16} textAnchor="middle">
              {fmt(t)}
            </text>
          </g>
        ) : (
          <g key={t} transform={`translate(${poz},${p})`}>
            <line className="tick" x2={-4} />
            <text className="tick-felirat" x={-8} dy="0.32em" textAnchor="end">
              {fmt(t)}
            </text>
          </g>
        )
      })}
      {props.cimke &&
        (x ? (
          <SvgMatek szoveg={props.cimke} className="tengely-cimke svg-matek" x={Math.max(a, b)} y={poz + 32} textAnchor="end" />
        ) : (
          <SvgMatek szoveg={props.cimke} className="tengely-cimke svg-matek" x={poz + 6} y={Math.min(a, b) - 4} textAnchor="start" />
        ))}
    </g>
  )
}

/** Nyílhegy a tengelyekhez (egyszer kell az SVG-ben). */
export function NyilDef() {
  return (
    <defs>
      <marker id="lecke-nyil" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" className="nyilhegy-lecke" />
      </marker>
    </defs>
  )
}

/** Vonal a pontokon át. A `d` CSS-tulajdonságként is be van állítva, így bemenetváltáskor átmenettel igazodik. */
export function Gorbe(props: { pontok: [number, number][]; className?: string; szaggatott?: boolean; rajzolodik?: boolean }) {
  const d = line()(props.pontok) ?? ''
  return (
    <path
      d={d}
      style={{ d: `path('${d}')` } as React.CSSProperties}
      className={`gorbe ${props.className ?? ''} ${props.szaggatott ? 'szaggatott' : ''} ${props.rajzolodik ? 'rajzolodik' : ''}`}
      pathLength={props.rajzolodik ? 1 : undefined}
    />
  )
}

/** Árnyékolt sáv (téglalap) opcionális felirattal. */
export function Sav(props: { x0: number; x1: number; y0: number; y1: number; className?: string; felirat?: string; feliratPoz?: 'fent' | 'lent' }) {
  const x = Math.min(props.x0, props.x1)
  const y = Math.min(props.y0, props.y1)
  const w = Math.abs(props.x1 - props.x0)
  const h = Math.abs(props.y1 - props.y0)
  return (
    <g className={`sav ${props.className ?? ''}`}>
      <rect x={x} y={y} width={w} height={h} />
      {props.felirat && (
        <text className="sav-felirat" x={x + w / 2} y={props.feliratPoz === 'lent' ? y + h - 6 : y + 14} textAnchor="middle">
          {props.felirat}
        </text>
      )}
    </g>
  )
}

/**
 * Kiemelt (vagy diás nézetben ×) pont felirattal. Húzható, ha van `onHuz`: a mutató helyét a
 * belső koordinátarendszerben adja vissza; billentyűzettel a nyilakkal léptethető.
 */
export function Pont(props: {
  x: number
  y: number
  cimke?: string
  jel?: 'kor' | 'x'
  className?: string
  r?: number
  cimkeIrany?: 'jobb' | 'bal' | 'fent' | 'lent'
  onHuz?: (x: number, y: number) => void
  onLep?: (dx: number, dy: number) => void
  ariaLabel?: string
}) {
  const r = props.r ?? 6
  const huzhato = !!props.onHuz
  const kezd = (e: React.PointerEvent<SVGGElement>) => {
    if (!props.onHuz) return
    const g = e.currentTarget
    g.setPointerCapture(e.pointerId)
    const belso = g.parentElement as unknown as SVGGraphicsElement
    const mozog = (ev: PointerEvent) => {
      const ctm = belso.getScreenCTM()
      if (!ctm) return
      const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse())
      props.onHuz!(pt.x, pt.y)
    }
    const veg = () => {
      g.removeEventListener('pointermove', mozog)
      g.removeEventListener('pointerup', veg)
      g.removeEventListener('pointercancel', veg)
    }
    g.addEventListener('pointermove', mozog)
    g.addEventListener('pointerup', veg)
    g.addEventListener('pointercancel', veg)
  }
  const lep = (e: React.KeyboardEvent) => {
    if (!props.onLep) return
    const d = e.shiftKey ? 5 : 1
    const m: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }
    if (m[e.key]) {
      e.preventDefault()
      props.onLep(...m[e.key])
    }
  }
  const cx = props.cimkeIrany === 'bal' ? -r - 6 : props.cimkeIrany === 'fent' || props.cimkeIrany === 'lent' ? 0 : r + 6
  const cy = props.cimkeIrany === 'fent' ? -r - 8 : props.cimkeIrany === 'lent' ? r + 15 : 4
  const anchor = props.cimkeIrany === 'bal' ? 'end' : props.cimkeIrany === 'fent' || props.cimkeIrany === 'lent' ? 'middle' : 'start'
  return (
    <g
      className={`pont ${props.className ?? ''} ${huzhato ? 'huzhato' : ''}`}
      style={{ transform: `translate(${props.x}px, ${props.y}px)` }}
      onPointerDown={kezd}
      onKeyDown={lep}
      tabIndex={huzhato ? 0 : undefined}
      role={huzhato ? 'slider' : undefined}
      aria-label={props.ariaLabel ?? props.cimke}
    >
      {huzhato && <circle className="pont-fogo" r={r + 10} />}
      {props.jel === 'x' ? (
        <path className="pont-x" d={`M${-r} ${-r} L${r} ${r} M${-r} ${r} L${r} ${-r}`} />
      ) : (
        <circle className="pont-kor" r={r} />
      )}
      {props.cimke && <SvgMatek szoveg={props.cimke} className="pont-cimke svg-matek" x={cx} y={cy} textAnchor={anchor} />}
    </g>
  )
}
