// Usage: node scripts/check-overflow.mjs <url> [width] — lists elements wider than the viewport (no horizontal scroll allowed).
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
const W = +(process.argv[3] ?? 360)
const browser = await chromium.launch({ executablePath: existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined })
const page = await browser.newPage({ viewport: { width: W, height: 800 } })
await page.goto(process.argv[2], { waitUntil: 'networkidle' })
const r = await page.evaluate((W) => {
  const sw = document.documentElement.scrollWidth
  if (sw <= W) return []
  const out = [`page scrollWidth ${sw}px`]
  for (const el of document.querySelectorAll('body *')) {
    const b = el.getBoundingClientRect()
    if (b.right > W + 1 && el.children.length < 4) out.push(`${el.tagName}.${String(el.className).slice(0,80)} → ${Math.round(b.right)}`)
  }
  return out.slice(0, 15)
}, W)
console.log(r.length ? r.join('\n') : `no overflow at ${W}px`)
await browser.close()
