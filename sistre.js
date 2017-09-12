/* Copyright 2017 Ronny Reichmann */
/* SISTRE is teth's [S]ingle [I]mmutable [S]tate [TRE]e */

const objectPath = require('object-path')
const { circular } = require('./T')
const pipe = require('./pipe')

const sistre = (() => {
  const allStateTrees = {}
  function init () {
    if (!arguments.length) throw new Error('No initial state provided')
    else if (arguments.length === 1) return init('main', arguments[0])
    const name = arguments[0]
    const initialState = arguments[1]
    const tree = composeSistreMiddleware(name, initialState)
    allStateTrees[name] = tree
    return tree
  }
  function get () {
    if (!arguments.length) return get('main')
    return allStateTrees[arguments[0]]
  }
  const didChangePattern = Object.freeze({
    role: 'state-tree',
    event: 'did-change'
  })
  return Object.freeze({ init, get, didChangePattern })
})()

function composeSistreMiddleware (name, initialStateTree) {
  const stateTree = initialStateTree
  const circularPattern = Object.assign({ name }, sistre.didChangePattern)
  let openMutations = 0
  let mutationsCount = 0
  function retrieveValue (keypath) {
    return objectPath.get(stateTree, keypath)
  }
  function replaceValue (keypath, value) {
    objectPath.set(stateTree, keypath, value)
    return keypath
  }
  // Normal sistre state is immutable
  function state (...allStringKeypaths) {
    const allKeypaths = allStringKeypaths.map(kp => kp.split('.'))
    return function middleware (message, next) {
      const originals = allKeypaths.map(retrieveValue)
      return next(message, ...originals)
    }
  }
  // TODO: Test the new explicit mutation method
  state.mutate = function (...allStringKeypaths) {
    const allKeypaths = allStringKeypaths.map(kp => kp.split('.'))
    return function middleware (message, next) {
      openMutations += 1
      const originals = allKeypaths.map(retrieveValue)
      const rawResult = next(message, ...originals)
      if (!rawResult) throw new Error('Mutation must have a return value')
      const result = rawResult.then ? rawResult : pipe.resolve(rawResult)
      return result.then(changes => {
        if (changes.length !== originals.length) {
          throw new Error(`Returned array must contain ${originals.length} value(s) for key path(s) ${allStringKeypaths.join(', ')}`)
        }
        const keypaths = allKeypaths
          .map((kp, idx) => ({
            path: kp,
            original: originals[idx],
            change: changes[idx]
          }))
          .filter(({ original, change }) => original !== change)
          .map(({ path, change }) => replaceValue(path, change))
        openMutations -= 1
        mutationsCount += keypaths.length
        if ((openMutations === 0) && (mutationsCount > 0)) {
          circular(Object.assign({ keypaths }, circularPattern))
        }
      })
    }
  }
  return state
}

module.exports = sistre
