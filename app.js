/**
 * app.js — page navigation, entry point
 */

// ── Page transitions ───────────────────────────────────────
function switchPage(fromId, toId) {
  const from = document.getElementById(fromId);
  const to   = document.getElementById(toId);
  from.classList.add('out');
  setTimeout(() => {
    from.classList.add('hidden');
    from.classList.remove('out');
    to.classList.remove('hidden');
  }, 800);
}

function goToInput() {
  playRocket();
  document.getElementById('lrocket').classList.add('go');
  burst(100);
  setTimeout(() => burst(60), 350);
  setTimeout(() => burst(40), 700);
  setTimeout(() => switchPage('p-land', 'p-input'), 1100);
}

function goBack() {
  switchPage('p-results', 'p-input');
}
