import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4178/'
const outputDir = process.env.PROMISE_QA_OUTPUT_DIR ?? join(tmpdir(), 'hotel-promise-qa')
const viewports = [
  { label: '320x740', width: 320, height: 740 },
  { label: '390x844', width: 390, height: 844 },
]
const choices = [
  { id: 'a', expectedReturn: 'promise-return-manageable', clue: /waktu untuk memberi kabar/i },
  { id: 'b', expectedReturn: 'promise-return-upset', clue: /janji kamar siap belum aman/i },
  { id: 'c', expectedReturn: 'promise-return-upset', clue: /tidak memberi kepastian/i },
]
const errors = []
const completedGroups = []
const screenshots = []
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
})

await mkdir(outputDir, { recursive: true })

async function screenshot(page, name) {
  const path = join(outputDir, `${name}.png`)
  await page.screenshot({ path })
  screenshots.push(path)
  console.log(`SCREENSHOT ${path}`)
}

function watch(page, label) {
  page.on('pageerror', (error) => errors.push(`${label} pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${label} console: ${message.text()}`)
  })
  page.on('requestfailed', (request) => errors.push(`${label} requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${label} HTTP ${response.status()}: ${response.url()}`)
  })
}

async function verify(page, label) {
  const requestedWidth = page.viewportSize().width
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  assert.ok(Math.max(dimensions.document, dimensions.body) <= requestedWidth, `${label} horizontal overflow: ${JSON.stringify({ requestedWidth, ...dimensions })}`)
  const buttons = page.getByRole('button')
  for (let index = 0; index < await buttons.count(); index += 1) {
    const button = buttons.nth(index)
    if (!(await button.isVisible())) continue
    const box = await button.boundingBox()
    assert.ok(box && box.width >= 44 && box.height >= 44, `${label} button ${index} below 44px: ${JSON.stringify(box)}`)
  }
}

try {
  for (const viewport of viewports) {
    for (const choice of choices) {
      const label = `${choice.id}-${viewport.label}`
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: true,
      })
      watch(page, label)
      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      await verify(page, `${label} title`)
      await page.getByRole('button', { name: /Mulai cerita singkat/i }).click()
      const opening = page.locator('[data-scenario-id="promise-guest-start"]')
      assert.equal(await opening.locator('[data-option-id]').count(), 3)
      const shownOptionIds = await opening.locator('[data-option-id]').evaluateAll((items) => items.map((item) => item.dataset.optionId))
      assert.equal(new Set(shownOptionIds).size, 3, `${label} option order must be a full permutation`)
      assert.equal(await page.locator('html').getAttribute('lang'), 'id')
      assert.equal(await opening.locator('h2[lang="de"]').count(), 1)
      await verify(page, `${label} promise opening`)

      const chosen = opening.locator(`[data-option-id="${choice.id}"]`)
      const selectedText = await chosen.textContent()
      await chosen.click()
      assert.equal(await page.locator('[data-scenario-id="promise-guest-start"]').count(), 1)
      assert.equal(await page.getByRole('button', { name: /Lihat hasil/i }).count(), 0)
      assert.ok(await page.getByText(choice.clue).count(), `${label} selected OptionId lost its authored reason`)
      assert.equal(await page.locator('blockquote[lang="de"]').textContent(), selectedText)
      assert.equal(await page.getByText('Pertemuan 1 dari 2').count(), 1)
      await verify(page, `${label} opening feedback`)
      if (choice.id === 'b') await screenshot(page, `promise-b-feedback-${viewport.label}`)

      await page.getByRole('button', { name: 'Lanjutkan' }).click()
      assert.equal(await page.locator(`[data-scenario-id="${choice.expectedReturn}"]`).count(), 1)
      assert.equal(await page.getByText('Pertemuan 2 dari 2').count(), 1)
      await verify(page, `${label} returning guest`)
      if (choice.id === 'b') await screenshot(page, `promise-b-return-${viewport.label}`)

      await page.locator('[data-option-id="a"]').click()
      assert.equal(await page.getByRole('button', { name: 'Lihat hasil' }).count(), 1)
      assert.equal(await page.getByRole('heading', { name: 'Pelajaran dibawa pulang' }).count(), 0)
      assert.equal(await page.getByText('Pertemuan 2 dari 2').count(), 1)
      await verify(page, `${label} final feedback`)
      if (choice.id === 'a') await screenshot(page, `promise-final-feedback-${viewport.label}`)

      await page.getByRole('button', { name: 'Lihat hasil' }).click()
      assert.equal(await page.getByRole('heading', { name: 'Pelajaran dibawa pulang' }).count(), 1)
      assert.equal(await page.getByText('2 dari 2 pertemuan selesai.').count(), 1)
      assert.equal(await page.getByRole('button', { name: 'Coba jawaban lain' }).count(), 1)
      assert.equal(await page.getByRole('button', { name: 'Pilih shift' }).count(), 2)
      await verify(page, `${label} report`)
      if (choice.id === 'a') await screenshot(page, `promise-report-${viewport.label}`)

      await page.getByRole('button', { name: 'Coba jawaban lain' }).click()
      assert.equal(await page.locator('[data-scenario-id="promise-guest-start"]').count(), 1)
      assert.equal(await page.getByText('Pertemuan 1 dari 2').count(), 1)
      assert.equal(await page.getByRole('heading', { name: 'Pilihanmu' }).count(), 0)
      await page.getByText('Detail shift').click()
      assert.equal(await page.getByText('Keputusan dicatat').evaluate((node) => node.nextElementSibling.textContent), '0')
      await verify(page, `${label} replay reset`)
      await page.close()
      completedGroups.push({ choice: choice.id, viewport: viewport.label, status: 'PASS' })
      writeFileSync(join(outputDir, 'promise-smoke-checkpoint.json'), `${JSON.stringify({ baseUrl, completedGroups, screenshots, errors }, null, 2)}\n`)
    }
  }

  assert.deepEqual(errors, [], `browser/network errors:\n${errors.join('\n')}`)
  const report = { baseUrl, completedGroups, screenshots, errors, limitations: ['Playwright Chromium emulation is not physical device, Safari, or screen-reader speech verification.'] }
  writeFileSync(join(outputDir, 'promise-smoke-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(`PASS promise A/B/C semantic routing, feedback before report, picker/replay reset, 44px controls, overflow, and browser/network checks at ${viewports.map(({ label }) => label).join(' and ')}`)
  console.log(`Screenshots: ${outputDir}`)
} finally {
  await browser.close()
}
