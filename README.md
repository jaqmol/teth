![Teth Logo](./teth-logo.svg "Teth Logo")

# teth

Frontend library for the browser: minimalist, functional, reactive, pattern matching, single immutable state tree. Teth-based applications are written in **T**, a JavaScript-DSL.

## T

A functional domain specific language in JavaScript. A minimal set of enhancements concerning pattern matching and message passing. Business logic in T is express in functional style; data models, messages and entry conditions are expressed as object literals.

##### compatible

Any JavaScript library can be used from T. Calling into T from JavaScript is the same as sending messages inside pure T.

### define(...)

``` javascript
import { define } from 'teth/T'
define({ key: 'Enter' }, event => {
  // Process the user input on enter
})
define('key: Escape', event => {
  // Dismiss the user input on escape
})
```

`define(<pattern>, <function>)` defines T functions.

- `<pattern>` is an object literal (or string representation thereof) and serves as function description and entry-condition at the same time. `<pattern>` is always a subset or equivalent of the message received.
- `<function>` is the handler function you provide. It's called with the `<message>`.
- multiple `define(...)` are used to register handlers for messages that are of interest in several parts of the app. Though `circular(...)` must be used instead of `send(...)` then.

#### conceptual discussion

**T** function definitions are based upon describing entry-conditions. Messaging further helps with behavioral decomposition of intent. When refactoring **T** code, and patterns and messages are adjusted, the function description automatically is on par with implementation.

Using sister (see below) further strengthens expressiveness in intent.

### send(...)

``` javascript
import { define, send } from 'teth/T'
define('key: Enter', event => {
  // Process the user input on enter
})
define({ key: 'Escape' }, event => {
  // Dismiss the user input on escape
})
send({ key: event.key, value: event.target.value})
  .then(result => {
    // process result
  })
  .catch(error => {
    // handle error
  })
```

`send(<message>) -> <pipe>` sends T messages.

- `<message>` is an object literal. A message carries properties representing means of association, as well as properties representing values and data models.

- `<pipe>` is the return value of sending a message. Even if the handler function is not explicitly returning a `<pipe>`, T will resolve the return value with a `<pipe>`.

### message and pattern conventions

``` javascript
{
  type: 'dsl',
  cmd: 'use',
  data: '01010100'
}
```

Because T functions are defined with message-patterns (entry-conditions), messages should be composed following a convention. Here are 3 proposals:

  - role-cmd:
    - `role: <string>` describes the role which the message is associated with
    - `cmd: <string>` describes what is supposed to happen upon reception reception
  - type-action:
    - `type: <string>` is the type of the message
    - `action: <string>` describes what is supposed to happen upon reception
  - type-cmd:
    - `type: <string>` is the type of the message
    - `cmd: <string>` describes what is supposed to happen upon reception
  - The message can be extended by one or many `[data|payload|...: <data>]` that carry values or data models to be processed
  - It's important to choose one convention and stick to it throughout the application.

Patterns (entry-conditions) of T function definitions should contain the 2 main properties of the message convention. Here's an example of non-naive (non-tutorial) usage of patterns and message:

``` javascript
import { define, send } from 'teth/T'
define('type: event, cmd: process-input, key: Enter'}, event => {
  // Process the user input on enter
})
define({type: 'event', cmd: 'process-input', key: 'Escape'}, event => {
  // Dismiss the user input on escape
})
send({type: 'event', cmd: 'process-input', key: event.key, value: event.target.value})
  .then(result => {
    // process result
  })
  .catch(error => {
    // handle error
  })
```

### circular(...)

``` javascript
import { define, circular } from 'teth/T'
// in component-alpha.js
define('type: route, cmd: change', msg => { /* ... */ })
// in component-beta.js
define('type: route, cmd: change', msg => { /* ... */ })
// in component-gamma.js
define('type: route, cmd: change', msg => { /* ... */ })
// in main.js & on route change:
  circular({type: 'route', cmd: 'change', route: routeIdentifier})
    .then(results => {
      // process results
    })
    .catch(error => {
      // handle error
    })
```

`circular(<message>) -> <pipe>` sends circular T messages.

- Behaves like `send(...)`, except it resolves with an array of results.

### string representation of messages and patterns

The functions `match(...)`, `do(...)`, `define(...)`, `send(...)`, `circular(...)` accept string representations (`jsonic`) of messages and patterns (object literals), e.g.

``` javascript
'role: login-event, cmd: authenticate'
// is equivalent to:
{ role: 'login-event', cmd: 'authenticate' }
```

### context(...)

``` javascript
// file component-alpha.js
import rootCtx from 'teth/T'
// create component-discrete versions of define, send and circular:
const { define, send, circular } = rootCtx.context()
// backbone communication with other components:
rootCtx.define(/* ... */)
rootCtx.send(/* ... */)
rootCtx.circular(/* ... */)
```

`context() -> <discrete-context>` creates discrete computation contexts to insulate components/services.

- The 3 main functions of T `define(...)`, `send(...)`, `circular(...)` imported directly from 'teth/T' belong to the root computation context.
- The `context(...)` function creates additional discrete computation contexts for the purpose of separation of concern and encapsulation.
- Discrete computation contexts are the means to separate components and services from each other.
- The root context forms the backbone communication channel between components and services.

## sistre

Single immutable state tree expressed as **T** middleware.

``` javascript
// Init single immutable state tree
const state = sistre.init({
  bicycles: {
    muscle: [13, 21, 35],
    electric: [39, 43, 97]
  }
})
// Define intent of state change in T function definition
define('add: one, to: bicycles.muscle',
  state('bicycles.muscle'), // state change intent for keypath "bicycles.muscle"
  (msg, muscle) => {
    // ...
  })
send('add: one, to: bicycles.muscle')
```

`sistre.init(<initial-state>) -> <state-fn>` initialize the single immutable state tree function.

- `<initial-state>` is an object literal representing the full initial state of the complete application.

`stateFn(<key-path-a>, <key-path-b>, ...)` create **T** middleware that adds data models to call arguments of handler function.

- `<key-path-a>, <key-path-b>, ...` one or many key paths, which resolve to data models, which will be added to call arguments of handler function. The handler function will be called with:
  1. the original `<message>` that was sent
  2. all data models requested by the key-paths

A middleware can be reused throughout several **T** function definitions:

``` javascript
const muscleModels = state('bicycles.muscle')
const electricModels = state('bicycles.electric')

define('add: one, to: muscle-bicycles', muscleModels,
  (msg, musclePoweredBikes) => { /* ... */ })

define('remove: one, from: muscle-bicycles', muscleModels,
  (msg, musclePoweredBikes) => { /* ... */ })

define('add: one, to: electric-bicycles', electricModels,
  (msg, electricPoweredBikes) => { /* ... */ })

define('remove: one, from: electric-bicycles', electricModels,
  (msg, electricPoweredBikes) => { /* ... */ })
```

`stateFn.mutate(<key-path-a>, <key-path-b>, ...) -> <changes-array>` TODO continue

#### conceptual discussion

Expressing the intent of state change is enforced and stated clearly at a dominant position in function definition.

This forms optimal conditions for high maintainability, test-driven design and development, as well as separation of concern and continuous refactoring. In contrast to the mainstream approach towards object orientation.

## pipe

Merging promises with functional reactive map/reduce (+ debounce and throttle). Pipes can be used in backends as well.

``` javascript
// ...
const readFile = pipe.wrap(fs.readFile)
const writeFile = pipe.wrap(fs.writeFile)
// ...
readFile('./package.json', 'utf8')
  .then(packString => JSON.parse(packString))
  .then(pack => pipe((resolve, reject) => {
    const keys = Object.keys(allScripts)
    return next => {
      if (keys.length) next(keys.splice(0, 1)[0])
      else resolve()
    }
  }))
  .filter(lit => !lit.pack.scripts[lit.key])
  .map(lit => {
    lit.pack.scripts[lit.key] = lit.value
    return lit.pack
  })
  .reduce((r, i) => i)
  .then(pack => JSON.stringify(pack, null, 2))
  .then(packString => writeFile('./package.json', packString))
  .then(() => { /* ... */ })
  .catch(console.error)
```

## HTML

**TODO: finish description**

## facade

Functional reactive HTML without writing HTML. **TODO: finish description**

### match(...)

The pattern matching facility on top of which `define(...)`, `send(...)`, `circular(...)` and `context(...)` are built. It can be used as an alternative for conditionals.

``` javascript
import { match } from 'teth/T'
// ...
match(event)
  .define({ key: 'Enter' }, event => {
    // Process the user input on enter
  })
  .define({ key: 'Escape' }, event => {
    // Dismiss the user input on escape
  })
  .do()
```

A matcher instance can be used to store and reuse conditional computation trees.

``` javascript
const matcher = match()
  .define({ key: 'Enter' }, event => /* Process the user input on enter */)
  .define({ key: 'Escape' }, event => /* Dismiss the user input on escape */)
// ...
matcher.do(event)
```

If a matcher is triggered with a literal it does not know, it trows an error. Until ...

``` javascript
const matcher = match()
  .define({ key: 'Enter' }, event => /* Process the user input on enter */)
  .define({ key: 'Escape' }, event => /* Dismiss the user input on escape */)
  .unknown(msg => /* Handle unknown { role: 'provoker', cmd: 'should-throw' } */)
// ...
matcher.do('role: provoker, cmd: should-throw')
```

... error handling is done by attaching an unknown-handler.

## Only possible with JavaScript™ ;)

Or as Douglas put it:
> [JavaScript: The World's Most Misunderstood Programming Language](http://www.crockford.com/javascript/javascript.html)
