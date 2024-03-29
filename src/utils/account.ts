import { cacheStore } from './cacheStore'
import { gqlClient } from './gqlClient'

export async function getAccount(
  variables = {
    orderBy: { lastActivity: 'desc' },
    where: {
      status: { equals: 'OFFLINE' },
      loginActivity: { notIn: ['ONLINE'] },
    } as any,
  },
) {
  const QUERY = `
  query getAccount($orderBy: [AccountOrderByWithRelationInput], $where: AccountWhereInput) {
    findFirstAccount(orderBy: $orderBy, where: $where) {
      id
      name
      username
      password
      pin
      lastActivity
      status
      statusDuration
      loginActivity
    }
  }
`
  if (cacheStore.get('owner')) {
    variables.where.ownerId = { equals: cacheStore.get('owner') }
  }
  const account = await gqlClient
    .query(QUERY, variables)
    .toPromise()
    .then((result) => {
      return result?.data?.findFirstAccount
    })

  cacheStore.set('account', account)

  return account
}

export async function getAccounts(
  variables = { orderBy: { lastActivity: 'asc' } },
) {
  const QUERY = `
  query getAccount($orderBy: [AccountOrderByWithRelationInput], $where: AccountWhereInput) {
    findManyAccount(orderBy: $orderBy, where: $where) {
      id
      name
      username
      password
      pin
      lastActivity
      status
      statusDuration
      loginActivity
    }
  }
`
  const accounts = await gqlClient
    .query(QUERY, variables)
    .toPromise()
    .then((result) => {
      return result?.data?.findManyAccount
    })

  return accounts
}

export async function updateAccount(variables) {
  const QUERY = `
  mutation updateAccount($data: AccountUpdateInput!, $where: AccountWhereUniqueInput!) {
    updateOneAccount(data: $data, where: $where) {
      id
      name
      username
      password
      pin
      lastActivity
      status
      statusDuration
      loginActivity
    }
  }
`
  const account = await gqlClient
    .mutation(QUERY, variables)
    .toPromise()
    .then((result) => {
      return result?.data?.updateOneAccount
    })

  return account
}
