# *ט* teth
Functional, reactive, pattern matching based, single immutable state tree, pure and clean open source JS lib.

## teth **pipe**

Merging promises with functional reactive map/reduce and debounce.

``` javascript
// ...
const readFile = pipe.wrap(fs.readFile)
const writeFile = pipe.wrap(fs.writeFile)
// ...
readFile('./package.json', 'utf8')
  .then(packString => JSON.parse(packString))
  .then(pack => pipe((resolve, reject, push) => {
    Object.keys(allScripts).forEach(key => {
      push({ pack, key, value: allScripts[key] })
    })
    resolve()
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
Good for frontend and backend.

## teth **conduit**

Pattern matching and message passing based domain specific language in JavaScript.

## teth **sistre**

Single immutable state tree expressed as **conduit** middleware.

## teth **facade**

Functional reactive HTML without writing HTML.

## endorsing javascript

As Douglas put it:
> [JavaScript: The World's Most Misunderstood Programming Language](http://www.crockford.com/javascript/javascript.html)
