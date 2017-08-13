/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const auid = require('./auid')

test('matcher inline', () => {
  const testAuidsArr = [...(new Array(999))].map(() => auid())
  const testAuidsSet = new Set(testAuidsArr)
  expect(testAuidsArr.length).toBe(testAuidsSet.size)
})
