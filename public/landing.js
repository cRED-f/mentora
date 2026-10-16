(() => {
  'use strict';
  const navButton = document.getElementById('landing-menu-button');
  const nav = document.getElementById('mobile-landing-nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function closeMenu() {
    if (!navButton || !nav) return;
    nav.hidden = true;
    navButton.setAttribute('aria-expanded', 'false');
    navButton.setAttribute('aria-label', 'Open navigation');
  }
  navButton?.addEventListener('click', () => {
    const expanding = nav.hidden;
    nav.hidden = !expanding;
    navButton.setAttribute('aria-expanded', String(expanding));
    navButton.setAttribute('aria-label', expanding ? 'Close navigation' : 'Open navigation');
  });
  nav?.querySelectorAll('a').forEach(anchor => anchor.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });
  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });
  // Defer the hidden state until the first observer frame so JS failure never creates a blank page.
  document.documentElement.classList.add('js-motion');
  revealItems.forEach(item => observer.observe(item));
  // Pages restored from BFCache may already be scrolled beyond an item's initial observer range.
  window.addEventListener('pageshow', () => {
    for (const item of revealItems) {
      const rect = item.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) item.classList.add('is-visible');
    }
  });
})();
