(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const currentLabel = document.querySelector("[data-current]");
  const totalLabel = document.querySelector("[data-total]");
  const progress = document.querySelector(".progress__bar");
  const sectionLabel = document.querySelector("[data-section-label]");
  const speakerPanel = document.querySelector("[data-speaker-panel]");
  const notesButton = document.querySelector('[data-action="notes"]');
  let current = 0;
  let touchStartX = 0;

  const indexFromHash = () => {
    const requested = Number.parseInt(location.hash.slice(1), 10);
    return Number.isInteger(requested) ? requested - 1 : 0;
  };

  const updateSpeakerNote = () => {
    const note = slides[current].querySelector(".speaker-note");
    speakerPanel.textContent = note?.textContent.trim() || "No note for this slide.";
  };

  const show = (index, updateHash = true) => {
    current = Math.max(0, Math.min(index, slides.length - 1));

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    currentLabel.textContent = String(current + 1);
    totalLabel.textContent = String(slides.length);
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    sectionLabel.textContent = slides[current].dataset.section || "";
    document.title = `${slides[current].dataset.title} · WebAssembly and JavaScript`;
    updateSpeakerNote();

    if (updateHash) history.replaceState(null, "", `#${current + 1}`);
  };

  const next = () => show(current + 1);
  const previous = () => show(current - 1);

  const toggleNotes = () => {
    const visible = document.body.classList.toggle("notes-visible");
    notesButton.classList.toggle("is-active", visible);
    notesButton.setAttribute("aria-pressed", String(visible));
  };

  const isTyping = (target) => target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;

  document.addEventListener("keydown", (event) => {
    if (isTyping(event.target)) return;

    if (["ArrowRight", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      next();
    } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      previous();
    } else if (event.key === "Home") {
      show(0);
    } else if (event.key === "End") {
      show(slides.length - 1);
    } else if (event.key.toLowerCase() === "f") {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    } else if (event.key.toLowerCase() === "n") {
      toggleNotes();
    }
  });

  document.querySelector('[data-action="next"]').addEventListener("click", next);
  document.querySelector('[data-action="previous"]').addEventListener("click", previous);
  notesButton.addEventListener("click", toggleNotes);
  window.addEventListener("hashchange", () => show(indexFromHash(), false));

  document.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });

  document.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(distance) > 50) distance < 0 ? next() : previous();
  }, { passive: true });

  const identityModuleBytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x06, 0x01, 0x60, 0x01, 0x7f, 0x01, 0x7f,
    0x03, 0x02, 0x01, 0x00,
    0x07, 0x0c, 0x01, 0x08, 0x69, 0x64, 0x65, 0x6e,
    0x74, 0x69, 0x74, 0x79, 0x00, 0x00,
    0x0a, 0x06, 0x01, 0x04, 0x00, 0x20, 0x00, 0x0b,
  ]);

  const numberInput = document.querySelector("#number-input");
  const numberResult = document.querySelector("[data-number-result]");
  const int32Result = document.querySelector("[data-int32-result]");
  const wasmResult = document.querySelector("[data-wasm-result]");
  let wasmIdentity = null;

  const formatNumber = (value) => Number.isFinite(value) ? value.toLocaleString("en-US", { useGrouping: false }) : "invalid";

  const updateNumberLab = () => {
    const value = Number(numberInput.value.trim());

    if (!Number.isFinite(value)) {
      numberResult.textContent = "invalid";
      int32Result.textContent = "invalid";
      wasmResult.textContent = "invalid";
      return;
    }

    numberResult.textContent = formatNumber(value);
    int32Result.textContent = formatNumber(value | 0);
    wasmResult.textContent = wasmIdentity ? formatNumber(wasmIdentity(value)) : "loading";
  };

  numberInput.addEventListener("input", updateNumberLab);
  document.querySelectorAll("[data-number]").forEach((button) => {
    button.addEventListener("click", () => {
      numberInput.value = button.dataset.number;
      updateNumberLab();
    });
  });

  WebAssembly.instantiate(identityModuleBytes)
    .then(({ instance }) => {
      wasmIdentity = instance.exports.identity;
      updateNumberLab();
    })
    .catch(() => {
      wasmResult.textContent = "Wasm unavailable";
    });

  const stackButtons = [...document.querySelectorAll("[data-stack-step]")];
  const stackValues = document.querySelector("[data-stack-values]");
  const stackCaption = document.querySelector("[data-stack-caption]");
  const stackStates = [
    { values: ["7"], caption: "Push local 0. Its declared type is i32." },
    { values: ["7", "35"], caption: "Push local 1. The validator already knows both types." },
    { values: ["42"], caption: "i32.add pops two i32 values and pushes one wrapped i32 result." },
    { values: ["42"], caption: "The function ends with one i32, matching its result type." },
  ];

  const showStackStep = (step) => {
    const state = stackStates[step];
    stackValues.replaceChildren(...state.values.map((value) => {
      const item = document.createElement("b");
      item.textContent = value;
      return item;
    }));
    stackCaption.textContent = state.caption;
    stackButtons.forEach((button, index) => {
      button.classList.toggle("is-done", index < step);
      button.classList.toggle("is-current", index === step);
    });
  };

  stackButtons.forEach((button) => {
    button.addEventListener("click", () => showStackStep(Number(button.dataset.stackStep)));
  });

  const pixelPreview = document.querySelector("[data-pixel-preview]");
  const pixelFragment = document.createDocumentFragment();
  for (let row = 0; row < 12; row += 1) {
    for (let column = 0; column < 12; column += 1) {
      const pixel = document.createElement("span");
      const hue = (column * 23 + row * 11 + (column * row * 3)) % 360;
      const lightness = 38 + ((row + column) % 4) * 9;
      pixel.style.background = `hsl(${hue} 78% ${lightness}%)`;
      pixelFragment.append(pixel);
    }
  }
  pixelPreview.append(pixelFragment);

  totalLabel.textContent = String(slides.length);
  show(indexFromHash(), false);
})();
