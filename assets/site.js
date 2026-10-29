// Marks the current page in the nav and sets the year in the footer.
(function () {
  const here = location.pathname.split('/').pop() || 'index.html';
  const inBlog = location.pathname.includes('/blog/');
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href');
    const isBlogLink = a.textContent.trim() === 'Blog';
    const active = inBlog ? isBlogLink : (href === here);
    if (active) a.classList.add('active');
  });
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// Hide the header when scrolling down; show it when scrolling up.
(function () {
  const header = document.querySelector('header');
  if (!header) return;
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (y < 80) {
        header.classList.remove('is-hidden');   // always show near the top
      } else if (delta > 8) {
        header.classList.add('is-hidden');      // scrolling down
      } else if (delta < -8) {
        header.classList.remove('is-hidden');   // scrolling up
      }
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
})();