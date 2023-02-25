js/watch:
	deno bundle --import-map=imports.json client.js --watch --unstable bundle.js
js:
	deno bundle --import-map=imports.json client.js -r | \
		esbuild --bundle --minify --sourcefile=client.js --outfile=bundle.js --format=esm
js/lint:
	deno lint client.js painter.js brush.js helper.js shader.js
go:
	go run main.go
wasm:
	GOOS=js GOARCH=wasm go build -o splashing.wasm main.go
wasm/link:
	cp "$$(go env GOROOT)/misc/wasm/wasm_exec.js" Go.js
