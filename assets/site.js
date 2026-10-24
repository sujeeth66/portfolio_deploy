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