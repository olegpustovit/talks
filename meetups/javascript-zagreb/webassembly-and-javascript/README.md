# WebAssembly and JavaScript

> From asm.js to practical C++ interop.

A 40-minute JavaScript Zagreb talk about the odd road from JavaScript numbers to
asm.js and WebAssembly, followed by a practical guide to C++ and JavaScript
interop with Emscripten.

## Open the deck

Serve the repository root so the browser can load ES modules and any compiled
Wasm demo output:

```sh
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/meetups/javascript-zagreb/webassembly-and-javascript/
```

Controls:

- Right arrow, Space, or Page Down moves forward.
- Left arrow or Page Up moves backward.
- Home and End jump to the first and last slide.
- `F` toggles fullscreen.
- `N` toggles speaker notes.
- Add `?print` before the hash for a print-friendly layout.

The integer lab inside the deck is real WebAssembly and needs no build step.
The photo demo uses a JavaScript fallback until its C++ kernel has been compiled.

## Rehearsal material

- [`study-guide.html`](./study-guide.html) is the detailed visual learning guide:
  number contracts, asm.js, the Wasm machine, memory ownership, interop examples,
  performance traps, and presenter self-tests.
- [`senior-exam.html`](./senior-exam.html) is the 100-point candidate exam.
  [`senior-exam-answers.html`](./senior-exam-answers.html) has model answers and
  a point-by-point grading rubric.
- [`RESEARCH.md`](./RESEARCH.md) contains the thesis, timing, detailed argument,
  interop semantics, accuracy traps, and primary sources.
- [`demos/pixel-lab/`](./demos/pixel-lab/) is the main C++ Emscripten demo.
- [`demos/embind-lab/`](./demos/embind-lab/) contrasts raw exports with Embind.

## Suggested delivery

Run the number quiz before explaining anything. Let the room guess. The reveal
works because all three answers are correct under different numeric contracts.

Use `|0` as a small recurring example. It begins as a JavaScript coercion,
becomes an asm.js type annotation, and ends as the explicit `i32` in
WebAssembly.

In the practical half, show the two heaps and account for each pointer, copy,
view, and owner in the photo demo.
