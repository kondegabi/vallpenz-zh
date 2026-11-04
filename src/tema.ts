import { useEffect, useState } from 'react'

export type Tema = 'rendszer' | 'vilagos' | 'sotet'
const KULCS = 'vp2zh.tema.v1'

function olvas(): Tema {
  try {
    const t = localStorage.getItem(KULCS)
    if (t === 'vilagos' || t === 'sotet' || t === 'rendszer') return t
  } catch {
    // localStorage nélkül is működik, csak nem jegyzi meg
  }
  return 'rendszer'
}

export function useTema(): [Tema, () => void] {
  const [tema, setTema] = useState<Tema>(olvas)
  useEffect(() => {
    const html = document.documentElement
    if (tema === 'rendszer') html.removeAttribute('data-theme')
    else html.setAttribute('data-theme', tema === 'sotet' ? 'dark' : 'light')
    try {
      localStorage.setItem(KULCS, tema)
    } catch {
      // lásd fent
    }
  }, [tema])
  const kovetkezo = () => setTema((t) => (t === 'rendszer' ? 'vilagos' : t === 'vilagos' ? 'sotet' : 'rendszer'))
  return [tema, kovetkezo]
}
