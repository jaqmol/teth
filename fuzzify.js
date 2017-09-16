/* Copyright 2017 Ronny Reichmann */
/* FUZZIFY Adjectify value ranges for later use in pattern matching */

function composeCheckFn (compareFn, adjective) {
  return nextCheckFn => {
    return value => {
      if (compareFn(value)) return adjective
      else return nextCheckFn(value)
    }
  }
}

function fuzzify (config) {
  const initializers = Object.keys(config)
    .map(adjective => [config[adjective], adjective])
    .map(([compareFn, adjective]) => composeCheckFn(compareFn, adjective))
  initializers.reverse()
  return initializers.reduce((acc, initCheckFn) => initCheckFn(acc), v => v)
}

module.exports = fuzzify
