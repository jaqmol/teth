/* Copyright 2017 Ronny Reichmann */
/* WATCH source files for changes */

const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const spawn = require('child_process').spawn

const directoryPath = argv._[0]
const scriptToExecute = argv._[1]
if (!directoryPath) throw new Error('Specify directory path to watch as first argument')
if (!scriptToExecute) throw new Error('Specify NPM script name to execute on change as second argument')
const npmArgs = ['run', scriptToExecute]

const watchingMessage = `Watching for changes in ${directoryPath} ...`
const executingMessage = `Change detected, executing npm-script: ${scriptToExecute}`

fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {
  console.log(executingMessage)
  const proc = spawn('npm', npmArgs, { stdio: 'inherit' })
  proc.on('close', code => {
    if (code === 1) console.error('Error while watching for changes, see above')
    else console.log(watchingMessage)
  })
  proc.on('error', err => {
    console.error(err)
  })
})

console.log(watchingMessage)
