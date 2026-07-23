export const EMPTY_TILE = null

const DEFAULT_POINTS_PER_TILE = 10
const DEFAULT_MAX_CASCADES = 100

function validateBoardDimensions(board, width) {
  if (!Array.isArray(board)) {
    throw new TypeError('board must be an array')
  }

  if (!Number.isInteger(width) || width < 1) {
    throw new RangeError('width must be a positive integer')
  }

  if (board.length === 0 || board.length % width !== 0) {
    throw new RangeError('board length must be a positive multiple of width')
  }
}

function validateCandyTypes(candyTypes) {
  const uniqueTypes = [...new Set(candyTypes)]

  if (uniqueTypes.length < 2) {
    throw new RangeError('at least two different candy types are required')
  }

  return uniqueTypes
}

function randomItem(items, random) {
  const randomIndex = Math.min(
    Math.floor(random() * items.length),
    items.length - 1,
  )

  return items[Math.max(0, randomIndex)]
}

function createsImmediateMatch(board, index, candyType, width) {
  const column = index % width
  const hasHorizontalMatch =
    column >= 2 &&
    board[index - 1] === candyType &&
    board[index - 2] === candyType
  const hasVerticalMatch =
    index >= width * 2 &&
    board[index - width] === candyType &&
    board[index - width * 2] === candyType

  return hasHorizontalMatch || hasVerticalMatch
}

/**
 * Creates a full board without matches already formed. Injecting `random`
 * makes the behavior deterministic in automated tests.
 */
export function createBoard({
  width,
  height = width,
  candyTypes,
  random = Math.random,
}) {
  if (!Number.isInteger(width) || width < 1) {
    throw new RangeError('width must be a positive integer')
  }

  if (!Number.isInteger(height) || height < 1) {
    throw new RangeError('height must be a positive integer')
  }

  const availableTypes = validateCandyTypes(candyTypes)
  const board = []

  for (let index = 0; index < width * height; index += 1) {
    const validTypes = availableTypes.filter(
      (type) => !createsImmediateMatch(board, index, type, width),
    )

    board.push(randomItem(validTypes, random))
  }

  return board
}

export function findMatchGroups(board, width) {
  validateBoardDimensions(board, width)
  const height = board.length / width
  const groups = []

  for (let row = 0; row < height; row += 1) {
    let column = 0

    while (column < width) {
      const startColumn = column
      const type = board[row * width + column]

      while (
        column + 1 < width &&
        board[row * width + column + 1] === type
      ) {
        column += 1
      }

      const length = column - startColumn + 1
      if (type !== EMPTY_TILE && length >= 3) {
        groups.push({
          type,
          orientation: 'row',
          indices: Array.from(
            { length },
            (_, offset) => row * width + startColumn + offset,
          ),
        })
      }

      column += 1
    }
  }

  for (let column = 0; column < width; column += 1) {
    let row = 0

    while (row < height) {
      const startRow = row
      const type = board[row * width + column]

      while (
        row + 1 < height &&
        board[(row + 1) * width + column] === type
      ) {
        row += 1
      }

      const length = row - startRow + 1
      if (type !== EMPTY_TILE && length >= 3) {
        groups.push({
          type,
          orientation: 'column',
          indices: Array.from(
            { length },
            (_, offset) => (startRow + offset) * width + column,
          ),
        })
      }

      row += 1
    }
  }

  return groups
}

export function findMatchedIndices(board, width) {
  const uniqueIndices = new Set(
    findMatchGroups(board, width).flatMap((group) => group.indices),
  )

  return [...uniqueIndices].sort((first, second) => first - second)
}

export function areAdjacent(firstIndex, secondIndex, width, boardSize) {
  const indicesAreValid =
    Number.isInteger(firstIndex) &&
    Number.isInteger(secondIndex) &&
    firstIndex >= 0 &&
    secondIndex >= 0 &&
    firstIndex < boardSize &&
    secondIndex < boardSize

  if (!indicesAreValid || firstIndex === secondIndex) {
    return false
  }

  const firstRow = Math.floor(firstIndex / width)
  const secondRow = Math.floor(secondIndex / width)
  const firstColumn = firstIndex % width
  const secondColumn = secondIndex % width

  return (
    Math.abs(firstRow - secondRow) +
      Math.abs(firstColumn - secondColumn) ===
    1
  )
}

export function swapTiles(board, firstIndex, secondIndex) {
  const nextBoard = [...board]
  ;[nextBoard[firstIndex], nextBoard[secondIndex]] = [
    nextBoard[secondIndex],
    nextBoard[firstIndex],
  ]

  return nextBoard
}

export function clearMatches(board, matchedIndices) {
  const nextBoard = [...board]
  matchedIndices.forEach((index) => {
    nextBoard[index] = EMPTY_TILE
  })

  return nextBoard
}

function moveTilesDown(board, width) {
  const height = board.length / width
  const fallenBoard = Array(board.length).fill(EMPTY_TILE)

  for (let column = 0; column < width; column += 1) {
    let destinationRow = height - 1

    for (let row = height - 1; row >= 0; row -= 1) {
      const tile = board[row * width + column]

      if (tile !== EMPTY_TILE) {
        fallenBoard[destinationRow * width + column] = tile
        destinationRow -= 1
      }
    }
  }

  return fallenBoard
}

function fillEmptyTiles(board, width, candyTypes, random) {
  const height = board.length / width
  const filledBoard = [...board]

  for (let column = 0; column < width; column += 1) {
    for (let row = height - 1; row >= 0; row -= 1) {
      const index = row * width + column

      if (filledBoard[index] === EMPTY_TILE) {
        filledBoard[index] = randomItem(candyTypes, random)
      }
    }
  }

  return filledBoard
}

export function collapseBoard({
  board,
  width,
  candyTypes,
  random = Math.random,
}) {
  validateBoardDimensions(board, width)
  const availableTypes = validateCandyTypes(candyTypes)

  const fallenBoard = moveTilesDown(board, width)

  return fillEmptyTiles(
    fallenBoard,
    width,
    availableTypes,
    random,
  )
}

export function resolveBoard({
  board,
  width,
  candyTypes,
  random = Math.random,
  pointsPerTile = DEFAULT_POINTS_PER_TILE,
  maxCascades = DEFAULT_MAX_CASCADES,
}) {
  if (!Number.isInteger(maxCascades) || maxCascades < 1) {
    throw new RangeError('maxCascades must be a positive integer')
  }

  let nextBoard = [...board]
  let cascades = 0
  let clearedTiles = 0
  let score = 0
  const steps = []

  while (cascades < maxCascades) {
    const matchGroups = findMatchGroups(nextBoard, width)

    const matchedIndices = [
      ...new Set(
        matchGroups.flatMap((group) => group.indices),
      ),
    ].sort((first, second) => first - second)

    if (matchedIndices.length === 0) {
      return {
        board: nextBoard,
        cascades,
        clearedTiles,
        score,
        stabilized: true,
        steps,
      }
    }

    cascades += 1

    steps.push({
      type: 'match-found',
      cascade: cascades,
      matchedIndices,
      matchGroups: matchGroups.map((group) => ({
        type: group.type,
        orientation: group.orientation,
        indices: [...group.indices],
      })),
      board: [...nextBoard],
    })

    clearedTiles += matchedIndices.length
    score += matchedIndices.length * pointsPerTile * cascades

    const clearedBoard = clearMatches(nextBoard, matchedIndices)

    steps.push({
      type: 'tiles-cleared',
      cascade: cascades,
      board: [...clearedBoard],
      clearedIndices: [...matchedIndices],
    })

    const fallenBoard = moveTilesDown(clearedBoard, width)

    steps.push({
      type: 'tiles-fell',
      cascade: cascades,
      board: [...fallenBoard],
    })

    nextBoard = collapseBoard({
      board: fallenBoard,
      width,
      candyTypes,
      random,
    })
  

    steps.push({
      type: 'tiles-refilled',
      cascade: cascades,
      board: [...nextBoard],
    })
  }

  return {
    board: nextBoard,
    cascades,
    clearedTiles,
    score,
    stabilized: false,
    steps,
  }
}

export function trySwap({
  board,
  firstIndex,
  secondIndex,
  width,
  candyTypes,
  random = Math.random,
}) {
  if (!areAdjacent(firstIndex, secondIndex, width, board.length)) {
    return { accepted: false, reason: 'not-adjacent', board: [...board] }
  }

  const swappedBoard = swapTiles(board, firstIndex, secondIndex)
  const createdMatches = findMatchGroups(swappedBoard, width).filter(
    (group) =>
      group.indices.includes(firstIndex) || group.indices.includes(secondIndex),
  )

  if (createdMatches.length === 0) {
    return { accepted: false, reason: 'no-match', board: [...board] }
  }

  return {
    accepted: true,
    reason: 'match',
    initialMatches: createdMatches,
    ...resolveBoard({
      board: swappedBoard,
      width,
      candyTypes,
      random,
    }),
  }
}
