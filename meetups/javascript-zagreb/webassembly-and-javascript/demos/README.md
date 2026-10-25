# Talk demos

The deck has two supporting Emscripten demos.

- [`pixel-lab/`](./pixel-lab/) is the main live demo. It makes every allocation,
  copy, call, view, and free visible.
- [`embind-lab/`](./embind-lab/) shows how a C++ class becomes a pleasant
  JavaScript wrapper and why the wrapper still needs explicit cleanup.

Both pages use a JavaScript fallback before their C++ output has been built. A
status badge always says which implementation is running, so the fallback
cannot be mistaken for Wasm during a rehearsal.

Serve this talk through HTTP after building:

```sh
python3 -m http.server 8080
```

Opening an HTML file directly will not work because the browser needs to fetch
ES modules and `.wasm` files.

