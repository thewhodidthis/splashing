import { rand, curb } from "@thewhodidthis/arithmetics"
import looper from "@thewhodidthis/animation"
import glx from "@thewhodidthis/glx"
import { fragment, vertex } from "./shader.js"
import Painter from "./painter.js"
import { deltaprobe, ranger, sizeformatter } from "./helper.js"
import Walker from "./walker.js"
import { Brush } from "./brush.js"

const ALPHA = 1.26
const DELAY = 10
const MAX_FRAMES = 20
const MAX_STEP = 50

const cauchy = (u = Math.random()) => Math.tan(Math.PI * (u - 0.5))
const pareto = a => (u = Math.random()) => 1 / Math.pow(1 - u, 1 / a)

const save = document.querySelector("#save")
const progress = document.querySelector("progress")
const clear = document.querySelector("#clear")
const draw = document.querySelector("#draw")
const statusline = document.querySelector("#statusline")

const canvas = document.querySelector("canvas")
const loop = looper(render)

const attributes = { preserveDrawingBuffer: true }
const { gl, createVbo, createProgram } = glx(canvas, { attributes })
const shadow = canvas.cloneNode().getContext("2d")
const { width: w, height: h } = canvas

console.log(gl)

const background = [1, 1, 1]
const clearColor = [...background, 0]

const bytesPerElement = Float32Array.BYTES_PER_ELEMENT
const edges = new Float32Array([
  0, 0,
  0, h,
  w, 0,
  w, 0,
  0, h,
  w, h,
])

const program = createProgram(vertex, fragment)
const buffer = createVbo(edges)
const aPosition = gl.getAttribLocation(program, "aPosition")

if (aPosition !== -1) {
  // attrib location, no. of per attrib elements, element type, _, size, offset
  gl.enableVertexAttribArray(aPosition)
}

const uResolution = gl.getUniformLocation(program, "uResolution")
const uSampler = gl.getUniformLocation(program, "uSampler")
const uThreshold = gl.getUniformLocation(program, "uThreshold")

const master = gl.createTexture()

gl.activeTexture(gl.TEXTURE0 + 0)
gl.bindTexture(gl.TEXTURE_2D, master)

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)

gl.useProgram(program)

const { searchParams: settings } = new URL(document.location)
const sampler = settings.has("cauchy") ? cauchy : pareto(ALPHA)

const durationMaybe = settings.has("duration") ? settings.get("duration") : 10
const duration = 200 * parseInt(durationMaybe, 10)

const painter = new Painter()

const randompoint = (...args) => Array.from({ length: args.length }, (_, i) => rand(0, args.at(i)))
const center = [w, h].map(v => v * 0.5)

const brushswap = deltaprobe(() => {
  painter.brush = new Brush()
})

const store = []
const proxy = new Proxy(store, {
  set(t, k, v) {
    const r = Reflect.set(t, k, v)

    if (t.length && k === "length") {
      const n = parseInt(((t.length % MAX_FRAMES) / MAX_FRAMES) * 100, 10)
      const p = String(n).padStart(3, " ")

      if (n) {
        statusline.replaceChildren(ranger(`Running&hellip; <code>${p}%</code>`))
        progress.setAttribute("value", n)

        save.removeAttribute("disabled")
      } else {
        statusline.replaceChildren(ranger(`Okay, <code>${t.length}</code> frames in store`))
        progress.setAttribute("value", 0)

        draw.removeAttribute("disabled")
      }
    }

    if (t.length && t.length % MAX_FRAMES === 0) {
        loop.stop()
    }

    if (t.length) {
      save.removeAttribute("disabled")
    } else {
      draw.removeAttribute("disabled")
    }

    return r
  }
})

const walker = new Walker(...center, MAX_STEP)
const worker = new Worker("worker.js")

worker.addEventListener("message", (e) => {
  const { image, step, error } = e.data

  if (error) {
    progress.setAttribute("value", 0)
    console.error(error)
  }

  if (step) {
    const { index, total: t } = step
    const { length: l } = String(t)
    const n = parseInt(((index + 1) / t) * 100, 10)
    const p = String(n).padStart(l, " ")

    statusline.replaceChildren(ranger(`Processing&hellip; <code>${p}%</code>`))
    progress.setAttribute("value", n)
  }

  if (image) {
    const { data, size } = image

    const gif = `Splash.${Date.now()}.gif`
    const a = `<a href="data:image/gif;base64,${data}" download="${gif}"><strong>${gif}</strong></a>`
    const s = sizeformatter(size)

    proxy.splice(0, proxy.length)

    statusline.replaceChildren(ranger(`All set! ${a} <code>${s}</code>`))
    progress.setAttribute("value", 0)
  }
})

draw.addEventListener("click", function ondraw() {
  draw.setAttribute("disabled", "")

  statusline.replaceChildren(ranger(`Running&hellip;`))
  walker.reset(...randompoint(w, h))

  progress.removeAttribute("value")
  loop.start()
}, { passive: true })

clear.addEventListener("click", function onclear() {
  shadow.clearRect(0, 0, w, h)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
})

save.addEventListener("click", function onsave() {
  if (proxy.length === 0) {
    return
  }

  draw.setAttribute("disabled", "")
  save.setAttribute("disabled", "")

  statusline.replaceChildren(ranger(`Uploading&hellip;`))
  worker.postMessage({ store })

  progress.removeAttribute("value")
  loop.stop()
}, { passive: true })

function render(_, n) {
  const distance = sampler()
  const p = walker.walk(distance)

  const x = curb(p.x, w)
  const y = curb(p.y, h)

  painter.step(x, y).tick().draw(shadow)

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, shadow.canvas)
  gl.generateMipmap(gl.TEXTURE_2D)

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

  gl.clearColor(...clearColor)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

  gl.uniform2f(uResolution, w, h)
  gl.uniform1i(uSampler, master)
  gl.uniform1f(uThreshold, 0.75)

  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, gl.TRUE, 2 * bytesPerElement, 0)
  gl.drawArrays(gl.TRIANGLES, 0, edges.length / 2)

  if (n % 100 === 0) {
    brushswap()
  }

  if (n % DELAY === 0) {
    proxy.push(canvas.toDataURL())
  }
}
