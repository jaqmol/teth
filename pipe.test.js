/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const pipe = require('./pipe')

test('synchronous pipe', done => {
  pipe((resolve, reject) => { resolve(1) })
    .then(result => result + 1)
    .then(result => result + 2)
    .then(result => result + 3)
    .then(result => {
      expect(result).toBe(7)
      done()
    })
})
test('asynchronous pipe', done => {
  function asyncResolve (resolve, reject) {
    setTimeout(() => { resolve(11) }, 121)
  }
  pipe(asyncResolve)
    .then(result => result + 33)
    .then(result => {
      expect(result).toBe(44)
      done()
    })
})
test('pipe reject', done => {
  const e = new Error('Pipe test error')
  function asyncResolve (resolve, reject) {
    reject(e)
  }
  pipe(asyncResolve)
    .then(result => {
      expect(false).toBe(true)
      done()
    })
    .catch(error => {
      expect(error).toBe(e)
      done()
    })
})
test('then return pipe', done => {
  pipe(resolve => { resolve(1) })
    .then(result => pipe(resolve => {
      setTimeout(() => { resolve(result + 1) }, 11)
    }))
    .then(result => pipe(resolve => {
      setTimeout(() => { resolve(result + 2) }, 22)
    }))
    .then(result => pipe(resolve => {
      setTimeout(() => { resolve(result + 3) }, 33)
    }))
    .then(result => {
      expect(result).toBe(7)
      done()
    })
})
test('pipe.resolve', done => {
  pipe.resolve(13)
    .then(result => {
      expect(result).toBe(13)
      done()
    })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('pipe.reject', done => {
  const e = new Error('Pipe reject test')
  pipe.reject(e)
    .then(() => {
      expect(false).toBe(true)
      done()
    })
    .catch(error => {
      expect(error).toBe(e)
      done()
    })
})
test('pipe.all resolve', done => {
  const allPipes = [
    pipe(resolve => {
      setTimeout(() => { resolve(111) }, 33)
    }),
    pipe(resolve => {
      setTimeout(() => { resolve(222) }, 22)
    }),
    pipe(resolve => {
      setTimeout(() => { resolve(333) }, 11)
    })
  ]
  pipe.all(allPipes)
    .then(allResults => {
      expect(allResults).toEqual([111, 222, 333])
      done()
    })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('pipe.all reject', done => {
  const e = new Error('Pipe all reject test')
  const allPipes = [
    pipe(resolve => {
      setTimeout(() => { resolve(111) }, 33)
    }),
    pipe((r, reject) => {
      setTimeout(() => { reject(e) }, 22)
    }),
    pipe(resolve => {
      setTimeout(() => { resolve(333) }, 11)
    })
  ]
  pipe.all(allPipes)
    .then(allResults => {
      expect(false).toBe(true)
      done()
    })
    .catch(error => {
      expect(error).toBe(e)
      done()
    })
})
test('pipe.race resolve', done => {
  const allPipes = [
    pipe(resolve => {
      setTimeout(() => { resolve(111) }, 33)
    }),
    pipe(resolve => {
      setTimeout(() => { resolve(222) }, 22)
    }),
    pipe(resolve => {
      setTimeout(() => { resolve(333) }, 11)
    })
  ]
  pipe.race(allPipes)
    .then(firstResult => {
      expect(firstResult).toBe(333)
      done()
    })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('pipe.race reject', done => {
  const e = new Error('Pipe race reject test')
  const allPipes = [
    pipe(resolve => {
      setTimeout(() => { resolve(333) }, 33)
    }),
    pipe((r, reject) => {
      setTimeout(() => { reject(e) }, 11)
    }),
    pipe(resolve => {
      setTimeout(() => { resolve(555) }, 22)
    })
  ]
  pipe.all(allPipes)
    .then(allResults => {
      expect(false).toBe(true)
      done()
    })
    .catch(error => {
      expect(error).toBe(e)
      done()
    })
})
test('resolve with undefined value', done => {
  pipe(resolve => {
    setTimeout(() => { resolve() }, 33)
  }).then(() => {
    expect(true).toBe(true)
    done()
  }).catch(() => {
    expect(false).toBe(true)
    done()
  })
})
test('from iterable and forEach', done => {
  const iterable = [11, 22, 33, 44, 55, 66, 77]
  pipe.from(iterable)
    .forEach(item => {
      expect(iterable.indexOf(item)).not.toBe(-1)
    })
    .then(() => { done() })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('async push and forEach', done => {
  const allItems = [111, 222, 333]
  function asyncPush (resolve, reject, push) {
    setTimeout(() => { push(allItems[0]) }, 3)
    setTimeout(() => { push(allItems[1]) }, 7)
    setTimeout(() => { push(allItems[2]) }, 9)
    setTimeout(() => { resolve() }, 11)
  }
  pipe(asyncPush)
    .forEach(item => {
      expect(allItems.indexOf(item)).not.toBe(-1)
    })
    .then(() => { done() })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('simple map with forEach', done => {
  const iterable = [11, 22, 33, 44, 55, 66, 77]
  pipe.from(iterable)
    .map(item => item + 1000)
    .forEach(item => {
      expect(iterable.indexOf(item - 1000)).not.toBe(-1)
    })
    .then(() => { done() })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('multiple map with forEach', done => {
  const iterable = [11, 22, 33, 44, 55, 66, 77]
  pipe.from(iterable)
    .map(item => item + 1000)
    .map(item => item - 25)
    .forEach(item => {
      expect(iterable.indexOf(item - (1000 - 25))).not.toBe(-1)
    })
    .then(() => { done() })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('async map with forEach', done => {
  const iterable = [11, 22, 33, 44, 55, 66, 77]
  pipe.from(iterable)
    .map(item => pipe(resolve => {
      setTimeout(() => { resolve(item + 1000) }, 3)
    }))
    .map(item => pipe(resolve => {
      setTimeout(() => { resolve(item - 25) }, 5)
    }))
    .forEach(item => {
      expect(iterable.indexOf(item - (1000 - 25))).not.toBe(-1)
    })
    .then(() => { done() })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('filter with forEach', done => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const output = [1, 3, 5, 7, 9]
  pipe.from(input)
    .filter(item => Math.abs(item % 2) === 1)
    .forEach(item => {
      expect(output.indexOf(item)).not.toBe(-1)
    })
    .then(() => { done() })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('async filter with forEach', done => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const output = [1, 3, 5, 7, 9]
  pipe.from(input)
    .filter(item => pipe(resolve => {
      setTimeout(() => { resolve(Math.abs(item % 2) === 1) }, 3)
    }))
    .forEach(item => {
      expect(output.indexOf(item)).not.toBe(-1)
    })
    .then(() => { done() })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('reduce with resolve', done => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  pipe.from(input)
    .reduce((s, n) => s + n, 0)
    .then(sum => {
      expect(sum).toBe(45)
      done()
    })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('async reduce with resolve', done => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  pipe.from(input)
    .reduce((s, n) => pipe((resolve, reject) => {
      setTimeout(() => { resolve(s + n) }, 11)
    }), 0)
    .then(sum => {
      expect(sum).toBe(45)
      done()
    })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('complex streaming with resolve', done => {
  const inputA = [2, 4, 6, 8, 10]
  const inputB = [1, 3, 5, 7, 9]
  function getSimpleNumbers () {
    return pipe((resolve, reject, push) => {
      inputA.forEach(push)
      resolve()
    })
  }
  function makeObjectLiterals (sum) {
    return pipe((resolve, reject, push) => {
      inputB.forEach(num => { push({ sum, num }) })
      resolve()
    })
  }
  getSimpleNumbers()
    .reduce((s, n) => s + n, 0)
    .then(sum => {
      return makeObjectLiterals(sum)
        .map(o => Object.assign(o, {num: o.num + 1}))
    })
    .map(({sum, num}) => sum * num)
    .reduce((s, n) => s + n, 0)
    .then(sum => {
      expect(sum).toBe(900)
      done()
    })
    .catch(() => {
      expect(false).toBe(true)
      done()
    })
})
test('debounce', done => {
  const allDelays = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]
  function generateEvents () {
    return pipe((resolve, reject, push) => {
      while (allDelays.length) {
        const counter = allDelays.length
        const nextDelay = allDelays.splice(0, 1)[0]
        const shouldResolve = allDelays.length === 0
        setTimeout(() => {
          push({date: Date.now(), counter})
          if (shouldResolve) resolve()
        }, nextDelay)
      }
    })
  }
  const arrivalTimes = []
  const debounceDelay = 15
  generateEvents()
    .debounce(debounceDelay)
    .forEach(event => {
      expect(event.date).toBeDefined()
      expect(event.counter).toBeDefined()
      arrivalTimes.push(Date.now())
    })
    .then(() => {
      const allDifferences = []
      for (var i = 1; i < arrivalTimes.length; i++) {
        const a = arrivalTimes[i]
        const b = arrivalTimes[i - 1]
        allDifferences.push(a - b)
      }
      return allDifferences
    })
    .then(allDifferences => {
      for (var i = 0; i < allDifferences.length; i++) {
        const diff = allDifferences[i]
        expect(diff).toBeGreaterThanOrEqual(debounceDelay)
      }
      done()
    })
    .catch(error => {
      console.error(error)
      expect(false).toBe(true)
      done()
    })
})
test('wrapping of node callback functions', done => {
  function positiveTestFn (arg1, arg2, arg3, callback) {
    callback(undefined, arg1 + arg2 + arg3)
  }
  function negativeTestFn (arg1, callback) {
    callback('TEST-ERROR')
  }
  const wrappedPositiveTestFn = pipe.wrap(positiveTestFn)
  const wrappedNegativeTestFn = pipe.wrap(negativeTestFn)
  let count = 0
  function doneIfDone () {
    count += 1
    if (count === 2) done()
  }
  wrappedPositiveTestFn(1, 3, 5)
    .then(result => {
      expect(result).toBe(9)
      doneIfDone()
    })
  wrappedNegativeTestFn(9)
    .catch(err => {
      if (err) {
        expect(err).toBe('TEST-ERROR')
      } else {
        expect(false).toBe(true)
      }
      doneIfDone()
    })
})
