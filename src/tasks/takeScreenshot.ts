import { Browser, Page } from 'puppeteer'
import { cacheStore } from '../utils/cacheStore'
import { createLog } from '../utils/createLog'

export async function takeScreenshot() {
  const browser = cacheStore.get('browser') as Browser
  if(browser?.isConnected()){
    const pages = await browser.pages()
    const page = pages[pages.length - 1] as Page
    createLog('Take a screenshot')
    await page.screenshot({path: `./public/screenshot-${new Date().toString()}.png`}).catch(err => {
      throw err
    })
  }else{
    createLog('Taking a screenshot has been failed because a connected browser has not been found!')
  }
}
