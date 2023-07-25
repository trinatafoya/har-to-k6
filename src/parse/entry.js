const checks = require('./checks')
const request = require('./request')
const state = require('./state/entry')
const variables = require('./variables')
const sleep = require('./sleep')
const { entrySpec: makeEntrySpec } = require('../make')

function entry(node, result) {
  const spec = makeEntrySpec()
  if (node.pageref) {
    spec.page = node.pageref
  }
  if (node.comment) {
    spec.comment = node.comment
  }
  if (node.sleep) {
    spec.sleep = sleep(node.sleep)
  }
  request(node.request, spec.request)
  if (node.checks) {
    checks(node.checks, spec.checks)
  }
  if (node.variables) {
    variables(node.variables, spec.variables)
  }
  if (node._webSocketMessages) {
    // capture all the websocket messages for later use connecting to the websocket
    webSockets(node, spec)
  }

  state(spec)
  result.entries.push(spec)
}

function webSockets(node, spec) {
  for (const item of node._webSocketMessages) {
    spec.webSocketMessages.push(item)
  }
}

module.exports = entry
