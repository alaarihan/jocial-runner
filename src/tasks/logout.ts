import { Browser, Page } from 'puppeteer'
import { cacheStore } from '../utils/cacheStore'
import { createLog } from '../utils/createLog'

export async function accountLogout() {
    const account = cacheStore.get('account') as Record<string, any>
    const browser = cacheStore.get('browser') as Browser
    if (browser?.isConnected()) {
        const pages = await browser.pages()
        const page = pages[pages.length - 1] as Page
        createLog(`Logging account ${account.name} out`)
        await page.click('.uesrName')
        await page.waitForTimeout(1000)
        await page.click('a[href="/Account/Logout"]')
        await page.waitForTimeout(7000)
        await browser.close()
    } else {
        createLog(
            'Logging out has been failed because a connected browser has not been found!',
        )
    }
}
