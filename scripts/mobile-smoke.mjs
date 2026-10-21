import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4178/'
const outputDir = process.env.MOBILE_QA_OUTPUT_DIR ?? join(tmpdir(), 'hotel-mobile-qa')
const viewports = [
  { label: '320x740', width: 320, height: 740 },
  { label: '390x844', width: 390, height: 844 },
  { label: '768x900', width: 768, height: 900 },
  { label: '1280x900', width: 1280, height: 900 },
]
const checks = []
const errors = []
const screenshots = []
let browserVersion = 'unknown'
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
})
browserVersion = browser.version()
await mkdir(outputDir, { recursive: true })

function record(name, detail = '') {
  checks.push({ name, detail })
  writeFileSync(join(outputDir, 'mobile-smoke-checkpoint.json'), `${JSON.stringify({
    baseUrl,
    browserVersion,
    completedGroups: checks,
    screenshots,
    errors,
  }, null, 2)}\n`)
  console.log(`PASS ${name}${detail ? ` — ${detail}` : ''}`)
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

async function capture(page, name, options = {}) {
  const file = join(outputDir, `${name}.png`)
  await page.screenshot({ path: file, ...options })
  screenshots.push(file)
  console.log(`SCREENSHOT ${file}`)
}

async function verifyGeometry(page, label) {
  const requestedWidth = page.viewportSize().width
  const geometry = await page.evaluate(() => {
    const limit = document.documentElement.clientWidth
    return {
      innerWidth: window.innerWidth,
      clientWidth: limit,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      scrollX: window.scrollX,
      overflowElements: [...document.querySelectorAll('body *')]
        .map((node) => {
          const rect = node.getBoundingClientRect()
          return { tag: node.tagName, text: node.textContent?.trim().slice(0, 60), left: rect.left, right: rect.right, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }
        })
        .filter((node) => node.right > limit + 0.5 || node.scrollWidth > node.clientWidth + 1)
        .slice(0, 20),
    }
  })
  assert.ok(Math.max(geometry.documentWidth, geometry.bodyWidth) <= requestedWidth, `${label}: horizontal overflow beyond requested viewport ${requestedWidth}: ${JSON.stringify(geometry)}`)

  const buttons = page.getByRole('button')
  for (let index = 0; index < await buttons.count(); index += 1) {
    const button = buttons.nth(index)
    if (!(await button.isVisible())) continue
    const box = await button.boundingBox()
    assert.ok(box && box.width >= 44 && box.height >= 44, `${label}: button ${index} below 44px: ${JSON.stringify(box)}`)
  }
  const summaries = page.locator('summary')
  for (let index = 0; index < await summaries.count(); index += 1) {
    const summary = summaries.nth(index)
    if (!(await summary.isVisible())) continue
    const box = await summary.boundingBox()
    assert.ok(box && box.height >= 44, `${label}: disclosure target ${index} below 44px: ${JSON.stringify(box)}`)
  }
  return geometry
}

async function measureTextContrast(page, selectors) {
  return page.evaluate((targets) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas 2D context unavailable for contrast measurement')

    function composite(color, background) {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = `rgb(${background[0]} ${background[1]} ${background[2]})`
      context.fillRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
    }

    function luminance(rgb) {
      const channels = rgb.map((value) => {
        const channel = value / 255
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
      })
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
    }

    return Object.fromEntries(Object.entries(targets).map(([name, selector]) => {
      const node = document.querySelector(selector)
      if (!node) throw new Error(`Contrast target missing: ${name} (${selector})`)
      const ancestors = []
      for (let current = node; current; current = current.parentElement) ancestors.unshift(current)
      let background = [255, 255, 255]
      for (const ancestor of ancestors) background = composite(getComputedStyle(ancestor).backgroundColor, background)
      const style = getComputedStyle(node)
      const foreground = composite(style.color, background)
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
      return [name, {
        color: style.color,
        parentColor: getComputedStyle(node.parentElement).color,
        background,
        ratio: (values[0] + 0.05) / (values[1] + 0.05),
        fontSize: style.fontSize,
        fontWeight: Number.parseInt(style.fontWeight, 10),
      }]
    }))
  }, selectors)
}

async function openMode(page, label) {
  await page.getByRole('button', { name: /Pilih shift lain/i }).click()
  const button = page.getByRole('button', { name: new RegExp(label, 'i') })
  await button.click()
}

async function optionButtons(page) {
  return page.locator('[data-option-id]')
}

async function checkOpeningResponses(page, label) {
  const options = await optionButtons(page)
  assert.equal(await options.count(), 3, `${label}: expected three full German responses`)
  const optionData = await options.evaluateAll((items) => items.map((item) => ({
    id: item.dataset.optionId,
    text: item.textContent?.trim() ?? '',
    lang: item.getAttribute('lang'),
    fontSize: Number.parseFloat(getComputedStyle(item).fontSize),
    lineClamp: getComputedStyle(item).webkitLineClamp,
    box: (() => {
      const rect = item.getBoundingClientRect()
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom }
    })(),
  })))
  assert.equal(new Set(optionData.map(({ id }) => id)).size, 3, `${label}: repeated OptionId`)
  for (const option of optionData) {
    assert.equal(option.lang, 'de', `${label}: response language missing for ${option.id}`)
    assert.ok(option.text.length > 0, `${label}: empty response ${option.id}`)
    assert.ok(option.fontSize >= 16, `${label}: ${option.id} below 16px (${option.fontSize})`)
    assert.notEqual(option.lineClamp, '1', `${label}: response ${option.id} is clamped`)
  }
  const viewport = page.viewportSize()
  const layout = await page.evaluate(() => {
    const rectFor = (node) => {
      const rect = node.getBoundingClientRect()
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    }
    const options = [...document.querySelectorAll('[data-option-id]')].map(rectFor)
    const helpNode = [...document.querySelectorAll('summary')].find((node) => node.textContent?.trim() === 'Bantuan dan aturan tempo')
    return { options, help: helpNode ? rectFor(helpNode) : null }
  })
  const firstResponse = layout.options[0]
  assert.ok(firstResponse && firstResponse.y >= 0 && firstResponse.y + firstResponse.height <= viewport.height, `${label}: first response is not fully visible at opening: ${JSON.stringify(firstResponse)}`)
  const lastResponse = layout.options[2]
  assert.ok(lastResponse && layout.help && layout.help.y >= lastResponse.y + lastResponse.height, `${label}: optional help should follow the response choices: ${JSON.stringify({ lastResponse, help: layout.help })}`)
  assert.equal(await page.getByText('Hotel Ostseeblick fiktif; contoh ini bukan SOP hotel atau aturan pemberi kerja.').count(), 1, `${label}: visible fictional-training safety context missing`)
  assert.equal(await page.locator('[data-option-id]').evaluateAll((items) => items.some((item) => /^[ABC]\.\s/.test(item.textContent?.trim() ?? ''))), false, `${label}: positional response lettering remains visible`)
  return optionData
}

async function testResponsiveComposition() {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      isMobile: viewport.width < 600,
    })
    watch(page, `layout-${viewport.label}`)
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    assert.equal(await page.locator('html').getAttribute('lang'), 'id')
    const cta = page.getByRole('button', { name: /Mulai cerita singkat/i })
    const box = await cta.boundingBox()
    assert.ok(box && box.x >= 0 && box.y >= 0 && box.y + box.height <= viewport.height, `${viewport.label}: primary start CTA is not fully visible without scroll: ${JSON.stringify(box)}`)
    await verifyGeometry(page, `title-${viewport.label}`)
    if (viewport.width === 320 || viewport.width === 390) await capture(page, `title-${viewport.label}`)

    await cta.click()
    await page.waitForFunction(() => {
      const heading = document.activeElement
      const bounds = heading?.getBoundingClientRect()
      const firstResponse = document.querySelector('[data-option-id]')?.getBoundingClientRect()
      return heading instanceof HTMLHeadingElement && heading.getAttribute('lang') === 'de' && bounds && bounds.top >= 0 && bounds.bottom <= window.innerHeight && (window.scrollY === 0 || bounds.top <= 12) && firstResponse && firstResponse.top >= 0 && firstResponse.bottom <= window.innerHeight
    })
    const opening = await checkOpeningResponses(page, `promise-${viewport.label}`)
    const focused = await page.evaluate(() => ({
      text: document.activeElement?.textContent?.trim(),
      rect: (() => {
        const rect = document.activeElement?.getBoundingClientRect()
        return rect && { top: rect.top, bottom: rect.bottom }
      })(),
    }))
    assert.ok(focused.rect && focused.rect.top >= 0 && focused.rect.bottom <= viewport.height, `${viewport.label}: focused encounter heading is outside viewport ${JSON.stringify(focused)}`)
    assert.equal(await page.locator('[data-scenario-id="promise-guest-start"]').count(), 1)
    await verifyGeometry(page, `promise-opening-${viewport.label}`)
    if (viewport.width === 320 || viewport.width === 390) await capture(page, `promise-opening-${viewport.label}`)

    if (viewport.width === 320 || viewport.width === 390) {
      const firstChoice = opening[0].id
      await page.locator(`[data-option-id="${firstChoice}"]`).focus()
      await page.keyboard.press('Enter')
      assert.equal(await page.getByRole('heading', { name: 'Pilihanmu', level: 2 }).count(), 1)
      await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'Pilihanmu')
      await verifyGeometry(page, `keyboard-feedback-${viewport.label}`)
      await capture(page, `promise-keyboard-feedback-${viewport.label}`)
    }
    await page.close()
  }
  record('responsive composition', '320×740, 390×844, 768×900, 1280×900: CTA, overflow, target size, full German choices, focus and viewport screenshots')
}

async function testAllRelaxedPacksAndFeedback() {
  let nightReportContrastMetrics = null
  for (const mode of [
    { label: 'Shift pagi.*Frühschicht', id: 'frueh', count: 12 },
    { label: 'Shift malam.*Nachtschicht', id: 'nacht', count: 4 },
    { label: 'Janji kepada tamu.*Das Versprechen', id: 'promise', count: 2 },
  ]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
    watch(page, `relaxed-${mode.id}`)
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    if (mode.id === 'promise') await page.getByRole('button', { name: /Mulai cerita singkat/i }).click()
    else await openMode(page, mode.label)
    if (mode.id === 'promise') {
      assert.equal(await page.locator('[data-scenario-id]').getAttribute('data-scenario-id'), 'promise-guest-start')
    }
    assert.equal(await page.getByText(/Belajar santai · tanpa timer/i).count(), 1)

    const seenFamilies = []
    for (let index = 0; index < mode.count; index += 1) {
      seenFamilies.push(await page.locator('[data-family-id]').getAttribute('data-family-id'))
      await page.locator('[data-option-id="a"]').click()
      assert.equal(await page.getByRole('heading', { name: 'Pilihanmu', level: 2 }).count(), 1, `${mode.id} answer ${index + 1} feedback missing`)
      if (mode.id === 'promise' && index === 0) await capture(page, 'promise-playful-response')
      const finalButton = page.getByRole('button', { name: 'Lihat hasil' })
      if (index < mode.count - 1) {
        assert.equal(await finalButton.count(), 0, `${mode.id} report action appeared before last encounter`)
        await page.getByRole('button', { name: 'Lanjutkan' }).click()
        assert.equal(await page.locator('[data-scenario-id]').count(), 1)
      } else {
        assert.equal(await finalButton.count(), 1, `${mode.id} final feedback must precede report`)
        assert.equal(await page.getByRole('heading', { name: 'Pelajaran dibawa pulang' }).count(), 0)
        await capture(page, `${mode.id}-final-feedback`)
        await finalButton.click()
        assert.equal(await page.getByRole('heading', { name: 'Pelajaran dibawa pulang' }).count(), 1)
        assert.equal(await page.getByRole('button', { name: 'Coba jawaban lain' }).count(), 1)
        assert.ok(await page.getByRole('button', { name: 'Pilih shift' }).count() >= 1)
        if (mode.id === 'nacht') {
          const reportContrast = await measureTextContrast(page, {
            heading: 'main[data-screen="report"] h2',
            lessonHeading: 'main[data-screen="report"] h3',
            lessonBody: 'main[data-screen="report"] h3 + p',
          })
          nightReportContrastMetrics = reportContrast
          const reportRootColor = reportContrast.heading.parentColor
          assert.equal(reportContrast.heading.fontSize, '30px')
          assert.equal(reportContrast.lessonHeading.fontSize, '18px')
          assert.ok(reportContrast.lessonHeading.fontWeight >= 700)
          assert.equal(reportContrast.heading.color, reportRootColor, 'report heading must inherit report-root foreground')
          assert.equal(reportContrast.lessonHeading.color, reportRootColor, 'lesson heading must inherit report-root foreground')
          assert.equal(reportContrast.lessonBody.color, reportRootColor, 'lesson body must match report-root foreground')
          assert.ok(reportContrast.heading.ratio >= 3, `night report heading contrast below 3:1: ${JSON.stringify(reportContrast.heading)}`)
          assert.ok(reportContrast.lessonHeading.ratio >= 4.5, `night lesson heading contrast below 4.5:1: ${JSON.stringify(reportContrast.lessonHeading)}`)
        }
        await verifyGeometry(page, `${mode.id}-report`)
        if (mode.id === 'promise') {
          await capture(page, 'promise-report')
          await page.getByText('Rincian nilai dan catatan').click()
          await verifyGeometry(page, 'promise-report-expanded-standard-390')
          const scoreRows = await page.locator('details dl').evaluate((list) => ({
            labels: [...list.querySelectorAll('dt')].map((node) => node.textContent?.trim()),
            values: [...list.querySelectorAll('dd')].map((node) => node.textContent?.trim()),
          }))
          assert.equal(scoreRows.labels.length, 3, '390px report must preserve all three relaxed score labels')
          assert.ok(scoreRows.values.every((value) => value.endsWith('/100')), `390px report score values missing: ${JSON.stringify(scoreRows)}`)
          await capture(page, 'promise-report-expanded-standard-390', { fullPage: true })
        }
        if (mode.id === 'nacht') await capture(page, 'night-report')
      }
    }
    if (mode.id !== 'promise') assert.equal(new Set(seenFamilies).size, mode.count, `${mode.id} should visit every family exactly once`)
    await page.close()
  }
  assert.ok(nightReportContrastMetrics, 'night report contrast must be measured')
  record('all-mode final feedback and relaxed completion', `Promise 2/2, Frühschicht 12/12, Nachtschicht 4/4; report only after final feedback; night report heading ${nightReportContrastMetrics.heading.ratio.toFixed(2)}:1, 18px lesson heading ${nightReportContrastMetrics.lessonHeading.ratio.toFixed(2)}:1`)
}

async function testPromiseA11yAndClampedDelta() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  watch(page, 'promise-feedback')
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Mulai cerita singkat/i }).click()
  await page.locator('[data-option-id="a"]').click()
  assert.equal(await page.getByText('Kepuasan +10').count(), 1)
  assert.equal(await page.getByText('Ketenangan 0').count(), 1)
  const contrast = await page.locator('section[aria-labelledby="feedback-title"] p.mt-3.text-base.font-bold.leading-relaxed').evaluate((node) => {
    const text = getComputedStyle(node).color
    const surface = getComputedStyle(node.parentElement).backgroundColor
    return { text, surface, ratio: (function ratio(fg, bg) {
      function luminance(value) {
        const rgb = value.match(/[\d.]+/g).slice(0, 3).map(Number).map((channel) => {
          const c = channel / 255
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        })
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
      }
      const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
      return (values[0] + 0.05) / (values[1] + 0.05)
    })(text, surface) }
  })
  assert.ok(contrast.ratio >= 4.5, `day feedback contrast below 4.5:1: ${JSON.stringify(contrast)}`)
  await capture(page, 'promise-feedback-delta')
  await page.close()

  const night = await browser.newPage({ viewport: { width: 320, height: 740 }, deviceScaleFactor: 1, isMobile: true })
  watch(night, 'night-incorrect-feedback')
  await night.goto(baseUrl, { waitUntil: 'networkidle' })
  await openMode(night, 'Shift malam.*Nachtschicht')
  const nightContext = await measureTextContrast(night, {
    context: '[data-scenario-id] > div[lang="id"] > p:first-child',
    disclaimer: '[data-scenario-id] > div[lang="id"] > p.mt-1',
  })
  assert.equal(nightContext.context.fontSize, '16px')
  assert.equal(nightContext.disclaimer.fontSize, '14px')
  assert.ok(nightContext.context.ratio >= 4.5, `night context contrast below 4.5:1: ${JSON.stringify(nightContext.context)}`)
  assert.ok(nightContext.disclaimer.ratio >= 4.5, `night disclaimer contrast below 4.5:1: ${JSON.stringify(nightContext.disclaimer)}`)
  const nightScenarioId = await night.locator('[data-scenario-id]').getAttribute('data-scenario-id')
  const expectedNightDeltas = {
    'nacht-verpaetete-ankunft': [-5, 0],
    'nacht-flur-geraeusch': [-10, 0],
    'nacht-fruehes-taxi': [5, -5],
    'nacht-fruehes-taxi-abholort': [5, -5],
    'nacht-kaffeemaschine-0300': [0, -5],
  }
  const expectedNightDelta = expectedNightDeltas[nightScenarioId]
  assert.ok(expectedNightDelta, `unknown randomized first night card: ${nightScenarioId}`)
  await night.locator('[data-option-id="b"]').click()
  const satisfactionLabel = `Kepuasan ${expectedNightDelta[0] > 0 ? '+' : ''}${expectedNightDelta[0]}`
  const composureLabel = `Ketenangan ${expectedNightDelta[1] > 0 ? '+' : ''}${expectedNightDelta[1]}`
  assert.equal(await night.getByText(satisfactionLabel).count(), 1, 'incorrect night response satisfaction delta must reflect the selected authored scenario')
  assert.equal(await night.getByText(composureLabel).count(), 1, 'incorrect night response composure delta must reflect the selected authored scenario')
  assert.equal(await night.getByTestId('guest-reaction').textContent(), 'Tamu tampak ragu; bel meja berdenting pelan.')
  const nightContrast = await night.locator('section[aria-labelledby="feedback-title"] p.mt-3.text-base.font-bold.leading-relaxed').evaluate((node) => {
    const text = getComputedStyle(node).color
    const surface = getComputedStyle(node.parentElement).backgroundColor
    return { text, surface, ratio: (function ratio(fg, bg) {
      function luminance(value) {
        const rgb = value.match(/[\d.]+/g).slice(0, 3).map(Number).map((channel) => {
          const c = channel / 255
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        })
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
      }
      const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
      return (values[0] + 0.05) / (values[1] + 0.05)
    })(text, surface) }
  })
  assert.ok(nightContrast.ratio >= 4.5, `night incorrect feedback contrast below 4.5:1: ${JSON.stringify(nightContrast)}`)
  await verifyGeometry(night, 'night-incorrect-feedback-320x740')
  await capture(night, 'night-incorrect-feedback')
  await night.close()
  record('interactive feedback, actual deltas and night contrast', `clamped values shown as +10 / 0; day/night feedback ${contrast.ratio.toFixed(2)}:1 / ${nightContrast.ratio.toFixed(2)}:1; night context/disclaimer ${nightContext.context.ratio.toFixed(2)}:1 / ${nightContext.disclaimer.ratio.toFixed(2)}:1`)
}

async function testStableOrderAndRapidDuplicate() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  watch(page, 'stable-order-duplicate')
  await page.clock.install()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('radio', { name: 'Tantangan waktu' }).click()
  await page.getByRole('button', { name: /Mulai cerita singkat/i }).click()
  const orderBefore = await page.locator('[data-option-id]').evaluateAll((items) => items.map((item) => item.dataset.optionId))
  await page.clock.runFor(2000)
  const orderAfterTick = await page.locator('[data-option-id]').evaluateAll((items) => items.map((item) => item.dataset.optionId))
  assert.deepEqual(orderAfterTick, orderBefore, 'option order changed on a clock tick')

  await page.evaluate(() => {
    const button = document.querySelector('[data-option-id="b"]')
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  assert.equal(await page.getByRole('heading', { name: 'Pilihanmu', level: 2 }).count(), 1)
  assert.equal(await page.locator('blockquote[lang="de"]').count(), 1)
  await page.clock.runFor(5000)
  assert.equal(await page.getByLabel('Sisa waktu tantangan').textContent(), '2:48', 'clock must pause after the 10-second action cost')
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  await page.getByText('Detail shift', { exact: true }).click()
  const decisions = await page.getByText('Keputusan dicatat').evaluate((node) => node.nextElementSibling.textContent)
  assert.equal(decisions, '1', 'rapid duplicate answer scored more than once')
  await page.close()
  record('stable shuffle and duplicate-answer guard', 'ID order unchanged on tick; rapid duplicate clicks recorded once; feedback pauses challenge clock')
}

function clockSeconds(clockText) {
  const [minutes, seconds] = clockText.split(':').map(Number)
  return minutes * 60 + seconds
}

async function testChallengePausesAndTimeouts() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  watch(page, 'challenge-pauses')
  await page.clock.install()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('radio', { name: 'Tantangan waktu' }).click()
  await page.getByRole('button', { name: /Mulai cerita singkat/i }).click()
  await page.clock.runFor(2000)
  assert.equal(await page.getByLabel('Sisa waktu tantangan').textContent(), '2:58')

  await page.getByText('Bantuan dan aturan tempo').click()
  await page.waitForFunction(() => [...document.querySelectorAll('summary')].some((node) => node.textContent?.trim() === 'Bantuan dan aturan tempo' && node.parentElement?.open))
  const helpPauseStart = await page.getByLabel('Sisa waktu tantangan').textContent()
  await page.clock.runFor(5000)
  assert.equal(await page.getByLabel('Sisa waktu tantangan').textContent(), helpPauseStart, 'help must pause challenge clock')
  await page.getByText('Bantuan dan aturan tempo').click()
  await page.waitForFunction(() => [...document.querySelectorAll('summary')].some((node) => node.textContent?.trim() === 'Bantuan dan aturan tempo' && !node.parentElement?.open))
  const beforeHelpResume = clockSeconds(await page.getByLabel('Sisa waktu tantangan').textContent())
  let afterHelpResume = beforeHelpResume
  for (let second = 0; second < 5 && afterHelpResume === beforeHelpResume; second += 1) {
    await page.clock.runFor(1000)
    afterHelpResume = clockSeconds(await page.getByLabel('Sisa waktu tantangan').textContent())
  }
  assert.ok(afterHelpResume < beforeHelpResume, 'challenge clock should resume after closing help')

  const menuTrigger = page.getByRole('button', { name: 'Pilih shift' })
  await menuTrigger.click()
  assert.equal(await page.getByRole('dialog', { name: /tinggalkan shift ini/i }).count(), 1)
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Tetap bermain')
  const menuPauseStart = await page.getByLabel('Sisa waktu tantangan').textContent()
  await page.clock.runFor(5000)
  assert.equal(await page.getByLabel('Sisa waktu tantangan').textContent(), menuPauseStart, 'leave menu must pause challenge clock')
  await page.getByRole('button', { name: 'Tetap bermain' }).click()
  await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'Pilih shift')

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  const hiddenPauseStart = await page.getByLabel('Sisa waktu tantangan').textContent()
  await page.clock.runFor(4000)
  assert.equal(await page.getByLabel('Sisa waktu tantangan').textContent(), hiddenPauseStart, 'hidden tab must pause challenge clock')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  const beforeVisibleRun = clockSeconds(await page.getByLabel('Sisa waktu tantangan').textContent())
  await page.clock.runFor(2000)
  assert.equal(clockSeconds(await page.getByLabel('Sisa waktu tantangan').textContent()), beforeVisibleRun - 2)

  const beforeAnswer = clockSeconds(await page.getByLabel('Sisa waktu tantangan').textContent())
  await page.locator('[data-option-id="a"]').click()
  assert.equal(clockSeconds(await page.getByLabel('Sisa waktu tantangan').textContent()), beforeAnswer - 30, '30-second action cost not applied')
  assert.equal(await page.locator('[data-option-id]').count(), 0, 'answer options should be absent during feedback')
  const feedbackPauseStart = await page.getByLabel('Sisa waktu tantangan').textContent()
  await page.clock.runFor(5000)
  assert.equal(await page.getByLabel('Sisa waktu tantangan').textContent(), feedbackPauseStart, 'feedback must pause challenge clock')
  await capture(page, 'challenge-feedback-paused')
  await page.close()
  record('challenge timing and pauses', '180-second tick, 30-second action cost, help/menu/hidden-tab/feedback pause; stable option order')

  const actionTimeout = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  watch(actionTimeout, 'challenge-action-timeout')
  await actionTimeout.clock.install()
  await actionTimeout.goto(baseUrl, { waitUntil: 'networkidle' })
  await actionTimeout.getByRole('radio', { name: 'Tantangan waktu' }).click()
  await actionTimeout.getByRole('button', { name: /Mulai cerita singkat/i }).click()
  await actionTimeout.clock.runFor(177000)
  assert.equal(await actionTimeout.getByLabel('Sisa waktu tantangan').textContent(), '0:03')
  await actionTimeout.locator('[data-option-id="a"]').click()
  assert.equal(await actionTimeout.getByRole('button', { name: 'Lihat hasil' }).count(), 1, 'action-cost timeout skipped final answer feedback')
  assert.equal(await actionTimeout.getByRole('heading', { name: 'Pelajaran dibawa pulang' }).count(), 0)
  await actionTimeout.getByRole('button', { name: 'Lihat hasil' }).click()
  assert.equal(await actionTimeout.getByText('Waktu tantangan habis setelah 1 keputusan.').count(), 1)
  await actionTimeout.close()

  const clockTimeout = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  watch(clockTimeout, 'challenge-clock-timeout')
  await clockTimeout.clock.install()
  await clockTimeout.goto(baseUrl, { waitUntil: 'networkidle' })
  await clockTimeout.getByRole('radio', { name: 'Tantangan waktu' }).click()
  await clockTimeout.getByRole('button', { name: /Mulai cerita singkat/i }).click()
  await clockTimeout.clock.runFor(181000)
  assert.equal(await clockTimeout.getByRole('heading', { name: 'Pelajaran dibawa pulang' }).count(), 1)
  assert.equal(await clockTimeout.getByText('Waktu tantangan habis setelah 0 keputusan.').count(), 1)
  assert.equal(await clockTimeout.getByRole('heading', { name: 'Pilihanmu' }).count(), 0, 'clock timeout must not fabricate answer feedback')
  await capture(clockTimeout, 'challenge-clock-timeout')
  await clockTimeout.close()
  record('challenge timeout outcomes', 'action-cost timeout keeps final feedback; no-answer clock timeout reports 0 decisions without fictional feedback')
}

async function testLeaveConfirmationAndModeSwitch() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  watch(page, 'leave-confirmation-mode-switch')
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Mulai cerita singkat/i }).click()
  const selectedText = await page.locator('[data-option-id="b"]').textContent()
  await page.locator('[data-option-id="b"]').click()

  await page.getByRole('button', { name: 'Pilih shift' }).click()
  const dialog = page.getByRole('dialog', { name: /tinggalkan shift ini/i })
  assert.equal(await dialog.count(), 1)
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Tetap bermain')
  await page.getByRole('button', { name: 'Tetap bermain' }).click()
  await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'Pilih shift')
  assert.equal(await page.locator('blockquote[lang="de"]').textContent(), selectedText, 'Cancel must preserve answer feedback')
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  assert.equal(await page.locator('[data-scenario-id="promise-return-upset"]').count(), 1, 'Cancel must preserve the answer branch')

  await page.getByRole('button', { name: 'Pilih shift' }).click()
  await page.getByRole('dialog', { name: /tinggalkan shift ini/i }).getByRole('button', { name: 'Tinggalkan shift' }).click()
  assert.equal(await page.getByRole('button', { name: /Mulai cerita singkat/i }).count(), 1)
  const nightChoice = page.getByRole('button', { name: /Shift malam.*Nachtschicht/i })
  assert.equal(await nightChoice.count(), 1, 'Accept must expose the shift picker')
  await nightChoice.click()
  assert.match(await page.locator('[data-scenario-id]').getAttribute('data-scenario-id'), /^nacht-/, 'picker must start a selected-night-pack encounter regardless of random order')
  assert.equal(await page.getByText(/Belajar santai · tanpa timer/i).count(), 1)
  await verifyGeometry(page, 'accepted-leave-selected-night-mode')
  await page.close()
  record('leave confirmation and mode switch', 'Cancel retains selected feedback and branch; Accept opens picker and starts Nachtschicht')
}

async function test181SecondsAndReplay() {
  const page = await browser.newPage({ viewport: { width: 320, height: 740 }, deviceScaleFactor: 1, isMobile: true })
  watch(page, 'relaxed-181s')
  await page.clock.install()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Mulai cerita singkat/i }).click()
  await page.clock.runFor(181000)
  assert.equal(await page.locator('[data-scenario-id="promise-guest-start"]').count(), 1, 'relaxed encounter timed out after 181s')
  assert.equal(await page.getByRole('heading', { name: 'Pelajaran dibawa pulang' }).count(), 0)
  await page.locator('[data-option-id="b"]').click()
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  assert.equal(await page.locator('[data-scenario-id="promise-return-upset"]').count(), 1)
  await page.locator('[data-option-id="a"]').click()
  assert.equal(await page.getByRole('button', { name: 'Lihat hasil' }).count(), 1)
  await page.getByRole('button', { name: 'Lihat hasil' }).click()
  await page.getByRole('button', { name: 'Coba jawaban lain' }).click()
  assert.equal(await page.locator('[data-scenario-id="promise-guest-start"]').count(), 1)
  assert.equal(await page.getByText('Pertemuan 1 dari 2').count(), 1)
  await page.getByText('Detail shift', { exact: true }).click()
  assert.equal(await page.getByText('Keputusan dicatat').evaluate((node) => node.nextElementSibling.textContent), '0')
  await capture(page, 'relaxed-replay-reset-320x740')
  await page.close()
  record('relaxed 181-second completion and replay reset', 'encounter remains active past 181s; branch resets to opening and zero recorded answers')
}

async function testReportReflowAndReducedMotion() {
  const page = await browser.newPage({ viewport: { width: 320, height: 740 }, deviceScaleFactor: 1, isMobile: true, reducedMotion: 'reduce' })
  watch(page, 'report-200pct-reduced-motion')
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Mulai cerita singkat/i }).click()
  await page.locator('[data-option-id="a"]').click()
  const focusedAfterAnswer = await page.evaluate(() => document.activeElement?.textContent?.trim())
  assert.equal(focusedAfterAnswer, 'Pilihanmu')
  const bellAnimationName = await page.locator('.guest-bell').evaluate((bell) => getComputedStyle(bell).animationName)
  assert.equal(bellAnimationName, 'none', 'guest bell must respect reduced motion while feedback is displayed')
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  await page.locator('[data-option-id="a"]').click()
  await page.getByRole('button', { name: 'Lihat hasil' }).click()
  await page.getByText('Rincian nilai dan catatan').click()
  await verifyGeometry(page, 'report-expanded-standard-320')
  const standardScores = await page.locator('details dl').evaluate((list) => ({
    open: list.closest('details')?.open,
    labels: [...list.querySelectorAll('dt')].map((node) => node.textContent?.trim()),
    values: [...list.querySelectorAll('dd')].map((node) => node.textContent?.trim()),
  }))
  assert.equal(standardScores.open, true)
  assert.equal(standardScores.labels.length, 3, '320px report must preserve all three relaxed score labels')
  assert.ok(standardScores.values.every((value) => value.endsWith('/100')), `320px report score values missing: ${JSON.stringify(standardScores)}`)
  await capture(page, 'report-expanded-standard-320', { fullPage: true })
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await verifyGeometry(page, 'report-root-font-200pct-expanded')
  const values = page.locator('details dl dd')
  assert.ok(await values.count() >= 3, 'expanded report must retain all score values')
  for (let index = 0; index < await values.count(); index += 1) {
    const value = values.nth(index)
    await value.scrollIntoViewIfNeeded()
    const visible = await value.evaluate((node) => {
      const range = document.createRange()
      range.selectNodeContents(node)
      return [...range.getClientRects()].some((rect) => rect.bottom > 0 && rect.top < window.innerHeight)
    })
    assert.ok(visible, `report value ${index} was not scrolled into the visible viewport`)
  }
  const rowGeometry = await page.locator('details dl').evaluate((list) => {
    const terms = [...list.querySelectorAll('dt')]
    const values = [...list.querySelectorAll('dd')]
    const textRects = (node) => {
      const range = document.createRange()
      range.selectNodeContents(node)
      return [...range.getClientRects()].map((rect) => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }))
    }
    return terms.map((term, index) => {
      return {
        label: term.textContent,
        value: values[index].textContent,
        labelRects: textRects(term),
        valueRects: textRects(values[index]),
      }
    })
  })
  const width = page.viewportSize().width
  for (const row of rowGeometry) {
    assert.ok(row.labelRects.length > 0 && row.valueRects.length > 0, `report row text bounds missing: ${JSON.stringify(row)}`)
    for (const rect of [...row.labelRects, ...row.valueRects]) {
      assert.ok(rect.left >= -1 && rect.right <= width + 1, `report text extends outside viewport at 200%: ${JSON.stringify({ row, rect })}`)
    }
    for (const labelRect of row.labelRects) {
      for (const valueRect of row.valueRects) {
        const intersects = labelRect.left < valueRect.right - 1 && valueRect.left < labelRect.right - 1 && labelRect.top < valueRect.bottom - 1 && valueRect.top < labelRect.bottom - 1
        assert.equal(intersects, false, `report label/value text overlaps at 200%: ${JSON.stringify({ row, labelRect, valueRect })}`)
      }
    }
  }
  const motion = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    transitionDuration: getComputedStyle(document.querySelector('button')).transitionDuration,
  }))
  assert.equal(motion.scrollBehavior, 'auto')
  assert.ok(Number.parseFloat(motion.transitionDuration) < 0.001, `reduced motion transition remains animated: ${JSON.stringify(motion)}`)
  await capture(page, 'report-200pct-reduced-motion', { fullPage: true })
  await page.close()
  record('report reflow and reduced motion', 'details opened before overflow check; 320px horizontal bound, text-range overlap checks, each value scrolled onscreen and full-page screenshot; auto scrolling and near-zero transition duration')
}

try {
  if (process.env.MOBILE_QA_ONLY_REPORT_REFLOW === '1') {
    await testReportReflowAndReducedMotion()
  } else {
    await testResponsiveComposition()
    await testAllRelaxedPacksAndFeedback()
    await testPromiseA11yAndClampedDelta()
    await testStableOrderAndRapidDuplicate()
    await testChallengePausesAndTimeouts()
    await testLeaveConfirmationAndModeSwitch()
    await test181SecondsAndReplay()
    await testReportReflowAndReducedMotion()
  }
  assert.deepEqual(errors, [], `browser/network errors:\n${errors.join('\n')}`)
  record('browser and network errors', 'no page errors, console errors, failed requests, or HTTP >=400 responses observed')
} finally {
  const report = {
    baseUrl,
    browserVersion,
    viewports,
    checks,
    screenshots,
    errors,
    limitations: [
      'Chromium Playwright emulation is not a physical device, Safari, or screen-reader speech verification.',
      '200% root font-size reflow is a browser layout probe, not a native browser zoom/device test.',
    ],
  }
  await writeFile(join(outputDir, 'mobile-smoke-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  await browser.close()
  console.log(`REPORT ${join(outputDir, 'mobile-smoke-report.json')}`)
}
