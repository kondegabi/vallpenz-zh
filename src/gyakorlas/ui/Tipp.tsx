import { ArrowSquareOutIcon, WarningIcon } from '@phosphor-icons/react'
import { keplet } from '../../content/kepletter.ts'
import { link } from '../../router.ts'
import { Inline } from '../../ui/Inline.tsx'
import { Katex } from '../../ui/Katex.tsx'

/** Hiba utáni tipp: a lépés képlete, a „Magyarul:” mondat és a képlet csapdái, szó szerint a képlettárból. */
export function Tipp({ formulaId, latexIdx = 0 }: { formulaId: string; latexIdx?: number }) {
  const k = keplet(formulaId)
  if (!k) return null
  const latex = k.latex[latexIdx] ?? k.latex[0]
  return (
    <div className="tipp">
      <div className="tipp-fej">
        <span>
          Tipp: {k.cim}
        </span>
        <a href={link.keplet(k.id)} target="_blank" rel="noopener" className="tipp-link">
          a képlet oldala <ArrowSquareOutIcon size={14} aria-hidden />
        </a>
      </div>
      {latex && <Katex latex={latex} display />}
      {/* képlet nélküli szakasz (pl. 7.5): a képlettár bekezdései szó szerint */}
      {!latex &&
        k.blokkok.flatMap((b, i) =>
          b.tipus === 'bekezdes' ? [
            <p key={i} className="tipp-magyarul">
              <Inline szoveg={b.szoveg} linkek={false} />
            </p>,
          ] : [],
        )}
      {k.magyarul && (
        <p className="tipp-magyarul">
          <strong>Magyarul:</strong> <Inline szoveg={k.magyarul} linkek={false} />
        </p>
      )}
      {k.csapdak.map((c, i) => (
        <p key={i} className="tipp-csapda">
          <WarningIcon size={16} weight="bold" aria-hidden />
          <span>
            <strong>Csapda:</strong> <Inline szoveg={c} linkek={false} />
          </span>
        </p>
      ))}
    </div>
  )
}
