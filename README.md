![TETH](./teth-logo.png "TETH")

# teth

Library for application development: minimalist, functional, reactive, pattern matching, single immutable state tree. Teth-based applications are written in **T**, a JavaScript-DSL.

[Learn about the reasons behind Teth.](WHY.md)

## NEW IN 1.0.23

A RPC-stack to exchange messages with the server much the same way as messages are send within **T** itself. Thus allowing for server-side **T** usage.

## example- and starter-project *teth-todo*

[Todo app implemented in teth and T.](https://github.com/jaqmol/teth-todo) Provides a best practice example of how to structure an app with teth.

## TOC

- [define(...) — Define T-Function](#define)
- [send(...) | invoke(...) — Invoke First Function Definition that Matches](#send-invoke)
- [send.sync(...) – Invoke Function Synchronously](#sendsync)
- [circular(...) — Invoke All Function Definitions that Match](#circular)
- [context(...) — Get/Create Computation Context](#context)
- [init(...) — Init Teth App](#init)
- [remote(...) – Teth RPC Invocation for Client](#remote)
- [valet(...) – Teth RPC Adapter for Server](#valet)
- [cestre — Centralised State Tree](#cestre)
- [pipe — Promise compatible Map/Reduce with Backpressure](#pipe)
- [route — T-based Router Integrated With Cestre ](#route)
- [HTML — Tags expressed as JS continuation](#html)

## T

A minimal functional set of enhancements to JavaScript forming a domain specific language: **T** is functional, messaging provides robustness, entry conditions minimize need for conditionals and raise expressiveness.

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

`define(<pattern>, [<middleware>], <function>)` defines T functions that can be invoked by sending messages via the computation context they are defined in.

- `<pattern>` is an object literal (or string representation thereof) and serves as function description and entry-condition at the same time. `<pattern>` is always a subset or equivalent of the message received.
- `[<middleware>]` is an optional middleware. See `cestre` to get state and perform state mutations.
- `<function>` is the handler function you provide. It's called with the `<message>` and any additional argument provides my the middleware.
- multiple `define(...)` with the same `<pattern>` are used as application-wide event hub, together with `circular(...)` to send messages.

#### conceptual discussion

**T** function definitions describe entry-conditions. Messaging further helps with behavioral decomposition of intent. When refactoring **T** code, and patterns as well as messages are adjusted, function description automatically is on par with implementation.

Using `cestre` (see below) further strengthens expressiveness in intent.

### send(...) | invoke(...)

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

`send|invoke(<message>) -> <pipe>` sends T messages via the computation context it is used from. The first T-function (defined by `define(...)`) that matches the properties of `<message>` will be invoked. The return value is resolved as pipe if not provided as a thenable (pipe, Promise, Q, etc.).

- `<message>` is an object literal. A message carries properties representing means of association, as well as properties representing values and data models.

- `<pipe>` is the return value of sending a message. Even if the handler function is not explicitly returning a `<pipe>`, T will resolve the return value with a `<pipe>`.

### send.sync(...)

``` javascript
import { h1 } from 'teth/HTML'
import { define, send } from 'teth/T'
define('render: header', msg => {
  return h1('.header-1').content('TETH')
})
send.sync('render: header')
```

`send.sync(<message>) -> <pipe>` sends synchronous messages via the computation context. T will not resolve the handler function's return value with a `<pipe>`.

- Used for T-functions that must return immediately, like during rendering `teth/HTML`.
- **Note:** use this way of calling T-functions for exceptional cases only. Most of your code should be handled in asynchronous manner in order to reduce possible future refactoring costs.

### message and pattern conventions

Because functions are defined with patterns (entry-conditions), messages play a leading role in **T**. It's important to choose a reasonable convention and stick to it throughout the application. Splitting your code-base into module-components by using computational contexts helps with keeping messages simple and local.

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

`circular(<message>) -> <pipe>` sends circular T messages via the computation context it is used from. All T-functions (defined by `define(...)`) that match the properties of `<message>` will be invoked. The return values will be collected in an array and returned as pipe.

- Behaves like `send(...)`, except it invokes all matching function definitions in the given context. Return values are resolves with an array.

### string representation of messages and patterns

The functions `define(...)`, `send(...)`, `circular(...)`, `route(...)` (and others) accept string representations (`jsonic`) of messages and patterns (object literals), e.g.

``` javascript
'role: login-event, cmd: authenticate'
// is equivalent to:
{ role: 'login-event', cmd: 'authenticate' }
```

### context(...)

``` javascript
// backbone send and context functions:
import { send, circular, context } from 'teth/T'
// create component-discrete versions of define, send and circular:
const ctx = context('my-component')
// backbone communication with other components:
send(/* ... */)
circular(/* ... */)
// invocations within this computational context only:
ctx.define(/* ... */)
ctx.send(/* ... */)
ctx.circular(/* ... */)
```

`context([<name>]) -> <discrete-context>` gets, if necessary creates, discrete named computation contexts to insulate components/services.

- If the `<name>` attribute is omitted an unnamed context is created.
- If a context is supposed to be reused in several source-code files, using a named context is recommended.

- The 3 main functions of T `define(...)`, `send(...)`, `circular(...)` imported directly from 'teth/T' belong to the backbone computation context.
- - The backbone context forms a communication channel between components and services.
- Discrete computation contexts provide separation of concern and encapsulation; they represent means to isolate components and services from each other.
- `context(<name>)` invoked several times from completely disconnected parts of the application always returns the same context. Thus providing great testability.

## init(...)

``` javascript
import remote from 'teth/init'

init({
  renderPattern: 'render: app',
  state: {
    activeRoute: 'all',
    newItemText: '',
    itemEdited: null,
    todoItems: [
      {
        text: 'buy bananas',
        isCompleted: false,
        id: auid()
      },
      // ...
    ]
  },
  selector: '.todoapp'
})
```

`init(<options>)` initialises a Teth-app.

- `<options>` is an object literal that must contain the following properties:
  - `renderPattern`: String|Object, is used to generate the message that is sent on state tree changes.
  - `state`: Object, is the initial state tree.
  - `selector`; String, the CSS selector of the element at which Teth is patching the app into the DOM.

For a full initialisation example see [latest version of Teth-Todo (frontend/src/main.js).](https://github.com/jaqmol/teth-todo)

## remote(...)

Client-side RPC invocation for Teth.

``` javascript
import remote from 'teth/remote'
// ...
remote.init('/api') // backend API route
// ...
define('init: app', state.mutate('todoItems'), msg => {
  // RPC invocation to retrieve all todo items and update the state tree
  return remote('retrieve: all-todo-items').then(items => [items])
})
```

`remote.init(<backend-api-route>)` initialises a the remote backend endpoint.

- `<backend-api-route>` a string representing the backend API route. I.e. `/api`.

`remote(<message>) -> <pipe>` sends the `<message>` to the remote backend endpoint and returns a `pipe` resolving with the result.

- `<message>` is a object literal representing the message to be send. In this respect behaves much like `send(...)`.

*Alternative Invocation:*

`remote(<context-name>, <message>) -> <pipe>` sends the `<message>` to the remote backend endpoint and there to the context specified by `<context-name>` and returns a `pipe` resolving with the result.

- `<context-name>` is the name of the named context addressed by the remote message.
- `<message>` see above.

## valet(...)

Server-side RPC adapter for Teth. Connects **T** with server side endpoint. Makes transparent RPC calls from client side **T** possible.

``` javascript
const http = require('http')
const valet = require('teth/valet')
const { define } = require('teth/T')

http.createServer(valet('/api')).listen(3030)

define('retrieve: all-todo-items', msg => {
  return /* allTodoItems */
})
```

`valet([<route>])` initialises and returns a request/response handler function compatible with NodeJS and Express.

- `<route>` if provided filters incoming request. Otherwise returns a 404 on NodeJS or invokes `next(..)` on Express.

## cestre

Centralised state tree expressed as **T** middleware. Inspired by the concept of single immutable state trees.

### initialise state tree

``` javascript
// main.js

// Init centralised state tree via cestre itself
// NOT RECOMMENDED
import cestre from 'teth/cestre'

cestre.init({
  bicycles: {
    muscle: [13, 21, 35],
    electric: [39, 43, 97]
  }
})

// Or via teth/init
// RECOMMENDED
import init from 'teth/init'

init({
  ...
  state: {
    bicycles: {
      muscle: [13, 21, 35],
      electric: [39, 43, 97]
    }
  },
  ...
})
```

### retrieve and mutate state models

``` javascript
// component.fcd.js
const state = cestre()
// Define interest in specific state in T function definition
define('render: one, from: bicycles.muscle',
  state('bicycles.muscle'), // interest for state at keypath "bicycles.muscle"
  (msg, muscle) => {
    // ...
  })
send('render: one, from: bicycles.muscle')

// component.ctx.js
const state = cestre()
// Define intent to mutate state in T function definition
define('add: one, to: bicycles.muscle',
  state.mutate('bicycles.muscle', 'bicycles.electric'), // intent to mutate states at specified keypaths
  (msg, muscle, electric) => {
    // ... perform mutations
    // return values must be array containing the mutated states in exact the same order as received
    return [muscle, electric] // patched if not instance-equal with received
  })
send('add: one, to: bicycles.muscle')
```

`cestre.init(<initial-state>) -> <state-fn>` initialize the single immutable state tree function.

- `<initial-state>` is an object literal representing the full initial state of the complete application.

`cestre() -> <stateFn>` get the state function of the centralised state tree.

- `<stateFn>` The state function allows to express interest to retrieve or mutate a state model ...

`stateFn(<key-path-a>, <key-path-b>, ...)` create **T** middleware that hands over the state specified by the provided keypaths.

- `<key-path-a>, <key-path-b>, ...` one or many key paths, which resolve to models inside the state tree. The handler of the function definition will be called with:
  1. the original `<message>` as the first argument
  2. all state models as following arguments

### state mutations

In a T-function defined with a `state.mutate(...)` middleware state changes must always be returned as arrays of the state models in exactly the same order and amount as received, message argument omitted. E.g. if the function handler was called with `msg, muscle, electric`, the return value must be `[muscle, electric]`. The return values contained in the array must be instance-inequal in order to trigger a redraw event and instance-equal not to.

So it's wrong to mutate in place, for instance by using `push(item)`. Instead a new instance must be returned:

``` javascript
// ...
(msg, muscle, electric) => {
  const item = // ...
  // in case muscle is an array:
  const newMustlePoweredBikesArray = [...muscle, item]
  return [newMustlePoweredBikesArray, electric]
})
```

In the example above only `newMustlePoweredBikesArray` will be patched into the state tree, because it's instance-inequal to `muscle`. Additionally a change event is emitted.

``` javascript
// ...
(msg, muscle, electric) => {
  const item = // ...
  // in case muscle is an object literal:
  const newMustlePoweredBikesLiteral = Object.assign({}, muscle, { item })
  return [newMustlePoweredBikesLiteral, electric]
})
```

In the example above only `newMustlePoweredBikesLiteral` will be patched into the state tree, because it's instance-inequal to `muscle`. Additionally a change event is emitted.

A middleware can be reused throughout several **T** function definitions:

``` javascript
const muscleModels = state.mutate('bicycles.muscle')
const electricModels = state.mutate('bicycles.electric')

define('add: one, to: muscle-bicycles', muscleModels,
  (msg, musclePoweredBikes) => { /* ... */ return [musclePoweredBikes] })

define('remove: one, from: muscle-bicycles', muscleModels,
  (msg, musclePoweredBikes) => { /* ... */ return [musclePoweredBikes] })

define('add: one, to: electric-bicycles', electricModels,
  (msg, electricPoweredBikes) => { /* ... */ return [electricPoweredBikes] })

define('remove: one, from: electric-bicycles', electricModels,
  (msg, electricPoweredBikes) => { /* ... */ return [electricPoweredBikes] })
```

#### conceptual discussion

Expressing the intent of state change is enforced and stated clearly at a dominant position in function definition.

This forms optimal conditions for high maintainability, test-driven design and development, continuous refactoring, as well as separation of concern. In crass contrast to the mainstream approach towards object orientation, where misguided handling of instance variables often leads to an incomprehensible chaos of side-effects and in turn is the main cause for those kind of errors that are devastating on maintainability and extendability.

## pipe

Merging promises with functional reactive map/reduce (+ debounce and throttle). Pipes run on backpressure and can be used in backends as well.

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

### creating pipes with deferrer and generator

`pipe(<deferrerFn>) -> <generatorFn>` creates a pipe.

- `<deferrerFn>` is a callback that will be called with 2 arguments: `<resolveFn>` and `<rejectFn>`.
- Behaves like it's Promise counterpart.

`<generatorFn>` can be returned from the `<deferrerFn>`.

- Will be called repeatedly with a `<nextFn>` until `<deferrerFn>` resolved or rejected.
- Every `<nextFn>` must be called only once with a value each time `<generatorFn>` is called.
- So that values are emitted as fast as subsequent consumption is performed.
- Example of a generator emitting keys of an object literal as fast as subsequent consumers can process:

  ``` javascript
  pipe((resolve, reject) => {
    const keys = Object.keys(anObjectLiteral)
    return next => {
      if (keys.length) next(keys.splice(0, 1)[0])
      else resolve()
    }
  })
  ```

### operators

`.map(<operate-fn>) -> <pipe>` `.filter(<operate-fn>) -> <pipe>` `.forEach(<operate-fn>) -> <pipe>` `.reduce(<operate-fn>) -> <pipe>` behave like their array counterparts.

`.reduce(<operate-fn>) -> <pipe>` the reduce result is retrieved by chaining a `then()`.

`.then(<operate-fn>) -> <pipe>` `.catch(<fn>)` behave like their Promise counterparts.

`.debounce(<delay>) -> <pipe>` continues the stream of operations only after a firing silence of the previous operation of at least `<delay>` milliseconds.

`.throttle(<delay>) -> <pipe>` limits the events coming from the previous operation to firing in the interval of the given `<delay>`.

### constructor functions

`pipe.resolve(<value>) -> <pipe>` returns a pipe that will resolve with the given value.

`pipe.reject(<error>) -> <pipe>` returns a pipe that will reject with the given error.

`pipe.all(<Array[Thenable]>) -> <pipe>` resolves after all thenables (Promise-compatible asynchronous computations) in the given array did resolve.

- Passes on an array of results.

`pipe.race(<Array[Thenable]>) -> <pipe>` resolves as soon as the first of all the thenables (Promise-compatible asynchronous computations) resolved.

- Passes on the respective result.

`pipe.from(<Array>) -> <pipe>` creates an iterable pipe on which `.map(<fn>)` `.filter(<fn>)` `.forEach(<fn>)` `.reduce(<fn>)` can be used, from an array of values.

`pipe.wrap(<NodeJS-style-callback>) -> <pipe>` wraps a NodeJS style callback function (1st argument error, others results) into a pipe.

- Will resolve with the given arguments in an array (if more than one), with the result value otherwise.
- Will reject on error.

*NOT RECOMMENDED: `pipe.buffer(<size>) -> <buffer>` creates a buffer that keeps maximum the `<size>` amount of emitted values before the consuming operation is retrieving them. If the consumer is too slow and a `<size>` is given, values might be omitted. Without a `<size>` given and a slow consumer the buffer might overflow and crash your application. It's advisable to structure your code so that a buffer is not needed.*

  - *`<buffer>.emit(<value>)` emits a value onto the buffer. The value is stored until a pipe consumer retrieves it or it gets pushed from the buffer by reaching the `<size>` limit.*
  - *`<buffer>.resolve(<value>)` resolves the pipe underneath the buffer.*
  - *`<buffer>.reject(<error>)` rejects the pipe underneath the buffer.*
  - *`<buffer>.pipe` the pipe underneath the buffer.*

## route

**teth** router is build on **T** and integrated into **cestre**. [Based on Route-Parser.](https://github.com/rcs/route-parser) There are 2 ways of usage which can be intermixed:

### routing by state change *(recommended)*

In the example below 4 routes are defined:

- `/#` – the base route
- `/#/active` – active route based upon base route
- `/#/completed` – completed route based upon base route
- `/#/show/:itemId` – show item route based upon base route

``` javascript
// Defining routes
const mutateRoute = state.mutate('activeRoute') // activeRoute must exist in state tree
const base = route('/#', mutateRoute, () => [{ show: 'all' }])
base.route('/active', mutateRoute, () => [{ show: 'active' }])
base.route('/completed', mutateRoute, () => [{ show: 'completed' }])
base.route('/show/:itemId', mutateRoute, msg => [{ showItem: msg.params.itemId }])

// Using route-state
define('render: something',
  state('activeRoute'),
  (msg, activeRoute) => {
    // do something with activeRoute ...
  })
```

Each call to `route(...)` returns a route-function that can be used to define sub-routes extending the one defined.

`route(<description>, <mutation-middleware>, <mutation-handler-fn>) -> <sub-route-fn>` is defining a route much alike a state-mutating T-function is defined.

- `<description>` describes the URL of the route. The syntax:

| Expression      | Description          |
| --------------- | -------------------- |
| `:name`         | a parameter to capture from the route up to `/`, `?`, or end of string  |
| `*splat`        | a splat to capture from the route up to `?` or end of string |
| `()`            | Optional group that doesn't have to be part of the query. Can contain nested optional groups, params, and splats
| anything else   | free form literals   |

``` ascii
Examples:

/some/(optional/):thing
/users/:id/comments/:comment/rating/:rating
/*a/foo/*b
/books/*section/:title
/books?author=:author&subject=:subject
```

- `<mutation-middleware>` [see cestre state mutations.](#state-mutations)
- `<mutation-handler-fn>` [see cestre state mutations.](#state-mutations) Path parameters are accessible by the property `params` from the message the handler is called with.
- `<sub-route-fn>` a function that can be used to define sub-routes. Behaves the same as `route(...)`.

### routing by messaging

`route(<description>, <pattern>) -> <sub-route-fn>` is defining a route for messaging.

- `<description>` see above section.
- `<pattern>` the pattern literal that will be extended to send route change messages. Path parameters are accessible by the property `params` from the message the receiving T-function-handler is called with.
- `<sub-route-fn>` see above section.

## HTML

HTML-Tags expressed as JS continuation. [Based on Snabbdom.](https://github.com/snabbdom/snabbdom)

For every HTML element a function is exported to create nested virtual DOM elements that are patched into the actual DOM by Snabbdom. The process is triggered by state change events emitted by `cestre`.

#### 1. To create an element call a corresponding constructor-function:

``` javascript
  import { div } from 'teth/HTML'
  const virtualDivElem = div('#element-a1.selected')
```

A constructor-function can take a CSS selector.

#### 2. Classes, attributes, styles, event-listeners and content can be added by chaining calls:

``` javascript
  import { div } from 'teth/HTML'
  div('#element-a1')
    .class({'selected', isSelected})
    .attrib({alt: 'The first element'})
    .on({click: ev => processClickOn('element-a1')})
    .content('Here comes the content')
```

#### 3. Calls to attrib(), class(), style(), on() and hook() must be called with object literals:
``` javascript
  /* ... */.class({selected: isSelected})
           .class({hidden: isHidden, dark: isDark})
```
  **Note:** All values from calls to the same method will be merged: The example above assigns all 3 classes (selected, hidden, dark) to the virtual DOM element.
#### 4. Continuation methods:
- `attrib({key: value [, ...]})` Set attributes of the DOM element.
- `class({key: value [, ...]})` Set classes of the DOM element. Keys are names of classes, values must correspond to boolean values. Evaluation to true will cause the class name to be added.
- `content(<string> * N | <Virtual-DOM-Element> * N | <Array<Virtual-DOM-Elements>)` This function is the only one that doesn't support key-value-pairs. Attributes can be strings, virtual DOM elements or an array of virtual DOM elements.
- `on({key: value [, ...]})` Set event callbacks on the DOM element. Keys are names of events, values are callback functions. Every virtual DOM element needs it's own callback function for a given event type. Sharing a directly assign callback between DOM elements is not supported. Do call shared callbacks indirectly from within in directly attached callback function.
- `style({key: value [, ...]})` Set styles of the DOM element. Keys are style-names in camel-case (not in hyphen-notation as found in CSS, and not in Pascal-case) as usual when setting styles on DOM elements from JavaScript.
- `hook({key: value [, ...]})` Set callbacks for rendering hooks. The following hooks exist:

| Name       | Triggered when            | Arguments to callback |
|------------|---------------------------|-----------------------|
| pre        | the rendering process     | none                  |
|            | begins                    |                       |
| init       | a vnode has been added    | vnode                 |
| create     | a DOM element has been    | emptyVnode, vnode     |
|            | created based on a vnode  |                       |
| insert     | an element has been       | vnode                 |
|            | inserted into the DOM     |                       |
| prepatch   | an element is about to be | oldVnode, vnode       |
|            | rendered                  |                       |
| update     | an element is being       | oldVnode, vnode       |
|            | updated                   |                       |
| postpatch  | an element has been       | oldVnode, vnode       |
|            | rendered                  |                       |
| destroy    | an element is directly or | vnode                 |
|            | indirectly being removed  |                       |
| remove     | an element is directly    | vnode, removeCallback |
|            | being removed from the    |                       |
|            | DOM                       |                       |
| post       | the render process is     | none                  |
|            | done                      |                       |

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
