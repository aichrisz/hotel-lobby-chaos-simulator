import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const url = 'http://127.0.0.1:5173/'
const out = '/root/front-office-rpg-shots'
await fs.mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const viewports = [
  ['mobile', { width: 390, height: 844 }],
  ['tablet', { width: 820, height: 1180 }],
  ['desktop', { width: 1440, height: 1000 }],
]
for (const [name, viewport] of viewports) {
  const page = await browser.newPage({ viewport })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true })
  const markers = await page.evaluate(() => ({
    title: document.body.innerText.includes('Hotel Quest'),
    start: document.body.innerText.includes('Start Training'),
    board: document.body.innerText.includes('Quest Board'),
    rpg: document.body.innerText.includes('German Front Office RPG Simulator'),
    width: window.innerWidth,
  }))
  console.log(name, JSON.stringify(markers))
  await page.close()
}
await browser.close()
