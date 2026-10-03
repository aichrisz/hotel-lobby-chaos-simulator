import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173/'
const outputDir = process.env.PROMISE_QA_OUTPUT_DIR ?? join(tmpdir(), 'hotel-promise-qa')
const viewports = [
  { label: '390x844', width: 390, height: 844 },
  { label: '320x740', width: 320, height: 740 },
]
const choices = [
  { id: 'a', button: /10:30 Uhr Bescheid/i, returnLine: /Ich bin wieder da, wie besprochen/i, finalAnswer: /Ich prüfe den aktuellen Stand/i, rationale: /Kamu menepati janji untuk memberi kabar/i },
  { id: 'b', button: /spätestens um elf Uhr fertig/i, returnLine: /Ich bin wieder da\. Es ist elf, mein Zimmer ist noch nicht bereit/i, finalAnswer: /Es tut mir leid, dass ich Ihnen keine verlässliche Auskunft/i, rationale: /Janji yang tidak terverifikasi/i },
  { id: 'c', button: /Keine Ahnung/i, returnLine: /Ich bin wieder da\. Es ist elf, mein Zimmer ist noch nicht bereit/i, finalAnswer: /Es tut mir leid, dass ich Ihnen keine verlässliche Auskunft/i, rationale: /Janji yang tidak terverifikasi/i },
]
const errors = []

await mkdir(outputDir, { recursive: true })

async function saveScreenshot(page, name) {
  const filePath = join(outputDir, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: true })
  console.log(`SCREENSHOT ${filePath}`)
}

function watchErrors(page, label) {
  page.on('pageerror', (error) => errors.push(`${label} pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${label} console: ${message.text()}`)
  })
}

async function verifyPage(page, label) {
  const layout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }))
  assert.ok(
    Math.max(layout.documentWidth, layout.bodyWidth) <= layout.viewportWidth,
    `${label}: horizontal overflow ${JSON.stringify(layout)}`,
  )

  const buttons = page.getByRole('button')
  for (let index = 0; index < await buttons.count(); index += 1) {
    const button = buttons.nth(index)
    if (!(await button.isVisible())) continue
    const box = await button.boundingBox()
    assert.ok(box && box.width >= 44 && box.height >= 44, `${label}: visible button ${index} is below 44px: ${JSON.stringify(box)}`)
  }
}

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
})

try {
  for (const viewport of viewports) {
    for (const choice of choices) {
      const label = `promise-${choice.id}-${viewport.label}`
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: true,
      })
      watchErrors(page, label)
      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      await verifyPage(page, `${label} title`)
      if (choice.id === 'a') await saveScreenshot(page, `promise-title-${viewport.label}`)

      await page.getByRole('button', { name: /Mini-Schicht: Das Versprechen/i }).click()
      assert.match(await page.getByText('Begegnung').textContent() ?? '', /Begegnung/)
      assert.equal(await page.getByText('1/2').count(), 1)
      assert.equal(await page.getByText('3/2').count(), 0)
      assert.ok(await page.getByText('dringend').evaluate((badge) => badge.classList.contains('text-ink')))
      await verifyPage(page, `${label} opening`)
      if (choice.id === 'a') await saveScreenshot(page, `promise-opening-${viewport.label}`)

      await page.getByRole('button', { name: choice.button }).click()
      assert.match(await page.getByText('Feedback').textContent() ?? '', /Feedback/)
      assert.equal(await page.getByText('1/2').count(), 1)
      assert.equal(await page.getByText('3/2').count(), 0)
      assert.equal(await page.getByText(/Ich bin wieder da/).count(), 0)
      await verifyPage(page, `${label} first feedback`)
      if (choice.id !== 'c') await saveScreenshot(page, `${label}-first-feedback`)

      await page.getByRole('button', { name: /Weiter mit demselben Gast/i }).click()
      assert.equal(await page.getByText(choice.returnLine).count(), 1)
      assert.equal(await page.getByText('2/2').count(), 1)
      assert.equal(await page.getByText('3/2').count(), 0)
      await verifyPage(page, `${label} returning guest`)
      if (choice.id !== 'c') await saveScreenshot(page, `${label}-returning-guest`)

      await page.getByRole('button', { name: choice.finalAnswer }).click()
      assert.match(await page.getByText(choice.rationale).textContent() ?? '', new RegExp(choice.rationale.source, 'i'))
      assert.equal(await page.getByRole('button', { name: /Zur Schichtauswertung/i }).count(), 1)
      assert.equal(await page.getByText('2/2').count(), 1)
      assert.equal(await page.getByText('3/2').count(), 0)
      assert.equal(await page.getByText(/Patch Notes/).count(), 0)
      await verifyPage(page, `${label} final feedback`)
      if (choice.id !== 'c') await saveScreenshot(page, `${label}-final-feedback`)

      await page.getByRole('button', { name: /Zur Schichtauswertung/i }).click()
      assert.equal(await page.getByText(/2\/2 Begegnungen bearbeitet/).count(), 1)
      assert.equal(await page.getByText(/Mini-Schicht: Das Versprechen Patch Notes/i).count(), 1)
      await verifyPage(page, `${label} report`)
      if (choice.id !== 'c') await saveScreenshot(page, `${label}-report`)

      await page.getByRole('button', { name: /Neue Schicht/i }).last().click()
      assert.equal(await page.getByText(/Können Sie mir versprechen/i).count(), 1)
      assert.equal(await page.getByText('1/2').count(), 1)
      assert.equal(await page.getByText('Feedback').count(), 0)
      await verifyPage(page, `${label} restart`)
      if (choice.id !== 'c') await saveScreenshot(page, `${label}-restart`)
      await page.close()
    }
  }

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  watchErrors(desktop, 'desktop')
  await desktop.goto(baseUrl, { waitUntil: 'networkidle' })
  await verifyPage(desktop, 'desktop title')
  await saveScreenshot(desktop, 'desktop-title')

  await desktop.getByRole('button', { name: /Start Frühschicht/i }).click()
  assert.equal(await desktop.getByText('1/12').count(), 1)
  await desktop.getByRole('button', { name: /Der Kaffee wartet/i }).click()
  assert.match(await desktop.getByText('Feedback').textContent() ?? '', /Feedback/)
  await verifyPage(desktop, 'desktop Frühschicht feedback')
  await saveScreenshot(desktop, 'desktop-frueh-feedback')
  await desktop.getByRole('button', { name: /Next guest/i }).click()
  assert.equal(await desktop.getByText('2/12').count(), 1)
  await verifyPage(desktop, 'desktop Frühschicht next card')

  await desktop.reload({ waitUntil: 'networkidle' })
  await desktop.getByRole('button', { name: /Start Nachtschicht/i }).click()
  assert.equal(await desktop.getByText('1/4').count(), 1)
  assert.equal(await desktop.getByText(/Nachtschicht HUD/i).count(), 1)
  await verifyPage(desktop, 'desktop Nachtschicht desk')
  await saveScreenshot(desktop, 'desktop-nacht-desk')
  await desktop.getByRole('button', { name: /^A\./i }).click()
  assert.match(await desktop.getByText('Feedback').textContent() ?? '', /Feedback/)
  await desktop.getByRole('button', { name: /Next guest/i }).click()
  assert.equal(await desktop.getByText('2/4').count(), 1)
  await verifyPage(desktop, 'desktop Nachtschicht next card')
  await saveScreenshot(desktop, 'desktop-nacht-next')
  await desktop.close()

  assert.deepEqual(errors, [], `browser errors:\n${errors.join('\n')}`)
  console.log(`PASS promise branches A/B/C at ${viewports.map(({ label }) => label).join(' and ')}, desktop Früh-/Nachtschicht smoke, touch targets, overflow, and browser errors`)
  console.log(`Screenshots: ${outputDir}`)
} finally {
  await browser.close()
}
