/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const { context, define } = require('./conduit')
const sistre = require('./sistre')
const pipe = require('./pipe')

function createTestState () {
  return {bicycles: {muscle: [13, 21, 35], electric: [39, 43, 97]}}
}

test('sistre change state', () => {
  const ctx = context()
  const state = sistre(createTestState())
  const withMuscleState = state('bicycles.muscle')
  ctx.define('add: one, to: bicycles.muscle',
    withMuscleState,
    (msg, muscle, patch) => patch(muscle.concat([73])))
  define(sistre.didChangeMessage,
    withMuscleState,
    (msg, muscle) => expect(muscle).toEqual([ 13, 21, 35, 73 ]))
  ctx.send('add: one, to: bicycles.muscle')
})
test('sistre pass through', done => {
  const ctx = context()
  const state = sistre(createTestState())
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
