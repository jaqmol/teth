/* Copyright 2017 Ronny Reichmann */
/* RESONATE PRODUCTION implementation provides concurrency */

const auid = require('./auid')
const { context, raise, send, circular, _resonator } = require('./T')
const allRunningWorkers = []
const allThisSideStates = {}
const allOtherSideTransports = {}
const ctx = context()

function resonate (fileName) {
  if (window.Worker) {
    const worker = new window.Worker(fileName)
    worker.onmessage = e => {
      const message = e.data
      allOtherSideTransports[message.transportId] = message
    }
    allRunningWorkers.push(worker)
  } else {
    console.error('Please update your browser to run this application')
  }
}

function makeTransport (message) {
  return Object.freeze(Object.assign({
    transportId: auid()
  }, message))
}

function dispatchToWorker (state) {
  if (state.index === Object.keys(allThisSideStates).length) {

  } else {
    const nextWorker = allThisSideStates[state.message.transportId]
    nextWorker.postMessage(state.message)
  }
}

_resonator(message => {
  if (message.transportId) {
    if (allOtherSideTransports[message.transportId]) {
      // no responder for message from other side

    } else {
      // someone is using a reserved message property
      raise('The property "transportId" is reserved for concurrency messaging', -13)
    }
  } else {
    // fresh this side message
    const transportMessage = makeTransport(message)
    const state = {
      message: transportMessage,
      index: 0
    }
    allThisSideStates[state.message.transportId] = state
    dispatchToWorker(state)
  }
})

module.exports = resonate
