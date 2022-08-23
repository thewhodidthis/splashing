package main

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/color"
	"image/color/palette"
	"image/draw"
	"image/gif"
	"image/png"
	"syscall/js"
)

var colors color.Palette = append(palette.WebSafe, image.Transparent)

func main() {
	loop := make(chan bool)
	// Err-lang style callback hell FTW.
	save := js.FuncOf(func(this js.Value, steps []js.Value) interface{} {
		fig := gif.GIF{LoopCount: 0}
		buf := new(bytes.Buffer)
		bob := js.FuncOf(func(this js.Value, funcs []js.Value) interface{} {
			resolve, reject := funcs[0], funcs[1]

			for i, b64 := range steps {
				b, err := base64.StdEncoding.DecodeString(b64.String())

				// Jump to the next frame.
				if err != nil {
					reject.Invoke(js.Global().Get("Error").New(err.Error()))

					continue
				}

				img, err := png.Decode(bytes.NewReader(b))

				// Ditto.
				if err != nil {
					reject.Invoke(js.Global().Get("Error").New(err.Error()))

					continue
				}

				rec := img.Bounds()
				dst := image.NewPaletted(rec, colors)

				draw.Draw(dst, rec, img, rec.Min, draw.Src)

				fig.Image = append(fig.Image, dst)
				fig.Delay = append(fig.Delay, 0)

				e := js.Global().Get("CustomEvent").New("splashing#step", map[string]interface{}{
					"detail": map[string]interface{}{
						"total": len(steps),
						"index": i,
					},
				})

				js.Global().Call("dispatchEvent", e)
			}

			// Fail.
			if err := gif.EncodeAll(buf, &fig); err != nil {
				reject.Invoke(js.Global().Get("Error").New(err.Error()))

				return nil
			}

			// Win.
			resolve.Invoke(map[string]interface{}{
				"data": base64.StdEncoding.EncodeToString(buf.Bytes()),
				"size": buf.Len(),
			})

			return nil
		})

		return js.Global().Get("Promise").New(bob)
	})

	js.Global().Set("Save", save)

	// Block party (to keep from exiting).
	<-loop
}
