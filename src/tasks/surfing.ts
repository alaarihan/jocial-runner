import { Browser, Page } from 'puppeteer'
import { cacheStore, getBrowser } from '../utils/cacheStore'
import { getAccount, updateAccount } from '../utils/account'
import { createLog } from '../utils/createLog'
import { updateInactiveAccountsStatus } from '../utils/updateInactiveAccountsStatus'
import { minutesUntilMidnight, wakeupCall } from '../utils/utils'
import { runLoginActivity } from './loginActivity'

export async function runSurfing(account = null) {
  createLog('Starting website surfing')
  try {
    await updateInactiveAccountsStatus()
    const browser = await getBrowser().catch((err) => {
      createLog(err.message)
    })
    if (!browser) return
    if (!account) {
      account = await getAccount()
      if (!account) {
        await browser.close()
        createLog('No offline accounts found!')
        runLoginActivity()
        return
      }
    }
    createLog(`Update account "${account.name}" status to Online`)
    updateAccount({
      data: { status: 'ONLINE', statusDuration: 3, lastActivity: new Date() },
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
        await browser.close()
        return
      })
    await page.waitForTimeout(2000)
    createLog(`Logging in account "${account.name}"`)
    await page.waitForSelector('input[type=text]')
    await page.type('input[type=text]', account.username)
    await page.keyboard.down('Tab')
    await page.keyboard.type(account.password)
    await page.click('#btnlogin')
    await page.waitForSelector('a[href="/Account/Home"]', { visible: true })
    createLog('Going to surf websites')
    await page.click('a[href="/Account/Home"]')
    /* await page
      .waitForSelector('#welcomemsgbtn1', { visible: true, timeout: 10000 })
      .then(async () => {
        await page.click('#welcomemsgbtn1')
      })
      .catch((err) => {
        console.log('welcomemsgbtn1 not found!')
      }) */

    await page.waitForTimeout(2000)
    await page.click('a[href="/Account/RewardProgram/Dashboard"] .balAvaiRp')
    await page.waitForSelector(
      'a[href="/Account/RewardProgram/Promotional/"]',
      {
        visible: true,
      },
    )
    await page.click('a[href="/Account/RewardProgram/Promotional/"]')
    await page.waitForSelector(
      'a[href="/Account/RewardProgram/Promotional/WebSurf"]',
      { visible: true, timeout: 10000 },
    )
    await page.click('a[href="/Account/RewardProgram/Promotional/WebSurf"]')
    await page.waitForTimeout(1000)
    const pages = await browser.pages()
    const surfingPage = pages[pages.length - 1]
    await surfingPage.waitForSelector('h1 d')
    await page.waitForTimeout(4000)
    await surfingLoop(surfingPage)
    createLog(`Finished surfing websites for account ${account.name}`)
    await browser.close()
    runSurfing()
  } catch (err) {
    const browser = cacheStore.get('browser') as Browser
    if (browser?.isConnected()) {
      await browser.close()
    }
    await updateAccount({
      data: { status: 'OFFLINE' },
      where: { id: account.id },
    })
    throw err
  }
}

async function surfingLoop(page: Page, loop = 1) {
  const account = cacheStore.get('account') as any
  const progress = await page.evaluate(
    () => document.querySelector('h1 d').innerHTML,
  )
  createLog(`Current Points ${progress}`)
  createLog(`Surfing a website #${loop}`)
  if (loop > 40 || parseInt(progress) >= 10) {
    await updateAccount({
      data: {
        status: 'DONE',
        statusDuration: minutesUntilMidnight(),
        lastActivity: new Date(),
      },
      where: { id: account.id },
    })
    return
  }
  await page
    .waitForSelector('#rating', { visible: true, timeout: 150000 })
    .catch(async (err) => {
      createLog('Click skip button because the rating element has not show up')
      await page.click('#Skip')
      await page.waitForTimeout(1000)
      updateAccount({
        data: { lastActivity: new Date() },
        where: { id: account.id },
      })
      wakeupCall()
      await page.waitForSelector('#rating', { visible: true, timeout: 150000 })
    })
  await page.click('li[data-value="5"]')
  await page.waitForTimeout(1000)
  await page.click('#NextSite')
  await page.waitForTimeout(5000)
  loop++
  updateAccount({
    data: { lastActivity: new Date() },
    where: { id: account.id },
  })
  wakeupCall()
  await surfingLoop(page, loop)
}
