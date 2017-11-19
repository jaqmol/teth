/* Copyright 2017 Ronny Reichmann */
/* ACTION, Redux-style action/reducer support for Teth. */

function composeAction (pattern, callback) {
  pattern = Object.freeze(pattern)
  const actionFn = callback
    ? (...args) => Object.assign({}, pattern, callback(...args))
    : () => pattern
  actionFn.pattern = mergeLit => mergeLit
    ? Object.assign({}, pattern, mergeLit)
    : pattern
  return actionFn
}

module.exports = composeAction
