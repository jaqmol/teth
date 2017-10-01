![TETH](./teth-logo.svg "TETH")

# teth

Library for application development: minimalist, functional, reactive, pattern matching, single immutable state tree. Teth-based applications are written in **T**, a JavaScript-DSL.

## Why?

Static/strong typing does not guarantee program correctness! Popular JS preprocessor-languages fail to make substantial contributions to fix complexity- and robustness-problems.

> "Static Types Give You a False Sense of Security" — Eric Elliot, [The Shocking Secret About Static Types](https://medium.com/javascript-scene/the-shocking-secret-about-static-types-514d39bf30a3)

> “Whilst not conclusive, the lack of evidence in the charts that more advanced type languages are going to save us from writing bugs is very disturbing.” — Daniel Lebrero, [The broken promise of static typing](https://labs.ig.com/static-typing-promise)

Expressing everything as a (lazily named) class and scattering business logic throughout deep and poorly conceived inheritance trees, have rendered countless software-projects nearly unmaintainable.

`Teth` takes a different path by simplifying the complex and providing affordance for explicit expression, to omit the potentially harmful:

- Test-Driven-Development with Functional-Reactive Programming
- Entry Conditions and Computation Contexts
- Explicit State Mutations without Side-Effects

## Example and starter project: **teth-todo**

[Todo app implemented in teth and T.](https://github.com/jaqmol/teth-todo) Provides you a best practice example of how to structure an app with teth.

## TOC

- [define(...) — Define T-Function](#define)
- [send(...) — Invoke First Function Definition that Matches](#send)
- [circular(...) — Invoke All Function Definitions that Match](#circular)
- [context.get(...) — Get/Create Computation Context](#context-get)
- [init(...) — Init Teth App](#init)
- [cestre — Centralised State Tree](#cestre)
- [pipe — Promise compatible Map/Reduce with Backpressure](#pipe)
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

`send(<message>) -> <pipe>` sends T messages via the computation context it is used from. The first T-function (defined by `define(...)`) that matches the properties of `<message>` will be invoked. The return value is resolved as pipe if not provided as a thenable (pipe, Promise, Q, etc.).

- `<message>` is an object literal. A message carries properties representing means of association, as well as properties representing values and data models.

- `<pipe>` is the return value of sending a message. Even if the handler function is not explicitly returning a `<pipe>`, T will resolve the return value with a `<pipe>`.

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

### context.get(...)

``` javascript
// backbone send and context functions:
import { send, circular, context } from 'teth/T'
// create component-discrete versions of define, send and circular:
const ctx = context.get('my-component')
// backbone communication with other components:
send(/* ... */)
circular(/* ... */)
// invocations within this computational context only:
ctx.define(/* ... */)
ctx.send(/* ... */)
ctx.circular(/* ... */)
```

`context.get(<name>) -> <discrete-context>` gets, if necessary creates, discrete named computation contexts to insulate components/services.

- The 3 main functions of T `define(...)`, `send(...)`, `circular(...)` imported directly from 'teth/T' belong to the backbone computation context.
- Discrete computation contexts provide separation of concern and encapsulation; they represent the means to isolate components and services from each other.
- `context.get(...)` invoked several times from completely disconnected parts of the application always returns the same context. Thus providing great testability.
- The backbone context forms a communication channel between components and services.

### context()

`context() -> <discrete-context>` creates an unnamed discrete computation contexts to insulate components/services.

- Contexts behave like those created with `context.get(...)`.

## init(...)

``` javascript
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

## cestre

Centralised state tree expressed as **T** middleware. Inspired by the concept of single immutable state trees.

``` javascript
// main.js
// Init centralised state tree via cestre itself
import cestre from 'teth/cestre'
cestre.init({
  bicycles: {
    muscle: [13, 21, 35],
    electric: [39, 43, 97]
  }
})
// Or via teth/init
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
// component.fcd.js
// Retrieve state function
const state = cestre()
// Define interest in specific state in T function definition
define('render: one, from: bicycles.muscle',
  state('bicycles.muscle'), // interest for state at keypath "bicycles.muscle"
  (msg, muscle) => {
    // ...
  })
send('render: one, from: bicycles.muscle')
// component.ctx.js
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

`stateFn(<key-path-a>, <key-path-b>, ...)` create **T** middleware that hands over the state specified by the provided keypaths.

- `<key-path-a>, <key-path-b>, ...` one or many key paths, which resolve to models inside the state tree. The handler function will be called with:
  1. the original `<message>` as the first argument
  2. all state models as following arguments

### State mutations

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
