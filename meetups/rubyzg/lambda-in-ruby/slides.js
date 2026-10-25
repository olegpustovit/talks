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
    document.title = `${slides[current].dataset.title} · Lambda in Ruby`;
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

  const isTyping = (target) =>
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable;

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
      document.fullscreenElement
        ? document.exitFullscreen()
        : document.documentElement.requestFullscreen();
    } else if (event.key.toLowerCase() === "n") {
      toggleNotes();
    }
  });

  document.querySelector('[data-action="next"]').addEventListener("click", next);
  document.querySelector('[data-action="previous"]').addEventListener("click", previous);
  notesButton.addEventListener("click", toggleNotes);
  window.addEventListener("hashchange", () => show(indexFromHash(), false));

  document.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].screenX;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (event) => {
      const distance = event.changedTouches[0].screenX - touchStartX;
      if (Math.abs(distance) > 50) distance < 0 ? next() : previous();
    },
    { passive: true }
  );

  show(indexFromHash(), false);
})();
