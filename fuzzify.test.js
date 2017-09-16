/* Copyright 2017 Ronny Reichmann */
/* global test expect */

const fuzzify = require('./fuzzify')

test('fuzzify', () => {
  const oneThird = 100 / 3
  const twoThird = 2 * oneThird
  const fuzz = fuzzify({
    high: v => (v >= twoThird) && (v < 101),
    middle: v => (v >= oneThird) && (v < twoThird),
    low: v => (v >= 0) && (v < oneThird)
  })
  const testValues = [-1, 0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, oneThird, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, twoThird, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107]
  testValues.forEach(value => {
    const result = fuzz(value)
    if ((value >= 0) && (value < oneThird)) {
      expect(result).toBe('low')
    } else if ((value >= oneThird) && (value < twoThird)) {
      expect(result).toBe('middle')
    } else if ((value >= twoThird) && (value < 101)) {
      expect(result).toBe('high')
    } else {
      expect(result).toBe(value)
    }
  })
})
