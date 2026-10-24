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

// Load and play the 3D reel only while it is on screen; pause when scrolled away.
// Muted so browsers allow autoplay. Respects reduced-motion preferences.
(function () {
  const video = document.getElementById('reel');
  if (!video || !('IntersectionObserver' in window)) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) {
        if (!video.getAttribute('src')) video.src = 'assets/reel.mp4';
        if (!reduce) video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: [0, 0.5] });
  io.observe(video);
})();
