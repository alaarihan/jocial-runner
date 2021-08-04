import fastify from 'fastify'
import { runSurfing } from './tasks/surfing'
import { cacheStore } from './utils/cacheStore'

export const app = fastify()

app.register(require('fastify-cors'), {
  origin: true,
  credentials: true,
})
app.register(require('fastify-cookie'))

app.get('/run/surfing', async (req, reply) => {
  if (req.query['secret'] !== process.env.APP_SECRET) {
    return reply.status(403).send('Unauthorized!')
  }
  if (req.query['owner']) {
    cacheStore.set('owner', parseInt(req.query['owner']))
  }
  runSurfing()
  return reply.status(200).send('Running website surfing.')
})

app
  .listen(3001)
  .then(() => console.log(`🚀 Runner ready at http://localhost:3001`))
  .catch((err) => {
    console.log(err)
  })
