import { useRef, useState } from 'react'

import AnimatedBackground from './components/AnimatedBackground.jsx'
import blueCandy from './images/dark-candies/blue-haunted-moon.png'
import colorBombCandy from './images/dark-candies/color-bomb.png'
import greenCandy from './images/dark-candies/green-poison-apple.png'
import orangeCandy from './images/dark-candies/orange-dagger.png'
import purpleCandy from './images/dark-candies/purple-skull.png'
import redCandy from './images/dark-candies/red-broken-heart.png'
import yellowCandy from './images/dark-candies/yellow-fanged-star.png'

import {
  EMPTY_TILE,
  areAdjacent,
  createBoard,
  trySwap,
} from './game/board.js'
import { SPECIAL_TYPES } from './game/candy.js'
 
 

const BOARD_WIDTH = 8
const CANDY_TYPES = ['blue', 'green', 'orange', 'purple', 'red', 'yellow']
const CANDY_IMAGES = {
  blue: blueCandy,
  green: greenCandy,
  orange: orangeCandy,
  purple: purpleCandy,
  red: redCandy,
  yellow: yellowCandy,
}

const CANDY_LABELS = {
  blue: 'lua assombrada azul',
  green: 'maçã envenenada verde',
  orange: 'adaga de caramelo laranja',
  purple: 'caveira doce roxa',
  red: 'coração rachado vermelho',
  yellow: 'estrela com presas amarela',
}

const SPECIAL_LABELS = {
  [SPECIAL_TYPES.STRIPED_ROW]: 'listrado horizontal',
  [SPECIAL_TYPES.STRIPED_COLUMN]: 'listrado vertical',
  [SPECIAL_TYPES.COLOR_BOMB]: 'bomba de cor',
}


const STEP_DELAYS = {
  'match-found': 450,
  'tiles-cleared': 250,
  'tiles-fell': 350,
  'tiles-refilled': 350,
}

const SWAP_DELAY = 280
const REJECTED_SWAP_DELAY = 460

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}


function getSwapStyle(index, swapAnimation) {
  if (swapAnimation === null) {
    return undefined
  }

  const { firstIndex, secondIndex } = swapAnimation

  let targetIndex = null

  if (index === firstIndex) {
    targetIndex = secondIndex
  } else if (index === secondIndex) {
    targetIndex = firstIndex
  }

  if (targetIndex === null) {
    return undefined
  }

  const currentRow = Math.floor(index / BOARD_WIDTH)
  const targetRow = Math.floor(targetIndex / BOARD_WIDTH)

  const currentColumn = index % BOARD_WIDTH
  const targetColumn = targetIndex % BOARD_WIDTH

  const rowDifference = targetRow - currentRow
  const columnDifference = targetColumn - currentColumn

  const horizontalDistance =
    columnDifference === 0
      ? '0px'
      : columnDifference > 0
        ? 'calc(100% + var(--board-gap))'
        : 'calc(-100% - var(--board-gap))'

  const verticalDistance =
    rowDifference === 0
      ? '0px'
      : rowDifference > 0
        ? 'calc(100% + var(--board-gap))'
        : 'calc(-100% - var(--board-gap))'

  return {
    '--swap-x': horizontalDistance,
    '--swap-y': verticalDistance,
  }
}


function getAnimatedIndices(previousBoard, step) {
  if (step.type === 'match-found') {
    return step.matchedIndices
  }

  if (step.type === 'tiles-cleared') {
    return step.clearedIndices
  }

  if (step.type === 'tiles-fell') {
    return step.board.reduce((indices, candy, index) => {
      const changedPosition =
        candy !== EMPTY_TILE &&
        candy !== previousBoard[index]

      if (changedPosition) {
        indices.push(index)
      }

      return indices
    }, [])
  }

  if (step.type === 'tiles-refilled') {
    return step.board.reduce((indices, candy, index) => {
      const receivedNewCandy =
        previousBoard[index] === EMPTY_TILE &&
        candy !== EMPTY_TILE

      if (receivedNewCandy) {
        indices.push(index)
      }

      return indices
    }, [])
  }

  return []
}


function getMatchSizeForIndex(index, activeStep) {
  if (
    activeStep?.type !== 'match-found' ||
    !activeStep.matchGroups
  ) {
    return null
  }

  const matchingSizes = activeStep.matchGroups
    .filter((group) => group.indices.includes(index))
    .map((group) => group.indices.length)

  if (matchingSizes.length === 0) {
    return null
  }

  const largestMatchSize = Math.max(...matchingSizes)

  return largestMatchSize >= 5
    ? '5-plus'
    : String(largestMatchSize)
}


function getCandyAriaLabel(candy, index) {
  if (candy === EMPTY_TILE) {
    return `Posição vazia ${index + 1}`
  }

  if (candy.specialType === SPECIAL_TYPES.COLOR_BOMB) {
    return `Bomba de cor, posição ${index + 1}`
  }

  const specialDescription = candy.specialType
    ? ` ${SPECIAL_LABELS[candy.specialType]}`
    : ''

  const candyDescription = CANDY_LABELS[candy.candyType] ?? candy.candyType

  return `Doce ${candyDescription}${specialDescription}, posição ${index + 1}`
}


function newBoard() {
  return createBoard({
    width: BOARD_WIDTH,
    candyTypes: CANDY_TYPES,
  })
}

function App() {
  const [board, setBoard] = useState(newBoard)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState(
    'Arraste um doce ou selecione dois vizinhos.',
  )
  const [isResolving, setIsResolving] = useState(false)
  const [activeStep, setActiveStep] = useState(null)
  const resolvingRef = useRef(false)
  const [animatedIndices, setAnimatedIndices] = useState([])
  const [swapAnimation, setSwapAnimation] = useState(null)


  async function attemptMove(firstIndex, secondIndex) {
  if (resolvingRef.current) {
    return
  }

  const result = trySwap({
    board,
    firstIndex,
    secondIndex,
    width: BOARD_WIDTH,
    candyTypes: CANDY_TYPES,
  })

  if (!result.accepted && result.reason === 'not-adjacent') {
    setMessage('Esses doces não são vizinhos.')
    return
  }

  if (!result.accepted) {
    resolvingRef.current = true
    setIsResolving(true)
    setMessage('Essa troca não forma uma combinação.')

    try {
      setSwapAnimation({
        firstIndex,
        secondIndex,
        rejected: true,
      })

      await wait(REJECTED_SWAP_DELAY)
    } finally {
      setSwapAnimation(null)
      resolvingRef.current = false
      setIsResolving(false)
    }

    return
  }

  resolvingRef.current = true
  setIsResolving(true)
  setMessage('Trocando doces...')

  try {
    setSwapAnimation({
      firstIndex,
      secondIndex,
      rejected: false,
    })

    await wait(SWAP_DELAY)

    setSwapAnimation(null)
    setMessage('Resolvendo combinação...')

    let previousBoard = board

    for (const step of result.steps) {
      setAnimatedIndices(
        getAnimatedIndices(previousBoard, step),
      )

      setActiveStep(step)
      setBoard(step.board)

      await wait(STEP_DELAYS[step.type] ?? 300)

      previousBoard = step.board
    }

    setBoard(result.board)
    setScore((currentScore) => currentScore + result.score)

    setMessage(
      result.cascades > 1
        ? `Combo de ${result.cascades} cascatas! +${result.score} pontos.`
        : `Combinação concluída! +${result.score} pontos.`,
    )
  } finally {
    setSwapAnimation(null)
    setActiveStep(null)
    setAnimatedIndices([])
    resolvingRef.current = false
    setIsResolving(false)
  }
}


  function handleTileClick(index) {
    if (selectedIndex === null) {
      setSelectedIndex(index)
      setMessage('Agora selecione um doce vizinho.')
      return
    }

    if (selectedIndex === index) {
      setSelectedIndex(null)
      setMessage('Seleção cancelada.')
      return
    }

    if (!areAdjacent(selectedIndex, index, BOARD_WIDTH, board.length)) {
      setSelectedIndex(index)
      setMessage('Seleção alterada. Escolha um vizinho deste doce.')
      return
    }

    attemptMove(selectedIndex, index)
    setSelectedIndex(null)
  }

  function handleDrop(event, targetIndex) {
    event.preventDefault()

    if (draggedIndex !== null) {
      attemptMove(draggedIndex, targetIndex)
    }

    setDraggedIndex(null)
    setSelectedIndex(null)
  }

  function restartGame() {
    setBoard(newBoard())
    setScore(0)
    setDraggedIndex(null)
    setSelectedIndex(null)
    setMessage('Novo tabuleiro criado sem combinações iniciais.')
  }

  return (
    <main className="app">
      <AnimatedBackground />

      <section className="game-shell" aria-label="Jogo de combinar doces">
        <header className="game-header">
          <div>
            <p className="eyebrow">Dark Candy — protótipo</p>
            <h1>Kuromi</h1>
          </div>

          <div className="score-card" aria-label={`${score} pontos`}>
            <span>Pontos</span>
            <strong>{score.toLocaleString('pt-BR')}</strong>
          </div>
        </header>

        <div
          className="game"
          style={{ '--board-width': BOARD_WIDTH }}
          data-step={
            swapAnimation
             ? swapAnimation.rejected
              ? 'tiles-swap-rejected'
              : 'tiles-swapping'
             : activeStep?.type 
          }
          aria-busy={isResolving}
          aria-label="Tabuleiro 8 por 8"
        >
          {board.map((candy, index) => {
            const isEmpty = candy === EMPTY_TILE
            const candyType = candy?.candyType ?? null
            const specialType = candy?.specialType ?? null
            const isAnimating = animatedIndices.includes(index)
            const matchSize = getMatchSizeForIndex(index, activeStep)
            const swapStyle = getSwapStyle(index, swapAnimation)
            const isSwapping = swapStyle !== undefined
            const isSwapFront = swapAnimation?.firstIndex === index

            return (
              <button               
                className={`tile${selectedIndex === index ? ' selected' : ''}${
                  isEmpty ? ' empty' : ''
                }${isAnimating ? ' animating' : ''}${
                  isSwapping ? ' swapping' : ''
                }${isSwapFront ? ' swap-front' : ''}${
                  matchSize ? ` match-${matchSize}` : ''
                }`}
                style={swapStyle}
                key={index}
                type="button"
                disabled={isResolving}
                draggable={!isResolving && !isEmpty}
                aria-label={getCandyAriaLabel(candy, index)}
                aria-pressed={selectedIndex === index}
                onClick={() => handleTileClick(index)}
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, index)}
                onDragEnd={() => setDraggedIndex(null)}
              >
                {!isEmpty && (
                  <span
                    className="candy-visual"
                    data-candy-type={candyType ?? undefined}
                    data-special-type={specialType ?? undefined}
                  >
                    <img
                      src={
                        specialType === SPECIAL_TYPES.COLOR_BOMB
                          ? colorBombCandy
                          : CANDY_IMAGES[candyType]
                      }
                      alt=""
                      draggable="false"
                    />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <footer className="game-footer">
          <p className="message" aria-live="polite">
            {message}
          </p>
          <button 
            className="restart-button"
            type="button"
            disabled={isResolving}
            onClick={restartGame}
          >
            Reiniciar
          </button>
        </footer>
      </section>
    </main>
  )
}

export default App
