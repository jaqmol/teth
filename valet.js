/* Copyright 2017 Ronny Reichmann */
/* VALET - Server side RPC connector for Teth */

const auid = require('./auid')
const { define, send, context } = require('./T')
const jsonic = require('jsonic')
const immutableLiteral = lit => Object.freeze(typeof lit === 'string' ? jsonic(lit) : lit)
// const ctx = context()

function standardResponseHeaders (contentLength) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  }
  if (contentLength) {
    headers['Content-Length'] = contentLength
  }
  return headers
}

function composeResponder (response) {
  function json (httpCode, literal) {
    const jsonString = JSON.stringify(literal)
    response.writeHead(
      httpCode,
      standardResponseHeaders(
        Buffer.byteLength(jsonString)
      )
    )
    response.end(jsonString)
  }
  function fail (httpCode, errorLiteral) {
    errorLiteral['teth/rpc'] = '1.0'
    errorLiteral.type = 'error'
    json(httpCode, errorLiteral)
  }
  function respond (httpCode, responseLiteral) {
    responseLiteral['teth/rpc'] = '1.0'
    responseLiteral.type = 'response'
    json(httpCode, responseLiteral)
  }
  return { fail, respond }
}
function correctContentType (request) {
  return request.headers['content-type'] === 'application/json'
}
function correctHttpMethod (request) {
  return request.method === 'POST'
}

function transportLevelError (request, responder) {
  if (!correctContentType(request)) {
    responder.fail(415, {
      code: 'WRONG_CONTENT_TYPE',
      message: 'TETH/RPC: Wrong header content type, expected "application/json"',
      data: request.headers['content-type']
    })
    return true
  }
  if (!correctHttpMethod(request)) {
    responder.fail(405, {
      code: 'WRONG_HTTP_METHOD',
      message: 'TETH/RPC: Wrong HTTP method, expected "POST"',
      data: request.method
    })
    return true
  }
  return false
}

function handleRpcResponse (resultPipe, rpcReqLiteral, responder) {
  resultPipe
    .then(result => {
      responder.respond(200, { result })
    })
    .catch(error => {
      responder.fail(500, {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'TETH/RPC: Internal server error',
        error: error.toString(),
        data: rpcReqLiteral
      })
    })
}
function handleRpcRequest (dataString, sendFn, responder) {
  let rpcReqLiteral = null
  try {
    rpcReqLiteral = JSON.parse(dataString)
  } catch (error) {
    return responder.fail(400, {
      code: 'ERROR_PARSING_REQUEST',
      message: 'TETH/RPC: Request could not be parsed',
      error: error.toString(),
      data: dataString
    })
  }
  if ((rpcReqLiteral['teth/rpc'] !== '1.0') ||
      (rpcReqLiteral.type !== 'request') ||
      !rpcReqLiteral.message) {
    return responder.fail(400, {
      code: 'WRONG_REQUEST_FORMAT',
      message: 'TETH/RPC: Wrong request format',
      data: rpcReqLiteral
    })
  }
  const performSend = rpcReqLiteral.context
    ? context(rpcReqLiteral.context).send
    : sendFn
  handleRpcResponse(
    performSend(rpcReqLiteral.message),
    rpcReqLiteral,
    responder
  )
}

const rawRequestPattern = Object.freeze({ type: 'teth-valet', event: 'incoming-raw-request' })
const rawConfigForId = {}

const valet = {
  pattern: Object.freeze({ type: 'teth-valet', event: 'incoming-request' }),
  raw: config => {
    const configuration = Object.keys(config).reduce((acc, key) => {
      acc[key.toLowerCase()] = immutableLiteral(config[key])
      return acc
    }, {})
    const configId = auid()
    rawConfigForId[configId] = Object.freeze(configuration)
    return Object.freeze(Object.assign({ configId }, rawRequestPattern))
  },
  standardResponseHeaders
}

define(valet.pattern, msg => {
  const srv = msg.server
  const responder = composeResponder(srv.response)
  if (transportLevelError(srv.request, responder)) return
  let dataString = ''
  srv.request.on('data', chunk => {
    dataString += chunk.toString()
    if (dataString.length > 1e6) {
      srv.request.connection.destroy()
    }
  })
  srv.request.on('end', () => {
    handleRpcRequest(dataString, send, responder)
  })
})

define(rawRequestPattern, incomingMessage => {
  const config = rawConfigForId[incomingMessage.configId]
  const srv = incomingMessage.server
  const method = srv.request.method.toLowerCase()
  const targetPattern = config[method]
  if (targetPattern) {
    if (targetPattern.onData && (typeof targetPattern.onData === 'function')) {
      srv.request.on('data', chunk => targetPattern.onData(chunk))
      srv.request.on('end', () => targetPattern.onData(null))
    } else {
      const chunkCollector = []
      srv.request.on('data', chunk => {
        chunkCollector.push(chunk)
      })
      srv.request.on('end', () => {
        const outgoingMessage = Object.assign({}, targetPattern, {
          params: incomingMessage.params,
          headers: srv.request.headers,
          body: Buffer.concat(chunkCollector)
        })
        send(outgoingMessage)
          .then(result => {
            if (result) {
              srv.response.writeHead(
                result.code || 200,
                result.headers || standardResponseHeaders()
              )
              srv.response.end(result.body)
            } else {
              composeResponder(srv.response).fail(500, {
                code: 'NO_RESPONSE_FROM_HANDLER',
                message: 'TETH/RPC/RAW: No response from handler'
              })
            }
          })
          .catch(error => {
            composeResponder(srv.response).fail(500, {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'TETH/RPC/RAW: Internal server error',
              error: error.toString()
            })
          })
      })
    }
  } else {
    composeResponder(srv.response).fail(400, {
      code: 'NO_HANDLER_FOR_METHOD',
      message: `TETH/RPC/RAW: No handler for method: ${method.toUpperCase()}`
    })
  }
})

define('type: teth-valet, fail: not-found', msg => {
  const responder = composeResponder(msg.server.response)
  responder.fail(404, {
    code: 'NOT_FOUND',
    message: 'Not found'
  })
})

module.exports = Object.freeze(valet)
