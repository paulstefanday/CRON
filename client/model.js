const http = require('choo/http')
const merge = (state, data) => Object.assign({}, state, data)
const headers = () => ({ 'X-Auth': localStorage.getItem('cronToken') })
const initState = {
  user: false,
  tasks: [],
  records: []
}

module.exports = {
  namespace: 'data',
  state: initState,
  reducers: {

    reset: (action, state) => merge(state, initState),

    addUser: (action, state) => merge(state, { user: action.data }),

    addTask: (action, state) => {
      state.tasks.push(action.data)
      return merge(state, { tasks: state.tasks })
    },

    addTasks: (action, state) => merge(state, { tasks: action.data }),

    removeTask: (action, state) => {
      let tasks = state.tasks.filter(t => t.id !== action.data.id)
      return merge(state, { tasks })
    }
    
  },
  effects: {

    login: (action, state, send, done) =>
      http.post('/auth/local', { json: action.data }, (err, res, body) => {
        if(!err) {
          localStorage.setItem('cronToken', body.token)
          send('data:validate', {}, done)
        }
        else done()
      }),

    signup: (action, state, send, done) =>
      http.post('/users', { json: action.data }, (err, res, body) => {
        if(res.statusCode === 201) send('location:setLocation', { location: '/' }, done)
        else done()
      }),

    validate: (action, state, send, done) =>
      http.get('/users', { json: true, headers:headers() }, (err, res, body) => {
        if(res.statusCode === 200) {
          send('data:addUser', { data: body.data[0] },
            () => send('data:tasks', {}, done)
          )
        }
        else send('data:reset', {}, done)
      }),

    logout: (action, state, send, done) => {
      localStorage.removeItem('cronToken')
      send('data:reset', {}, done)
    },

    create: (action, state, send, done) =>
      http.post('/tasks', { json: action.data, headers:headers() }, (err, res, body) => {
        send('data:addTask', { data: body }, done)
      }),

    // update: (action, state, send, done) =>,

    delete: (action, state, send, done) =>
      http.del('/tasks/'+action.data.id, { json: action.data, headers:headers() }, (err, res, body) => {
        send('data:removeTask', { data: action.data}, done)
      }),

    tasks: (action, state, send, done) =>
      http.get('/tasks', { json: true, headers:headers() }, (err, res, body) => {
        send('data:addTasks', { data: body.data }, done)
      })

    // records: (action, state, send, done) =>,

    // stats: (action, state, send, done) =>
  }
}
