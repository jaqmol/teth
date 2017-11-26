/* Copyright 2017 Ronny Reichmann */
/* global beforeAll afterAll test expect */

const http = require('http')
const PORT = 1351
const valet = require('./valet-old')
const { define } = require('./T')
let srv = null

beforeAll(() => {
  srv = http.createServer(valet('/test/rpc')).listen(PORT)
})

define('greet: the-world', () => {
  return { hello: 'world' }
})
define({ fare: 'well' }, () => {
  return { you: 'too' }
})

function performRequest (config, message, callback) {
  const postData = JSON.stringify(message)
  config.headers['Content-Length'] = Buffer.byteLength(postData)
  const req = http.request(config, res => {
    res.setEncoding('utf8')
    let collector = ''
    res.on('data', chunk => {
      collector += chunk
    })
    res.on('end', () => {
      callback(null, res.statusCode, JSON.parse(collector))
    })
  })
  req.on('error', e => {
    callback(e)
  })
  req.write(postData)
  req.end()
}

test('rpc string message', done => {
  const message = {
    'teth/rpc': '1.0',
    type: 'request',
    message: 'greet: the-world'
  }
  const config = {
    hostname: 'localhost',
    port: PORT,
    path: '/test/rpc',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }
  performRequest(config, message, (err, status, response) => {
    expect(err).toBe(null)
    if (err) done()
    expect(status).toBe(200)
    expect(response['teth/rpc']).toBe('1.0')
    expect(response.type).toBe('response')
    expect(response.result).toEqual({ hello: 'world' })
    done()
  })
})

test('provoke path error', done => {
  const message = {
    'teth/rpc': '1.0',
    type: 'request',
    message: { greet: 'the-world' }
  }
  const config = {
    hostname: 'localhost',
    port: PORT,
    path: '/test/rmi',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }
  performRequest(config, message, (err, status, response) => {
    expect(err).toBe(null)
    if (err) done()
    expect(status).toBe(404)
    expect(response['teth/rpc']).toBe('1.0')
    expect(response.type).toBe('error')
    expect(response.code).toBe('PATH_NOT_FOUND')
    expect(response.message).toBe('Requested server path not found')
    expect(response.data).toBe('/test/rmi')
    // console.log(response)
    done()
  })
})

test('provoke content type error', done => {
  const config = {
    hostname: 'localhost',
    port: PORT,
    path: '/test/rpc',
    method: 'POST',
    headers: {}
  }
  performRequest(config, 'hi', (err, status, response) => {
    expect(err).toBe(null)
    if (err) done()
    expect(status).toBe(415)
    expect(response['teth/rpc']).toBe('1.0')
    expect(response.type).toBe('error')
    expect(response.code).toBe('WRONG_CONTENT_TYPE')
    expect(response.message).toBe('TETH/RPC: Wrong header content type, expected "application/json"')
    done()
  })
})

test('provoke http method error', done => {
  const config = {
    hostname: 'localhost',
    port: PORT,
    path: '/test/rpc',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }
  performRequest(config, 'hi', (err, status, response) => {
    expect(err).toBe(null)
    if (err) done()
    expect(status).toBe(405)
    expect(response['teth/rpc']).toBe('1.0')
    expect(response.type).toBe('error')
    expect(response.code).toBe('WRONG_HTTP_METHOD')
    expect(response.message).toBe('TETH/RPC: Wrong HTTP method, expected "POST"')
    done()
  })
})

test('provoke internal server error', done => {
  const message = {
    'teth/rpc': '1.0',
    type: 'request',
    message: { greet: 'the-king' }
  }
  const config = {
    hostname: 'localhost',
    port: PORT,
    path: '/test/rpc',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }
  performRequest(config, message, (err, status, response) => {
    expect(err).toBe(null)
    if (err) done()
    expect(status).toBe(500)
    expect(response['teth/rpc']).toBe('1.0')
    expect(response.type).toBe('error')
    expect(response.code).toBe('INTERNAL_SERVER_ERROR')
    expect(response.message).toBe('TETH/RPC: Internal server error')
    expect(response.error).toBe('Error: No match found for {"greet":"the-king"} in this context')
    expect(response.data).toEqual(message)
    done()
  })
})

test('rpc literal message', done => {
  const message = {
    'teth/rpc': '1.0',
    type: 'request',
    message: { fare: 'well' }
  }
  const config = {
    hostname: 'localhost',
    port: PORT,
    path: '/test/rpc',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }
  performRequest(config, message, (err, status, response) => {
    expect(err).toBe(null)
    if (err) done()
    expect(status).toBe(200)
    expect(response['teth/rpc']).toBe('1.0')
    expect(response.type).toBe('response')
    expect(response.result).toEqual({ you: 'too' })
    done()
  })
})

afterAll(() => {
  srv.close()
})
