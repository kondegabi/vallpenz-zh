import katex from 'katex'
import { useMemo } from 'react'
import { kiemel } from '../content/kiemel.ts'

const OPCIOK = {
  throwOnError: false,
  strict: 'ignore' as const,
  // csak a saját kiemelő parancsunkat engedjük
  trust: (ctx: { command: string }) => ctx.command === '\\htmlClass',
}

export function Katex({
  latex,
  display = false,
  kiemelt,
  osztaly,
}: {
  latex: string
  display?: boolean
  kiemelt?: string[]
  /** a kiemelt tag CSS-osztálya (alapból a magyarázó mód kékje) */
  osztaly?: string
}) {
  const html = useMemo(
    () => katex.renderToString(kiemelt?.length ? kiemel(latex, kiemelt, osztaly) : latex, { ...OPCIOK, displayMode: display }),
    [latex, display, kiemelt, osztaly],
  )
  return display ? (
    <div className="katex-blokk" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  )
}
