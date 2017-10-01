/* Copyright 2017 Ronny Reichmann */

const bloomrun = require('bloomrun')
const jsonic = require('jsonic')
const pipe = require('./pipe')
const immutableLiteral = lit => Object.freeze(typeof lit === 'string' ? jsonic(lit) : lit)
const composeError = (...args) => {
  const lastIdx = args.length - 1
  let e
  if (typeof args[lastIdx] === 'number') {
    e = new Error(args.slice(0, lastIdx).join(' '))
    e.code = args[lastIdx]
  } else {
    e = new Error(args.join(' '))
  }
  return e
}
const raise = (...args) => {
  throw composeError(...args)
}

function match (matchLiteral) {
  const patternMatcher = bloomrun()
  let unknownRoutine
  const composit = {}
  composit.define = function (pattern, routine) {
    pattern = immutableLiteral(pattern)
    patternMatcher.add(pattern, routine)
    return composit
  }
  composit.unknown = function (routine) {
    unknownRoutine = routine
    return composit
  }
  function performDo (literal, notFoundCallback) {
    literal = immutableLiteral(literal)
    const routine = patternMatcher.lookup(literal)
    if (routine) return routine(literal)
    else {
      if (notFoundCallback) return notFoundCallback(literal)
      else if (unknownRoutine) return unknownRoutine(literal)
      else {
        raise(
          'No match found for',
          JSON.stringify(literal),
          'in this context',
          -1)
      }
    }
  }
  composit.do = matchLiteral
    ? unknownFn => performDo(matchLiteral, unknownFn)
    : performDo
  function performDoAll (literal, notFoundCallback) {
    literal = immutableLiteral(literal)
    const allRoutines = patternMatcher.list(literal)
    if (allRoutines.length) return allRoutines.map(cb => cb(literal))
    else {
      if (notFoundCallback) return notFoundCallback(literal)
      else if (unknownRoutine) return unknownRoutine(literal)
      else {
        raise(
          'No match found for',
          JSON.stringify(literal),
          'in this context',
          -2)
      }
    }
  }
  composit.doAll = matchLiteral
    ? unknownFn => performDoAll(matchLiteral)
    : performDoAll
  return Object.freeze(composit)
}

// Types might prove too great a seduction to end up in harmful thought patterns
// function type (composePattern, composeFn) {
//   const typeSymbol = Symbol()
//   const immutableType = literal => Object.freeze(Object.assign(
//     {type: typeSymbol}, literal
//   ))
//   const routine = composeFn
//     ? msg => immutableType(composeFn(msg))
//     : msg => immutableType(msg)
//   const matcher = match()
//     .define(composePattern, routine)
//     .unknown(msg => raise('No match found for', JSON.stringify(msg), 'to compose this type', -3))
//   const composer = composeMessage => matcher.send(composeMessage)
//   composer.type = typeSymbol
//   return Object.freeze(composer)
// }

function proceduresPerformer (allProcedures) {
  function next (index, inputArgs) {
    if (index === allProcedures.length) return inputArgs
    else {
      const procedure = allProcedures[index]
      const commence = (...nextInputArgs) => next(index + 1, nextInputArgs)
      return procedure(...inputArgs, commence)
    }
  }
  return msg => next(0, [msg])
}

function composeDefine (contextMatcher, contextComposit) {
  return function (...args) {
    const pattern = args[0] // literal is ensured in contextMatcher.define
    const allProcedures = args.slice(1)
    if (allProcedures.length === 1) {
      contextMatcher.define(pattern, allProcedures[0])
    } else if (allProcedures.length > 1) {
      contextMatcher.define(pattern, proceduresPerformer(allProcedures))
    } else raise('No procedure(s) provided', -4) // throw new Error('No procedure(s) provided')
    return contextComposit
  }
}

const composeContext = (() => {
  function createContext () {
    const contextMatcher = match()
    const composit = {}
    composit.define = composeDefine(contextMatcher, composit)
    composit.unknown = callback => {
      contextMatcher.unknown(callback)
      return composit
    }
    composit.send = msg => {
      try {
        const result = contextMatcher.do(msg)
        if (result && result.then && result.catch) return result
        else return pipe.resolve(result)
      } catch (e) {
        return pipe.reject(e)
      }
    }
    composit.send.sync = msg => {
      return contextMatcher.do(msg)
    }
    composit.circular = msg => {
      try {
        return pipe.all(contextMatcher.doAll(msg)
          .map(result => {
            if (result && result.then && result.catch) return result
            else return pipe.resolve(result)
          }))
      } catch (e) {
        return pipe.reject(e)
      }
    }
    composit.context = createContext
    return Object.freeze(composit)
  }
  const allNamedConexts = {}
  createContext.get = name => {
    if (!allNamedConexts[name]) allNamedConexts[name] = createContext()
    return allNamedConexts[name]
  }
  return createContext
})()

// function resonateContext (ctx) {
//   const composit = {}
//   composit.define = ctx.define
//   composit._resonator = routine => {
//     ctx.unknown(routine)
//     return composit
//   }
//   composit.send = ctx.send
//   composit.circular = ctx.circular
//   composit.context = ctx.context
//   return Object.freeze(composit)
// }

module.exports = Object.freeze(
  Object.assign(
    { match, composeError, raise }, // TODO: remove composeError
    composeContext()))
