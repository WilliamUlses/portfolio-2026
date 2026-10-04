// Defers entrance animations until the stage is visible (after preloader or page transitions)
export function whenStageReady(cb: () => void): () => void {
  const html = document.documentElement;
  let done = false;
  const run = () => {
    if (done) return;
    if ("loader" in html.dataset || "nav" in html.dataset) return;
    done = true;
    cleanup();
    cb();
  };
  const cleanup = () => {
    window.removeEventListener("wu:loaded", run);
    window.removeEventListener("wu:nav-end", run);
  };
  window.addEventListener("wu:loaded", run);
  window.addEventListener("wu:nav-end", run);
  requestAnimationFrame(run);
  return () => {
    done = true;
    cleanup();
  };
}
