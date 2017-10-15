/* Copyright 2017 Ronny Reichmann */
/* global beforeAll test expect */

const mock = require('xhr-mock')
const remote = require('./remote')

mock.setup()

function respond (res, status, literal) {
  return res
    .status(status)
    .header('Content-Type', 'application/json')
    .body(JSON.stringify(literal))
}

mock.post('http://localhost:1351/test/rpc', (req, res) => {
  let msg = null
  try {
    msg = JSON.parse(req._body)
  } catch (err) {
    return respond(res, 400, {
      code: 'ERROR_PARSING_REQUEST',
      message: 'TETH/RPC: Request could not be parsed',
      error: err.toString(),
      data: req._body
    })
  }

  if (req._method !== 'POST') {
    return respond(res, 405, {
      code: 'WRONG_HTTP_METHOD',
      message: 'TETH/RPC: Wrong HTTP method, expected "POST"',
      data: req._method
    })
  } else if (req._url !== 'http://localhost:1351/test/rpc') {
    return respond(res, 404, {
      code: 'PATH_NOT_FOUND',
      message: 'Requested server path not found',
      data: req._url
    })
  } else if (!req._headers['content-type'] && (req._headers['content-type'] === 'application/json')) {
    return respond(res, 415, {
      code: 'WRONG_CONTENT_TYPE',
      message: 'TETH/RPC: Wrong header content type, expected "application/json"',
      data: req._headers['content-type']
    })
  } else {
    if (msg.message === 'greet: the-world') {
      return respond(res, 200, {
        'teth/rpc': '1.0',
        type: 'response',
        result: { hello: 'world' }
      })
    } else {
      const msgStr = JSON.stringify(msg.message)
      const errorMsg = 'No match found for ' + msgStr + ' in this context'
      return respond(res, 500, {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'TETH/RPC: Internal server error',
        error: errorMsg,
        data: msg.message
      })
    }
  }
})

beforeAll(() => {
  remote.init('http://localhost:1351/test/rpc')
})

test('simple rpc message', done => {
  remote('greet: the-world')
    .then(result => {
      expect(result).toEqual({ hello: 'world' })
      done()
    })
    .catch(err => {
      expect(err).toBe(null)
      console.error('error', err)
      done()
    })
})

test('provoke internal server error', done => {
  remote('greet: the-king')
    .then(result => {
      expect(result).toEqual(null)
      done()
    })
    .catch(err => {
      expect(err.code).toBe('INTERNAL_SERVER_ERROR')
      expect(err.message).toBe('TETH/RPC: Internal server error')
      expect(err.error).toBe('No match found for "greet: the-king" in this context')
      done()
    })
})
