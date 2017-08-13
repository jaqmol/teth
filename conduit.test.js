/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const { match, context } = require('./conduit') // { match, context, type }
const jsonic = require('jsonic')

test('matcher inline', () => {
  const message = {say: 'Hello', to: 'Mr. Smith'}
  const result = match(message)
    .define({say: 'Hello'}, msg => {
      expect(msg).toEqual(message)
      return 111
    })
    .define({say: 'Hi'}, msg => {
      expect(false).toBe(true)
      return 222
    })
    .do()
  expect(result).toBe(111)
})
test('matcher inline string', () => {
  const message = 'say: Hello, to: Mr. Smith'
  const result = match(message)
    .define('say: Hello', msg => {
      expect(msg).toEqual(jsonic(message))
      return 333
    })
    .define('say: Hi', msg => {
      expect(false).toBe(true)
      return 444
    })
    .do()
  expect(result).toBe(333)
})
test('matcher instance', () => {
  const message = {say: 'Hello', to: 'Mr. Smith'}
  const matcher = match()
  matcher.define({say: 'Hello'}, msg => {
    expect(msg).toEqual(message)
    return 555
  })
  matcher.define({say: 'Hi'}, msg => {
    expect(false).toBe(true)
    return 666
  })
  expect(matcher.do(message)).toBe(555)
})
test('define and send', done => {
  const message = {say: 'Hello', to: 'Mr. Smith'}
  const { define, send } = context()
  define({say: 'Hello'}, msg => {
    expect(msg).toEqual(message)
    return 777
  })
  define({say: 'Hi'}, msg => {
    expect(false).toBe(true)
    return 888
  })
  send(message).then(result => {
    expect(result).toBe(777)
    done()
  })
  // expect(send(message)).toBe(777)
})
test('define and context define', done => {
  const rootMessage = {talk: 'Silently', to: 'Mr. Smith'}
  const contextMessage = {talk: 'Loudly', to: 'Subcontext'}
  const { define, send } = context()
  define({talk: 'Silently'}, msg => {
    expect(msg).toEqual(rootMessage)
    return 999
  })
  const subctx = context()
  subctx.define({to: 'Subcontext'}, msg => {
    expect(msg).toEqual(contextMessage)
    return 1111
  })
  send(rootMessage)
    .then(result => {
      expect(result).toBe(999)
      return subctx.send(contextMessage)
    })
    .then(result => {
      expect(result).toBe(1111)
      done()
    })
})
test('matcher error', () => {
  expect(() => {
    match({say: 'Hello', to: 'Mr. Smith'})
      .define({say: 'Hi'}, msg => {
        expect(false).toBe(true)
      })
      .do()
  }).toThrow()
})
test('matcher unknown', () => {
  const message = {say: 'Hello', to: 'Mr. Smith'}
  match()
    .define({say: 'Hi'}, msg => {
      expect(false).toBe(true)
    })
    .unknown(msg => {
      expect(msg).toEqual(message)
    })
    .do(message)
})
test('define and unknown', () => {
  const message = {say: 'Ma shlomcha', to: 'Mar Cohen'}
  const { define, send, unknown } = context()
  define({say: 'Hello'}, msg => {
    expect(false).toBe(true)
  })
  unknown(msg => {
    expect(msg).toEqual(message)
  })
  send(message)
})
test('matcher doAll', () => {
  const results = match()
    .define('take: one', msg => msg.payload[2])
    .define('take: one', msg => msg.payload[1])
    .define('take: one', msg => msg.payload[0])
    .doAll({take: 'one', payload: [111, 222, 333]})
  expect(results).toEqual([ 333, 222, 111 ])
})
test('define and circular', done => {
  const { define, circular } = context()
  define('extract: any', msg => msg.list[4])
  define('extract: any', msg => msg.list[3])
  define('extract: any', msg => msg.list[2])
  define('extract: any', msg => msg.list[1])
  define('extract: any', msg => msg.list[0])
  circular({extract: 'any', list: [10, 20, 30, 40, 50]})
    .then(results => {
      expect(results).toEqual([ 50, 40, 30, 20, 10 ])
      done()
    })
})
test('send error', done => {
  const ctx = context()
  ctx.define('what: ever', msg => false)
  ctx.send({content: 'none'})
    .then(() => {
      expect(true).toBe(false)
      done()
    })
    .catch(() => {
      expect(true).toBe(true)
      done()
    })
})
test('circular error', done => {
  const ctx = context()
  ctx.define('what: ever', msg => false)
  ctx.circular({content: 'none'})
    .then(() => {
      expect(true).toBe(false)
      done()
    })
    .catch(() => {
      expect(true).toBe(true)
      done()
    })
})
test('simple middlewares', done => {
  const ctx = context()
  const middleware = (inputMsg, next) => {
    const payload = 111 + inputMsg.payload
    return next(Object.assign({}, inputMsg, {payload})) + 5
  }
  const terminator = msg => msg.payload
  ctx.define('check: mw', middleware, middleware, middleware, middleware, terminator)
  ctx.send('check: mw, payload: 111')
    .then(result => {
      expect(result).toBe(575)
      done()
    })
})
test('argument multiplier middleware', () => {
  const message = {check: 'middleware', payload: '!11'}
  const ctx = context()
  const middleware = (msg, next) => {
    const result = next(msg, 'hi', 'there', 13)
    result[result.length - 1] = result[result.length - 1] + '37'
    return result
  }
  ctx.define('check: middleware', middleware, (msg, arg1, arg2, arg3) => {
    return [msg.payload, arg1, arg2, arg3]
  })
  ctx.send(message)
    .then(result => {
      expect(result).toEqual([ '!11', 'hi', 'there', '1337' ])
    })
})
// The usefulness of types needs to be discussed
// test('type', () => {
//   const Adder = type(
//     {var1: /\d+/, var2: /\d+/},
//     initData => ({
//       add: var3 => initData.var1 + initData.var2 + var3
//     })
//   )
//   const inst = Adder({var1: 3, var2: 5})
//   expect(inst.add(7)).toBe(15)
//   expect(() => Adder({var3: 3, var4: 5})).toThrow()
//   expect(() => Adder({var1: 'one', var2: 'two'})).toThrow()
// })
