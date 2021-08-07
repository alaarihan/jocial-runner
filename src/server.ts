import fastify from 'fastify'
import Handlebars from 'handlebars'
import path from 'path'
import { runLoginActivity } from './tasks/loginActivity'
import { runSurfing } from './tasks/surfing'
import { takeScreenshot } from './tasks/takeScreenshot'
import { cacheStore } from './utils/cacheStore'

export const app = fastify()

app.register(require('fastify-cors'), {
  origin: true,
  credentials: true,
})
app.register(require('fastify-cookie'))

// Handlebar template for listing files and directories.
const template = `
<html>
  <body>
  {{#if dirs}}
    dirs
  <ul>
    {{#dirs}}
      <li><a href="/public{{href}}">{{name}}</a></li>
    {{/dirs}}
  </ul>
  {{/if}}
  {{#if files}}
  files
  <ul>
    {{#files}}
      <li><a href="/public{{href}}" target="_blank">{{name}}</a></li>
    {{/files}}
  </ul>
  {{/if}}
  </body>
</html>
`
const handlebarTemplate = Handlebars.compile(template)
app.register(require('fastify-static'), {
    // An absolute path containing static files to serve.
    root: path.join(__dirname, '../public'),
    prefix: '/public/',
    prefixAvoidTrailingSlash: true,
    // Return a directory listing with a handlebar template.
    list: {
      // html or json response? html requires a render method.
      format: 'html',
      // A list of filenames that trigger a directory list response.
      names: ['index', 'index.html', 'index.htm', '/'],
      // You can provide your own render method as needed.
      render: (dirs, files) => handlebarTemplate({ dirs, files })
    }
  })


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

app.get('/run/loginActivity', async (req, reply) => {
    if (req.query['secret'] !== process.env.APP_SECRET) {
      return reply.status(403).send('Unauthorized!')
    }
    if (req.query['owner']) {
      cacheStore.set('owner', parseInt(req.query['owner']))
    }
    runLoginActivity()
    return reply.status(200).send('Running login activity.')
  })

app.get('/run/screenshot', async (req, reply) => {
  if (req.query['secret'] !== process.env.APP_SECRET) {
    return reply.status(403).send('Unauthorized!')
  }
  takeScreenshot()
  return reply.status(200).send('Taking a screenshot.')
})

app
  .listen(process.env.PORT || 3001)
  .then(() => console.log(`🚀 Runner ready at http://localhost:3001`))
  .catch((err) => {
    console.log(err)
  })
