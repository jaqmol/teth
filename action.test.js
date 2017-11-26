/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const { context } = require('./T')
const action = require('./action')
const ctx = context()

test('action without arguments', done => {
  const actionWithoutArg = action({
    type: 'no-arg'
  })
  ctx.define(actionWithoutArg.pattern(), msg => {
    expect(msg).toEqual(actionWithoutArg.pattern())
    done()
  })
  ctx.send(actionWithoutArg())
})

test('action with one argument', done => {
  const actionWithArg = action(
    { type: 'with-one-arg' },
    arg => ({ arg })
  )
  ctx.define(actionWithArg.pattern(), msg => {
    expect(msg).toEqual(actionWithArg.pattern({ arg: 'an-argument' }))
    done()
  })
  ctx.send(actionWithArg('an-argument'))
})

test('action with many arguments', done => {
  const actionWithManyArgs = action(
    { type: 'with-many-args' },
    (a, b, c) => ({ a, b, c })
  )
  ctx.define(actionWithManyArgs.pattern(), msg => {
    expect(msg).toEqual(actionWithManyArgs.pattern({ a: 11, b: 22, c: 33 }))
    done()
  })
  ctx.send(actionWithManyArgs(11, 22, 33))
})

test('action with multiple endpoints', done => {
  const multiAction = action(
    { type: 'multi-action' },
    (arg, multi) => ({ arg, multi })
  )
  let aCount = 0
  let bCount = 0
  ctx.define(multiAction.pattern({ multi: 111 }), msg => {
    expect(msg).toEqual({ type: 'multi-action', arg: 'ARG', multi: 111 })
    aCount += 1
    if ((aCount === 1) && (bCount === 1)) done()
  })
  ctx.define(multiAction.pattern({ multi: 333 }), msg => {
    expect(msg).toEqual({ type: 'multi-action', arg: 'ARG', multi: 333 })
    bCount += 1
    if ((aCount === 1) && (bCount === 1)) done()
  })
  ctx.send(multiAction('ARG', 111))
  ctx.send(multiAction('ARG', 333))
})
