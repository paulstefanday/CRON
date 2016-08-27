'use strict'

const html = require('choo/html')

// Stats
const stats = (state, prev, send) => html``

// Tasks
const task = (record, send) => html`<div>
  <h4>${record.url}</h4>
  <p>${record.method}: ${record.stats.success}/${record.stats.total} (${record.stats.total - record.stats.success} Failed)</p>
  <button onclick=${e => send('data:stats', { data: record })}>View Stats</button>
  <button onclick=${e => send('data:delete', { data: record })}>Delete</button>
</div>`

const tasks = (state, prev, send) => html`<div>
  ${state.data.tasks.map(record => task(record, send))}
</div>`

module.exports = { stats, task, tasks }
