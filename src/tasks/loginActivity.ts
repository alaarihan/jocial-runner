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
    await page.waitForSelector('a[href="/Account/Home"]', { visible: true })
    createLog('Going to dashboard page')
    await page.click('a[href="/Account/Home"]')
    /*  await page
      .waitForSelector('#welcomemsgbtn1', { visible: true, timeout: 10000 })
      .then(async () => {
        await page.click('#welcomemsgbtn1')
      })
      .catch((err) => {
        console.log('welcomemsgbtn1 not found!')
      }) */

    await page.waitForTimeout(2000)

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
  const account = cacheStore.get('account') as any
  await page.waitForTimeout(120000)
  if (loop > 63) {
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
