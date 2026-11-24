// A ZH kiértékelésének magyarázó blokkjai: „Miért?” (a helyes válasz indoka a képlettárból) és a
// számítások részeredményei. Csak a beadás után látszanak.

import type { Feladat } from '../gyakorlas/motor.ts'
import { link } from '../router.ts'
import { Inline } from '../ui/Inline.tsx'
import { Katex } from '../ui/Katex.tsx'
import { forrasIdezetek, type ForrasIdezet, igazHamisMagyarazat, lancMagyarazat, reszeredmenyek, type Szakasz } from '../zh/magyarazat.ts'
import { MC_HATTER, type ZhIgazHamis, type ZhSzamitas, type ZhValasztos } from '../zh/sorsolas.ts'

const BETUK = ['A', 'B', 'C', 'D']

function Miert({ children }: { children: React.ReactNode }) {
  return (
    <div className="zh-miert">
      <h4>Miért?</h4>
      {children}
    </div>
  )
}

function Idezet({ f }: { f: ForrasIdezet }) {
  // a képlethez fűzött rövid magyarázat nem idézet
  if (f.magyarazat)
    return (
      <p className="zh-idezet-magyarazat">
        <Inline szoveg={f.idezet} linkek={false} />
      </p>
    )
  return (
    <blockquote className="zh-idezet">
      {f.latex ? <Katex latex={f.idezet} display /> : <p><Inline szoveg={f.idezet} linkek={false} /></p>}
      <cite>
        Képlettár:{' '}
        {f.id ? (
          <a href={link.keplet(f.id)} target="_blank" rel="noreferrer">
            {f.nev}
          </a>
        ) : (
          f.nev
        )}
      </cite>
    </blockquote>
  )
}

function Jelolt({ szakaszok, osztaly }: { szakaszok: Szakasz[]; osztaly: string }) {
  return (
    <>
      {szakaszok.map((s, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {s.valtozott ? (
            <>
              {/* a szóvégi írásjel nem része a cserének */}
              <mark className={osztaly}>{s.szoveg.replace(/[.,;:]+$/, '')}</mark>
              {s.szoveg.match(/[.,;:]+$/)?.[0]}
            </>
          ) : (
            s.szoveg
          )}
        </span>
      ))}
    </>
  )
}

function Lanc({ f }: { f: Feladat }) {
  const m = lancMagyarazat(f)
  if (!m) return null
  return (
    <p className="zh-lanc">
      A feladat ezt adja: <Inline szoveg={m.adja} linkek={false} />; ezt kérdezi: <Inline szoveg={m.kerdezi} linkek={false} />
      {/* kérdőjel után nem kell pont */}
      {m.kerdezi.endsWith('?') ? ' ' : '. '}
      Ezért a lánc:{' '}
      <strong>
        <Inline szoveg={m.lanc} linkek={false} />
      </strong>
      .
    </p>
  )
}

/** A feladat minden lépése sorban: kérdés, érték, levezetés; a kérdezett végeredmények kiemelve. */
export function Reszeredmenyek({ feladat, kerdezett }: { feladat: Feladat; kerdezett: readonly string[] }) {
  const sorok = reszeredmenyek(feladat, kerdezett)
  return (
    <div className="zh-reszek">
      <h4>Részeredmények</h4>
      <ol>
        {sorok.map((r) => (
          <li key={r.key} className={r.kerdezett ? 'kerdezett' : undefined}>
            <span className="zh-resz-kerdes">
              {r.kerdes}
              {r.kerdezett && <span className="zh-resz-cimke">kérdezett</span>}
            </span>
            <span className="zh-resz-ertek">{r.ertek}</span>
            <span className="zh-resz-lev">
              <Inline szoveg={r.levezetes} linkek={false} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function IgazHamisMiert({ k }: { k: ZhIgazHamis }) {
  const m = igazHamisMagyarazat(k)
  return (
    <Miert>
      {m.igaz ? (
        <p>A képlettár ugyanezt mondja:</p>
      ) : (
        <>
          <p className="zh-csere-sor">
            <span className="zh-csere-felirat">Az állítás:</span> <Jelolt szakaszok={m.jelolt.hamis} osztaly="zh-csere-hamis" />
          </p>
          <p className="zh-csere-sor">
            <span className="zh-csere-felirat">Helyesen:</span> <Jelolt szakaszok={m.jelolt.igaz} osztaly="zh-csere-igaz" />
          </p>
          <p>A kiemelt rész cseréje teszi hamissá. A képlettár szerint:</p>
        </>
      )}
      {m.forrasok.length ? m.forrasok.map((f, i) => <Idezet key={i} f={f} />) : <p className="zh-idezet-nincs">Saját állítás: {k.allitas.kulcs}</p>}
    </Miert>
  )
}

export function ValasztosMiert({ k }: { k: ZhValasztos; valasz?: number | null }) {
  const h = MC_HATTER.get(k)
  if (!h) return k.indok ? <Miert><p><Inline szoveg={k.indok} linkek={false} /></p></Miert> : null
  if (h.fajta === 'elmeleti') {
    const forrasok = forrasIdezetek(h.kerdes)
    return (
      <Miert>
        <p>
          A helyes válasz ({BETUK[k.helyes]}): <strong>{k.opciok[k.helyes]}</strong>. A képlettár szerint:
        </p>
        {forrasok.map((f, i) => (
          <Idezet key={i} f={f} />
        ))}
      </Miert>
    )
  }
  // a felismerés nem számolós kérdés: a lánc indoklása marad
  if (h.fajta === 'felismeres')
    return (
      <Miert>
        <Lanc f={h.feladat} />
      </Miert>
    )
  // számolós kérdésnél csak a számítások (a felhasználó kérése)
  return <Reszeredmenyek feladat={h.feladat} kerdezett={[h.key]} />
}

/** Számítási példa: csak a számítások (a kérdezett értékekig), „Miért?” nélkül. */
export function SzamitasMiert({ p }: { p: ZhSzamitas }) {
  return <Reszeredmenyek feladat={p.feladat} kerdezett={p.kulcsok} />
}
