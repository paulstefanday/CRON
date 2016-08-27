'use strict'

const choo = require('choo')
const html = require('choo/html')
const app = choo({ onAction: (data, state, name, trace, createSend) => console.log(state) })
const { loginForm, taskForm, signupForm } = require('./forms')
const { tasks } = require('./components')

const container = template => (state, prev, send) => html`<div style="margin: 0 auto;max-width: 600px;padding: 20px 0;" onload=${e => send('data:validate')}>
 ${template(state, prev, send)}
</div>`

const login = (state, prev, send) => html`<div>
  <h1>Login</h1>
  ${loginForm(state, prev, send)}
  <p>No account? <a href="/signup">sign up</a>.</p>
</div>`

const signup = (state, prev, send) => html`<div>
  <h1>Signup</h1>
  ${signupForm(state, prev, send)}
  <p>Have an account? <a href="/">login</a>.</p>
</div>`

const home = (state, prev, send) => html`<div>
  <button onclick=${e => send('data:logout')}>Logout</button>
  <hr />
  ${taskForm(state,prev,send)}
  <hr />
  ${tasks(state,prev,send)}
</div>`

const auth = page => (state, prev, send) => state.data.user ? page(state, prev, send) : login(state, prev, send)

app.model(require('./model'))
app.router((route) => [
  route('/', container(auth(home))),
  route('/signup', container(signup))
])

const tree = app.start()
document.body.appendChild(tree)
