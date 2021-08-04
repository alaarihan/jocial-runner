import NodeCache from 'node-cache'
import puppeteer from 'puppeteer'

export const cacheStore = new NodeCache({ useClones: false })

export async function getBrowser(): Promise<puppeteer.Browser> {
  if (cacheStore.get('browser') === undefined) {
    const browser = await puppeteer.launch({
      headless: process.env.HEADLESS === 'yes' ? true : false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-features=site-per-process'],
    })

    browser.on('disconnected', () => {
      cacheStore.flushAll()
    })

    cacheStore.set('browser', browser)
  }

  return cacheStore.get('browser')
}
