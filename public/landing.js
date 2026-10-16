(() => {
  'use strict';
  const navButton = document.getElementById('landing-menu-button');
  const nav = document.getElementById('mobile-landing-nav');
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
})();
