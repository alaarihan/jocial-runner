import { getAccounts, updateAccount } from './account'

export async function updateInactiveAccountsStatus() {
  const variables = {
    orderBy: { lastActivity: 'asc' },
    where: {
      statusDuration: { gt: 0 },
    },
  }

  const accounts = await getAccounts(variables)
  if (accounts) {
    for (var i = 0, len = accounts.length; i < len; i++) {
      let statusTime = new Date()
      statusTime.setMinutes(
        statusTime.getMinutes() - accounts[i].statusDuration,
      )
      let accountLastActivity = new Date(accounts[i].lastActivity)
      if (accountLastActivity < statusTime) {
        await updateAccount({
          data: {
            status: 'OFFLINE',
            statusDuration: 0,
            loginActivity: 'OFFLINE',
          },
          where: { id: accounts[i].id },
        })
      }
    }
  }
}

export async function updateInactiveAccountsLoginActivity() {
  const activityDelay = new Date()
  activityDelay.setMinutes(activityDelay.getMinutes() - 10)
  const variables = {
    orderBy: { lastActivity: 'asc' },
    where: {
      loginActivity: { equals: 'ONLINE' },
      lastActivity: { lt: activityDelay },
    },
  }

  const accounts = await getAccounts(variables)
  if (accounts) {
    for (var i = 0, len = accounts.length; i < len; i++) {
      await updateAccount({
        data: {
          loginActivity: 'OFFLINE',
        },
        where: { id: accounts[i].id },
      })
    }
  }
}
