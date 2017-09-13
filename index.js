const auid = require('./auid')
const facade = require('./facade')
const HTML = require('./HTML')
const pipe = require('./pipe')
const sistre = require('./sistre')
const T = require('./T')

function init (config) {
  if (!config.state) throw new Error('config.state missing')
  if (!config.selector) throw new Error('config.selector missing')
  if (!config.renderPattern) throw new Error('config.renderPattern missing')
  config.startPattern = config.startPattern || sistre.didChangePattern
  sistre.init(config.state)
  facade({
    renderPattern: config.renderPattern,
    startPattern: config.startPattern,
    selector: config.selector
  })
}

module.exports = { auid, facade, HTML, init, pipe, sistre, T }
