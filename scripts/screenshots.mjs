import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.SCREENSHOT_URL ?? 'http://127.0.0.1:4178/'
const outputDir = process.env.SCREENSHOT_OUTPUT_DIR ?? join(tmpdir(), 'hotel-mobile-screenshots')
const shots = [
  { name: 'mobile-title-320x740', width: 320, height: 740, mode: 'title' },
  { name: 'mobile-title-390x844', width: 390, height: 844, mode: 'title' },
  { name: 'promise-opening-320x740', width: 320, height: 740, mode: 'promise-opening' },
  { name: 'promise-opening-390x844', width: 390, height: 844, mode: 'promise-opening' },
  { name: 'promise-feedback-b-390x844', width: 390, height: 844, mode: 'promise-feedback-b' },
  { name: 'promise-return-upset-390x844', width: 390, height: 844, mode: 'promise-return-upset' },
  { name: 'promise-final-feedback-390x844', width: 390, height: 844, mode: 'promise-final-feedback' },
  { name: 'promise-report-390x844', width: 390, height: 844, mode: 'promise-report' },
  { name: 'night-incorrect-feedback-320x740', width: 320, height: 740, mode: 'night-incorrect-feedback' },
  { name: 'desktop-title-1280x900', width: 1280, height: 900, mode: 'title' },
]

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
})

try {
  for (const shot of shots) {
    const page = await browser.newPage({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 1,
      isMobile: shot.width < 600,
    })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    if (shot.mode === 'promise-opening' || shot.mode.startsWith('promise-')) {
      await page.getByRole('button', { name: /Mulai cerita singkat/i }).click()
    }
    if (shot.mode === 'promise-feedback-b' || shot.mode === 'promise-return-upset') {
      await page.locator('[data-option-id="b"]').click()
    }
    if (shot.mode === 'promise-return-upset') {
      await page.getByRole('button', { name: 'Lanjutkan' }).click()
    }
    if (shot.mode === 'promise-final-feedback' || shot.mode === 'promise-report') {
      await page.locator('[data-option-id="a"]').click()
      await page.getByRole('button', { name: 'Lanjutkan' }).click()
      await page.locator('[data-option-id="a"]').click()
      if (shot.mode === 'promise-report') await page.getByRole('button', { name: 'Lihat hasil' }).click()
    }
    if (shot.mode === 'night-incorrect-feedback') {
      await page.getByRole('button', { name: /Pilih shift lain/i }).click()
      await page.getByRole('button', { name: /Shift malam.*Nachtschicht/i }).click()
      await page.locator('[data-option-id="b"]').click()
    }
    const path = join(outputDir, `${shot.name}.png`)
    await page.screenshot({ path })
    console.log(`SCREENSHOT ${path}`)
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(`screenshots captured from ${baseUrl}`)
