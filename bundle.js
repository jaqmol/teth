/* Copyright 2017 Ronny Reichmann */
/* BUNDLE teth source files, yet without concurrency-support */

const argv = require('minimist')(process.argv.slice(2))
const path = require('path')
const fs = require('fs')
const initBrowserify = require('browserify')
// const through = require('through')
const UglifyJS = require('uglify-es')
const pipe = require('./pipe')
const mkdirp = pipe.wrap(require('mkdirp'))
const fsWriteFile = pipe.wrap(fs.writeFile)

const performBundling = pipe.wrap((filePath, debug, callback) => {
  const browserify = initBrowserify(filePath, { debug })
  browserify.bundle(callback)
})
function performMinifying (sourceString) {
  return pipe((resolve, reject) => {
    const result = UglifyJS.minify(sourceString)
    if (result.error) reject(result.error)
    else resolve(result.code)
  })
}

function bundleJS (config) {
  if (!config.inputFilePath) return pipe.reject(new Error('config.inputFilePath missing'))
  if (!config.outputDirectoryPath) return pipe.reject(new Error('config.outputDirectoryPath missing'))
  const outputFileName = config.outputFileName || path.basename(config.inputFilePath)
  const outputFilePath = `${config.outputDirectoryPath}${path.sep}${outputFileName}`
  return mkdirp(config.outputDirectoryPath)
    .then(() => performBundling(config.inputFilePath, config.debug))
    .then(buff => buff.toString('utf8'))
    .then(srcStr => {
      if (config.debug) return srcStr
      else return performMinifying(srcStr)
    })
    .then(minSrcStr => fsWriteFile(outputFilePath, minSrcStr))
    .then(() => outputFilePath)
}

function commandLineBundleJS () {
  const inputFilePath = argv['i'] || argv['in']
  const outputDirectoryPath = argv['o'] || argv['out']
  const outputFileName = argv['f'] || argv['filename']
  const debug = argv['d'] || argv['debug']
  if (!inputFilePath) console.error('Specify an input file path with parameter -i|-in')
  else if (!outputDirectoryPath) console.error('Specify an output directory path with parameter -o|-out')
  else {
    console.log('Input file path:', inputFilePath)
    if (debug) console.log('Debug mode')
    bundleJS({ inputFilePath, outputDirectoryPath, outputFileName, debug })
      .then(outputFilePath => {
        console.log('Bundled output file path:', outputFilePath)
      })
      .catch(err => {
        console.error(err)
      })
  }
}

if (require.main === module) commandLineBundleJS()

module.exports = bundleJS
