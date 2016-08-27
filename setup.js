'use strict'

require('dotenv').load()
const db = process.env.DB
const r = require('rethinkdbdash')({
  db,
  port: process.env.DBPORT,
  host: process.env.DBHOST
})
const create = name => r.db(db).tableList().contains(name).do(tableExists => r.branch( tableExists, {created: 0}, r.db(db).tableCreate(name))).run()

r.dbList().contains(db)
  .do(dbExists => r.branch(dbExists, {created: 0}, r.dbCreate(db))).run()
  .then(() => create('users'))
  .then(() => create('tasks'))
  .then(() => create('records'))
  .then(() => r.db(db).table('tasks').indexCreate('frequency').run())
  .then(() => r.db(db).table('tasks').indexCreate('userId').run())
  .then(() => r.db(db).table('records').indexCreate('taskId').run())
  .then(() => r.db(db).table('records').indexCreate('createdAt').run())
  .then(() => r.db(db).table('records').indexCreate('code').run())
  .then(() => r.db(db).table('records').indexCreate('success').run())
  .then(() => process.exit())
  .catch(err => {
    console.log(err)
    process.exit()
  })
