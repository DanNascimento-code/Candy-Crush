import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SPECIAL_TYPES,
  createCandy,
  getCandyType,
  getSpecialType,
} from './candy.js'

test('createCandy creates an immutable regular candy', () => {
  const candy = createCandy('purple')

  assert.deepEqual(candy, {
    candyType: 'purple',
    specialType: null,
  })
  assert.equal(Object.isFrozen(candy), true)
})

test('a striped candy keeps its base type', () => {
  const candy = createCandy('purple', SPECIAL_TYPES.STRIPED_COLUMN)

  assert.equal(getCandyType(candy), 'purple')
  assert.equal(getSpecialType(candy), SPECIAL_TYPES.STRIPED_COLUMN)
})

test('a color bomb is colorless', () => {
  const candy = createCandy(null, SPECIAL_TYPES.COLOR_BOMB)

  assert.equal(getCandyType(candy), null)
  assert.equal(getSpecialType(candy), SPECIAL_TYPES.COLOR_BOMB)
})

test('createCandy rejects inconsistent special candy states', () => {
  assert.throws(
    () => createCandy('purple', SPECIAL_TYPES.COLOR_BOMB),
    /color bomb cannot have a base candy type/,
  )
  assert.throws(
    () => createCandy(null, SPECIAL_TYPES.STRIPED_ROW),
    /striped candy needs a base candy type/,
  )
})
