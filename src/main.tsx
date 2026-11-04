import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import 'katex/dist/katex.min.css'
import './styles.css'
import './gyakorlas.css'
import './leckek.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
