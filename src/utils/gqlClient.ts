import { createClient } from '@urql/core'
global.fetch = require("node-fetch");
export const gqlClient = createClient({
  url: `${process.env.API_URL}/graphql`,
  fetchOptions: () => {
    return {
      headers: { 'root-secret': process.env.API_ROOT_SECRET },
    }
  },
})
