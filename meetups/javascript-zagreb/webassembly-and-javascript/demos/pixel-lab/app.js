const sourceCanvas = document.querySelector("[data-source]");
const outputCanvas = document.querySelector("[data-output]");
const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
const outputContext = outputCanvas.getContext("2d");
const levelsInput = document.querySelector("[data-levels]");
const levelsOutput = document.querySelector("[data-level-output]");
const runtimeBadge = document.querySelector("[data-runtime]");
const status = document.querySelector("[data-status]");
const duration = document.querySelector("[data-duration]");
const byteCount = document.querySelector("[data-byte-count]");
const outputPolicy = document.querySelector("[data-output-policy]");
const outputDetail = document.querySelector("[data-output-detail]");
let Module = null;
let imageSeed = 1;
let renderFrame = 0;

const drawGeneratedImage = () => {
  const { width, height } = sourceCanvas;
  const gradient = sourceContext.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `hsl(${(imageSeed * 47) % 360} 85% 52%)`);
  gradient.addColorStop(.45, `hsl(${(imageSeed * 47 + 105) % 360} 82% 48%)`);
  gradient.addColorStop(1, `hsl(${(imageSeed * 47 + 230) % 360} 90% 55%)`);
  sourceContext.fillStyle = gradient;
  sourceContext.fillRect(0, 0, width, height);

  for (let index = 0; index < 28; index += 1) {
    const x = (index * 193 + imageSeed * 67) % width;
    const y = (index * 109 + imageSeed * 31) % height;
    const radius = 16 + ((index * 29 + imageSeed) % 92);
    sourceContext.beginPath();
    sourceContext.arc(x, y, radius, 0, Math.PI * 2);
    sourceContext.fillStyle = `hsl(${(index * 41 + imageSeed * 13) % 360} 90% ${36 + (index % 4) * 12}% / .55)`;
    sourceContext.fill();
  }

  sourceContext.save();
  sourceContext.translate(width * .08, height * .74);
  sourceContext.rotate(-.08);
  sourceContext.font = "800 82px system-ui, sans-serif";
  sourceContext.fillStyle = "rgb(10 7 17 / 72%)";
  sourceContext.fillText("RGBA", 0, 0);
  sourceContext.font = "700 22px monospace";
  sourceContext.fillStyle = "white";
  sourceContext.fillText(`${width} × ${height} × 4 bytes`, 5, 36);
  sourceContext.restore();
};

const quantize = (value, levels) => {
  const steps = levels - 1;
  const bucket = Math.floor((value * steps + 127) / 255);
  return Math.floor((bucket * 255) / steps);
};

const posterizeInJavaScript = (rgba, levels) => {
  for (let index = 0; index + 3 < rgba.length; index += 4) {
    rgba[index] = quantize(rgba[index], levels);
    rgba[index + 1] = quantize(rgba[index + 1], levels);
    rgba[index + 2] = quantize(rgba[index + 2], levels);
  }
};

const selectedPolicy = () => document.querySelector('input[name="policy"]:checked').value;

const paintWithJavaScript = (source, levels) => {
  const copy = new Uint8ClampedArray(source.data);
  posterizeInJavaScript(copy, levels);
  outputContext.putImageData(new ImageData(copy, source.width, source.height), 0, 0);
};

const paintWithWasm = (source, levels, policy) => {
  const pointer = Module._malloc(source.data.byteLength);

  try {
    Module.HEAPU8.set(source.data, pointer);
    Module._posterize(pointer, source.data.byteLength, levels);

    if (policy === "copy") {
      const copy = Module.HEAPU8.slice(pointer, pointer + source.data.byteLength);
      const pixels = new Uint8ClampedArray(copy);
      outputContext.putImageData(new ImageData(pixels, source.width, source.height), 0, 0);
    } else {
      const view = new Uint8ClampedArray(Module.HEAPU8.buffer, pointer, source.data.byteLength);
      outputContext.putImageData(new ImageData(view, source.width, source.height), 0, 0);
    }
  } finally {
    Module._free(pointer);
  }
};

const render = () => {
  const source = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const levels = Number(levelsInput.value);
  const policy = selectedPolicy();
  levelsOutput.value = String(levels);
  outputPolicy.textContent = policy === "copy" ? "slice" : "subarray view";
  outputDetail.textContent = policy === "copy" ? "copy out" : "borrow until paint";
  byteCount.textContent = `${source.data.byteLength.toLocaleString()} bytes`;

  const started = performance.now();
  if (Module) paintWithWasm(source, levels, policy);
  else paintWithJavaScript(source, levels);
  duration.textContent = `${(performance.now() - started).toFixed(2)} ms`;
};

const scheduleRender = () => {
  cancelAnimationFrame(renderFrame);
  renderFrame = requestAnimationFrame(render);
};

levelsInput.addEventListener("input", scheduleRender);
document.querySelectorAll('input[name="policy"]').forEach((input) => input.addEventListener("change", scheduleRender));
document.querySelector("[data-regenerate]").addEventListener("click", () => {
  imageSeed += 1;
  drawGeneratedImage();
  render();
});

drawGeneratedImage();
render();

try {
  const { default: createModule } = await import("./pixel_lab.mjs");
  Module = await createModule();
  runtimeBadge.classList.add("is-wasm");
  runtimeBadge.querySelector("span").textContent = "C++ / Wasm";
  status.textContent = "The Emscripten module is active.";
  render();
} catch {
  runtimeBadge.querySelector("span").textContent = "JS fallback";
  status.textContent = "Build pixel_lab.cpp, then reload to activate C++ / Wasm.";
}

