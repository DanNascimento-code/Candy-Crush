import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EMPTY_TILE,
  areAdjacent,
  collapseBoard,
  createBoard,
  findMatchGroups,
  findMatchedIndices,
  planSpecialCreations,
  resolveBoard,
  swapTiles,
  trySwap,
} from './board.js'
import { SPECIAL_TYPES, createCandy } from './candy.js'

const candyTypes = ['a', 'b', 'c', 'd', 'e', 'f']

function sequenceRandom(values) {
  let index = 0
  return () => {
    const value = values[index % values.length]
    index += 1
    return value
  }
}

function boardFromTypes(types) {
  return types.map((type) => {
    if (type === EMPTY_TILE || typeof type === 'object') {
      return type
    }

    return createCandy(type)
  })
}

test('createBoard fills the board without starting matches', () => {
  const board = createBoard({
    width: 8,
    candyTypes,
    random: sequenceRandom([0, 0.2, 0.4, 0.6, 0.8]),
  })

  assert.equal(board.length, 64)
  assert.equal(board.includes(EMPTY_TILE), false)
  assert.deepEqual(findMatchedIndices(board, 8), [])
})

test('createBoard rejects invalid dimensions with an explicit error', () => {
  assert.throws(
    () => createBoard({ width: 0, candyTypes }),
    /width must be a positive integer/,
  )
})

test('findMatchGroups detects rows and columns without crossing an edge', () => {
  const board = boardFromTypes([
    'a', 'a', 'a', 'b',
    'b', 'c', 'a', 'b',
    'c', 'b', 'a', 'c',
    'b', 'c', 'b', 'a',
  ])

  assert.deepEqual(findMatchGroups(board, 4), [
    { type: 'a', orientation: 'row', indices: [0, 1, 2] },
    { type: 'a', orientation: 'column', indices: [2, 6, 10] },
  ])
  assert.deepEqual(findMatchedIndices(board, 4), [0, 1, 2, 6, 10])
})

test('areAdjacent rejects squares on opposite sides of a row boundary', () => {
  assert.equal(areAdjacent(6, 7, 8, 64), true)
  assert.equal(areAdjacent(7, 8, 8, 64), false)
  assert.equal(areAdjacent(0, 8, 8, 64), true)
  assert.equal(areAdjacent(0, 0, 8, 64), false)
})

test('swapTiles returns a new board and preserves the original', () => {
  const original = boardFromTypes(['a', 'b', 'c'])
  const swapped = swapTiles(original, 0, 1)

  assert.deepEqual(swapped, boardFromTypes(['b', 'a', 'c']))
  assert.deepEqual(original, boardFromTypes(['a', 'b', 'c']))
  assert.notEqual(swapped, original)
})

test('collapseBoard moves tiles down and fills empty spaces', () => {
  const board = boardFromTypes([
    EMPTY_TILE, 'a', 'b',
    'c', EMPTY_TILE, 'd',
    'e', 'f', EMPTY_TILE,
  ])
  const collapsed = collapseBoard({
    board,
    width: 3,
    candyTypes,
    random: sequenceRandom([0, 0.2, 0.4]),
  })

  assert.deepEqual(collapsed, boardFromTypes([
    'a', 'b', 'c',
    'c', 'a', 'b',
    'e', 'f', 'd',
  ]))
  assert.deepEqual(board, boardFromTypes([
    EMPTY_TILE, 'a', 'b',
    'c', EMPTY_TILE, 'd',
    'e', 'f', EMPTY_TILE,
  ]))
})


test('trySwap rejects a swap between non-adjacent positions', () => {
  const board = boardFromTypes([
    'a', 'b', 'c',
    'd', 'e', 'f',
    'g', 'h', 'i',
  ])
  const result = trySwap({
    board: board,
    firstIndex: 0,
    secondIndex: 4,
    width: 3,
    candyTypes,
  })

  assert.equal(result.accepted, false)
  assert.equal(result.reason, 'not-adjacent')
  assert.deepEqual(result.board, board)
})

test('trySwap rejects a neighboring swap that creates no match', () => {
  const board = boardFromTypes([
    'a', 'b', 'c',
    'd', 'e', 'f',
    'b', 'c', 'd',
  ])
  const result = trySwap({
    board,
    firstIndex: 0,
    secondIndex: 1,
    width: 3,
    candyTypes,
  })

  assert.equal(result.accepted, false)
  assert.equal(result.reason, 'no-match')
  assert.deepEqual(result.board, board)
})

test('trySwap accepts a match and resolves the resulting board', () => {
  const board = boardFromTypes([
    'a', 'b', 'a',
    'c', 'a', 'd',
    'e', 'f', 'b',
  ])
  const result = trySwap({
    board,
    firstIndex: 1,
    secondIndex: 4,
    width: 3,
    candyTypes,
    random: sequenceRandom([0, 0.2, 0.4, 0.6, 0.8]),
  })

  assert.equal(result.accepted, true)
  assert.equal(result.clearedTiles >= 3, true)
  assert.equal(result.score >= 30, true)
  assert.equal(result.steps[0].specialCreations, undefined)
  assert.deepEqual(findMatchedIndices(result.board, 3), [])
  assert.deepEqual(board, boardFromTypes([
    'a', 'b', 'a',
    'c', 'a', 'd',
    'e', 'f', 'b',
  ]))
})


test('resolveBoard records match-found, tiles-cleared, tiles-fell, and tiles-refilled steps in order', () => {
  const board = boardFromTypes([
    'b', 'c', 'd',
    'c', 'd', 'b',
    'a', 'a', 'a',
  ])

  const result = resolveBoard({
    board,
    width: 3,
    candyTypes,
    random: sequenceRandom([0, 0.2, 0.4]),
  })

  assert.equal(result.stabilized, true)
  assert.equal(result.steps.length, 4)

  assert.deepEqual(result.steps[0], {
    type: 'match-found',
    cascade: 1,
    matchedIndices: [6, 7, 8],
    matchGroups: [
      {
        type: 'a',
        orientation: 'row',
        indices: [6, 7, 8],
      },
    ],
    board: boardFromTypes([
      'b', 'c', 'd',
      'c', 'd', 'b',
      'a', 'a', 'a',
    ]),
  })

  assert.deepEqual(result.steps[1], {
    type: 'tiles-cleared',
    cascade: 1,
    board: boardFromTypes([
      'b', 'c', 'd',
      'c', 'd', 'b',
      EMPTY_TILE, EMPTY_TILE, EMPTY_TILE,
    ]),
    clearedIndices: [6, 7, 8],
  })

  assert.deepEqual(result.steps[2], {
    type: 'tiles-fell',
    cascade: 1,
    board: boardFromTypes([
      EMPTY_TILE, EMPTY_TILE, EMPTY_TILE,
      'b', 'c', 'd',
      'c', 'd', 'b',
    ]),
  })

  assert.deepEqual(result.steps[3], {
    type: 'tiles-refilled',
    cascade: 1,
    board: boardFromTypes([
      'a', 'b', 'c',
      'b', 'c', 'd',
      'c', 'd', 'b',
    ]),
  }
  )

  assert.notEqual(result.steps[0].board, board)
  assert.notEqual(result.steps[1].board, result.steps[0].board)
  assert.notEqual(result.steps[2].board, result.steps[1].board)
  assert.notEqual(result.steps[3].board, result.steps[2].board)
})


test('resolveBoard records the correct step sequence across multiple cascades', () => {
  const board = boardFromTypes([
    'b', 'c', 'd',
    'c', 'd', 'b',
    'a', 'a', 'a',
  ])

  const result = resolveBoard({
    board,
    width: 3,
    candyTypes,
    random: sequenceRandom([
      0, 0, 0,
      0, 0.2, 0.4,
    ]),
  })

  assert.equal(result.stabilized, true)
  assert.equal(result.cascades, 2)
  assert.equal(result.steps.length, 8)

  assert.deepEqual(
    result.steps.map(({ type, cascade }) => ({ type, cascade })),
    [
      { type: 'match-found', cascade: 1 },
      { type: 'tiles-cleared', cascade: 1 },
      { type: 'tiles-fell', cascade: 1 },
      { type: 'tiles-refilled', cascade: 1 },

      { type: 'match-found', cascade: 2 },
      { type: 'tiles-cleared', cascade: 2 },
      { type: 'tiles-fell', cascade: 2 },
      { type: 'tiles-refilled', cascade: 2 },
    ],
  )
})

test('resolveBoard stops safely when random refills never stabilize', () => {
  const result = resolveBoard({
    board: boardFromTypes(Array(9).fill('a')),
    width: 3,
    candyTypes: ['a', 'b'],
    random: () => 0,
    maxCascades: 2,
  })

  assert.equal(result.stabilized, false)
  assert.equal(result.cascades, 2)
})


test('trySwap plans a column-striped candy for a row of four', () => {
  const board = boardFromTypes([
    'a', 'a', 'b', 'a',
    'b', 'c', 'a', 'd',
    'c', 'd', 'e', 'f',
    'd', 'e', 'f', 'b',
  ])

  const result = trySwap({
    board,
    firstIndex: 2,
    secondIndex: 6,
    width: 4,
    candyTypes,
    random: sequenceRandom([0.2, 0.4, 0.6, 0.8]),
  })

  assert.equal(result.accepted, true)

  assert.deepEqual(
    result.steps[0].specialCreations,
    [
      {
        index: 2,
        candyType: 'a',
        specialType: SPECIAL_TYPES.STRIPED_COLUMN,
      },
    ],
  )
})


test('trySwap preserves the striped candy created by a row of four', () => {
  const board = boardFromTypes([
    'a', 'a', 'b', 'a',
    'b', 'c', 'a', 'd',
    'c', 'd', 'e', 'f',
    'd', 'e', 'f', 'b',
  ])

  const result = trySwap({
    board,
    firstIndex: 2,
    secondIndex: 6,
    width: 4,
    candyTypes,
    random: sequenceRandom([0.2, 0.4, 0.6, 0.8]),
  })

  const clearedStep = result.steps.find(
    (step) => step.type === 'tiles-cleared',
  )

  assert.deepEqual(clearedStep.clearedIndices, [0, 1, 3])

  assert.deepEqual(clearedStep.board[2], {
    candyType: 'a',
    specialType: SPECIAL_TYPES.STRIPED_COLUMN,
  })

  assert.deepEqual(result.board[2], {
    candyType: 'a',
    specialType: SPECIAL_TYPES.STRIPED_COLUMN,
  })
})

test('createBoard represents every occupied position with the same candy shape', () => {
  const board = createBoard({
    width: 3,
    candyTypes,
    random: sequenceRandom([0, 0.2, 0.4]),
  })

  assert.equal(
    board.every(
      (candy) =>
        typeof candy === 'object' &&
        typeof candy.candyType === 'string' &&
        candy.specialType === null,
    ),
    true,
  )
})

test('a striped candy still matches candies of its base type', () => {
  const stripedCandy = createCandy('a', SPECIAL_TYPES.STRIPED_COLUMN)
  const board = boardFromTypes([
    stripedCandy, 'a', 'a',
    'b', 'c', 'd',
    'c', 'd', 'b',
  ])

  assert.deepEqual(findMatchGroups(board, 3), [
    {
      type: 'a',
      orientation: 'row',
      indices: [0, 1, 2],
    },
  ])
})

test('trySwap creates a row-striped candy for a column of four', () => {
  const board = boardFromTypes([
    'a', 'b', 'c', 'd',
    'a', 'c', 'd', 'e',
    'b', 'a', 'e', 'f',
    'a', 'd', 'f', 'b',
  ])

  const result = trySwap({
    board,
    firstIndex: 8,
    secondIndex: 9,
    width: 4,
    candyTypes,
    random: sequenceRandom([0.2, 0.4, 0.6, 0.8]),
  })

  assert.deepEqual(result.steps[0].specialCreations, [
    {
      index: 8,
      candyType: 'a',
      specialType: SPECIAL_TYPES.STRIPED_ROW,
    },
  ])
})

test('trySwap creates a color bomb for a row of five', () => {
  const board = boardFromTypes([
    'a', 'a', 'b', 'a', 'a',
    'b', 'c', 'a', 'd', 'e',
    'c', 'd', 'e', 'f', 'b',
    'd', 'e', 'f', 'b', 'c',
    'e', 'f', 'b', 'c', 'd',
  ])

  const result = trySwap({
    board,
    firstIndex: 2,
    secondIndex: 7,
    width: 5,
    candyTypes,
    random: sequenceRandom([0.2, 0.4, 0.6, 0.8]),
  })

  assert.deepEqual(result.steps[0].specialCreations, [
    {
      index: 2,
      candyType: null,
      specialType: SPECIAL_TYPES.COLOR_BOMB,
    },
  ])
})

test('trySwap creates a color bomb for a column of five', () => {
  const board = boardFromTypes([
    'a', 'b', 'c', 'd', 'e',
    'a', 'c', 'd', 'e', 'f',
    'b', 'a', 'e', 'f', 'b',
    'a', 'd', 'f', 'b', 'c',
    'a', 'e', 'b', 'c', 'd',
  ])

  const result = trySwap({
    board,
    firstIndex: 10,
    secondIndex: 11,
    width: 5,
    candyTypes,
    random: sequenceRandom([0.2, 0.4, 0.6, 0.8]),
  })

  assert.deepEqual(result.steps[0].specialCreations, [
    {
      index: 10,
      candyType: null,
      specialType: SPECIAL_TYPES.COLOR_BOMB,
    },
  ])
})

test('a color bomb has priority when special plans overlap', () => {
  const creations = planSpecialCreations(
    [
      {
        type: 'a',
        orientation: 'row',
        indices: [10, 11, 12, 13],
      },
      {
        type: 'a',
        orientation: 'column',
        indices: [3, 8, 13, 18, 23],
      },
    ],
    13,
    14,
  )

  assert.deepEqual(creations, [
    {
      index: 13,
      candyType: null,
      specialType: SPECIAL_TYPES.COLOR_BOMB,
    },
  ])
})
