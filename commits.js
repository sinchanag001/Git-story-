/**
 * commits.js — commit parsing, classification, filtering, rendering
 */

const SAMPLE = `a1b2c3d feat: add user authentication with JWT tokens
e4f5g6h fix: resolve login redirect loop on mobile
i7j8k9l feat: implement dashboard chart components
m0n1o2p chore: update webpack dependencies
q3r4s5t fix: correct timezone offset in scheduler
u6v7w8x feat: add CSV export for reports
y9z0a1b fix: patch XSS vulnerability in comments
c2d3e4f feat: implement team member invite flow
g5h6i7j release: v2.1.0 — dashboard milestone shipped
k8l9m0n fix: resolve race condition in async fetch
o1p2q3r feat: dark mode support across all pages
s4t5u6v chore: add unit tests for auth module
w7x8y9z feat: integrate Stripe payment gateway
a0b1c2d fix: memory leak in image carousel
e3f4g5h release: v2.2.0 — payments milestone`;

let parsedData  = null;
let activeFilter = 'all';

// ── Helpers ────────────────────────────────────────────────
function classify(msg) {
  const m = msg.toLowerCase();
  if (m.match(/release|milestone|v\d+\.\d+/))            return 'milestone';
  if (m.match(/^feat|add |implement|support|integrat/))   return 'feat';
  if (m.match(/^fix|resolv|patch|correct|bug|hotfix/))   return 'fix';
  return 'chore';
}

function parseCommits(raw) {
  return raw
    .split('\n')
    .filter(l => l.trim())
    .map(l => {
      const parts = l.trim().split(' ');
      return { hash: parts[0].slice(0, 7), msg: parts.slice(1).join(' ') };
    });
}

function getActiveTypes() {
  const types = [];
  document.querySelectorAll('#filterCheckboxes .cb-item').forEach(cb => {
    const inp = cb.querySelector('input');
    if (!inp.checked) return;
    if (cb.classList.contains('feat'))  types.push('feat');
    if (cb.classList.contains('fix'))   types.push('fix');
    if (cb.classList.contains('mile'))  types.push('milestone');
    if (cb.classList.contains('chore')) types.push('chore');
  });
  return types;
}

// ── Filter / render ────────────────────────────────────────
function setFilter(f, el) {
  activeFilter = f;
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  renderFilter(f);
}

function applyCheckboxFilter() {
  if (activeFilter === 'all') renderFilter('all');
}

function renderFilter(f) {
  const { data, commits } = parsedData;
  const mc = document.getElementById('mainContent');

  if (f === 'standup') {
    mc.innerHTML = `<div class="narr-card"><div class="narr-title">✦ Standup Summary</div><div class="narr-text">${data.standup}</div></div>`;
    return;
  }
  if (f === 'release') {
    mc.innerHTML = `<div class="narr-card"><div class="narr-title">✦ Release Notes</div><div class="narr-text">${data.release}</div></div>`;
    return;
  }

  const activeTypes = getActiveTypes();
  const filtered = f === 'all'
    ? commits.filter(c => activeTypes.includes(classify(c.msg)))
    : commits.filter(c => classify(c.msg) === f);

  let html = '<div class="timeline"><div class="tl-line"></div>';
  filtered.forEach((c, i) => {
    const t     = classify(c.msg);
    const clean = c.msg.replace(/^[^:]+:\s*/, '');
    const desc  = (data.descriptions && data.descriptions[c.hash]) || '';

    if (t === 'milestone' && i > 0) {
      html += `<div class="tl-divider">✦ milestone reached</div>`;
    }

    html += `
      <div class="tl-item" onclick="glowItem(this)">
        <div class="tl-dot ${t}"></div>
        <div class="tl-body">
          <div class="tl-badge ${t}">${t === 'milestone' ? '⬡ milestone' : t === 'feat' ? '◈ feature' : '⬤ bug fix'}</div>
          <div class="tl-msg">${clean}</div>
          ${desc ? `<div class="tl-desc">${desc}</div>` : ''}
          <div class="tl-hash">${c.hash}</div>
        </div>
      </div>`;
  });

  html += '</div>';
  mc.innerHTML = html;
  renderBottomTimeline(filtered);
}

// ── Bottom timeline bar ────────────────────────────────────
function renderBottomTimeline(commits) {
  const bt    = document.getElementById('bottomTimeline');
  const nodes = document.getElementById('btNodes');

  if (!commits || commits.length === 0) { bt.style.display = 'none'; return; }

  bt.style.display = 'block';
  nodes.innerHTML  = commits.slice(0, 20).map((c, i) => {
    const t   = classify(c.msg);
    const lbl = c.msg.replace(/^[^:]+:\s*/, '').slice(0, 22);
    return `<div class="bt-node" onclick="glowBtNode(this,${i})">
      <span class="bt-node-tip">${lbl}</span>
      <div class="bt-node-dot ${t}"></div>
    </div>`;
  }).join('');
}

function glowBtNode(el, idx) { playGlow(); burst(15); }

// ── Glow interactions ──────────────────────────────────────
function glowItem(el) {
  const was = el.classList.contains('glowing');
  document.querySelectorAll('.tl-item').forEach(i => i.classList.remove('glowing'));
  if (!was) { el.classList.add('glowing'); playGlow(); burst(22); }
}

function glowPlanet(el) {
  const was = el.classList.contains('glowing');
  document.querySelectorAll('.p-commit').forEach(p => p.classList.remove('glowing'));
  if (!was) { el.classList.add('glowing'); playGlow(); burst(28); }
}

// ── Render results page ────────────────────────────────────
function renderResults(data, commits) {
  parsedData = { data, commits };

  const feats = commits.filter(c => classify(c.msg) === 'feat');
  const fixes = commits.filter(c => classify(c.msg) === 'fix');
  const miles = commits.filter(c => classify(c.msg) === 'milestone');

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card total"><div class="stat-num">${commits.length}</div><div class="stat-lbl">Total</div></div>
    <div class="stat-card feat"><div class="stat-num">${feats.length}</div><div class="stat-lbl">Features</div></div>
    <div class="stat-card fix"><div class="stat-num">${fixes.length}</div><div class="stat-lbl">Bug fixes</div></div>
    <div class="stat-card mile"><div class="stat-num">${miles.length}</div><div class="stat-lbl">Milestones</div></div>`;

  document.getElementById('planetRow').innerHTML = [...miles, ...feats, ...fixes]
    .slice(0, 12)
    .map(c => {
      const t   = classify(c.msg);
      const lbl = c.msg.replace(/^[^:]+:\s*/, '').slice(0, 16);
      const tip = c.msg.replace(/^[^:]+:\s*/, '');
      return `<div class="p-commit" onclick="glowPlanet(this)">
        <div class="p-commit-tip">${tip}</div>
        <div class="p-commit-orb ${t}"></div>
        <div class="p-commit-lbl">${lbl}</div>
      </div>`;
    })
    .join('');

  renderFilter('all');
  switchPage('p-input', 'p-results');
}

// ── Analyze (API call) ─────────────────────────────────────
async function runAnalysis() {
  const raw = document.getElementById('git-input').value.trim();
  if (!raw) return;

  const btn = document.getElementById('analyzeBtn');
  btn.disabled   = true;
  btn.innerHTML  = '<span class="spinning"></span>Mapping universe...';

  const commits = parseCommits(raw);
  const prompt  = `Analyze these git commits and respond ONLY with valid JSON, no markdown.

Commits:
${raw}

Return:
{
  "standup": "3-4 sentence standup with <strong> tags on key feature names.",
  "release": "4-5 sentence release notes with <strong> tags on versions and milestones.",
  "descriptions": { "HASH7CHAR": "one sentence explaining what this commit did and why" }
}

The descriptions object must cover every commit, using the 7-char hash as keys.`;

  try {
    const res  = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    const d    = await res.json();
    const txt  = d.content.map(b => b.text || '').join('');
    const data = JSON.parse(txt.replace(/```json|```/g, '').trim());
    renderResults(data, commits);
  } catch (e) {
    // Fallback if API unavailable
    const feats = commits.filter(c => classify(c.msg) === 'feat');
    const fixes = commits.filter(c => classify(c.msg) === 'fix');
    const miles = commits.filter(c => classify(c.msg) === 'milestone');
    renderResults({
      standup: `This sprint delivered <strong>${feats.length} new features</strong> and resolved <strong>${fixes.length} bugs</strong>${miles.length ? ' with ' + miles.length + ' milestone' + (miles.length > 1 ? 's' : '') : ''}.`,
      release: `This release includes <strong>${feats.length} features</strong> and <strong>${fixes.length} fixes</strong> across ${commits.length} commits.`,
      descriptions: {},
    }, commits);
  }

  btn.disabled  = false;
  btn.innerHTML = '✦ Generate Story';
}

// ── Input helpers ──────────────────────────────────────────
document.getElementById('git-input').addEventListener('input', function () {
  const n = this.value.split('\n').filter(l => l.trim()).length;
  document.getElementById('ccount').textContent = n + ' commit' + (n === 1 ? '' : 's');
});

function loadSample() {
  const ta = document.getElementById('git-input');
  ta.value = SAMPLE;
  ta.dispatchEvent(new Event('input'));
}

// ── Drop zone ──────────────────────────────────────────────
const dz = document.getElementById('dropZone');

dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
dz.addEventListener('drop', e => {
  e.preventDefault();
  dz.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const ta = document.getElementById('git-input');
    ta.value = ev.target.result;
    ta.dispatchEvent(new Event('input'));
  };
  reader.readAsText(file);
});
