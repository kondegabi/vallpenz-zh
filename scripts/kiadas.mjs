// A kész dist/ mappát kiteszi a gh-pages ágra, innen szolgálja ki az oldalt a GitHub Pages.
// Futtatás: npm run kiadas (tesztel, épít, majd feltölt).
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO = 'https://github.com/kondegabi/vallpenz-zh.git'
const git = (...args) => execFileSync('git', args, { stdio: 'inherit' })
const verzio = execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim()

const mappa = mkdtempSync(join(tmpdir(), 'vallpenz-kiadas-'))
try {
  git('clone', '--quiet', '--branch', 'gh-pages', '--depth', '1', REPO, mappa)
  for (const nev of readdirSync(mappa)) {
    if (nev !== '.git') rmSync(join(mappa, nev), { recursive: true })
  }
  cpSync('dist', mappa, { recursive: true })
  writeFileSync(join(mappa, '.nojekyll'), '')

  const ujra = (...args) => git('-C', mappa, ...args)
  ujra('add', '-A')
  ujra('-c', 'user.name=kondegabi', '-c', 'user.email=kondegabi@users.noreply.github.com',
    'commit', '--quiet', '--allow-empty', '-m', `Kiadás: a main ${verzio} állapotának buildje`)
  ujra('push', '--quiet', 'origin', 'gh-pages')
  console.log('Kész, pár perc múlva él: https://kondegabi.github.io/vallpenz-zh/')
} finally {
  rmSync(mappa, { recursive: true, force: true })
}
