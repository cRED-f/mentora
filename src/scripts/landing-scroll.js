// Homepage-only Locomotive Scroll v5 integration. The site remains usable if
// JS or this optional animation module fails to load.
import 'locomotive-scroll/dist/locomotive-scroll.css';

export function setupLandingScroll() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.querySelector('.landing-scroll-progress');
  let scroll = null;
  let active = true;
  let pending = null;

  function stop() {
    active = false;
    document.documentElement.classList.remove('has-landing-scroll');
    if (scroll) { scroll.destroy(); scroll = null; }
    if (progress) progress.style.transform = 'scaleX(0)';
  }

  async function start() {
    if (!active || reduced.matches || scroll || pending) return;
    // Defer fetching/initializing the library for users requesting less motion.
    pending = import('locomotive-scroll');
    try {
      const { default: LocomotiveScroll } = await pending;
      if (!active || reduced.matches || scroll) return;
      scroll = new LocomotiveScroll({
        lenisOptions: { lerp: 0.095, smoothWheel: true, smoothTouch: false },
        scrollCallback: ({ progress: position }) => {
          if (progress) progress.style.transform = `scaleX(${Math.max(0, Math.min(1, position))})`;
        },
      });
      // Reveals are hidden ONLY once the observer and smooth-scroll engine exist.
      document.documentElement.classList.add('has-landing-scroll');
    } catch (error) {
      // Fall back to native scrolling; never hide content if the library fails.
      console.warn('Mentora scroll enhancement unavailable; using native scrolling.', error);
    } finally {
      pending = null;
    }
  }

  reduced.addEventListener('change', () => {
    if (reduced.matches) stop();
    else { active = true; void start(); }
  });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', () => { active = true; void start(); });
  void start();
}
