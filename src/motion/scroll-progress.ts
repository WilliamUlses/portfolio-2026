// Tracks global scroll progression normalized between 0 and 1, throttled per RAF frame
export function onScrollProgress(cb: (p: number) => void): () => void {
  let raf = 0;
  const read = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    cb(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(read);
  };
  read();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  const ro = new ResizeObserver(schedule);
  ro.observe(document.body);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    ro.disconnect();
  };
}
