/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const pipe = require('./pipe')

test('pipe.event', done => {
  function receiveSendFn (msg) {
    let count = 0
    msg.event
      .forEach(event => {
        count++
        if (count === 100) {
          expect(true).toBe(true)
          done()
        }
      })
  }
  const pattern = { role: 'event' }
  const eventEmitterFn = pipe.event(receiveSendFn)(pattern)
  for (var i = 0; i < 100; i++) {
    eventEmitterFn({ type: 'test', index: i })
  }
})
