import { hex2rgb } from "./helper.js"

const colors = [
  // 250, 86, 25
  "#fa5619",
  // 36, 52, 112
  "#243470",
  // 239, 193, 38
  "#efc126",
  // 13, 7, 11
  "#0d070b",
  // 255, 255, 253
  "#fffffd",
]

const { createObjectURL, revokeObjectURL } = self.URL || self.webkitURL
const sprites = colors.map((c) =>
  new Promise((resolve, reject) => {
    const [r, g, b] = hex2rgb(c)
    const svg = `<svg
      height="10"
      width="10"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <radialGradient id="gradient">
          <stop offset="0%" stop-color="rgba(${r}, ${g}, ${b}, 0.9)" />
          <stop offset="90%" stop-color="rgba(${r}, ${g}, ${b}, 0.0)" />
        </radialGradient>
      </defs>
      <circle cx="5" cy="5" r="5" fill="url('#gradient')" />
    </svg>`

    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = (e) => {
      reject(e)
    }

    image.src = url
  })
)

// The brushes array contains gradient images created for each color in the palette.
export const brushes = await Promise.all(sprites)

// Helps rotate through brushes.
export function Brush() {
  const b = brushes.shift()

  //Ooh, mutate in place, is this even legal?
  brushes.push(b)

  return b
}
