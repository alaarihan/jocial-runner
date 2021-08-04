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
  const log = await gqlClient
    .mutation(QUERY, { data: { message, type } })
    .toPromise()
    .then((result) => {
      return result?.data?.createOneLog
    })

  return log
}
