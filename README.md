<svg width="28px" height="39px" viewBox="0 0 28 39" style="float: left; margin: 57px 15px 0 0;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 43.2 (39069) - http://www.bohemiancoding.com/sketch -->
    <desc>Created with Sketch.</desc>
    <defs></defs>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Group">
            <path d="M7.2506135,4.47972973 C4.97043825,6.60289394 3.2622124,8.83233115 2.12590029,11.1680838 C0.708626342,14.0813692 0,17.5221437 0,21.4905108 C0,24.8132308 0.539343383,27.8485136 1.61804633,30.5964503 C2.69674927,33.344387 4.17305415,35.4308979 6.04700526,36.8560456 C7.92095636,38.2811933 10.0862035,38.9937565 12.5428117,38.9937565 C15.6135719,38.9937565 18.2236789,38.1709625 20.3732111,36.52535 C22.5227432,34.8797375 24.1683311,32.3719876 25.310024,29.0020251 C26.4517169,25.6320626 27.0225547,21.5141562 27.0225547,16.6481824 C27.0225547,14.4907765 26.7469778,12.9042408 26.1958157,11.8885278 C25.6446537,10.8728148 24.731313,10.364966 23.4557665,10.364966 C22.6683921,10.364966 21.4991586,10.573617 19.948031,10.9909255 C18.3969034,11.4082339 16.6843898,11.9869454 14.8104387,12.7270774 L13.6293829,13.1758786 L14.6450909,16.6009401 C16.2198397,16.0182831 17.5465457,15.5261814 18.6252486,15.1246205 C19.7039516,14.7230595 20.4401356,14.5222821 20.8338228,14.5222821 C21.3692374,14.5222821 21.7550451,14.6325128 21.9912574,14.8529777 C22.2274697,15.0734425 22.4164367,15.4356293 22.5581641,15.9395489 C22.6998915,16.4434685 22.7707542,17.1520949 22.7707542,18.0654492 C22.7707542,21.5141491 22.353452,24.5651792 21.5188351,27.218631 C20.6842182,29.8720828 19.5346688,31.8483629 18.0701524,33.1475307 C16.605636,34.4466985 14.8813119,35.0962726 12.8971284,35.0962726 C11.1649047,35.0962726 9.65710531,34.5529924 8.37368501,33.4664157 C7.09026472,32.379839 6.08244059,30.7854298 5.35018239,28.6831401 C4.61792418,26.5808504 4.25180057,24.2226994 4.25180057,21.6086164 C4.25180057,18.081179 4.81476483,15.1285692 5.94071024,12.7506985 C6.84400704,10.8430367 8.21604458,9.04181722 10.0568516,7.34700567 L10.0568516,4.47972973 L7.2506135,4.47972973 Z" id="Combined-Shape" fill="#6F6F6F"></path>
            <polygon id="Rectangle" fill="#0076FF" fill-rule="nonzero" points="11.0784137 10.4855083 14.6358461 10.4855083 14.6358461 0.0658783784 4.21621622 0.0658783784 4.21621622 3.62331081 11.0784137 3.62331081"></polygon>
        </g>
    </g>
</svg>

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

- `<pattern>` is an object literal (or string representation thereof) and serves as function description and entry-condition at the same time. `<pattern>` is always a subset or equivalent of the message received. *There are no function names in T. When refactoring T code leads to changes in an entry-condition (`<pattern>`), it automatically reflects positively upon function description.*
- `<function>` is the handler function you provide. It's called with the `<message>`.
- multiple `define(...)` are used to register handlers for messages that are of interest in several parts of the app. Though `circular(...)` must be used instead of `send(...)` then.

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

- Behaves like `send(...)`, except it resolves with an array of results

### string representation of messages and patterns

The functions `match(...)`, `do(...)`, `define(...)`, `send(...)`, `circular(...)` accept string representations (`jsonic`) of messages and patterns (object literals), e.g.

``` javascript
'role: login-event, cmd: authenticate'
// is equivalent to:
{ role: 'login-event', cmd: 'authenticate' }
```

### context(...)

The 3 main function of T `define(...)`, `send(...)`, `circular(...)` imported directly from 'teth/T' belong to the root computation context. The `context(...)` function creates additional discrete computation contexts for the purpose of separation of concern and encapsulation.

Discrete computation contexts are the means to separate components and services from each other. The root context forms the backbone communication channel between components and services.

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

## sistre

Single immutable state tree expressed as **T** middleware. **TODO: finish description**

## HTML

**TODO: finish description**

## facade

Functional reactive HTML without writing HTML. **TODO: finish description**

## Only possible with JavaScript™ ;)

Or as Douglas put it:
> [JavaScript: The World's Most Misunderstood Programming Language](http://www.crockford.com/javascript/javascript.html)
