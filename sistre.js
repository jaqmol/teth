/* Copyright 2017 Ronny Reichmann */
/* SISTRE is teth's [S]ingle [I]mmutable [S]tate [TRE]e */

const objectPath = require('object-path')
const { circular } = require('./conduit')

function composeSistreMiddleware (initialStateTree) {
  const stateTree = initialStateTree
  function getValue (keypath) {
    return objectPath.get(stateTree, keypath)
  }
  function setValue (keypath, value) {
    objectPath.set(stateTree, keypath, value)
    return keypath
  }
  return function withKeypaths (...allKeypaths) {
    allKeypaths = allKeypaths.map(kp => kp.split('.'))
    return function middleware (message, next) {
      const originals = allKeypaths.map(getValue)
      const patch = (...changes) => {
        if (changes.length !== originals.length) {
          const stringKeypaths = allKeypaths.map(kp => kp.join('.'))
          throw new Error(`Returned array must contain ${originals.length} value(s) for key path(s) ${stringKeypaths}`)
        }
        const changedKeypaths = allKeypaths
          .map((kp, idx) => ({
            keypath: kp,
            original: originals[idx],
            change: changes[idx]
          }))
          .filter(({ original, change }) => original !== change)
          .map(({ keypath, change }) => setValue(keypath, change))
        if (changedKeypaths.length) {
          circular(Object.assign({},
            composeSistreMiddleware.didChangeMessage,
            { changedKeypaths }
          ))
        }
      }
      return next(message, ...originals, patch)
    }
  }
}
composeSistreMiddleware.didChangeMessage = Object.freeze({
  role: 'state-tree',
  event: 'did-change'
})

module.exports = composeSistreMiddleware
