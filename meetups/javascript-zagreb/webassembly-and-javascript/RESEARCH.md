# WebAssembly and JavaScript: talk research and speaker brief

## Chosen title

**WebAssembly and JavaScript**

**Subtitle:** From asm.js to practical C++ interop.

The title says exactly what the talk covers and will be easy to find later.
`|0` remains a recurring example inside the talk. JavaScript sees a bitwise OR
with zero. An asm.js validator sees an integer annotation.

## Abstract

Compiler-generated JavaScript used bitwise operations as type annotations. That
approach became asm.js, helped port million-line game engines to the browser,
and showed where an explicit compilation target would help. WebAssembly added
fixed-width values, linear memory, compact code, and a boundary JavaScript can
call.

We will follow that history, disassemble one tiny function, and then build a
useful C++ image kernel with Emscripten. The second half is about the part most
introductions skip: what actually happens to numbers, strings, arrays, objects,
pointers, and ownership when data crosses between JavaScript and C++.

## Audience and promise

The audience knows JavaScript and can read a little C or C++. No compiler theory
is required.

By the end, they should be able to:

1. Explain why asm.js used `|0` and why WebAssembly followed it.
2. Predict how an `i32`, `i64`, string, object, and byte buffer cross the
   JavaScript and Emscripten boundary.
3. Choose raw exports, `ccall`/`cwrap`, Embind, or `emscripten::val` for a small
   project.
4. Recognize when Wasm will help and when ordinary JavaScript is the better
   engineering choice.

## The thesis

WebAssembly is not "faster JavaScript." It is an explicit machine contract that
JavaScript can host.

The history makes that claim concrete:

```text
C++ semantics
    ↓ translated into
JavaScript coercion patterns such as |0
    ↓ standardized as
asm.js, a validated subset of JavaScript
    ↓ made explicit as
WebAssembly types, instructions, linear memory, imports, and exports
```

The practical consequence is equally concrete. Most Emscripten bugs do not come
from the arithmetic kernel. They come from crossing the boundary without a
clear answer to four questions:

- What is the representation?
- Did we copy it or share a view?
- Who owns it?
- How long is it valid?

## Timing and narrative

Target length is 40 minutes plus questions.

### Act 1: one integer, three answers, 0:00 to 7:00

Open on `0xffffffff`. JavaScript can display it as `4294967295`, coerce it to
`-1` with `|0`, and preserve it as an unsigned word in `Uint32Array`. Ask the
room which value is real. The answer is that the bits need a contract.

Make the important correction early. JavaScript `Number` can represent many
integers exactly, including every integer through `2^53 - 1`. Historically it
did not have a distinct general integer numeric type. Bitwise operators add a
32-bit coercion, typed arrays add fixed-width storage, and BigInt later adds
arbitrary-precision integer arithmetic. Those are different promises.

### Act 2: the browser learns to read compiler output, 7:00 to 17:00

Emscripten began in 2010 and was described in a 2011 paper as an LLVM-to-
JavaScript compiler. C and C++ wanted predictable wrapping arithmetic,
contiguous bytes, pointers, and structured control flow. JavaScript could mimic
those semantics, but the generated source was peculiar.

Reveal an asm.js function:

```js
function add1(x) {
  x = x | 0;
  return (x + 1) | 0;
}
```

The first coercion is a parameter annotation. The second preserves 32-bit
two's-complement wrapping. A parser can validate the restricted program and
compile it ahead of time. A browser without special asm.js support can still run
it as ordinary JavaScript.

This was not a toy. Mozilla reported that Epic ported more than a million lines
of Unreal Engine 3 code to the web in four days. The point is reuse, not a claim
that every line ran at native speed.

### Act 3: stop writing machine code as punctuation, 17:00 to 24:00

asm.js paid compatibility costs. Browsers still had to parse JavaScript source.
Machine types were encoded as coercion idioms. Adding features was constrained
by the requirement that the output remain sensible JavaScript.

In June 2015, engineers from Mozilla, Chromium, Edge, and WebKit announced work
on WebAssembly. Its goals included a portable compact binary, fast loading,
incremental evolution, sandboxed computation, and synchronous integration with
JavaScript. This was described at the time as an evolutionary step from asm.js.

The browser preview arrived in 2016. Browsers shipped WebAssembly by default in
2017. WebAssembly 1.0 became a W3C Recommendation on 5 December 2019.

Show the same addition in three forms:

```cpp
uint32_t add(uint32_t a, uint32_t b) { return a + b; }
```

```wat
(func (export "add") (param i32 i32) (result i32)
  local.get 0
  local.get 1
  i32.add)
```

```js
const { add } = instance.exports;
add(2_147_483_647, 1); // -2147483648 at the JS i32 boundary
```

The C++ example uses an unsigned type because unsigned overflow is defined to
wrap. Signed overflow in C++ is undefined behavior, even though Wasm `i32.add`
itself wraps the underlying 32-bit word.

The deck's integer lab instantiates a tiny handwritten Wasm binary. It compares
plain JavaScript addition, asm.js-style coercion, and `i32.add` without relying
on a compiler or a network request.

### Act 4: understand the boundary, 24:00 to 36:00

Draw two memory worlds:

```text
JavaScript heap                    WebAssembly linear memory
objects, strings, DOM nodes        bytes at numeric offsets
garbage collected                 malloc/free or language allocator
        │                                      │
        └── values, copies, views, handles ────┘
```

Core WebAssembly and the JavaScript API now include more than the original four
numeric types, including reference types. Emscripten's ordinary C and C++ ABI is
still best understood through numeric values and linear memory. Do not claim
that all modern Wasm can only exchange four numbers.

Use the photo kernel to follow real bytes:

1. Canvas gives JavaScript a `Uint8ClampedArray` of RGBA bytes.
2. JavaScript calls `_malloc(length)` in the Emscripten module.
3. `HEAPU8.set(source, ptr)` copies bytes into Wasm linear memory.
4. JavaScript calls `_posterize(ptr, length, levels)` once.
5. C++ mutates the bytes in place.
6. JavaScript copies the output into `ImageData` or consumes a valid view before
   `_free(ptr)`.

The useful performance rule is to send buffers, not pixels. A cheap call for
each pixel pays the boundary overhead millions of times. One call over a large
buffer gives the compiled kernel enough work to justify the crossing.

### Act 5: choose an interop layer, 36:00 to 40:00

End with a decision table and four rules:

1. Start with a small C ABI when stability and control matter.
2. Use Embind when the public API follows C++ classes and a natural JavaScript
   wrapper is worth generated glue.
3. Keep large data in one memory world. Pass pointer and length, or expose a
   short-lived typed view.
4. Document ownership and invalidation beside every boundary method.

## Numeric semantics to teach precisely

### JavaScript Number

ECMAScript `Number` uses the IEEE 754 binary64 value set. An integer is "safe"
when no other integer maps to the same Number value. The safe magnitude limit is
`2^53 - 1`.

```js
Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2; // true
```

`Number.isInteger(3.0)` is `true`, but that is a value predicate. It does not
introduce an integer storage type.

### Bitwise coercion

Most JavaScript bitwise operators coerce Number operands to 32-bit words.
`ToInt32` truncates the fractional part and takes the value modulo `2^32`, then
interprets the upper half as negative.

```js
3.9 | 0;          // 3
0xffffffff | 0;   // -1
0x80000000 | 0;   // -2147483648
```

This is why asm.js could use `x = x | 0` as an integer annotation while
remaining valid JavaScript.

### WebAssembly integers

Wasm integer bits do not carry signedness by themselves. Instructions choose a
signed or unsigned interpretation when it matters, such as comparison or
division. Addition wraps modulo the bit width.

At the JavaScript API boundary:

| Wasm value | JavaScript value | Important detail |
| --- | --- | --- |
| `i32` | `Number` | Conversion keeps the low 32 bits. Results appear signed. |
| `i64` | `BigInt` | Passing a Number throws. Current Emscripten enables BigInt integration by default. |
| `f32` | `Number` | The value is rounded to binary32 at the boundary or instruction. |
| `f64` | `Number` | This is the closest direct numeric match. |
| pointer | `Number` in wasm32 | It is an offset into linear memory, not a JavaScript object reference. |
| reference type | host/reference value | Modern Wasm can carry references, but this does not turn a C++ pointer into a DOM node. |

Mention `memory64` only if asked. Emscripten's common browser target is wasm32,
so examples use 32-bit offsets.

## C++ and Emscripten interop semantics

### Raw C exports

Use `extern "C"` to avoid C++ name mangling. Export the function at link time or
mark it `EMSCRIPTEN_KEEPALIVE`. Direct calls are fast and make the ABI visible.

```cpp
extern "C" {

EMSCRIPTEN_KEEPALIVE
uint32_t checksum(const uint8_t* bytes, size_t length);

}
```

Generated Emscripten module calls commonly use a leading underscore:

```js
const sum = Module._checksum(ptr, length);
```

`ccall` performs a one-off call with simple type conversion. `cwrap` creates a
reusable JavaScript wrapper. They support numbers, strings, booleans, and 8-bit
arrays, not arbitrary JavaScript structures.

### Pointers and buffers

A pointer is a byte offset. JavaScript accesses Emscripten's canonical typed
array views over `WebAssembly.Memory`:

```js
const ptr = Module._malloc(bytes.byteLength);
try {
  Module.HEAPU8.set(bytes, ptr);
  Module._transform(ptr, bytes.byteLength);
  const output = Module.HEAPU8.slice(ptr, ptr + bytes.byteLength);
} finally {
  Module._free(ptr);
}
```

`slice` copies. `subarray` creates a view. A view is faster to create, but it is
only valid while the allocation exists and while the underlying memory buffer
has not been replaced by growth.

With `-sALLOW_MEMORY_GROWTH`, a growth can invalidate previously captured typed
array views. Recreate the view from `Module.HEAPU8` after any call that might
allocate or grow memory.

### Strings

JavaScript strings and C++ strings have different representations. Typical glue
encodes JavaScript text as UTF-8, allocates bytes in linear memory, passes a
pointer and often a length, then decodes returned bytes back into a JavaScript
string. That is work and usually at least one copy.

Raw helpers make the steps explicit:

```js
const ptr = Module.stringToNewUTF8(input);
try {
  Module._consume_text(ptr);
} finally {
  Module._free(ptr);
}

const result = Module.UTF8ToString(returnedPtr);
```

Prefer pointer plus length when embedded zero bytes or repeated scanning matter.
Do not retain a temporary pointer created by glue unless the API explicitly
transfers ownership.

### C++ classes and Embind

Embind generates glue for functions, classes, value types, smart pointers, and
common standard-library containers. It makes a good demo API:

```cpp
class Histogram {
 public:
  void add(uint8_t value);
  uint32_t count(uint8_t value) const;
};

EMSCRIPTEN_BINDINGS(histogram_api) {
  emscripten::class_<Histogram>("Histogram")
      .constructor<>()
      .function("add", &Histogram::add)
      .function("count", &Histogram::count);
}
```

The JavaScript handle is not the C++ object itself. It contains enough state for
generated glue to locate the native object. Objects constructed in JavaScript or
returned by value normally need explicit cleanup:

```js
const histogram = new Module.Histogram();
try {
  histogram.add(7);
} finally {
  histogram.delete();
}
```

Where supported, explicit resource management can write `using histogram = ...`.
Finalizers are a fallback, not deterministic ownership.

`register_vector<T>` exposes a wrapped C++ vector API. It does not make the
vector a native JavaScript array. For large numeric data, a typed memory view is
usually the more revealing choice:

```cpp
emscripten::val bytes() {
  return emscripten::val(
      emscripten::typed_memory_view(data_.size(), data_.data()));
}
```

The returned typed array is a raw view. Mutation, reallocation, destruction, or
memory growth can invalidate it.

### JavaScript values inside C++

`emscripten::val` can hold and invoke JavaScript values from C++:

```cpp
using emscripten::val;

void announce(const std::string& message) {
  val::global("console").call<void>("log", message);
}
```

`EM_JS` is useful for a small named JavaScript function embedded beside C++.
`EM_ASM` is terse but becomes hard to test and type-check when it grows. Keep DOM
or framework orchestration in JavaScript unless moving it has a clear benefit.

### The practical choice

| Need | Start with | Cost to notice |
| --- | --- | --- |
| A few stable functions | raw `extern "C"` exports | manual strings and buffers |
| Converted calls for simple values | `ccall` / `cwrap` | conversion glue and runtime exports |
| C++ classes in JavaScript | Embind | wrapper size, call cost, explicit lifetime |
| C++ calling a browser or JS API | `emscripten::val` or `EM_JS` | reverse boundary calls |
| Large numeric data | pointer + length or typed memory view | ownership and invalidation |
| A very large WebIDL-shaped API | WebIDL Binder | separate interface file and narrower type set |

## Main demo: posterize a generated photograph

The repository includes `demos/pixel-lab`. It generates a colorful image in a
canvas, so the talk does not depend on Wi-Fi or a licensed photo. The slider
changes posterization levels.

The C++ loop is deliberately boring. The data movement is the lesson.

```cpp
for (size_t i = 0; i + 3 < length; i += 4) {
  pixels[i] = quantize(pixels[i], levels);
  pixels[i + 1] = quantize(pixels[i + 1], levels);
  pixels[i + 2] = quantize(pixels[i + 2], levels);
}
```

Demo beats:

1. Run the JavaScript fallback and establish the visual result.
2. Build and reload so the badge says `C++ / Wasm`.
3. Pause on `_malloc`, `HEAPU8.set`, one call, output copy, and `_free`.
4. Switch to "Borrow view" and ask what can invalidate it before showing the
   answer.
5. Change the implementation to call once per pixel only if you want a comic
   failure. Do not present an unmeasured speed ratio.

## Secondary demo: Embind feels native until ownership appears

The `embind-lab` exposes a `Palette` class. JavaScript can construct it, feed
colors, and ask for the dominant channel. Then the final line, `palette.delete()`,
reveals that the pleasant wrapper did not merge the garbage-collected heap with
the C++ heap.

This teaches an API decision the audience will face in real work, which a
Fibonacci benchmark does not.

## Rust comparison

Rust changes the producer language and gives stronger source-level memory
safety. It does not erase the host boundary. `wasm-bindgen` generates JavaScript
glue, strings are encoded and copied between JavaScript and Wasm memory, and
Rust structures are commonly represented by pointer-backed JavaScript wrappers.

Use one short comparison slide or keep it for questions:

```rust
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}")
}
```

The JavaScript signature hides allocation, UTF-8 encoding, pointer and length
arguments, decoding, and cleanup. That is the same lesson as Embind.

## Claims to avoid

- "WebAssembly is always faster than JavaScript." Modern JavaScript engines are
  excellent, and calls, copies, code size, or startup can dominate.
- "JavaScript has no integers." Use the precise distinction between integer
  values, fixed-width operations and storage, and a distinct numeric type.
- "Wasm is assembly for the web." It is a portable typed instruction format,
  not the native instruction set of the visitor's CPU.
- "Wasm replaces JavaScript." Its design explicitly integrates with JavaScript,
  which normally owns the UI and Web APIs.
- "Typed arrays make this zero-copy." A view over Wasm-owned memory can avoid a
  copy. Moving existing JavaScript-owned bytes into Wasm usually requires one.
- "The sandbox makes C++ safe." Linear-memory bounds are checked, but C++ bugs
  can still corrupt valid locations inside the module and produce wrong results.
- "Embind manages C++ lifetime like JavaScript." Handles usually need explicit
  cleanup.
- "A view stays valid until I drop it." Allocation lifetime, vector
  reallocation, and WebAssembly memory growth can all invalidate it.

## Primary sources

These are ordered by where they enter the talk.

1. [ECMAScript Number and safe-integer semantics](https://tc39.es/ecma262/2026/multipage/numbers-and-dates.html#sec-number.max_safe_integer)
2. [ECMAScript `ToInt32` and `ToUint32`](https://tc39.es/ecma262/2026/multipage/abstract-operations.html#sec-toint32)
3. [The asm.js specification](https://asmjs.org/spec/latest/)
4. [Emscripten talks and 2011 publication index](https://emscripten.org/docs/introducing_emscripten/Talks-and-Publications.html)
5. [Mozilla on asm.js in Firefox 22 and the Unreal Engine 3 port](https://blog.mozilla.org/mbest/2013/06/25/asm-js-its-really-fast-backwards-compatible-and-now-in-the-release-version-of-firefox/)
6. [Luke Wagner's June 2015 WebAssembly announcement](https://blog.mozilla.org/luke/2015/06/17/webassembly/)
7. [WebAssembly high-level goals](https://github.com/WebAssembly/design/blob/main/HighLevelGoals.md)
8. [The 2016 cross-browser WebAssembly preview](https://v8.dev/blog/webassembly-browser-preview)
9. [V8's history, including the 2017 on-by-default launch](https://v8.dev/blog/10-years)
10. [W3C WebAssembly 1.0 publication history](https://www.w3.org/standards/history/wasm-core-1/)
11. [WebAssembly core specification](https://webassembly.github.io/spec/core/)
12. [WebAssembly JavaScript interface](https://webassembly.github.io/spec/js-api/)
13. [WebAssembly design rationale](https://github.com/WebAssembly/design/blob/main/Rationale.md)
14. [Why WebAssembly was created alongside asm.js](https://github.com/WebAssembly/design/blob/main/FAQ.md)
15. [Emscripten's toolchain model](https://emscripten.org/docs/introducing_emscripten/about_emscripten.html)
16. [Calling between C/C++ and JavaScript](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html)
17. [Embind, ownership, and typed memory views](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html)
18. [Emscripten memory representation](https://emscripten.org/docs/porting/emscripten-runtime-environment.html#emscripten-memory-representation)
19. [Modern modularized Emscripten output](https://emscripten.org/docs/compiling/Modularized-Output.html)
20. [Building Emscripten output as WebAssembly](https://emscripten.org/docs/compiling/WebAssembly.html)
21. [`wasm-bindgen` string conversion](https://rustwasm.github.io/docs/wasm-bindgen/reference/types/string.html)
22. [Rust and Wasm interface design](https://rustwasm.github.io/book/game-of-life/implementing.html#interfacing-rust-and-javascript)

## Research status

Checked against the linked primary specifications and official project
documentation on 1 September 2026. The deck teaches the stable wasm32 Emscripten
model. Newer reference and GC features are acknowledged so the simplified ABI
explanation is not mistaken for the entire modern WebAssembly type system.
