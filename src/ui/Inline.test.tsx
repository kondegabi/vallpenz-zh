import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Inline } from './Inline.tsx'

// A képlettár markdown-escape-jei (\_ és \*) a megjelenítésben jelölés nélkül látszanak.

describe('soron belüli szöveg', () => {
  it('a \\_ aláhúzásjelként, a \\* csillagként jelenik meg, visszaperjel nélkül', () => {
    const html = renderToStaticMarkup(<Inline szoveg={'r\\_D, C\\* = 411 USD, U\\* = 1032 USD'} linkek={false} />)
    expect(html).toBe('r_D, C* = 411 USD, U* = 1032 USD')
  })

  it('a félkövér jelölés továbbra is működik', () => {
    expect(renderToStaticMarkup(<Inline szoveg={'**1033** és C\\*'} linkek={false} />)).toBe('<strong>1033</strong> és C*')
  })
})
