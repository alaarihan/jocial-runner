import { Browser, Page } from 'puppeteer'
import { cacheStore, getBrowser } from './utils/cacheStore'

export async function testBrowser(account = null) {
  try {
    const browser = await getBrowser().catch((err) => {
      console.log(err.message)
    })
    if (!browser) return
    const page = await browser.newPage()
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
    })
    await page.goto(
      'https://antoinevastel.com/bots/',
    )
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `browser.png`, fullPage: true })
    await browser.close()
  } catch (err) {
    const browser = cacheStore.get('browser') as Browser
    if (browser?.isConnected()) {
      await browser.close()
    }
    throw err
  }
}

testBrowser()
