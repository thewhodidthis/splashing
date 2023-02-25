import { rand } from "@thewhodidthis/arithmetics"
import { TAU } from "@thewhodidthis/geometrics"

export default class Walker {
  constructor(x = 0, y = x, max = 0) {
    this.max = max

    this.x = x
    this.y = y
  }
  reset(x, y, max) {
    this.max = max ?? this.max

    this.x = x ?? this.x
    this.y = y ?? this.y
  }
  walk(s = 1, max = this.max) {
    // Directions are uniformly spread, scale represents step size.
    const scale = Math.min(s, max)
    const angle = rand(TAU)

    this.x += scale * Math.cos(angle)
    this.y += scale * Math.sin(angle)

    return this
  }
}
