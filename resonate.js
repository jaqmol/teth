/* Copyright 2017 Ronny Reichmann */
/* RESONATE _will_ provide concurrency */

const path = require('path')
const auid = require('./auid')
const hub = {}
const allWorkerConfigs = []
const blankPerform = () => { return undefined }

function workerConfig (sourceFilePath) {
  const runtimeFileName = 'wrkr_' + auid()
  return { sourceFilePath, runtimeFileName }
}

function send (msg) {

}

function circular (msg) {

}

hub.send = blankPerform
hub.circular = blankPerform
hub.add = filePath => {
  if (path.extname(filePath) !== '.js') filePath += '.js'
  const config = workerConfig(filePath)
  allWorkerConfigs.push(config)
  if (allWorkerConfigs.length === 1) {
    hub.send = send
    hub.circular = circular
  }
  /*
  if (run in test environment / respectively node.js) start via tiny workerConfig
  else if (run in deployment) start via runtimeFileName
  */
}
hub._allWorkerConfigs = allWorkerConfigs

const resonate = hub.add

module.exports = { resonate, hub }
