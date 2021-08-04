import { Page } from 'puppeteer'
import { cacheStore, getBrowser } from '../utils/cacheStore'
import { getAccount, updateAccount } from '../utils/account'
import { createLog } from '../utils/createLog'
import { updateInactiveAccountsStatus } from '../utils/updateInactiveAccountsStatus'
import { minutesUntilMidnight } from '../utils/utils'

export async function runSurfing(account = null) {
  await updateInactiveAccountsStatus()
  if (!account) {
    account = await getAccount()
    if (!account) {
      createLog('No offline accounts found!')
      return
    }
  }
  const browser = await getBrowser()
  createLog('Update account status to Online')
  updateAccount({
    data: { status: 'ONLINE', statusDuration: 6, lastActivity: new Date() },
    where: { id: account.id },
  })
  const page = await browser.newPage()
  await page.goto('https://www.asia-region.jocial.com/')
  await page.waitForSelector('iframe[title="reCAPTCHA"').catch(async (err) => {
    await browser.close()
    runSurfing(account)
    return
  })
  await page.waitForTimeout(2000)
  createLog('Logging in')
  await page.waitForSelector('input[type=text]')
  await page.type('input[type=text]', account.username)
  await page.keyboard.down('Tab')
  await page.keyboard.type(account.password)
  await page.click('#btnlogin')
  await page.waitForSelector('a[href="/Account/Home"]')
  createLog('Going to surf websites')
  await page.click('a[href="/Account/Home"]')
  await page.waitForSelector('#welcomemsgbtn1')
  await page.click('#welcomemsgbtn1')
  await page.waitForTimeout(2000)
  await page.click('a[href="/Account/RewardProgram/Dashboard"] .balAvaiRp')
  await page.waitForSelector('a[href="/Account/RewardProgram/Promotional/"]')
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
  createLog('Finished surfing websites')
  await browser.close()
}

async function surfingLoop(page: Page, loop = 1) {
  const account = cacheStore.get('account') as any
  createLog(`Surfing a website #${loop}`)
  const progress = await page.evaluate(
    () => document.querySelector('h1 d').innerHTML,
  )

  createLog(`Current Points ${progress}`)
  if (loop > 40 || parseInt(progress) >= 10) {
    await updateAccount({
      data: { status: 'DONE', statusDuration: minutesUntilMidnight() },
      where: { id: account.id },
    })
    return
  }
  await page
    .waitForSelector('#rating', { visible: true, timeout: 200000 })
    .catch(async (err) => {
      await page.goto(
        'https://www.asia-region.jocial.com/Account/RewardProgram/Promotional/WebSurf',
      )
      await surfingLoop(page, loop)
      return
    })
  await page.click('li[data-value="5"]')
  await page.waitForTimeout(1000)
  await page.click('#NextSite')
  await page.waitForTimeout(3000)
  loop++
  createLog('Update last activity')
  updateAccount({
    data: { lastActivity: new Date() },
    where: { id: account.id },
  })
  await surfingLoop(page, loop)
}
