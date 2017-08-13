const fs = require('fs')
const pipe = require('./pipe')
const readFile = pipe.wrap(fs.readFile)
const writeFile = pipe.wrap(fs.writeFile)
const tthpth = '../teth'

// TETH INIT
// inject scripts and dependencies into a projects package.json

const allScripts = {
  'bndl-js-prd': `node ${tthpth}/bundle.js -i ./src/main.js -o ./app-bundle -f app.js`,
  'bndl-js-dev': `node ${tthpth}/bundle.js -i ./src/main.js -o ./app-bundle -f app.js --debug`,
  'cp-css': 'cpy ./src/**/*.css ./app-bundle',
  'cp-idx': 'cpy ./src/index.html ./app-bundle',
  'clr': 'rimraf ./app-bundle',
  'bld-prd': 'npm run clr && npm run bndl-js-prd && npm run cp-idx && npm run cp-css',
  'bld-dev': 'npm run clr && npm run bndl-js-dev && npm run cp-idx && npm run cp-css',
  'build': 'npm run bld-dev',
  'deploy': 'npm run bld-prd',
  'auto-build': `node ${tthpth}/watch.js ./src build`,
  'auto-reload': 'reload -d ./app-bundle -s ./app-bundle/index.html -b'
}

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
  .then(() => {
    console.log('Please install the following packages:')
    console.log('  npm install cpy-cli --save-dev')
    console.log('  npm install reload --save-dev')
    console.log('  npm install rimraf --save-dev')
    console.log('Then you\'re done.')
  })
  .catch(console.error)
