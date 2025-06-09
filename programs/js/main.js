  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const a = q.nextElementSibling;
      const expanded = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', !expanded);
      a.style.display = expanded ? 'none' : 'block';
    });
  });