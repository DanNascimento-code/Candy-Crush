import { useEffect, useRef, useState } from 'react'

import { getMusicForPhase } from '../audio/musicCatalog.js'

const DEFAULT_VOLUME = 0.24
const MUTED_STORAGE_KEY = 'sweet-mayhem:music-muted'

const GENRE_LABELS = {
  gothic: 'Gótico',
  darkwave: 'Darkwave',
  deathcore: 'Deathcore',
}

function getInitialMutedPreference() {
  try {
    return window.localStorage.getItem(MUTED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function BackgroundMusic({ phase }) {
  const track = getMusicForPhase(phase)
  const audioRef = useRef(null)
  const [isMuted, setIsMuted] = useState(getInitialMutedPreference)
  const [playbackState, setPlaybackState] = useState('loading')

  useEffect(() => {
    const audio = audioRef.current

    if (audio === null || track === null) {
      return undefined
    }

    let isDisposed = false

    function removeUnlockListeners() {
      document.removeEventListener('pointerdown', handleFirstInteraction, true)
      document.removeEventListener('click', handleFirstInteraction, true)
      document.removeEventListener('keydown', handleFirstInteraction, true)
    }

    function handlePlaybackStarted() {
      if (!isDisposed) {
        setPlaybackState('playing')
      }

      removeUnlockListeners()
    }

    function handlePlaybackError() {
      if (!isDisposed) {
        setPlaybackState('error')
      }
    }

    async function attemptPlayback() {
      try {
        await audio.play()
        handlePlaybackStarted()
      } catch {
        if (!isDisposed) {
          setPlaybackState('waiting')
        }
      }
    }

    function handleFirstInteraction() {
      void attemptPlayback()
    }

    audio.loop = true
    audio.preload = 'auto'
    audio.volume = DEFAULT_VOLUME
    audio.load()

    audio.addEventListener('playing', handlePlaybackStarted)
    audio.addEventListener('error', handlePlaybackError)
    document.addEventListener('pointerdown', handleFirstInteraction, true)
    document.addEventListener('click', handleFirstInteraction, true)
    document.addEventListener('keydown', handleFirstInteraction, true)

    void attemptPlayback()

    return () => {
      isDisposed = true
      removeUnlockListeners()
      audio.removeEventListener('playing', handlePlaybackStarted)
      audio.removeEventListener('error', handlePlaybackError)
      audio.pause()
    }
  }, [track])

  useEffect(() => {
    const audio = audioRef.current

    if (audio !== null) {
      audio.muted = isMuted
    }

    try {
      window.localStorage.setItem(MUTED_STORAGE_KEY, String(isMuted))
    } catch {
      // The preference is optional when browser storage is unavailable.
    }
  }, [isMuted])

  if (track === null) {
    return null
  }

  const isAudible = playbackState === 'playing' && !isMuted
  const statusLabel = isMuted
    ? 'Música silenciada'
    : playbackState === 'waiting'
      ? 'Clique para ouvir'
      : playbackState === 'error'
        ? 'Áudio indisponível'
        : `${GENRE_LABELS[track.genre]} · Fase ${phase}`

  async function handleToggleMusic() {
    const audio = audioRef.current

    if (audio === null) {
      return
    }

    const shouldEnable = isMuted || playbackState !== 'playing'

    if (!shouldEnable) {
      audio.muted = true
      setIsMuted(true)
      return
    }

    audio.muted = false
    setIsMuted(false)

    try {
      await audio.play()
      setPlaybackState('playing')
    } catch {
      setPlaybackState('waiting')
    }
  }

  return (
    <div className="music-control" data-playing={isAudible || undefined}>
      <audio
        ref={audioRef}
        src={track.src}
        muted={isMuted}
        loop
        preload="auto"
      />

      <button
        className="music-toggle"
        type="button"
        aria-pressed={isAudible}
        aria-label={isAudible ? 'Silenciar música' : 'Ativar música'}
        onClick={handleToggleMusic}
      >
        <span className="music-icon" aria-hidden="true">
          {isAudible ? '♪' : '×'}
        </span>

        <span className="music-copy">
          <small>{statusLabel}</small>
          <strong>{track.title}</strong>
        </span>
      </button>
    </div>
  )
}

export default BackgroundMusic
