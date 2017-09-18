/* Copyright 2017 Ronny Reichmann */
/* INIT Initialize a teth app. */

const facade = require('./facade')
const sistre = require('./sistre')

function init (config) {
  if (!config.renderPattern) throw new Error('config.renderPattern missing')
  if (!config.state) throw new Error('config.state missing')
  if (!config.selector) throw new Error('config.selector missing')
  config.startPattern = config.startPattern || sistre.didChangePattern
  sistre.init(config.state)
  facade({
    renderPattern: config.renderPattern,
    startPattern: config.startPattern,
    selector: config.selector
  })
}

module.exports = init
