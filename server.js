'use strict'

if(process.env.NODE_ENV === 'development') require('dotenv').load()
const feathers = require('feathers')
const rest = require('feathers-rest')
const bodyParser = require('body-parser')
const auth = require('feathers-authentication')
const hooks = require('feathers-hooks')
const service = require('feathers-rethinkdb')
const r = require('rethinkdbdash')({
  db: process.env.DB,
  port: process.env.DBPORT,
  host: process.env.DBHOST
})
const handler = require('feathers-errors/handler')
const compression = require('compression')

// App
var app = feathers()
  .configure(rest())
  .configure(hooks())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended: true}))
  .configure(auth({ idField: 'id', header: 'X-Auth', token: { secret: process.env.SECRET } }))
  .use(compression({
    filter: (req, res) => /[text|application|document]/i.test(req.headers['content_type']) ? compression.filter(req, res) : false
  }))
  .use('/', feathers.static(__dirname + '/public'))
  .use('/signup', function(req, res) {
    res.redirect('/')
  })
  .use(handler())

// Models
const model = name => [ name, service({ Model: r, name, paginate: { default: 10, max: 50 } }) ]
const models = ['users', 'tasks', 'records']
models.map(m => app.use(...model(m)))

// Services
const loggedIn = [ auth.hooks.verifyToken(), auth.hooks.populateUser(), auth.hooks.restrictToAuthenticated() ]
const isOwner = [ ...loggedIn, auth.hooks.restrictToOwner({ idField: 'id', ownerField: 'userId' })]
const createdAt = hook => { hook.data.createdAt = new Date() }
const updatedAt = hook => { hook.data.updatedAt = new Date() }
const disable = hooks.disable('external')

app.service('users').before({
  get: disable,
  find: [...loggedIn, auth.hooks.queryWithCurrentUser({ idField: 'id', as: 'id' })],
  create: [auth.hooks.hashPassword('password'), createdAt],
  update: [...isOwner, updatedAt],
  patch: disable,
  remove: disable
})

app.service('tasks').before({
  all: loggedIn,
  find: [auth.hooks.queryWithCurrentUser({ idField: 'id', as: 'userId' })],
  create: [auth.hooks.associateCurrentUser({ idField: 'id', as: 'userId' }), createdAt],
  update: [...isOwner, updatedAt],
  patch: disable,
  remove: [...isOwner]
})

app.service('tasks').after({ find: [
  (hook, next) => {
    // get stats
    let queries = []
    let stats = item => {
      queries.push(r.table('records').filter({'taskId': item.id, code:200}).count())
      queries.push(r.table('records').getAll(item.id, {index: 'taskId'}).count())
    }
    hook.result.data.map(stats)
    Promise.all(queries).then(results => {
      for (let i = 0; i < hook.result.data.length; i++) {
        let counter = i * 2
        hook.result.data[i].stats = {
          total: results[counter + 1],
          success: results[counter]
        }
      }
      next()
    })
  }
],
create: hook => { hook.result.stats = { total: 0, success: 0 } }
})

app.service('records').before({ all: loggedIn, create: disable, patch: disable, update: disable, remove: disable })

app.listen(process.env.PORT, () => console.log(`Listening on ${process.env.PORT}`))

// Cron
const schedule = require('node-schedule')
const request = require('request')
const recordTasks = frequency => () => r.table('tasks').getAll(frequency, { index: 'frequency' }).run().then(records => {
  records.map(record => {
    // process http request
    let start = new Date()
    request({ uri:record.url, method:record.method }, function(error, response, body) {
      let createdAt = new Date()
      let code = error ? 500 : response.statusCode
      // create record
      r.table('records').insert({
        taskId: record.id,
        createdAt, code,
        error: error ? error.code : false,
        bodyLength: error ? 0 : body.length,
        time:createdAt - start,
        success: code === 200
      }).run()
    })
  })
})

const minute = schedule.scheduleJob('* * * * *', recordTasks('MINUTE'))
const hour = schedule.scheduleJob('@hourly', recordTasks('HOURLY'))
const day = schedule.scheduleJob('@daily', recordTasks('DAILY'))
const week = schedule.scheduleJob('@weekly', recordTasks('WEEKLY'))
