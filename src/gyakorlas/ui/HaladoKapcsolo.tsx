import { beallit, useBeallitasok } from '../beallitasok.ts'

/** „YTM számolással, haladó”: alapból kikapcsolva; a ZH-szimulációra nem hat. */
export function HaladoKapcsolo() {
  const b = useBeallitasok()
  return (
    <label className="halado-kapcsolo">
      <input type="checkbox" checked={b.haladoYtm} onChange={(e) => beallit({ haladoYtm: e.target.checked })} />
      <span>
        <strong>YTM számolással, haladó</strong>
        <span>A WACC-feladatokban a YTM-et néha a kötvényből, iterációval kell kiszámolni. Kézzel ez percekig tart, ezért a ZH-szimulációban a YTM mindig adott.</span>
      </span>
    </label>
  )
}
