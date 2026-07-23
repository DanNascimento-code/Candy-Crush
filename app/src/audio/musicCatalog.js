function createTrack(track) {
  return Object.freeze(track)
}

export const MUSIC_CATALOG = Object.freeze([
  createTrack({
    phase: 1,
    genre: 'gothic',
    title: 'Gothic Dance Floor',
    artist: 'Origami Repetika',
    src: new URL(
      './music/phase-01-gothic-dance-floor.mp3',
      import.meta.url,
    ).href,
    sourceUrl:
      'https://freemusicarchive.org/music/Origami_Repetika/2021-tracks/gothic-dance-floor/',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  }),
  createTrack({
    phase: 2,
    genre: 'darkwave',
    title: 'Darker Waves',
    artist: 'Zander Noriega',
    src: new URL(
      './music/phase-02-darker-waves.mp3',
      import.meta.url,
    ).href,
    sourceUrl: 'https://opengameart.org/content/darker-waves',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
  }),
  createTrack({
    phase: 3,
    genre: 'deathcore',
    title: 'Age of Digital Hunters',
    artist: 'David J. Barrios',
    src: new URL(
      './music/phase-03-age-of-digital-hunters.mp3',
      import.meta.url,
    ).href,
    sourceUrl:
      'https://freemusicarchive.org/music/david-j-barrios/single/age-of-digital-hunters-la-era-de-los-cazadores-digitales-intro-deathcore-instrumental/',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  }),
])

export function getMusicForPhase(phase) {
  if (!Number.isInteger(phase)) {
    return null
  }

  return MUSIC_CATALOG.find((track) => track.phase === phase) ?? null
}
