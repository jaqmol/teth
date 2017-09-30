/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const route = require('./route')
const { define } = require('./T')
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
  const patternShowAllItems = {type: 'route', cmd: 'show-all-items'}
  const patternSowActiveItems = {type: 'route', cmd: 'show-active-items'}
  const patternShowCompleteItems = {type: 'route', cmd: 'show-completed-items'}
  const root = route('/#', patternShowAllItems)
  root.route('/active', patternSowActiveItems)
  root.route('/completed', patternShowCompleteItems)
  let receptionCount = 0
  define(patternShowAllItems, msg => {
    expect(msg).toEqual(patternShowAllItems)
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  define(patternSowActiveItems, msg => {
    expect(msg).toEqual(patternSowActiveItems)
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  define(patternShowCompleteItems, msg => {
    expect(msg).toEqual(patternShowCompleteItems)
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#')
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/active')
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/completed')
})

test('route with variables', done => {
  const mockWindow = replaceMockWindow()
  const patternShowRootItems = {type: 'route', cmd: 'show-root-items'}
  const patternActivateItem = {type: 'route', cmd: 'activate-item'}
  const patternCompleteItem = {type: 'route', cmd: 'complete-item'}
  const root = route('/#', patternShowRootItems)
  root.route('/activate/:itemId', patternActivateItem)
  root.route('/complete/:itemId', patternCompleteItem)
  let receptionCount = 0
  define(patternShowRootItems, msg => {
    expect(msg).toEqual(patternShowRootItems)
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  define(patternActivateItem, msg => {
    expect(msg).toEqual(Object.assign({ itemId: '111' }, patternActivateItem))
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  define(patternCompleteItem, msg => {
    expect(msg).toEqual(Object.assign({ itemId: '222' }, patternCompleteItem))
    receptionCount += 1
    if (receptionCount === 3) done()
  })
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#')
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/activate/111')
  mockWindow.changeHrefAndFireHashChange(testOrigin + '/#/complete/222')
})

test('route change with several listeners', done => {
  const mockWindow = replaceMockWindow()
  const listenerPattern = {type: 'route', cmd: 'inform-about'}
  const root = route('/#', 'type: ignored-route')
  root.route('/inform/:itemId', listenerPattern)
  let factor = 1
  const value = 111
  let receptionCount = 0
  define(listenerPattern, msg => {
    expect(msg).toEqual(Object.assign({ itemId: `${factor * value}` }, listenerPattern))
    receptionCount += 1
    if (receptionCount === 9) done()
  })
  define(listenerPattern, msg => {
    expect(msg).toEqual(Object.assign({ itemId: `${factor * value}` }, listenerPattern))
    receptionCount += 1
    if (receptionCount === 9) done()
  })
  define(listenerPattern, msg => {
    expect(msg).toEqual(Object.assign({ itemId: `${factor * value}` }, listenerPattern))
    receptionCount += 1
    if (receptionCount === 9) done()
  })
  mockWindow.changeHrefAndFireHashChange(testOrigin + `/#/inform/${factor * value}`)
  factor += 1
  mockWindow.changeHrefAndFireHashChange(testOrigin + `/#/inform/${factor * value}`)
  factor += 1
  mockWindow.changeHrefAndFireHashChange(testOrigin + `/#/inform/${factor * value}`)
})
