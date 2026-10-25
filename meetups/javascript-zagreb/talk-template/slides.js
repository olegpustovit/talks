(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const currentLabel = document.querySelector("[data-current]");
  const totalLabel = document.querySelector("[data-total]");
  const progress = document.querySelector(".progress__bar");
  let current = 0;
  let touchStartX = 0;

  const indexFromHash = () => {
    const requested = Number.parseInt(location.hash.slice(1), 10);
    return Number.isInteger(requested) ? requested - 1 : 0;
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
    document.title = `${slides[current].dataset.title} · [Talk title]`;
    if (updateHash) history.replaceState(null, "", `#${current + 1}`);
  };

  const next = () => show(current + 1);
  const previous = () => show(current - 1);

  document.addEventListener("keydown", (event) => {
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
    }
  });

  document.querySelector('[data-action="next"]').addEventListener("click", next);
  document.querySelector('[data-action="previous"]').addEventListener("click", previous);
  window.addEventListener("hashchange", () => show(indexFromHash(), false));
  document.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
  document.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(distance) > 50) distance < 0 ? next() : previous();
  }, { passive: true });

  show(indexFromHash(), false);
})();
