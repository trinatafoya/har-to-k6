const headers = require('./headers')
const cookies = require('./cookies')
const address = require('./address')
const indent = require('./indent')
const object = require('./object')
const post = require('./post')
const text = require('./text')
const generateMultipartFixedPre = require('./post/multipart/fixed/pre')
const { websocketFactor: makeWebsocketFactor } = require('../make')
const { PostSpecies } = require('../enum')

function websocket(spec) {
  let request = spec.request
  const factor = makeWebsocketFactor()
  factor.call = 'connect'
  factor.method = method(request)
  factor.capacity = capacity(request)
  address(request, factor)
  body(request, factor)
  factor.headers = headers(request.headers)
  factor.cookies = cookies(request.cookies)
  factor.options = options(factor)
  factor.messages = spec.webSocketMessages
  factor.args = args(factor)
  factor.compact = compact(factor)
  return render(factor)
}

function method(spec) {
  return text(spec.method)
}

function capacity(spec) {
  return spec.method !== 'GET'
}

function body(spec, factor) {
  factor.body = post(spec)

  const isStructured = spec.state.post.species === PostSpecies.Structured
  const isMultipartFormData = (spec.post.type || '').includes(
    'multipart/form-data'
  )
  const hasVariables = !!spec.state.params.variable

  if (isStructured && isMultipartFormData) {
    // Pre-request logic for fixed multipart/form-data
    if (!hasVariables) {
      factor.pre.push(
        generateMultipartFixedPre(spec.post.params, spec.state.post.boundary)
      )
    }
  }
}

function ws_send_messages(messages) {
  let send_messages = [' function (socket) {']
  send_messages.push("\tsocket.on('open', function () {")
  for (const message of messages) {
    if (message.type === 'send') {
      send_messages.push(`\t\tsocket.send(${JSON.stringify(message.data)})`)
    }
  }
  send_messages.push(
    ...[
      '\t\tsleep(3)',
      '\t\tsocket.close()',
      '\t})',
      "\tsocket.on('error', function (e) {",
      '\t\tfail(`WebSocket failed: ${e.error()}`);',
      '\t})\n}\n',
    ]
  )
  return send_messages.join('\n')
}

function args(factor) {
  const items = []
  items.push(factor.address)
  if (factor.body) {
    items.push(factor.body)
  } else if (factor.capacity && factor.options) {
    // Body argument placeholder necessary
    items.push(`null`)
  }
  if (factor.options) {
    items.push(factor.options)
  }
  if (factor.messages) {
    items.push(ws_send_messages(factor.messages))
  }

  return items
}

function options(factor) {
  if (factor.headers || factor.cookies) {
    const entries = []
    if (factor.headers) {
      entries.push({ name: 'headers', value: factor.headers })
    }
    if (factor.cookies) {
      entries.push({ name: 'cookies', value: factor.cookies })
    }
    return object(entries)
  } else {
    return null
  }
}

function compact(factor) {
  return (
    !factor.capacity || factor.args.length === 1 || factor.args[1] === 'null'
  )
}

function pre(factor) {
  if (factor.pre.length) {
    return factor.pre.join(`\n`)
  } else {
    return null
  }
}

function main(factor) {
  if (factor.compact) {
    const list = factor.args.join(`, `)
    return `ws.${factor.call}(${list});\nsleep(3.8);`
  } else {
    const list = factor.args.join(`,\n`)
    return (
      '' +
      `ws.${factor.call}(
${indent(list)}
);
sleep(3.8)`
    )
  }
}

function render(factor) {
  return [pre(factor), main(factor)].filter(item => item).join(`\n`)
}

module.exports = websocket
