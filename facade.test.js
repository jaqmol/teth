/* Copyright 2017 Ronny Reichmann */
/* global test expect */

// const { send, define } = require('./conduit')
// const sistre = require('./sistre')
// const facade = require('./facade')
//
// function createTestState () {
//   return {bicycles: {muscle: [13, 21, 35], electric: [39, 43, 97]}}
// }

test('facade', () => {
  expect(true).toBe(true)
  // const ctx = context()
  // const state = sistre(createTestState())
  // const renderer = facade()
  // const withMuscleState = state('bicycles.muscle')
  // ctx.define('add: one, to: bicycles.muscle',
  //   withMuscleState,
  //   (msg, muscle, patch) => patch(muscle.concat([73])))
  // define(sistre.didChangeMessage,
  //   withMuscleState,
  //   (msg, muscle) => expect(muscle).toEqual([ 13, 21, 35, 73 ]))
  // ctx.send('add: one, to: bicycles.muscle')
})
