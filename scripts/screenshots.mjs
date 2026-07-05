import { chromium } from 'playwright'

const baseUrl = process.env.SCREENSHOT_URL ?? 'http://127.0.0.1:5173/'

const shots = [
  { name: 'mobile-title', width: 390, height: 844, mode: 'title' },
  { name: 'mobile-desk', width: 390, height: 844, mode: 'desk' },
  { name: 'mobile-feedback', width: 390, height: 844, mode: 'feedback' },
  { name: 'desktop-title', width: 1280, height: 900, mode: 'title' },
]

const browser = await chromium.launch({ headless: true })

for (const shot of shots) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 1,
    isMobile: shot.width < 600,
  })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  if (shot.mode === 'desk' || shot.mode === 'feedback') {
    await page.getByRole('button', { name: /Start Frühschicht/ }).click()
  }
  if (shot.mode === 'feedback') {
    await page.getByRole('button', { name: /Der Kaffee wartet/ }).click()
  }
  await page.screenshot({ path: `docs/screenshots/${shot.name}.png`, fullPage: true })
  await page.close()
}

await browser.close()
console.log(`screenshots captured from ${baseUrl}`)
