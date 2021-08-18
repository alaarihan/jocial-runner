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
      width: 1300,
      height: 900,
      deviceScaleFactor: 1,
    })
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.0 Safari/537.36',
    )
    await page.evaluateOnNewDocument(() => {
      if (navigator.webdriver === false) {
        // Post Chrome 89.0.4339.0 and already good
      } else if (navigator.webdriver === undefined) {
        // Pre Chrome 89.0.4339.0 and already good
      } else {
        // Pre Chrome 88.0.4291.0 and needs patching
        delete Object.getPrototypeOf(navigator).webdriver
      }
    })
    await page.goto('https://bot.sannysoft.com/')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `browser.png` })
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
