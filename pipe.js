/* Copyright 2017 Ronny Reichmann */
/* PIPE, minimal, promise-compatible streaming framework */

const pipe = require('teth-pipe')

pipe.event = function (ctxSendFn, basePattern) {
  if (arguments.length === 1) {
    return contPattern => pipe.event(ctxSendFn, contPattern)
  } else if (arguments.length === 2) {
    let send = e => {
      const buffer = pipe.buffer()
      ctxSendFn(Object.assign(
        {},
        basePattern,
        { event: buffer.pipe }
      ))
      send = buffer.emit
      send(e)
    }
    return event => { send(event) }
  } else {
    throw new Error('Argument(s) missing.')
  }
}

module.exports = pipe
