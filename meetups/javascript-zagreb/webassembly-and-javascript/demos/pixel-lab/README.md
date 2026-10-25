# Pixel lab

This demo generates an image locally, copies its RGBA bytes into Emscripten
linear memory, calls one C++ function, and paints the result.

## Build

Install and activate the Emscripten SDK, then run:

```sh
./build.sh release
```

For assertions, source maps, and safe-heap checks:

```sh
./build.sh debug
```

The build creates `pixel_lab.mjs`, `pixel_lab.wasm`, and possibly a source map
in this directory. Reload the page and the badge will change from `JS fallback`
to `C++ / Wasm`.

## Rehearse

1. Start with "Copy output" selected. Read the five operations in the stats
   strip: allocate, copy in, call once, copy out, free.
2. Switch to "Borrow view." The canvas consumes a view before `_free` runs.
3. Ask what would break if the view escaped the function or memory grew.
4. Change the level slider to show that one boundary call processes the entire
   buffer.

The timing is deliberately labelled "bridge + kernel." It is not a JavaScript
versus Wasm benchmark.

