import { Browser, Page } from 'puppeteer'
import { cacheStore, getBrowser } from '../utils/cacheStore'
import { getAccount, updateAccount } from '../utils/account'
import { createLog } from '../utils/createLog'
import {
  updateInactiveAccountsLoginActivity,
  updateInactiveAccountsStatus,
} from '../utils/updateInactiveAccountsStatus'
import { minutesUntilMidnight, wakeupCall } from '../utils/utils'

export async function runLoginActivity(account = null) {
  createLog('Starting login activity')
  try {
    await updateInactiveAccountsStatus()
    await updateInactiveAccountsLoginActivity()
    const browser = await getBrowser().catch((err) => {
      createLog(err.message)
    })
    if (!browser) return
    if (!account) {
      account = await getAccount({
        orderBy: { lastActivity: 'desc' },
        where: {
          status: { equals: 'DONE' },
          loginActivity: { equals: 'OFFLINE' },
        } as any,
      })
      if (!account) {
        await browser.close()
        createLog(
          'Not found account with DONE status and loginActivity OFFLINE status',
        )
        return
      }
    }
    createLog(`Update account "${account.name}" loginActivity status to Online`)
    updateAccount({
      data: { loginActivity: 'ONLINE', lastActivity: new Date() },
      where: { id: account.id },
    })
    const page = await browser.newPage()
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
    })
    await page.goto('https://www.asia-region.jocial.com/')
    await page
      .waitForSelector('iframe[title="reCAPTCHA"')
      .catch(async (err) => {
        createLog('The login page did not load properly, closing the browser')
        throw err
      })
    await page.waitForTimeout(2000)
    createLog(`Logging in account "${account.name}"`)
    await page.waitForSelector('input[type=text]')
    await page.type('input[type=text]', account.username)
    await page.keyboard.down('Tab')
    await page.keyboard.type(account.password)
    await page.click('#btnlogin')
    await page.waitForTimeout(5000)
    if (page.url() === 'https://www.asia-region.jocial.com/') {
      await page.waitForTimeout(15000)
    }
    if (page.url() === 'https://www.asia-region.jocial.com/Account/With-Jocial') {
      await page.waitForSelector('a[href="/Account/Preview"]', { visible: true })
      await page.click('a[href="/Account/Preview"]')
    }
    await page.waitForSelector('a[href="/Account/Home"]', { visible: true })
    createLog('Going to dashboard page')
    await page.click('a[href="/Account/Home"]')
    /* Temporary modals closing */
    await page
      .waitForSelector('#welcomemsgbtn4', { visible: true, timeout: 5000 })
      .then(async () => {
        await page.click('#welcomemsgbtn4')
      })
      .catch((err) => { })
    await page.waitForTimeout(1000)
    await page
      .waitForSelector('#welcomemsgbtn1', { visible: true, timeout: 5000 })
      .then(async () => {
        await page.click('#welcomemsgbtn1')
      })
      .catch((err) => { })
    await page.waitForTimeout(2000)
    /* End closing */

    await loginActivityCheck(page)
    createLog(`Finished login activity for account ${account.name}`)
    await browser.close()
    runLoginActivity()
  } catch (err) {
    const browser = cacheStore.get('browser') as Browser
    if (browser?.isConnected()) {
      await browser.close()
    }
    await updateAccount({
      data: { loginActivity: 'OFFLINE' },
      where: { id: account.id },
    })
    throw err
  }
}

async function loginActivityCheck(page: Page, loop = 1) {
  const account = cacheStore.get('account') as Record<string, any>
  const browser = cacheStore.get('browser') as Browser
  if (!browser?.isConnected()) {
    await updateAccount({
      data: { loginActivity: 'OFFLINE' },
      where: { id: account.id },
    })
    throw new Error('The browser is not connected!, aborting..')
  }
  await page.waitForTimeout(120000)
  if (loop > 50) {
    createLog(`Logging account ${account.name} out`)
    await page.click('.uesrName')
    await page.waitForTimeout(1000)
    await page.click('a[href="/Account/Logout"]')
    await page.waitForTimeout(7000)
    await updateAccount({
      data: {
        loginActivity: 'DONE',
        statusDuration: minutesUntilMidnight(),
        lastActivity: new Date(),
      },
      where: { id: account.id },
    })
    wakeupCall()
    return
  }
  updateAccount({
    data: { lastActivity: new Date() },
    where: { id: account.id },
  })

  createLog(
    `Login activity progress for account ${account.name}: ${loop * 2} minutes`,
  )
  loop++
  wakeupCall()
  await loginActivityCheck(page, loop)
}
