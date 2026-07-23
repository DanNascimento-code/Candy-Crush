export const SPECIAL_TYPES = Object.freeze({
  STRIPED_ROW: 'striped-row',
  STRIPED_COLUMN: 'striped-column',
  COLOR_BOMB: 'color-bomb',
})

const VALID_SPECIAL_TYPES = new Set([
  null,
  ...Object.values(SPECIAL_TYPES),
])

export function createCandy(candyType, specialType = null) {
  if (!VALID_SPECIAL_TYPES.has(specialType)) {
    throw new RangeError(`unknown special type: ${specialType}`)
  }

  const isColorBomb = specialType === SPECIAL_TYPES.COLOR_BOMB

  if (isColorBomb && candyType !== null) {
    throw new TypeError('a color bomb cannot have a base candy type')
  }

  if (!isColorBomb && typeof candyType !== 'string') {
    throw new TypeError('a regular or striped candy needs a base candy type')
  }

  return Object.freeze({ candyType, specialType })
}

export function getCandyType(candy) {
  if (candy === null) {
    return null
  }

  if (typeof candy !== 'object' || !('candyType' in candy)) {
    throw new TypeError('every occupied tile must contain a candy object')
  }

  return candy.candyType
}

export function getSpecialType(candy) {
  return candy === null ? null : candy.specialType
}
