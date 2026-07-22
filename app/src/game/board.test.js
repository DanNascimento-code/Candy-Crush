import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EMPTY_TILE,
  areAdjacent,
  collapseBoard,
  createBoard,
  findMatchGroups,
  findMatchedIndices,
  resolveBoard,
  swapTiles,
  trySwap,
} from './board.js'

const candyTypes = ['a', 'b', 'c', 'd', 'e', 'f']

function sequenceRandom(values) {
  let index = 0
  return () => {
    const value = values[index % values.length]
    index += 1
    return value
  }
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
  const board = [
    'a', 'a', 'a', 'b',
    'b', 'c', 'a', 'b',
    'c', 'b', 'a', 'c',
    'b', 'c', 'b', 'a',
  ]

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
  const original = ['a', 'b', 'c']
  const swapped = swapTiles(original, 0, 1)

  assert.deepEqual(swapped, ['b', 'a', 'c'])
  assert.deepEqual(original, ['a', 'b', 'c'])
  assert.notEqual(swapped, original)
})

test('collapseBoard moves tiles down and fills empty spaces', () => {
  const board = [
    EMPTY_TILE, 'a', 'b',
    'c', EMPTY_TILE, 'd',
    'e', 'f', EMPTY_TILE,
  ]
  const collapsed = collapseBoard({
    board,
    width: 3,
    candyTypes,
    random: sequenceRandom([0, 0.2, 0.4]),
  })

  assert.deepEqual(collapsed, [
    'a', 'b', 'c',
    'c', 'a', 'b',
    'e', 'f', 'd',
  ])
  assert.deepEqual(board, [
    EMPTY_TILE, 'a', 'b',
    'c', EMPTY_TILE, 'd',
    'e', 'f', EMPTY_TILE,
  ])
})


test('trySwap rejects a swap between non-adjacent positions', () => {
  const board = [
    'a', 'b', 'c',
    'd', 'e', 'f',
    'g', 'h', 'i',
  ]
})

test('trySwap rejects a neighboring swap that creates no match', () => {
  const board = [
    'a', 'b', 'c',
    'd', 'e', 'f',
    'b', 'c', 'd',
  ]
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
  const board = [
    'a', 'b', 'a',
    'c', 'a', 'd',
    'e', 'f', 'b',
  ]
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
  assert.deepEqual(findMatchedIndices(result.board, 3), [])
  assert.deepEqual(board, [
    'a', 'b', 'a',
    'c', 'a', 'd',
    'e', 'f', 'b',
  ])
})

test('resolveBoard stops safely when random refills never stabilize', () => {
  const result = resolveBoard({
    board: Array(9).fill('a'),
    width: 3,
    candyTypes: ['a', 'b'],
    random: () => 0,
    maxCascades: 2,
  })

  assert.equal(result.stabilized, false)
  assert.equal(result.cascades, 2)
})
