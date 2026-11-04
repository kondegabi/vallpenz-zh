// Sok halvány elem + egy erős: szimulált vonalak és pontfelhő, előjeles negyedekkel.

import { Gorbe } from './abra.tsx'

/** Sok vékony, átlátszó vonal és rajtuk egy vastag összesítő; az első megjelenéskor kirajzolódnak. */
export function SzimulaltVonalak(props: { halvanyak: [number, number][][]; eros?: [number, number][]; erosOsztaly?: string }) {
  return (
    <g className="szimulalt-vonalak">
      {props.halvanyak.map((v, i) => (
        <Gorbe key={i} pontok={v} className="halvany-vonal" rajzolodik />
      ))}
      {props.eros && <Gorbe pontok={props.eros} className={`eros-vonal ${props.erosOsztaly ?? ''}`} rajzolodik />}
    </g>
  )
}

export function Pontfelho({ pontok, className }: { pontok: [number, number][]; className?: string }) {
  return (
    <g className={`pontfelho ${className ?? ''}`}>
      {pontok.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.6} />
      ))}
    </g>
  )
}

/**
 * A kovariancia előjele szerint színezett negyedek a (cx, cy) középpont körül: jobb felső és bal alsó
 * pozitív (együtt mozognak), a másik kettő negatív.
 */
export function ElojelesNegyedek(props: { cx: number; cy: number; w: number; h: number }) {
  const { cx, cy, w, h } = props
  return (
    <g className="elojeles-negyedek" aria-hidden>
      <rect className="negyed-poz" x={cx} y={0} width={Math.max(0, w - cx)} height={Math.max(0, cy)} />
      <rect className="negyed-poz" x={0} y={cy} width={Math.max(0, cx)} height={Math.max(0, h - cy)} />
      <rect className="negyed-neg" x={0} y={0} width={Math.max(0, cx)} height={Math.max(0, cy)} />
      <rect className="negyed-neg" x={cx} y={cy} width={Math.max(0, w - cx)} height={Math.max(0, h - cy)} />
      <text className="negyed-felirat" x={w - 6} y={h - 8} textAnchor="end">
        − ellentétesen
      </text>
      <text className="negyed-felirat" x={w - 6} y={14} textAnchor="end">
        + együtt mozognak
      </text>
    </g>
  )
}
