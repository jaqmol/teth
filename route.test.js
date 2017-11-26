/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const { define, context } = require('./T')
const cestre = require('./cestre')
const route = require('./route')
const routeCtx = context('teth-route-private')
const pattern = { type: 'route-private', event: 'change' }

test('route without variables', done => {
  const patternShowAllItems = {'change-route': 'show-all-items'}
  const patternShowActiveItems = {'change-route': 'show-active-items'}
  const patternShowCompleteItems = {'change-route': 'show-completed-items'}
  const root = route('/#', patternShowAllItems)
  root.route('/active', patternShowActiveItems)
  root.route('/completed', patternShowCompleteItems)
  let receptionCount = 0
  define(patternShowAllItems, msg => {
    expect(msg).toEqual(Object.assign({ params: {} }, patternShowAllItems))
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  define(patternShowActiveItems, msg => {
    expect(msg).toEqual(Object.assign({ params: {} }, patternShowActiveItems))
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  define(patternShowCompleteItems, msg => {
    expect(msg).toEqual(Object.assign({ params: {} }, patternShowCompleteItems))
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  routeCtx.circular(Object.assign({ path: '/#' }, pattern))
  routeCtx.circular(Object.assign({ path: '/#/active' }, pattern))
  routeCtx.circular(Object.assign({ path: '/#/completed' }, pattern))
})

test('route with variables', done => {
  const patternShowRootItems = {'change-route': 'show-root-items'}
  const patternActivateItem = {'change-route': 'activate-item'}
  const patternCompleteItem = {'change-route': 'complete-item'}
  const root = route('/#', patternShowRootItems)
  root.route('/activate/:itemId', patternActivateItem)
  root.route('/complete/:itemId', patternCompleteItem)
  let receptionCount = 0
  define(patternShowRootItems, msg => {
    expect(msg).toEqual(Object.assign({ params: {} }, patternShowRootItems))
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  define(patternActivateItem, msg => {
    expect(msg).toEqual(Object.assign({ params: { itemId: '111' } }, patternActivateItem))
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  define(patternCompleteItem, msg => {
    expect(msg).toEqual(Object.assign({ params: { itemId: '222' } }, patternCompleteItem))
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  routeCtx.circular(Object.assign({ path: '/#' }, pattern))
  routeCtx.circular(Object.assign({ path: '/#/activate/111' }, pattern))
  routeCtx.circular(Object.assign({ path: '/#/complete/222' }, pattern))
})

test('route change with several listeners', done => {
  const ignorePattern = 'type: ignored-route'
  const listenerPattern = {'change-route': 'inform-about'}
  const root = route('/#', 'type: ignored-route')
  root.route('/inform/:itemId', listenerPattern)
  let factor = 1
  const value = 111
  let receptionCount = 0
  define(ignorePattern, () => {})
  define(listenerPattern, msg => {
    expect(msg).toEqual(Object.assign({ params: { itemId: `${factor * value}` } }, listenerPattern))
    receptionCount += 1
    if (receptionCount === 9) done()
  })
  define(listenerPattern, msg => {
    expect(msg).toEqual(Object.assign({ params: { itemId: `${factor * value}` } }, listenerPattern))
    receptionCount += 1
    if (receptionCount === 9) done()
  })
  define(listenerPattern, msg => {
    expect(msg).toEqual(Object.assign({ params: { itemId: `${factor * value}` } }, listenerPattern))
    receptionCount += 1
    if (receptionCount === 9) done()
  })
  routeCtx.circular(Object.assign({ path: `/#/inform/${factor * value}` }, pattern))
  factor += 1
  routeCtx.circular(Object.assign({ path: `/#/inform/${factor * value}` }, pattern))
  factor += 1
  routeCtx.circular(Object.assign({ path: `/#/inform/${factor * value}` }, pattern))
})

test('route with state mutation', done => {
  cestre.init({ activeRoute: 'init' })
  const state = cestre()
  const mutateRoute = state.mutate('activeRoute')
  const root = route('/#', mutateRoute, () => ['all'])
  root.route('/active', mutateRoute, () => ['active'])
  root.route('/completed', mutateRoute, () => ['completed'])
  root.route('/show/:itemId', mutateRoute, msg => [{ show: msg.params.itemId }])
  let expectedRoute = 'init'
  let finish = false
  define(cestre.didChangePattern, state('activeRoute'), (msg, activeRoute) => {
    expect(activeRoute).toEqual(expectedRoute)
    if (finish) done()
  })
  expectedRoute = 'all'
  routeCtx.circular(Object.assign({ path: '/#' }, pattern))
  expectedRoute = 'active'
  routeCtx.circular(Object.assign({ path: '/#/active' }, pattern))
  expectedRoute = 'completed'
  routeCtx.circular(Object.assign({ path: '/#/completed' }, pattern))
  expectedRoute = { show: '777' }
  finish = true
  routeCtx.circular(Object.assign({ path: '/#/show/777' }, pattern))
})
