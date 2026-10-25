const runtimeBadge = document.querySelector("[data-runtime]");
const colorInput = document.querySelector("[data-color]");
const swatches = document.querySelector("[data-swatches]");
const sizeOutput = document.querySelector("[data-size]");
const dominantOutput = document.querySelector("[data-dominant]");
const stateOutput = document.querySelector("[data-state]");
const eventLog = document.querySelector("[data-log]");
let Module = null;
let palette = null;
let colors = [];

class FallbackPalette {
  #totals = [0, 0, 0];
  #size = 0;

  add(red, green, blue) {
    this.#totals[0] += red;
    this.#totals[1] += green;
    this.#totals[2] += blue;
    this.#size += 1;
  }

  size() { return this.#size; }

  dominantChannel() {
    if (this.#size === 0) return "none";
    if (this.#totals[0] >= this.#totals[1] && this.#totals[0] >= this.#totals[2]) return "red";
    if (this.#totals[1] >= this.#totals[2]) return "green";
    return "blue";
  }

  delete() {}
}

const log = (message) => {
  const item = document.createElement("li");
  item.textContent = message;
  eventLog.prepend(item);
};

const createPalette = () => {
  palette = Module ? new Module.Palette() : new FallbackPalette();
  stateOutput.textContent = "alive";
  stateOutput.classList.remove("is-dead");
  log("palette = new Module.Palette()");
};

const hexToRgb = (hex) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const updateOutputs = () => {
  sizeOutput.textContent = String(palette.size());
  dominantOutput.textContent = palette.dominantChannel();
  swatches.replaceChildren();

  if (colors.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No colors yet.";
    swatches.append(empty);
    return;
  }

  colors.forEach((color) => {
    const swatch = document.createElement("i");
    swatch.style.background = color;
    swatch.title = color;
    swatches.append(swatch);
  });
};

const addColor = (hex) => {
  const [red, green, blue] = hexToRgb(hex);
  palette.add(red, green, blue);
  colors.push(hex);
  log(`palette.add(${red}, ${green}, ${blue})`);
  updateOutputs();
};

document.querySelector("[data-add]").addEventListener("click", () => addColor(colorInput.value));
document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    colorInput.value = button.dataset.preset;
    addColor(button.dataset.preset);
  });
});

document.querySelector("[data-destroy]").addEventListener("click", () => {
  palette.delete();
  palette = null;
  stateOutput.textContent = "deleted";
  stateOutput.classList.add("is-dead");
  log("palette.delete()  // C++ destructor runs now");
  colors = [];
  createPalette();
  updateOutputs();
});

window.addEventListener("beforeunload", () => palette?.delete());

try {
  const { default: createModule } = await import("./palette.mjs");
  Module = await createModule();
  runtimeBadge.classList.add("is-wasm");
  runtimeBadge.querySelector("span").textContent = "C++ / Embind";
} catch {
  runtimeBadge.querySelector("span").textContent = "JS fallback";
}

createPalette();
updateOutputs();

