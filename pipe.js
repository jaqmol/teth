/* Copyright 2017 Ronny Reichmann */
/* PIPE, minimal, promise-compatible streaming framework */

const PUSH = Symbol()
const RESOLVE = Symbol()
const REJECT = Symbol()
const PROCEED = Symbol()

function processResultValue (passOnType, result, callback) {
  if (result && result.then && result.catch) {
    if (result.forEach) {
      result
        .forEach(value => { callback({type: PUSH, value}) })
        .then(value => { callback({type: RESOLVE, value}) })
        .catch(error => { callback({type: REJECT, value: error}) })
    } else {
      result
        .then(value => { callback({type: RESOLVE, value}) })
        .catch(error => { callback({type: REJECT, value: error}) })
    }
  } else {
    callback({type: passOnType, value: result})
  }
}

function composeForEachOperateFn (callback, nextPipe) {
  return message => {
    if (message.type === PUSH) {
      try {
        callback(message.value)
      } catch (err) {
        nextPipe[PROCEED]({type: REJECT, value: err})
      }
    } else nextPipe[PROCEED](message)
  }
}
function composeMapOperateFn (callback, nextPipe) {
  return message => {
    if (message.type === PUSH) {
      try {
        const result = callback(message.value)
        processResultValue(PUSH, result, nextPipe[PROCEED])
      } catch (err) {
        nextPipe[PROCEED]({type: REJECT, value: err})
      }
    } else nextPipe[PROCEED](message)
  }
}
function composeFilterOperateFn (callback, nextPipe) {
  return message => {
    if (message.type === PUSH) {
      try {
        const result = callback(message.value)
        processResultValue(PUSH, result, processedMsg => {
          if (processedMsg.value) nextPipe[PROCEED](message)
        })
      } catch (err) {
        nextPipe[PROCEED]({type: REJECT, value: err})
      }
    } else nextPipe[PROCEED](message)
  }
}
function composeReduceOperateFn (callback, nextPipe, initialAccumulator) {
  let accumulator = initialAccumulator
  let inProgress = false
  const allJobMessages = []
  function nextJob () {
    if (inProgress) return
    if (allJobMessages.length) {
      inProgress = true
      const message = allJobMessages.splice(0, 1)[0]
      if (message.type === PUSH) {
        try {
          const result = callback(accumulator, message.value)
          processResultValue(PUSH, result, processedMsg => {
            accumulator = processedMsg.value
            inProgress = false
            nextJob()
          })
        } catch (err) {
          nextPipe[PROCEED]({type: REJECT, value: err})
        }
      } else if (message.type === RESOLVE) {
        nextPipe[PROCEED]({type: RESOLVE, value: accumulator})
        accumulator = initialAccumulator
      }
    }
  }
  return message => {
    if ((message.type === PUSH) || (message.type === RESOLVE)) {
      allJobMessages.push(message)
      nextJob()
    } else nextPipe[PROCEED](message)
  }
}
function composeDebounceOperateFn (delay, nextPipe) {
  let lastPushMessage, activeTimeoutId
  return message => {
    if (message.type === PUSH) {
      lastPushMessage = message
      if (activeTimeoutId) clearTimeout(activeTimeoutId)
      activeTimeoutId = setTimeout(() => {
        activeTimeoutId = undefined
        nextPipe[PROCEED](lastPushMessage)
      }, delay)
    } else if (message.type === RESOLVE) {
      if (activeTimeoutId) clearTimeout(activeTimeoutId)
      activeTimeoutId = undefined
      if (lastPushMessage) nextPipe[PROCEED](lastPushMessage)
      nextPipe[PROCEED](message)
    } else nextPipe[PROCEED](message)
  }
}
function composeThenOperateFn (callback, nextPipe) {
  return message => {
    if (message.type === RESOLVE) {
      try {
        const result = callback(message.value)
        if (result) processResultValue(RESOLVE, result, nextPipe[PROCEED])
      } catch (err) {
        nextPipe[PROCEED]({type: REJECT, value: err})
      }
    } else {
      nextPipe[PROCEED](message)
    }
  }
}
function composeCatchOperateFn (callback) {
  return message => {
    if (message.type === REJECT) {
      callback(message.value)
    }
  }
}

function pipe (generate) {
  const buffer = composeBuffer()
  const performGenerate = generate
    ? function () {
      const msgDisp = type => value => {
        buffer.add({type, value}).flush()
      }
      generate(msgDisp(RESOLVE), msgDisp(REJECT), msgDisp(PUSH))
    }
    : function () {}
  function opCbSetterFn (composeOpFn) {
    return (firstArg, lastArg) => {
      const nextPipe = pipe()
      buffer.setOperateFn(composeOpFn(firstArg, nextPipe, lastArg))
      performGenerate()
      buffer.flush()
      return nextPipe
    }
  }
  const composit = {
    forEach: opCbSetterFn(composeForEachOperateFn),
    map: opCbSetterFn(composeMapOperateFn),
    filter: opCbSetterFn(composeFilterOperateFn),
    reduce: opCbSetterFn(composeReduceOperateFn),
    debounce: opCbSetterFn(composeDebounceOperateFn),
    then: opCbSetterFn(composeThenOperateFn),
    catch: callback => {
      buffer.setOperateFn(composeCatchOperateFn(callback))
      performGenerate()
      buffer.flush()
    },
    [PROCEED]: message => {
      buffer.add(message).flush()
    }
  }
  return Object.freeze(composit)
}
function composeBuffer () {
  let allMessages = []
  let operateFn
  const composit = {
    setOperateFn: anOperateFn => { operateFn = anOperateFn },
    add: message => {
      allMessages.push(message)
      return composit
    },
    flush: () => {
      if (!operateFn) return
      if (!allMessages.length) return
      allMessages.forEach(operateFn)
      allMessages = []
    }
  }
  return Object.freeze(composit)
}

pipe.resolve = value => {
  return pipe(resolve => { resolve(value) })
}
pipe.reject = error => {
  return pipe((resolve, reject) => { reject(error) })
}
pipe.all = allItems => {
  return pipe((resolve, reject) => {
    const acc = []
    const length = allItems.length
    let count = 0
    let wasRejected = false
    const composeThenFn = idx => value => {
      if (wasRejected) return
      acc[idx] = value
      count += 1
      if (count === length) resolve(acc)
    }
    const composeCatchFn = () => err => {
      if (wasRejected) return
      wasRejected = true
      reject(err)
    }
    allItems.forEach((item, idx) => {
      if (wasRejected) return
      if (item.then && item.catch) {
        item.then(composeThenFn(idx)).catch(composeCatchFn())
      } else {
        composeThenFn(idx)(item)
      }
    })
  })
}
pipe.race = allItems => {
  return pipe((resolve, reject) => {
    let value, error
    const composeThenFn = () => val => {
      if (value || error) return
      value = val
      resolve(val)
    }
    const composeCatchFn = () => err => {
      if (value || error) return
      error = err
      reject(err)
    }
    allItems.forEach(item => {
      if (value || error) return
      if (item.then && item.catch) {
        item.then(composeThenFn()).catch(composeCatchFn())
      } else {
        composeThenFn()(item)
      }
    })
  })
}
pipe.from = collection => {
  return pipe((resolve, reject, push) => {
    collection.forEach(push)
    resolve()
  })
}
pipe.wrap = workerFn => {
  return function (...workerFnArgs) {
    return pipe((resolve, reject) => {
      workerFn(...workerFnArgs, function (err, ...args) {
        if (err) reject(err)
        else resolve(args.length === 1 ? args[0] : args)
      })
    })
  }
}

module.exports = pipe
