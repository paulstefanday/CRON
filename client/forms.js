'use strict'

const html = require('choo/html')
const btnCss = 'pure-button pure-button-primary pure-input-1' // pure-input-1-2
const el = name => document.getElementById(name).value
const json = function(fields, extra) {
  let data = {}
  fields.map(field => data[field] = el(field))
  if(extra) data = Object.assign({}, data, extra)
  return data
}

const taskForm = (state, prev, send) => {

  let create = e => send('data:create', { data: json(['url', 'method', 'frequency']) })

  return html`<div class="pure-form">
    <fieldset class="pure-group">
        <input type="text" class="pure-input-1" id="url" placeholder="Url" />
        <select id="method" class="pure-input-1">
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
        <select id="frequency" class="pure-input-1" >
          <option>MINUTE</option>
          <option>HOURLY</option>
          <option>DAILY</option>
          <option>WEEKLY</option>
        </select>
    </fieldset>
    <button onclick=${create} class=${btnCss}>Create</button>
  </div>`
}

const loginForm = (state, prev, send) => {

  let create = e => send('data:login', { data: json(['email', 'password']) })

  return html`<div class="pure-form">
      <fieldset class="pure-group">
        <input type="email" class="pure-input-1" id="email" placeholder="Email">
        <input type="password" class="pure-input-1" id="password" placeholder="Password">
      </fieldset>
      <button onclick=${create} class=${btnCss}>Sign in</button>
  </div>`
}

const signupForm = (state, prev, send) => {

  let create = e => send('data:signup', { data: json(['email', 'password', 'firstName']) })

  return html`<div class="pure-form">
      <fieldset class="pure-group">
        <input type="text" class="pure-input-1" id="firstName" placeholder="First Name">
        <input type="email" class="pure-input-1" id="email" placeholder="Email">
        <input type="password" class="pure-input-1" id="password" placeholder="Password">
      </fieldset>
      <button onclick=${create} class=${btnCss}>Sign in</button>
  </div>`
}

module.exports = { loginForm, signupForm, taskForm }
