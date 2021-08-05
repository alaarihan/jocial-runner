import NodeCache from 'node-cache'
import puppeteer, { Browser } from 'puppeteer'

export const cacheStore = new NodeCache({ useClones: false })

export async function getBrowser(
  getNew: boolean = true,
): Promise<puppeteer.Browser> {
  if (cacheStore.get('browser') === undefined) {
    const browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'no' ? true : false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-features=site-per-process'],
    })

    browser.on('disconnected', () => {
      cacheStore.del('browser')
    })

    cacheStore.set('browser', browser)
  } else {
    const browser = cacheStore.get('browser') as Browser
    if (!browser.isConnected()) {
      cacheStore.del('browser')
      return await getBrowser()
    } else if (getNew) {
      throw new Error('There is a woking browser already!')
    }
  }

  return cacheStore.get('browser')
}
