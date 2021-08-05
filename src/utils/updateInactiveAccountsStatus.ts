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
          },
          where: { id: accounts[i].id },
        })
      }
    }
  }
}
