import { curb as clamp, lerp as mix, rand, randF } from "@thewhodidthis/arithmetics"
import { TAU, poltocar } from "@thewhodidthis/geometrics"
import { vector, Vector } from "@thewhodidthis/vector"
import { Brush } from "./brush.js"
import { quadraticCurve } from "./helper.js"

class Step extends Vector {
  constructor(x, y) {
    super(x, y)

    this.t = performance.now()
  }
}

class Drop {
  constructor(x = 0, y = 0, r = 0) {
    this.x = x
    this.y = y

    this.r = r
    this.d = 2 * r
  }
}

export default class Painter {
  constructor(s = 1) {
    this.brush = new Brush()

    this.drops = []
    this.steps = []

    this.sensitivity = s
  }
  draw(context) {
    // Loop through and reset paint drops in one go.
    while (this.drops.length > 0) {
      const { x, y, r, d } = this.drops.shift()

      context.drawImage(this.brush, x - r, y - r, d, d)
    }

    return this
  }
  tick(time = performance.now()) {
    // Dump old points.
    this.steps = this.steps.filter(p => (time - p.t) < 200)

    // Add points if the brush is still.
    if (time - this?.lastStep?.t > 7.5) {
      this.step(this.lastStep.x, this.lastStep.y)
    }

    // Bail if steps still empty after all of the above.
    if (this.done) {
      delete this.lastStep
      delete this.lastTail

      return this
    }

    // Extract each curve's points from steps.
    const { 0: head, [this.steps.length - 1]: tail } = this.steps
    const start = this.lastTail ?? this.steps.at(-2) ?? head
    const end = tail

    this.lastTail = tail

    // Find and scale the average difference over the window.
    const scale = 1 / (this.steps.length * this.sensitivity)
    const average = [...this.steps]
      .reverse()
      .reduce((r, e, i, a) => i ? r.concat(e.subtract(a[i - 1])) : r, [])
      .reduce((r, e) => r.add(e), vector())
      .times(scale)

    const velocity = average.length()
    const distance = end.subtract(start)

    // Find the curve's control point.
    const control = start
      .add(distance.multiply(0.5))
      .add(average.multiply(Math.max(0, 1 - Math.log(velocity))))

    const thickness = Math.max(2, ((velocity - 10) * 0.25) + randF(-2, 2))
    const increment = 1 / distance.length()

    // Plot curve.
    for (let t = 0; t <= 1; t += increment) {
      const x = quadraticCurve(start.x, end.x, control.x, t)
      const y = quadraticCurve(start.y, end.y, control.y, t)

      this.drop(x, y, thickness)
    }

    // Draw spray drops, lots more when the velocity is high,
    // but not too many so as not to stall the app.
    Array.from({ length: clamp(rand(Math.max(0, velocity - 20) * 5), 1000) }, () => velocity)
      .map(v => v * 0.05)
      .forEach((v) => {
        const scatterDistance = mix(Math.min(1, v), Math.random(), Math.pow(Math.random(), 4) * v)
        const scatterSpread = randF(Math.PI, -Math.PI) / 3
        const rotation = -1 * Math.sin(scatterSpread) * Math.cos(scatterSpread)

        // Random factor, tends to be closer to 1.
        const radius = Math.pow(Math.random(), 4)
          // The further the scatter, the smaller the radius.
          * Math.min(1 / scatterDistance, 1)
          // When velocity is higher, make it bigger.
          * velocity * 0.5

        const { x, y } = vector(average.multiply(scatterDistance).dot(rotation)).plus(end)

        this.drop(x, y, radius)
      })

    // Draw drippy drops.
    const deltaT = tail.t - head.t

    const radius = randF(deltaT * 0.1)
    const spread = randF(deltaT * 0.3)

    Array.from({ length: clamp(2 - velocity / 5, 1000) }, () => randF(TAU))
      .map(a => poltocar(a, spread))
      .forEach((p) => {
        const { x, y } = tail.add(p)

        this.drop(x, y, radius)
      })

    return this
  }
  drop(x, y, r) {
    const d = new Drop(x, y, r)

    this.drops.push(d)
  }
  step(x, y) {
    this.lastStep = new Step(x, y)

    return this
  }
  set lastStep(m) {
    this.steps.push(m)
  }
  get done() {
    return this.steps.length === 0
  }
}
