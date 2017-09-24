/* Copyright 2017 Ronny Reichmann */
/* AUID Acceptably Unique Identifier */

const randomBytes = require('crypto').randomBytes
let currentCount = 0

function auid () {
  const zoneComp = Number(730 + (new Date()).getTimezoneOffset()).toString(16)
  const stampComp = Number(Date.now()).toString(16)
  currentCount = currentCount === 11111111
    ? 0
    : currentCount + 1
  const countComp = Number(currentCount).toString(16)
  const randomComp = randomBytes(2).toString('hex')
  return `auid_${zoneComp}_${stampComp}_${countComp}_${randomComp}`
}

module.exports = auid
