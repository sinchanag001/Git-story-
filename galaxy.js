/**
 * galaxy.js — Milky Way star field, shooting stars, burst effects
 */

const C = document.getElementById('gc');
const X = C.getContext('2d');

let stars  = [];
let shoots = [];
let bursts = [];

// ── Star factory ──────────────────────────────────────────
function mkStar() {
  const angle  = Math.random() * Math.PI * 2;
  const r      = Math.random() < 0.15 ? Math.random() * 60 : Math.pow(Math.random(), 1.3) * 520;
  const spread = Math.random() < 0.5 ? angle + 0.35 : angle - 0.35;
  const inArm  = Math.random() < 0.5 && r > 60;
  const bx = C.width * 0.5;
  const by = C.height * 0.48;
  const x  = bx + Math.cos(inArm ? spread : angle) * r;
  const y  = by + Math.sin(inArm ? spread : angle) * r * 0.42;
  const hue = Math.random() < 0.25 ? 260 + Math.random() * 40 : 220 + Math.random() * 120;

  return {
    x, y,
    r:      Math.random() < 0.07 ? 2.2 : Math.random() < 0.2 ? 1.2 : 0.65,
    a:      Math.random(),
    da:     (0.002 + Math.random() * 0.007) * (Math.random() < 0.5 ? 1 : -1),
    hue,
    bright: Math.random() < 0.12,
  };
}

// ── Burst effect (called on glow / launch) ────────────────
function burst(n) {
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2;
    bursts.push({
      x:     C.width  * 0.5 + (Math.random() - 0.5) * 200,
      y:     C.height * 0.45 + (Math.random() - 0.5) * 120,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed,
      r:     0.6 + Math.random() * 1.4,
      hue:   260 + Math.random() * 100,
      life:  1,
      decay: 0.012 + Math.random() * 0.018,
    });
  }
}

// ── Shooting star factory ─────────────────────────────────
function addShoot() {
  const fromTop = Math.random() < 0.6;
  const x       = fromTop ? Math.random() * C.width : -20;
  const y       = fromTop ? -10 : Math.random() * C.height * 0.4;
  const angle   = fromTop ? (Math.PI / 4 + Math.random() * 0.5) : (Math.random() * 0.6);
  const speed   = 3 + Math.random() * 6;

  shoots.push({
    x, y,
    vx:    Math.cos(angle) * speed,
    vy:    Math.sin(angle) * speed,
    len:   70 + Math.random() * 120,
    life:  1,
    decay: 0.018 + Math.random() * 0.025,
    hue:   260 + Math.random() * 80,
  });
}

setInterval(() => {
  if (Math.random() < 0.85) addShoot();
  if (Math.random() < 0.30) addShoot(); // occasional double
}, 600);

// ── Resize + seed ─────────────────────────────────────────
function resize() {
  C.width  = C.offsetWidth  || 700;
  C.height = C.offsetHeight || 700;
  stars = Array.from({ length: 420 }, mkStar);
}

// ── Main render loop ──────────────────────────────────────
function drawFrame() {
  X.clearRect(0, 0, C.width, C.height);

  const cx = C.width  * 0.5;
  const cy = C.height * 0.48;

  // Purple-toned Milky Way core (layered ellipses)
  const layers = [
    { rx: 240, ry: 35, a: 0.018, c: '140,90,220'  },
    { rx: 170, ry: 26, a: 0.032, c: '160,110,240' },
    { rx: 100, ry: 16, a: 0.055, c: '190,150,255' },
    { rx:  50, ry: 10, a: 0.09,  c: '210,180,255' },
    { rx:  20, ry:  5, a: 0.16,  c: '235,215,255' },
  ];

  layers.forEach(l => {
    X.save();
    X.translate(cx, cy);
    X.scale(1, 0.42);
    X.beginPath();
    X.ellipse(0, 0, l.rx, l.rx, 0, 0, Math.PI * 2);
    X.fillStyle = `rgba(${l.c},${l.a})`;
    X.fill();
    X.restore();
  });

  // Stars
  stars.forEach(s => {
    s.a = Math.max(0.04, Math.min(0.95, s.a + s.da));
    if (s.a <= 0.04 || s.a >= 0.95) s.da *= -1;
    X.beginPath();
    X.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    X.fillStyle = `hsla(${s.hue},${s.bright ? 80 : 55}%,${s.bright ? 92 : 74}%,${s.bright ? s.a : s.a * 0.65})`;
    X.fill();
  });

  // Burst particles
  bursts = bursts.filter(b => {
    b.life -= b.decay;
    b.x += b.vx;
    b.y += b.vy;
    if (b.life <= 0) return false;
    X.beginPath();
    X.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    X.fillStyle = `hsla(${b.hue},88%,85%,${b.life})`;
    X.fill();
    return true;
  });

  // Shooting stars
  shoots = shoots.filter(s => {
    s.life -= s.decay;
    s.x += s.vx;
    s.y += s.vy;
    if (s.life <= 0 || s.x > C.width + 100 || s.y > C.height + 50) return false;

    const speed  = Math.hypot(s.vx, s.vy);
    const tailLen = s.len;
    const tx = s.x - s.vx * (tailLen / speed);
    const ty = s.y - s.vy * (tailLen / speed);

    const g = X.createLinearGradient(s.x, s.y, tx, ty);
    g.addColorStop(0,   `hsla(${s.hue},90%,95%,${s.life * 0.95})`);
    g.addColorStop(0.3, `hsla(${s.hue},80%,85%,${s.life * 0.5})`);
    g.addColorStop(1,   `hsla(${s.hue},70%,75%,0)`);

    X.beginPath();
    X.moveTo(s.x, s.y);
    X.lineTo(tx, ty);
    X.strokeStyle = g;
    X.lineWidth   = 1.5 + s.life * 0.8;
    X.lineCap     = 'round';
    X.stroke();

    // Head glow dot
    X.beginPath();
    X.arc(s.x, s.y, 1.5 + s.life * 0.8, 0, Math.PI * 2);
    X.fillStyle = `hsla(${s.hue},100%,98%,${s.life * 0.9})`;
    X.fill();

    return true;
  });

  requestAnimationFrame(drawFrame);
}

// ── Flame animation ───────────────────────────────────────
let ft = 0;
(function fl() {
  ft += 0.09;
  const ids   = ['fa', 'fb', 'fc', 'fd'];
  const bases = [14, 19, 14, 11];
  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('ry', String(bases[i] + Math.sin(ft + i * 1.1) * 2.2));
  });
  requestAnimationFrame(fl);
})();

// ── Boot ─────────────────────────────────────────────────
window.addEventListener('resize', resize);
resize();
drawFrame();
