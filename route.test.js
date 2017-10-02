/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const route = require('./route')
const { define } = require('./T')
const cestre = require('./cestre')
const testOrigin = 'http://some.origin.com'

function composeMockWindow () {
  const allListeners = {
    load: [],
    hashchange: []
  }
  function addEventListener (eventName, callback) {
    allListeners[eventName].push(callback)
  }
  const location = {}
  function changeHrefAndFireHashChange (hrefValue) {
    location.href = hrefValue
    allListeners['hashchange'].forEach(callback => callback())
  }
  function changeOrigin (originValue) {
    location.origin = originValue
  }
  return Object.freeze({ addEventListener, location, changeHrefAndFireHashChange, changeOrigin })
}

function replaceMockWindow () {
  const mockWindow = composeMockWindow()
  route.__mockWindow(mockWindow)
  mockWindow.changeOrigin(testOrigin)
  return mockWindow
}

test('route without variables', done => {
  const mockWindow = replaceMockWindow()
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
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#')
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/active')
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/completed')
})

test('route with variables', done => {
  const mockWindow = replaceMockWindow()
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
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#')
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/activate/111')
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/complete/222')
})

test('route change with several listeners', done => {
  const mockWindow = replaceMockWindow()
  const listenerPattern = {'change-route': 'inform-about'}
  const root = route('/#', 'type: ignored-route')
  root.route('/inform/:itemId', listenerPattern)
  let factor = 1
  const value = 111
  let receptionCount = 0
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
  mockWindow.changeHrefAndFireHashChange(testOrigin + `/#/inform/${factor * value}`)
  factor += 1
  mockWindow.changeHrefAndFireHashChange(testOrigin + `/#/inform/${factor * value}`)
  factor += 1
  mockWindow.changeHrefAndFireHashChange(testOrigin + `/#/inform/${factor * value}`)
})

test('route with state mutation', done => {
  const mockWindow = replaceMockWindow()
  cestre.init({ activeRoute: 'init' })
  const state = cestre.get()
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
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#')
  expectedRoute = 'active'
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/active')
  expectedRoute = 'completed'
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/completed')
  expectedRoute = { show: '777' }
  finish = true
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/show/777')
})
