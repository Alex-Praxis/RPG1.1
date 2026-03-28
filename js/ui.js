// ── MODAL ──
export function openModal(id) {
  document.getElementById(id).classList.add('open');
}
export function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modal when clicking the backdrop
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ── TOAST ──
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2600);
}
