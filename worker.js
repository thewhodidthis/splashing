importScripts("./Go.js")

;(async () => {
  // Set up the WASM!
  const go = new Go()
  const result = await WebAssembly.instantiateStreaming(fetch("splashing.wasm"), go.importObject)

  go.run(result.instance)
})()

self.addEventListener("splashing#step", function onprogress(e) {
  self.postMessage({ step: e.detail })
})

self.addEventListener("message", async function onmessage({ data }) {
  const { store } = data

  if (store) {
    try {
      const frames = store.map(s => s.replace("data:image/png;base64,", ""))
      const result = await self.Save(...frames)

      self.postMessage({ image: result })
    } catch (e) {
      self.postMessage({ error: e.message })
    }
  }
})
