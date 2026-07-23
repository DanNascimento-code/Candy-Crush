const BAT_FLIGHTS = Object.freeze([
  {
    top: '9%',
    duration: '18s',
    delay: '-3s',
    scale: 0.58,
    midRise: '-4vh',
    rise: '2vh',
    opacity: 0.38,
    blur: '0.3px',
    flapDuration: '680ms',
  },
  {
    top: '17%',
    duration: '24s',
    delay: '-17s',
    scale: 0.82,
    midRise: '3vh',
    rise: '-3vh',
    opacity: 0.5,
    blur: '0px',
    flapDuration: '760ms',
  },
  {
    top: '28%',
    duration: '31s',
    delay: '-9s',
    scale: 0.44,
    midRise: '-2vh',
    rise: '-6vh',
    opacity: 0.3,
    blur: '0.5px',
    flapDuration: '610ms',
  },
  {
    top: '12%',
    duration: '27s',
    delay: '-24s',
    scale: 0.68,
    midRise: '5vh',
    rise: '1vh',
    opacity: 0.44,
    blur: '0.15px',
    flapDuration: '720ms',
  },
  {
    top: '35%',
    duration: '36s',
    delay: '-29s',
    scale: 0.38,
    midRise: '-3vh',
    rise: '4vh',
    opacity: 0.26,
    blur: '0.65px',
    flapDuration: '590ms',
  },
])

function BatIcon() {
  return (
    <svg
      className="bat-icon"
      viewBox="0 0 80 42"
      focusable="false"
      aria-hidden="true"
    >
      <path
        className="bat-wing bat-wing-left"
        d="M38 18C29 6 16 4 3 7c5 4 7 8 8 14 5-3 9-3 13 1 3-4 8-5 14-2Z"
      />
      <path
        className="bat-wing bat-wing-right"
        d="M42 18C51 6 64 4 77 7c-5 4-7 8-8 14-5-3-9-3-13 1-3-4-8-5-14-2Z"
      />
      <path
        className="bat-body"
        d="M34 16l2-8 4 5 4-5 2 8c3 3 4 7 2 13l-8 9-8-9c-2-6-1-10 2-13Z"
      />
    </svg>
  )
}

function AnimatedBackground() {
  return (
    <div className="animated-background" aria-hidden="true">
      <div className="fog-layer fog-layer-back" />

      <div className="bat-swarm">
        {BAT_FLIGHTS.map((flight, index) => (
          <span
            className="bat-flight"
            key={`${flight.top}-${flight.duration}`}
            style={{
              '--bat-top': flight.top,
              '--bat-duration': flight.duration,
              '--bat-delay': flight.delay,
              '--bat-scale': flight.scale,
              '--bat-mid-rise': flight.midRise,
              '--bat-rise': flight.rise,
              '--bat-opacity': flight.opacity,
              '--bat-blur': flight.blur,
              '--flap-duration': flight.flapDuration,
              '--bob-delay': `${index * -170}ms`,
            }}
          >
            <BatIcon />
          </span>
        ))}
      </div>

      <div className="fog-layer fog-layer-front" />
    </div>
  )
}

export default AnimatedBackground
