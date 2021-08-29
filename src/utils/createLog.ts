import { cacheStore } from './cacheStore'
import { gqlClient } from './gqlClient'

export async function createLog(message, type = 'INFO') {
  console.log(message)
  const QUERY = `
  mutation createOneLog($data: LogCreateInput!) {
    createOneLog(data: $data) {
      id
      message
      type
    }
  }
`
  const account = cacheStore.get('account') as Record<string, any>
  const data = { message, type } as any
  if (account?.id) {
    data.account = {
      connect: {
        id: account.id,
      },
    }
  }
  const log = await gqlClient
    .mutation(QUERY, { data })
    .toPromise()
    .then((result) => {
      return result?.data?.createOneLog
    })

  return log
}
