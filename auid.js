/* Copyright 2017 Ronny Reichmann */
/* AUID Acceptably Unique Identifier */

let currentCount = 0

const randomNumberComponent = (() => {
  const crypto = window.crypto || window.msCrypto
  if (!crypto) return
  const array = new Uint8Array(1)
  crypto.getRandomValues(array)
  return Number(array[0]).toString(16)
})() || (() => {
  const crypto = require('crypto')
  return () => crypto.randomBytes(1).toString('hex')
})()

function auid () {
  const zoneComp = Number(730 + (new Date()).getTimezoneOffset()).toString(16)
  const stampComp = Number(Date.now()).toString(16)
  currentCount = currentCount === 1111111
    ? 0
    : currentCount + 1
  const countComp = Number(currentCount).toString(16)
  const randomComp = randomNumberComponent()
  return `auid_${zoneComp}_${stampComp}_${countComp}_${randomComp}`
}

module.exports = auid
