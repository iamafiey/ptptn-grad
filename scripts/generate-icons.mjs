// Renders public/icons/icon.svg into the PNG sizes the PWA manifest needs.
import { chromium } from 'playwright'
import { existsSync, readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8')
const out = (n) => new URL(`../public/icons/${n}`, import.meta.url).pathname
// Uses a system Chromium when available (e.g. CI containers with pre-installed browsers).
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const browser = await chromium.launch({ executablePath })
const page = await browser.newPage()

async function render(size, name, { maskable = false } = {}) {
  await page.setViewportSize({ width: size, height: size })
  // Maskable: square full-bleed tile; the artwork already sits inside the 80% safe zone.
  const art = (maskable ? svg.replaceAll('rx="112"', 'rx="0"') : svg).replace('<svg ', `<svg width="${size}" height="${size}" `)
  await page.setContent(`<html><body style="margin:0">${art}</body></html>`)
  await page.screenshot({ path: out(name), omitBackground: !maskable })
}

await render(192, 'icon-192.png')
await render(512, 'icon-512.png')
await render(512, 'icon-maskable-512.png', { maskable: true })
await render(180, 'apple-touch-icon.png', { maskable: true })
await browser.close()
console.log('icons written')
