import { useState } from 'react'

import blueCandy from './images/blue-candy.png'
import greenCandy from './images/green-candy.png'
import orangeCandy from './images/orange-candy.png'
import purpleCandy from './images/purple-candy.png'
import redCandy from './images/red-candy.png'
import yellowCandy from './images/yellow-candy.png'
import { areAdjacent, createBoard, trySwap } from './game/board.js'

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

  function attemptMove(firstIndex, secondIndex) {
    const result = trySwap({
      board,
      firstIndex,
      secondIndex,
      width: BOARD_WIDTH,
      candyTypes: CANDY_TYPES,
    })

    if (!result.accepted) {
      setMessage(
        result.reason === 'not-adjacent'
          ? 'Esses doces não são vizinhos.'
          : 'A troca precisa formar uma combinação.',
      )
      return
    }

    setBoard(result.board)
    setScore((currentScore) => currentScore + result.score)
    setMessage(
      result.cascades > 1
        ? `Combo de ${result.cascades} cascatas! +${result.score} pontos.`
        : `Combinação concluída! +${result.score} pontos.`,
    )
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
          aria-label="Tabuleiro 8 por 8"
        >
          {board.map((candyType, index) => (
            <button
              className={`tile${selectedIndex === index ? ' selected' : ''}`}
              key={index}
              type="button"
              draggable
              aria-label={`Doce ${candyType}, posição ${index + 1}`}
              aria-pressed={selectedIndex === index}
              onClick={() => handleTileClick(index)}
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, index)}
              onDragEnd={() => setDraggedIndex(null)}
            >
              <img src={CANDY_IMAGES[candyType]} alt="" draggable="false" />
            </button>
          ))}
        </div>

        <footer className="game-footer">
          <p className="message" aria-live="polite">
            {message}
          </p>
          <button className="restart-button" type="button" onClick={restartGame}>
            Reiniciar
          </button>
        </footer>
      </section>
    </main>
  )
}

export default App
