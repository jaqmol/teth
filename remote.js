/* Copyright 2017 Ronny Reichmann */
/* REMOTE - Client side RPC send function for Teth */
/* global XMLHttpRequest */

const pipe = require('teth/pipe')
const { send } = require('teth/T')

let valetUrl = null

function retrieveXhrProto () {
  return pipe(resolve => {
    send('type: teth-globals, retrieve: xhr-object')
      .then(xhr => { resolve(xhr) })
      .catch(() => { resolve(XMLHttpRequest) })
  })
}

function remote (...args) {
  if (!valetUrl) return pipe.reject(new Error('Remote must be initialized before use'))
  const request = {
    'teth/rpc': '1.0',
    type: 'request'
  }
  if (args.length === 2) {
    request.context = args[0]
    request.message = args[1]
  } else if (args.length === 1) {
    request.message = args[0]
  } else {
    return pipe.reject(new Error('Remote must be called with either 1 argument <message> or 2 arguments <context-name> and <message>'))
  }
  return retrieveXhrProto().then(XhRequest => {
    return pipe((resolve, reject) => {
      const handler = new XhRequest()
      handler.open('POST', valetUrl)
      handler.setRequestHeader('Content-Type', 'application/json')
      handler.onreadystatechange = function () {
        if (handler.readyState === 4) { /* .DONE not supported by some browsers and the test mock */
          let response = null
          try {
            response = JSON.parse(handler.responseText)
          } catch (error) {
            reject(error)
            return
          }
          if (response) {
            if (handler.status === 200) resolve(response.result)
            else reject(response)
          } else reject(new Error('No response'))
        }
      }
      handler.send(JSON.stringify(request))
    })
  })
}
remote.init = remoteValetUrl => {
  if (valetUrl) throw new Error('Remote can only be initialized once')
  valetUrl = remoteValetUrl
}

module.exports = remote
