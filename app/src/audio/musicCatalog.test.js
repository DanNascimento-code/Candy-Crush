import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MUSIC_CATALOG,
  getMusicForPhase,
} from './musicCatalog.js'

test('music catalog maps one licensed track to each planned phase', () => {
  assert.equal(MUSIC_CATALOG.length, 3)

  assert.deepEqual(
    MUSIC_CATALOG.map(({ phase, genre }) => ({ phase, genre })),
    [
      { phase: 1, genre: 'gothic' },
      { phase: 2, genre: 'darkwave' },
      { phase: 3, genre: 'deathcore' },
    ],
  )
})

test('every catalog entry has an audio source and auditable licensing data', () => {
  for (const track of MUSIC_CATALOG) {
    assert.match(track.src, /\.mp3$/)
    assert.match(track.sourceUrl, /^https:\/\//)
    assert.match(track.licenseUrl, /^https:\/\//)
    assert.ok(track.title.length > 0)
    assert.ok(track.artist.length > 0)
    assert.equal(Object.isFrozen(track), true)
  }
})

test('getMusicForPhase returns the selected phase track', () => {
  assert.equal(getMusicForPhase(1)?.title, 'Gothic Dance Floor')
  assert.equal(getMusicForPhase(2)?.title, 'Darker Waves')
  assert.equal(
    getMusicForPhase(3)?.title,
    'Age of Digital Hunters',
  )
})

test('getMusicForPhase rejects phases that do not exist yet', () => {
  assert.equal(getMusicForPhase(0), null)
  assert.equal(getMusicForPhase(4), null)
  assert.equal(getMusicForPhase('1'), null)
})
