/* Copyright 2017 Ronny Reichmann */
/* VALET - Server side RPC connector for Teth */

const { send, context } = require('teth/T')

function composeResponder (response) {
  function json (httpCode, literal) {
    const jsonString = JSON.stringify(literal)
    console.log('valet should respond with:', httpCode, jsonString)
    response.writeHead(httpCode, {
      'Content-Length': Buffer.byteLength(jsonString),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    })
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

function transportLevelErrorChecker (pathRestriction) {
  const correctUrl = pathRestriction ? url => url === pathRestriction : () => true
  return (request, next, responder) => {
    if (!correctUrl(request.url)) {
      if (next) {
        next()
      } else {
        responder.fail(404, {
          code: 'PATH_NOT_FOUND',
          message: 'Requested server path not found',
          data: request.url
        })
      }
      return true
    }
    if (!correctContentType(request)) {
      responder.fail(415, {
        code: 'WRONG_CONTENT_TYPE',
        message: 'TETH/RPC: Wrong header content type, expected "application/json"',
        data: request.headers['Content-Type']
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
}

function handleRpcResponse (rpcReqLiteral, responder, resultPipe) {
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
function handleRpcRequest (responder, dataString) {
  let rpcReqLiteral = null
  try {
    rpcReqLiteral = JSON.parse(dataString)
  } catch (error) {
    return responder.fail(400, {
      code: 'ERROR_PARSING_REQUEST',
      message: 'TETH/RPC: Request could not be parsed',
      error: error.toString(),
      data: rpcReqLiteral
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
  const sendFn = rpcReqLiteral.context
    ? context(rpcReqLiteral.context).send
    : send
  handleRpcResponse(
    rpcReqLiteral,
    responder,
    sendFn(rpcReqLiteral.message)
  )
}

function valet (pathRestriction) {
  const transportLevelError = transportLevelErrorChecker(pathRestriction)
  return function (request, response, next) {
    const responder = composeResponder(response)
    if (transportLevelError(request, next, responder)) return
    let dataString = ''
    request.on('data', chunk => {
      dataString += chunk.toString()
      // Too much POST data, kill connection!
      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      if (dataString.length > 1e6) {
        request.connection.destroy()
      }
    })
    request.on('end', () => {
      handleRpcRequest(responder, dataString)
    })
  }
}

module.exports = valet
