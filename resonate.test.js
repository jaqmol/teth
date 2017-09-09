/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const path = require('path')
const { resonate } = require('./resonate')
// const { context } = require('./T') // { match, context, type }

resonate(path.join(__dirname, 'resonate.test-worker-a')) // this should start Worker
resonate(path.join(__dirname, 'resonate.test-worker-b')) // this should start Worker

test('resonator send', () => {

})
test('resonator circular', () => {

})
