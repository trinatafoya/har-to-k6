const checks = require('../checks')
const request = require('../request')
const websocket = require('../websocket')
const variables = require('../variables')
const withSleep = require('../withSleep')

function logic(spec) {
  let flow = [
    communicationProtocol(spec),
    checks(spec.checks),
    variables(spec.variables),
  ]

  if (spec.sleep) {
    flow = withSleep(flow, spec.sleep)
  }

  return flow.filter(item => item).join(`\n`)
}

function communicationProtocol(spec) {
  if (
    spec.request.address &&
    ['ws:', 'wss'].includes(spec.request.address.slice(0, 3))
  ) {
    return websocket(spec)
  }
  return request(spec.request)
}

module.exports = logic
