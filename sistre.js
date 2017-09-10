/* Copyright 2017 Ronny Reichmann */
/* SISTRE is teth's [S]ingle [I]mmutable [S]tate [TRE]e */

const objectPath = require('object-path')
const { circular } = require('./T')

const sistre = (() => {
  const allStateTrees = {}
  function init () {
    const name = arguments.length === 2 ? arguments[0] : 'main'
    const initialState = arguments.length === 2 ? arguments[1] : arguments[0]
    if (!initialState) throw new Error('Initial state is missing')
    const st = composeSistreMiddleware(name, initialState)
    allStateTrees[name] = st
    return st
  }
  function get () {
    return allStateTrees[!arguments.length ? 'main' : arguments[0]]
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
  function getValue (keypath) {
    return objectPath.get(stateTree, keypath)
  }
  function setValue (keypath, value) {
    objectPath.set(stateTree, keypath, value)
    return keypath
  }
  return function withKeypaths (...allStringKeypaths) {
    const allKeypaths = allStringKeypaths.map(kp => kp.split('.'))
    return function middleware (message, next) {
      const originals = allKeypaths.map(getValue)
      const patch = (...changes) => {
        if (changes.length !== originals.length) {
          throw new Error(`Returned array must contain ${originals.length} value(s) for key path(s) ${allStringKeypaths}`)
        }
        const keypaths = allKeypaths
          .map((kp, idx) => ({
            path: kp,
            original: originals[idx],
            change: changes[idx]
          }))
          .filter(({ original, change }) => original !== change)
          .map(({ path, change }) => setValue(path, change))
        if (keypaths.length) {
          circular(Object.assign({ keypaths }, circularPattern))
        }
      }
      return next(message, ...originals, patch)
    }
  }
}

module.exports = sistre
