/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const { context, define } = require('./T')
const cestre = require('./cestre')
const pipe = require('./pipe')

function createTestState () {
  return {bicycles: {muscle: [13, 21, 35], electric: [39, 43, 97]}}
}

test('cestre change main state', done => {
  const ctx = context()
  const state = cestre.init(createTestState()) // main state
  ctx.define('add: one, to: bicycles.muscle',
    state.mutate('bicycles.muscle'),
    (msg, muscle) => [ muscle.concat([73]) ])
  define(cestre.didChangePattern,
    state('bicycles.muscle'),
    (msg, muscle) => {
      expect(muscle).toEqual([ 13, 21, 35, 73 ])
      done()
    })
  ctx.send('add: one, to: bicycles.muscle')
    .catch(e => {
      expect(e).toBe(null)
      done()
    })
})
test('cestre pass through discrete state', done => {
  const ctx = context()
  const state = cestre.init('b-state', createTestState())
  const withBothSubStates = state('bicycles.muscle', 'bicycles.electric')
  ctx.define('start: processing',
    withBothSubStates,
    (msg, muscle, electric) => pipe.all([
      ctx.send({ process: 'muscle bikes', muscle }),
      ctx.send({ process: 'electric bikes', electric })
    ]))
  ctx.define('process: muscle bikes', ({ muscle }) => muscle.concat([777]))
  ctx.define('process: electric bikes', ({ electric }) => electric.concat([333]))
  ctx.send('start: processing')
    .then(([muscle, electric]) => ({muscle, electric}))
    .then(result => {
      expect(result).toEqual({
        muscle: [ 13, 21, 35, 777 ],
        electric: [ 39, 43, 97, 333 ]
      })
      done()
    })
})
test('cestre pass through sync discrete state', () => {
  const ctx = context()
  const state = cestre.init('c-state', createTestState())
  const withBothSubStates = state('bicycles.muscle', 'bicycles.electric')
  ctx.define('start: processing',
    withBothSubStates,
    (msg, muscle, electric) => [
      ctx.send.sync({ process: 'muscle bikes', muscle }),
      ctx.send.sync({ process: 'electric bikes', electric })
    ])
  ctx.define('process: muscle bikes', ({ muscle }) => muscle.concat([777]))
  ctx.define('process: electric bikes', ({ electric }) => electric.concat([333]))
  const result = ctx.send.sync('start: processing')
  expect(result).toEqual([ [ 13, 21, 35, 777 ], [ 39, 43, 97, 333 ] ])
})
