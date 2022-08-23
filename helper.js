// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/quadraticCurveTo
// https://en.wikipedia.org/wiki/B%C3%A9zier_curve
export function quadraticCurve(start, end, control, t) {
  return (1 - t) * (1 - t) * start + 2 * (1 - t) * t * control + t * t * end
}

// Helps convert CSS hexadecimal color strings to RGB arrays.
export function hex2rgb(hex) {
  return [
    parseInt(hex.substring(1, 3), 16),
    parseInt(hex.substring(3, 5), 16),
    parseInt(hex.substring(5, 7), 16),
  ]
}

// Runs a callback when second called within a certain threshold.
export function deltaprobe(callback, then = performance.now()) {
  return (now = then, threshold = 250) => {
    if (now - then <= threshold) {
      callback(then)
    }

    then = now
  }
}

// Helps turn file size given in bytes into human readable form.
// https://stackoverflow.com/questions/15900485
export function sizeformatter(bytes = 0, decimals = 2) {
  if (bytes === 0) {
    return "0 b"
  }

  const sizes = ["b", "Kb", "Mb", "Gb", "Tb", "Pb", "Eb", "Zb", "Yb"]
  const d = Math.max(0, decimals)
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${sizes[i]}`
}

// Helps with string to HTML coversion.
export function ranger(s = "") {
  return document.createRange().createContextualFragment(s)
}

// The Box-Muller transform for arriving from Uniform to Normal distribution
// https://en.wikipedia.org/wiki/Box–Muller_transform#Basic_form
export function basic(mean = 0, standardDeviation = 1) {
  let swap = false
  let spare

  return () => {
    swap = !swap

    if (swap) {
      return mean + (standardDeviation * spare)
    }

    const u1 = Math.random()
    const u2 = Math.random()

    const R = Math.sqrt(-2 * Math.log(u1))
    const theta = TAU * u2

    spare = R * Math.sin(theta)

    return mean + (standardDeviation * R * Math.cos(theta))
  }
}

// And in the more performant polar form adapted from,
// https://en.wikipedia.org/wiki/Marsaglia_polar_method
export function polar(mean = 0, standardDeviation = 1) {
  const sampler = () => {
    const x = rand(-1, 1)
    const y = rand(-1, 1)

    const s = (x * x) + (y * y)

    if (s < 1 && s > 0) {
      return [x, y, s]
    }

    return sampler()
  }

  let swap = false
  let spare

  return () => {
    swap = !swap

    if (swap) {
      return mean + (standardDeviation * spare)
    }

    const [x, y, s] = sampler()
    const commonFactor = Math.sqrt((-2 * Math.log(s)) / s)

    spare = commonFactor * y

    return mean + (standardDeviation * commonFactor * x)
  }
}

// The Normal distribution probability density function (Gaussian PDF) adapted from,
// https://github.com/errcw/gaussian/blob/master/lib/gaussian.js
export function guassian(mean = 0, variance = 1) {
  const standardDeviation = Math.sqrt(variance)
  const factor = 1 / standardDeviation * Math.sqrt(TAU)

  return x => factor * Math.exp(-0.5 * Math.pow((x - mean) / standardDeviation, 2))
}

export function randomNonZero() {
  let u = 0

  while (u === 0) {
    u = Math.random()
  }

  return u
}

// For generating preferably higher random numbers adapted from natureofcode.com
export default function monteCarlo() {
  function sampler() {
    const r1 = Math.random()
    const r2 = Math.random()

    if (r1 < r2) {
      return r1
    }

    // Keep working until a qualifying random value is found
    return sampler()
  }

  return sampler()
}
