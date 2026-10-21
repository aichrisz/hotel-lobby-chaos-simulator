import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4179/'
const outputDir = process.env.GAMEPLAY_QA_OUTPUT_DIR ?? join(tmpdir(), 'hotel-gameplay-qa')
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
const checks = [], screenshots = [], errors = [], evidence = [], soreBranches = new Set()
await mkdir(outputDir, { recursive: true })
function record(name, detail = '') { checks.push({ name, detail }); console.log(`PASS ${name}${detail ? ` — ${detail}` : ''}`) }
function clockSeconds(clockText) { const [minutes, seconds] = clockText.split(':').map(Number); return minutes * 60 + seconds }
async function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${label}: ${m.text()}`) })
  page.on('requestfailed', (r) => errors.push(`${label}: ${r.url()} ${r.failure()?.errorText ?? ''}`))
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${label}: HTTP ${r.status()} ${r.url()}`) })
}
async function capture(page, name, fullPage = false) { const path = join(outputDir, `${name}.png`); await page.screenshot({ path, fullPage }); screenshots.push(path) }
async function seedPage(page, seed) {
  await page.addInitScript((value) => { Math.random = () => value }, (seed + 0.25) / 0x7fffffff)
}
function episode(seed) { let s = (seed >>> 0) || 0x9e3779b9; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0x100000000 < 0.5 ? 'taxi-urgent' : 'shuttle-urgent' }
function seedFor(want) { let seed = 0; while (episode(seed) !== want) seed += 1; return seed }
async function openShift(page, mode, seed = 13, pacing = 'relaxed') {
  await seedPage(page, seed); await page.goto(baseUrl, { waitUntil: 'networkidle' })
  if (pacing === 'challenge') {
    const challenge = page.getByRole('radio', { name: 'Tantangan waktu' })
    await challenge.check(); assert.equal(await challenge.isChecked(), true, 'challenge pacing must be selected before shift start')
  }
  await page.getByRole('button', { name: /Pilih shift lain/i }).click(); await page.getByRole('button', { name: new RegExp(mode, 'i') }).click()
}
async function layout(page, label) {
  const width = page.viewportSize().width
  const dims = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, body: document.body.scrollWidth,
    buttons: [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length).map((b) => { const r = b.getBoundingClientRect(); return [r.width, r.height] }),
    overflow: [...document.querySelectorAll('body *')].map((node) => { const r = node.getBoundingClientRect(); return { tag: node.tagName, text: node.textContent?.trim().slice(0, 60), left: r.left, right: r.right, width: r.width, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth } }).filter((node) => node.right > window.innerWidth + 1 || node.scrollWidth > node.clientWidth + 1).slice(0, 12) }))
  assert.ok(dims.doc <= width && dims.body <= width, `${label}: horizontal overflow ${JSON.stringify(dims)}`)
  assert.ok(dims.buttons.every(([w, h]) => w >= 44 && h >= 44), `${label}: undersized target ${JSON.stringify(dims.buttons)}`)
}
async function priorityCards(page, label) {
  await page.waitForFunction(() => document.activeElement instanceof HTMLHeadingElement && /Siapa yang kamu layani dulu/.test(document.activeElement.textContent ?? ''))
  const cards = page.locator('[data-priority-guest]'); assert.equal(await cards.count(), 2, `${label}: two guests expected`)
  const boxes = await cards.evaluateAll((nodes) => nodes.map((n) => { const r = n.getBoundingClientRect(); return { text: n.textContent.trim(), top: r.top, bottom: r.bottom, height: r.height, font: getComputedStyle(n.querySelector('[lang="de"]')).fontSize } }))
  const viewHeight = page.viewportSize().height
  for (const b of boxes) { assert.ok(b.height >= 44 && Number.parseFloat(b.font) >= 16, `${label}: target/font ${JSON.stringify(b)}`); assert.ok(b.top >= 0 && b.bottom <= viewHeight, `${label}: first choice not visible ${JSON.stringify(b)}`); assert.ok(b.text.length > 60) }
  const contrast = await page.locator('[data-priority-guest]').evaluateAll((nodes) => {
    const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas 2D context unavailable for contrast measurement')
    const composite = (color, background) => {
      context.clearRect(0, 0, 1, 1); context.fillStyle = `rgb(${background[0]} ${background[1]} ${background[2]})`
      context.fillRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1)
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
    }
    const luminance = (rgb) => rgb.map((value) => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
    return nodes.flatMap((button) => [...button.querySelectorAll('[lang="de"], span:last-child')].map((node) => {
      const ancestors = []; for (let current = node; current; current = current.parentElement) ancestors.unshift(current)
      let bg = [255, 255, 255]
      for (const ancestor of ancestors) bg = composite(getComputedStyle(ancestor).backgroundColor, bg)
      const fg = composite(getComputedStyle(node).color, bg); const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
      return (values[0] + 0.05) / (values[1] + 0.05)
    }))
  })
  assert.ok(contrast.length >= 4 && contrast.every((ratio) => ratio >= 4.5), `${label}: priority text contrast below 4.5:1 ${JSON.stringify(contrast)}`)
  return boxes
}
async function selectGuest(page, guest, keyboard = false) {
  if (keyboard) {
    const buttons = ['taxi', 'family']
    const index = buttons.indexOf(guest)
    for (let step = 0; step <= index; step += 1) await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.dataset.priorityGuest : null)), guest, `${guest} must be reachable in priority tab order`)
    await page.keyboard.press('Enter')
  } else {
    await page.locator(`[data-priority-guest="${guest}"]`).click()
  }
  await page.waitForFunction(() => document.activeElement instanceof HTMLHeadingElement && document.activeElement.lang === 'de')
}
async function playSore(page, variant, first, ending, name, keyboard = false) {
  await openShift(page, 'Spätschicht', seedFor(variant)); const cards = await priorityCards(page, `${name}-queue`)
  const urgent = variant === 'taxi-urgent' ? 'taksi berangkat setelah satu layanan' : 'shuttle keluarga berangkat setelah satu layanan'
  assert.ok(cards.some((c) => c.text.toLowerCase().includes(urgent)), `${name}: deadline missing`)
  const queueText = await page.locator('[data-priority-guest]').allTextContents()
  await capture(page, `${name}-priority`); await selectGuest(page, first, keyboard)
  const openingId = await page.locator('[data-scenario-id]').getAttribute('data-scenario-id')
  assert.equal(openingId, `spaet-${variant}-${first}-opening`)
  await page.locator('[data-option-id="a"]').click(); await capture(page, `${name}-first-feedback`, true)
  assert.equal(await page.getByTestId('episode-consequence').count(), 1, `${name}: committed opening must show the actual waiting guest consequence`)
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Pilihanmu')
  await page.getByRole('button', { name: 'Lanjutkan' }).click()
  const pending = await page.locator('[data-scenario-id]').getAttribute('data-scenario-id')
  const expectedPending = variant === 'taxi-urgent'
    ? first === 'taxi' ? 'spaet-taxi-urgent-family-after-taxi' : 'spaet-taxi-urgent-taxi-pending'
    : first === 'family' ? 'spaet-shuttle-urgent-taxi-pending' : 'spaet-shuttle-urgent-family-pending'
  assert.equal(pending, expectedPending, `${name}: manifest branch must route to the authored guest state`)
  soreBranches.add(openingId); soreBranches.add(pending); soreBranches.add('spaet-reservierung-naechte')
  if (first !== (variant === 'taxi-urgent' ? 'taxi' : 'family')) {
    const pendingText = await page.locator('[data-scenario-id]').textContent()
    assert.match(pendingText, /Das Taxi ist weg|Das Shuttle ist weg/i, `${name}: deferred guest must receive the changed authored problem`)
    assert.match(pendingText, /berangkat/i, `${name}: missed deadline must be visible in Indonesian context`)
  }
  await capture(page, `${name}-changed-problem`)
  await page.locator('[data-option-id="a"]').click(); await page.getByRole('button', { name: 'Lanjutkan' }).click()
  assert.equal(await page.locator('[data-scenario-id]').getAttribute('data-scenario-id'), 'spaet-reservierung-naechte')
  await page.locator('[data-option-id="a"]').click(); assert.equal(await page.getByRole('button', { name: 'Lihat hasil' }).count(), 1)
  assert.equal(await page.getByRole('heading', { name: 'Pelajaran dibawa pulang' }).count(), 0)
  await capture(page, `${name}-last-feedback`); await page.getByRole('button', { name: 'Lihat hasil' }).click()
  assert.equal(await page.getByText('3 dari 3 pertemuan selesai.').count(), 1)
  assert.equal(await page.getByTestId('episode-outcome').getByRole('heading').textContent(), ending)
  await layout(page, `${name}-report`); await capture(page, `${name}-report`, true)
  evidence.push({ run: name, seed: seedFor(variant), variant, first, ids: [openingId, pending, 'spaet-reservierung-naechte'], answerOptionIds: ['a', 'a', 'a'], outcome: ending })
  return queueText
}

async function playChallengeOutcome(variant, first, options, outcome, name) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  await page.clock.install(); await watch(page, name)
  const seed = seedFor(variant)
  await openShift(page, 'Spätschicht', seed, 'challenge')
  await priorityCards(page, `${name}-queue`)
  await page.clock.runFor(20000) // simulated reading at the two-guest priority choice
  await selectGuest(page, first)
  const pathIds = [await page.locator('[data-scenario-id]').getAttribute('data-scenario-id')]
  for (let index = 0; index < options.length; index += 1) {
    await page.clock.runFor(20000) // simulated reading before each committed response
    await page.locator(`[data-option-id="${options[index]}"]`).click()
    if (index < options.length - 1) {
      await page.getByRole('button', { name: 'Lanjutkan' }).click()
      pathIds.push(await page.locator('[data-scenario-id]').getAttribute('data-scenario-id'))
    }
  }
  const remaining = clockSeconds(await page.getByLabel('Sisa waktu tantangan').textContent())
  assert.ok(remaining > 0, `${name}: challenge path exceeded the real 180-second budget`)
  assert.equal(await page.getByRole('button', { name: 'Lihat hasil' }).count(), 1)
  await page.getByRole('button', { name: 'Lihat hasil' }).click()
  assert.equal(await page.getByTestId('episode-outcome').getByRole('heading').textContent(), outcome)
  assert.equal(await page.getByText('3 dari 3 pertemuan selesai.').count(), 1)
  await capture(page, `${name}-challenge-report`, true)
  evidence.push({ run: name, seed, variant, first, ids: pathIds, answerOptionIds: options, remainingChallengeSeconds: remaining, outcome })
  await page.close()
}

async function testDuplicateInteractions() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  await watch(page, 'duplicate priority-answer-continue')
  await openShift(page, 'Spätschicht', seedFor('taxi-urgent'))
  await page.locator('[data-priority-guest="taxi"]').evaluate((button) => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true })); button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  assert.equal(await page.locator('[data-scenario-id]').getAttribute('data-scenario-id'), 'spaet-taxi-urgent-taxi-opening')
  await page.locator('[data-option-id="a"]').evaluate((button) => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true })); button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  assert.equal(await page.getByTestId('episode-consequence').count(), 1)
  await page.getByText('Detail shift', { exact: true }).click()
  assert.equal(await page.getByText('Keputusan dicatat').evaluate((node) => node.nextElementSibling.textContent), '1', 'duplicate answer must score once')
  await page.getByText('Detail shift', { exact: true }).click()
  await page.getByRole('button', { name: 'Lanjutkan' }).evaluate((button) => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true })); button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  assert.equal(await page.locator('[data-scenario-id]').getAttribute('data-scenario-id'), 'spaet-taxi-urgent-family-after-taxi', 'duplicate continue must advance exactly one encounter')
  await page.getByText('Detail shift', { exact: true }).click()
  assert.equal(await page.getByText('Keputusan dicatat').evaluate((node) => node.nextElementSibling.textContent), '1')
  await page.close()
  record('duplicate priority, answer, and continue', 'duplicate DOM click events select once, record one answer, and advance to exactly the authored pending guest')
}

async function testFreshStartCanSelectNewManifest() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  await watch(page, 'fresh-start-manifest')
  const taxiSeed = seedFor('taxi-urgent'), shuttleSeed = seedFor('shuttle-urgent')
  await openShift(page, 'Spätschicht', taxiSeed)
  assert.ok((await page.locator('[data-priority-guest="taxi"]').textContent()).includes('Taksi berangkat setelah satu layanan'))
  await page.getByRole('button', { name: 'Pilih shift' }).click()
  await page.getByRole('dialog', { name: /tinggalkan shift ini/i }).getByRole('button', { name: 'Tinggalkan shift' }).click()
  await page.evaluate((value) => { Math.random = () => value }, (shuttleSeed + 0.25) / 0x7fffffff)
  await page.getByRole('button', { name: /Spätschicht/i }).click()
  assert.ok((await page.locator('[data-priority-guest="family"]').textContent()).includes('Shuttle keluarga berangkat setelah satu layanan'))
  assert.ok((await page.locator('[data-priority-guest="taxi"]').textContent()).includes('Keberangkatan taksi baru besok'))
  evidence.push({ run: 'fresh-start-manifest', initialSeed: taxiSeed, freshSeed: shuttleSeed, observedVariant: 'shuttle-urgent' })
  await page.close()
  record('fresh start may create a new manifest', `normal picker start changed authored variant from taxi-urgent seed ${taxiSeed} to shuttle-urgent seed ${shuttleSeed}; no across-run novelty guarantee asserted`)
}

async function testPriorityReflowAt320() {
  const page = await browser.newPage({ viewport: { width: 320, height: 740 }, deviceScaleFactor: 1, isMobile: true })
  await watch(page, 'priority-200pct-320')
  await openShift(page, 'Spätschicht', seedFor('shuttle-urgent'))
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await capture(page, 'priority-200pct-320-before-layout', true)
  await layout(page, 'priority 200% at 320')
  const buttons = page.locator('[data-priority-guest]')
  assert.equal(await buttons.count(), 2)
  for (let index = 0; index < 2; index += 1) {
    const button = buttons.nth(index)
    const buttonBox = await button.evaluate((node) => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }))
    assert.ok(buttonBox.scrollWidth <= buttonBox.clientWidth + 1, `priority ${index} clips text internally at 200%: ${JSON.stringify(buttonBox)}`)
    const text = button.locator('span')
    for (let line = 0; line < await text.count(); line += 1) {
      const span = text.nth(line); await span.scrollIntoViewIfNeeded()
      const bounds = await span.evaluate((node) => {
        const rect = node.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(node)
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
          textRects: [...range.getClientRects()].map((item) => [item.left, item.right, item.top, item.bottom]) }
      })
      assert.ok(bounds.top >= 0 && bounds.bottom <= page.viewportSize().height, `priority ${index} text block ${line} unreachable at 200%: ${JSON.stringify(bounds)}`)
      assert.ok(bounds.textRects.length > 0 && bounds.textRects.every(([left, right]) => left >= 0 && right <= page.viewportSize().width), `priority ${index} text overflows at 200%: ${JSON.stringify(bounds.textRects)}`)
    }
  }
  await capture(page, 'priority-200pct-320', true)
  await page.close()
  record('priority 200% text reflow at 320×740', 'both guest choices and all card text remain reachable by vertical scrolling with no horizontal overflow or internal clipping')
}

async function runRandomPack(mode, count, seed, label, targetVariantId = null) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  await watch(page, label); await openShift(page, mode, seed)
  const families = [], encounterIds = []
  for (let index = 0; index < count; index += 1) {
    const card = page.locator('[data-scenario-id]')
    const id = await card.getAttribute('data-scenario-id')
    encounterIds.push(id); families.push(await card.getAttribute('data-family-id'))
    if (targetVariantId === id) await capture(page, `${label}-authored-variant`)
    await page.locator('[data-option-id="a"]').click()
    if (index < count - 1) await page.getByRole('button', { name: 'Lanjutkan' }).click()
  }
  assert.equal(new Set(families).size, count, `${label}: duplicate family`)
  assert.equal(new Set(encounterIds).size, count, `${label}: duplicate encounter`)
  assert.equal(await page.getByRole('button', { name: 'Lihat hasil' }).count(), 1)
  await page.getByRole('button', { name: 'Lihat hasil' }).click()
  const completionCount = await page.getByText(new RegExp(`${count} dari ${count} (kartu|pertemuan) selesai`)).count()
  assert.equal(completionCount, 1, `${label}: report completion label not found in ${await page.locator('main[data-screen="report"]').textContent()}`)
  if (targetVariantId && encounterIds.includes(targetVariantId)) {
    await capture(page, `${label}-variant-report`, true)
    evidence.push({ run: label, mode, seed, encounterIds, familyIds: families, variantId: targetVariantId })
  }
  await page.close()
  return { encounterIds, familyIds: families, variantFound: encounterIds.includes(targetVariantId) }
}

async function findRandomVariant(mode, count, firstSeed, targetVariantId, label) {
  for (let offset = 0; offset < 16; offset += 1) {
    const seed = firstSeed + offset
    const result = await runRandomPack(mode, count, seed, `${label}-${seed}`, targetVariantId)
    if (result.variantFound) {
      record(`${label} authored variant via normal random start`, `seed ${seed}; ${targetVariantId}; ${count} distinct families and encounter IDs`)
      return seed
    }
  }
  throw new Error(`${label}: failed to sample authored variant ${targetVariantId} in 16 actual normal starts`)
}

try {
  const page = await browser.newPage({ viewport: { width: 320, height: 740 }, deviceScaleFactor: 1, isMobile: true }); await watch(page, '320 taxi')
  const queue = await playSore(page, 'taxi-urgent', 'taxi', 'Lobi lancar', 'taxi-first-320', true); await page.getByRole('button', { name: 'Coba urutan lain' }).click()
  assert.deepEqual(await page.locator('[data-priority-guest]').allTextContents(), queue)
  await selectGuest(page, 'family', true); await page.getByText('Detail shift', { exact: true }).click()
  assert.equal(await page.getByText('Keputusan dicatat').evaluate((node) => node.nextElementSibling.textContent), '0', 'same-manifest replay must reset decision state')
  await page.getByText('Detail shift', { exact: true }).click(); await page.locator('[data-option-id="a"]').click(); await page.getByRole('button', { name: 'Lanjutkan' }).click()
  assert.equal(await page.locator('[data-scenario-id]').getAttribute('data-scenario-id'), 'spaet-taxi-urgent-taxi-pending')
  await page.close(); record('320×740 priority and same-manifest replay', 'both guests visible; real pending problem changes; replay keeps variant and exposes alternate order')

  for (const [variant, guest, outcome, name] of [
    ['taxi-urgent', 'family', 'Shift dipulihkan', 'taxi-family-first'],
    ['shuttle-urgent', 'family', 'Lobi lancar', 'shuttle-family-first'],
    ['shuttle-urgent', 'taxi', 'Shift dipulihkan', 'shuttle-taxi-first'],
  ]) {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true }); await watch(p, name)
    await playSore(p, variant, guest, outcome, name); await p.close(); record(name, `${variant}, ${guest} first -> ${outcome}`)
  }
  assert.equal(soreBranches.size, 9, `all nine reachable authored Spätschicht branch nodes should be exercised: ${[...soreBranches]}`)
  record('Spätschicht authored branch coverage', [...soreBranches].sort().join(', '))

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } }); await watch(desktop, 'desktop')
  await openShift(desktop, 'Spätschicht', seedFor('shuttle-urgent')); await priorityCards(desktop, 'desktop queue')
  await desktop.evaluate(() => { document.documentElement.style.fontSize = '200%' }); await layout(desktop, 'priority 200% desktop'); await capture(desktop, 'priority-200pct-desktop', true)
  await desktop.close(); record('desktop and 200% reflow', 'no horizontal clipping; all choices remain reachable')
  await testPriorityReflowAt320()

  for (const [variant, first, options, outcome, name] of [
    ['taxi-urgent', 'taxi', ['a', 'a', 'a'], 'Lobi lancar', 'challenge-taxi-smooth'],
    ['taxi-urgent', 'family', ['a', 'a', 'a'], 'Shift dipulihkan', 'challenge-taxi-recovered'],
    ['taxi-urgent', 'taxi', ['c', 'a', 'b'], 'Ada urusan terbuka', 'challenge-taxi-open'],
    ['shuttle-urgent', 'family', ['a', 'a', 'a'], 'Lobi lancar', 'challenge-shuttle-smooth'],
    ['shuttle-urgent', 'taxi', ['a', 'a', 'a'], 'Shift dipulihkan', 'challenge-shuttle-recovered'],
  ]) await playChallengeOutcome(variant, first, options, outcome, name)
  record('challenge reachability under real elapsed-time and response-cost budget', 'both variants reach smooth and recovery; authored open outcome reachable; each path includes 20s queue reading plus 20s per response')

  const open = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true }); await watch(open, 'open ending')
  await openShift(open, 'Spätschicht', seedFor('taxi-urgent')); await selectGuest(open, 'taxi')
  await open.locator('[data-option-id="c"]').click(); await open.getByRole('button', { name: 'Lanjutkan' }).click()
  await open.locator('[data-option-id="a"]').click(); await open.getByRole('button', { name: 'Lanjutkan' }).click()
  await open.locator('[data-option-id="b"]').click(); await open.getByRole('button', { name: 'Lihat hasil' }).click()
  assert.equal(await open.getByTestId('episode-outcome').getByRole('heading').textContent(), 'Ada urusan terbuka')
  await capture(open, 'spaet-open-ending', true); await open.close(); record('actual open-errand result', 'unsupported response and unchecked reservation produce factual open outcome')
  evidence.push({ run: 'relaxed-open-ending', seed: seedFor('taxi-urgent'), variant: 'taxi-urgent', first: 'taxi', ids: ['spaet-taxi-urgent-taxi-opening', 'spaet-taxi-urgent-family-after-taxi', 'spaet-reservierung-naechte'], answerOptionIds: ['c', 'a', 'b'], outcome: 'Ada urusan terbuka' })
  await testFreshStartCanSelectNewManifest()
  await testDuplicateInteractions()

  const surprise = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true }); await watch(surprise, 'surprise five')
  await openShift(surprise, 'Shift kejutan', 41); const surpriseFamilies = [], surpriseIds = []
  for (let i = 0; i < 5; i += 1) {
    const card = surprise.locator('[data-scenario-id]'); surpriseFamilies.push(await card.getAttribute('data-family-id')); surpriseIds.push(await card.getAttribute('data-scenario-id'))
    await surprise.locator('[data-option-id="a"]').click(); if (i < 4) await surprise.getByRole('button', { name: 'Lanjutkan' }).click()
  }
  assert.equal(new Set(surpriseFamilies).size, 5); assert.equal(new Set(surpriseIds).size, 5)
  await surprise.getByRole('button', { name: 'Lihat hasil' }).click(); assert.equal(await surprise.getByText('5 dari 5 kartu selesai.').count(), 1)
  evidence.push({ run: 'surprise-five', mode: 'surprise', seed: 41, encounterIds: surpriseIds, familyIds: surpriseFamilies })
  await capture(surprise, 'surprise-five-report', true); await surprise.close(); record('surprise shift', 'exactly five distinct morning families and encounter IDs, all played')

  const morning = await runRandomPack('Shift pagi', 12, 7, 'morning-random')
  evidence.push({ run: 'morning-random', mode: 'frueh', seed: 7, ...morning })
  record('Shift pagi random queue', `12 distinct families without replacement; ${morning.encounterIds.join(', ')}`)
  const night = await runRandomPack('Shift malam', 4, 31, 'night-random')
  evidence.push({ run: 'night-random', mode: 'nacht', seed: 31, ...night })
  record('Shift malam random queue', `4 distinct families without replacement; ${night.encounterIds.join(', ')}`)
  await findRandomVariant('Shift pagi', 12, 100, 'firmenrechnung-split-fehlende-daten', 'morning')
  await findRandomVariant('Shift malam', 4, 200, 'nacht-fruehes-taxi-abholort', 'night')

  const timed = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true }); await timed.clock.install(); await watch(timed, 'priority challenge')
  await openShift(timed, 'Spätschicht', seedFor('taxi-urgent'), 'challenge'); const beforeReading = await timed.getByLabel('Sisa waktu tantangan').textContent(); await timed.clock.runFor(2000)
  const afterReading = await timed.getByLabel('Sisa waktu tantangan').textContent(); assert.equal(clockSeconds(afterReading), clockSeconds(beforeReading) - 2)
  const before = afterReading
  await selectGuest(timed, 'taxi'); assert.equal(await timed.getByLabel('Sisa waktu tantangan').textContent(), before, 'priority click charged extra action cost')
  await timed.getByRole('button', { name: 'Pilih shift' }).click()
  await timed.getByRole('dialog').waitFor({ state: 'visible' })
  const pausedTime = await timed.getByLabel('Sisa waktu tantangan').textContent()
  await timed.clock.runFor(5000)
  assert.equal(await timed.getByLabel('Sisa waktu tantangan').textContent(), pausedTime)
  await timed.getByRole('button', { name: 'Tetap bermain' }).click()
  assert.equal(await timed.locator('[data-scenario-id]').getAttribute('data-scenario-id'), 'spaet-taxi-urgent-taxi-opening')
  assert.match(await timed.locator('[data-scenario-id]').textContent(), /Tamu yang menunggu: orang tua dan anak/)
  await timed.close()
  record('challenge priority and cancel', 'queue timer runs, selection has no action cost, leave pauses, cancel retains the selected path')

  const timeout = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true }); await timeout.clock.install(); await watch(timeout, 'queue timeout')
  await openShift(timeout, 'Spätschicht', seedFor('taxi-urgent'), 'challenge'); await timeout.clock.runFor(180000)
  assert.equal(await timeout.getByText('Waktu tantangan habis setelah 0 keputusan.').count(), 1); assert.equal(await timeout.getByRole('heading', { name: 'Pilihanmu' }).count(), 0)
  assert.equal(await timeout.getByTestId('episode-outcome').getByRole('heading').textContent(), 'Waktu tantangan habis')
  assert.equal(await timeout.getByTestId('episode-outcome').getByText('Belum ada layanan yang dikomit saat waktu habis.').count(), 1)
  await timeout.close(); record('queue timeout', 'zero decisions; no fabricated guest service or feedback')

  const actionTimeout = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true }); await actionTimeout.clock.install(); await watch(actionTimeout, 'answer timeout')
  await openShift(actionTimeout, 'Spätschicht', seedFor('taxi-urgent'), 'challenge'); await actionTimeout.clock.runFor(177000)
  await selectGuest(actionTimeout, 'taxi'); await actionTimeout.locator('[data-option-id="a"]').click(); assert.equal(await actionTimeout.getByRole('button', { name: 'Lihat hasil' }).count(), 1)
  assert.equal(await actionTimeout.getByTestId('episode-consequence').count(), 1, 'answer-cost timeout must preserve the committed response feedback')
  await actionTimeout.getByRole('button', { name: 'Lihat hasil' }).click(); assert.equal(await actionTimeout.getByText('Waktu tantangan habis setelah 1 keputusan.').count(), 1)
  assert.equal(await actionTimeout.getByTestId('episode-outcome').getByRole('heading').textContent(), 'Waktu tantangan habis')
  assert.match(await actionTimeout.getByTestId('episode-outcome').textContent(), /Faktur yang sudah diperiksa dikirim/)
  await actionTimeout.close(); record('answer-cost timeout', 'committed answer feedback precedes factual timeout report; other guests remain unserved')

  const reduced = await browser.newPage({ viewport: { width: 320, height: 740 }, isMobile: true, reducedMotion: 'reduce' }); await watch(reduced, 'reduced motion')
  await openShift(reduced, 'Spätschicht', seedFor('taxi-urgent')); await priorityCards(reduced, 'reduced queue'); await selectGuest(reduced, 'taxi'); await reduced.locator('[data-option-id="a"]').click()
  assert.equal(await reduced.locator('.guest-bell').evaluate((node) => getComputedStyle(node).animationName), 'none'); await capture(reduced, 'reduced-motion-feedback'); await layout(reduced, 'reduced feedback')
  await reduced.close(); record('reduced motion and focus', 'phase headings focused, bell animation disabled, controls meet size at 320px')

  assert.equal(soreBranches.size, 9, 'final report must include all nine exercised Spätschicht nodes')
  assert.deepEqual(errors, []); record('browser and network errors', 'no page errors, console errors, failed requests, or HTTP errors')
} finally {
  const evidenceReport = {
    baseUrl,
    browserVersion: browser.version(),
    authoredContentCounts: {
      independentFamilies: { morning: 12, night: 4, total: 16 },
      authoredIndependentScenarioRecordsIncludingTwoReplacementVariants: 18,
      authoredAdditionalIndependentVariants: 2,
      spaetUrgencyVariants: 2,
      spaetReachableAuthoredNodesObserved: [...soreBranches].sort(),
      scheduledSpaetEncountersPerRun: 3,
      surpriseDistinctMorningFamiliesPerRun: 5,
    },
    evidence,
  }
  await writeFile(join(outputDir, 'gameplay-smoke-evidence.json'), JSON.stringify(evidenceReport, null, 2))
  await writeFile(join(outputDir, 'gameplay-smoke-report.json'), `${JSON.stringify({ baseUrl, browserVersion: browser.version(), checks, screenshots, errors, limitations: ['Playwright Chromium does not replace physical-device or screen-reader testing.'] }, null, 2)}\n`)
  await browser.close(); console.log(`REPORT ${join(outputDir, 'gameplay-smoke-report.json')}`)
}
