/**
 * journey.js — animated commit journey playback
 */

let journeyActive = false;
let journeyTimer  = null;

const journeyNarrations = {
  feat: (msg, idx) => [
    `Feature #${idx + 1} lands in orbit`,
    `New capability detected: ${msg.slice(0, 30)}`,
    `Your universe expands with new functionality`,
  ][Math.floor(Math.random() * 3)],

  fix: (msg, idx) => [
    `Bug neutralized — the cosmos stabilizes`,
    `Patch applied — trajectory corrected`,
    `Anomaly resolved: ${msg.slice(0, 28)}`,
  ][Math.floor(Math.random() * 3)],

  milestone: (msg, idx) => [
    `MILESTONE REACHED — a new era begins`,
    `Major waypoint unlocked: ${msg.slice(0, 26)}`,
    `The project reaches a new frontier`,
  ][Math.floor(Math.random() * 3)],

  chore: () => `Maintenance complete — systems running smooth`,
};

async function startJourney() {
  if (journeyActive) { stopJourney(); return; }
  if (!parsedData) return;

  const btn     = document.getElementById('journeyBtn');
  const overlay = document.getElementById('journeyOverlay');
  const joStep  = document.getElementById('joStep');
  const joText  = document.getElementById('joText');

  btn.innerHTML = '<span class="jb-icon">⏹</span> Stop Journey';
  journeyActive = true;

  const { commits } = parsedData;

  // Reset state
  document.querySelectorAll('.p-commit').forEach(p => p.classList.remove('glowing', 'jplay'));
  document.querySelectorAll('.tl-item').forEach(i => i.classList.remove('glowing', 'jplay'));

  // Switch to 'all' view
  const allTab = document.querySelector('.ptab-all');
  if (allTab) setFilter('all', allTab);

  const tlItems = document.querySelectorAll('.tl-item');
  const planets = document.querySelectorAll('.p-commit');
  const total   = Math.min(tlItems.length, commits.length);

  // Start overlay
  overlay.classList.add('show');
  joStep.textContent = 'Mission Start';
  joText.textContent = 'Initiating project journey playback...';
  playChime(440, 0);

  for (let i = 0; i < total; i++) {
    if (!journeyActive) break;
    await new Promise(r => setTimeout(r, 1100));
    if (!journeyActive) break;

    const c   = commits[i];
    const t   = classify(c.msg);
    const msg = c.msg.replace(/^[^:]+:\s*/, '');

    // Highlight timeline item
    if (tlItems[i]) {
      tlItems[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      tlItems[i].classList.add('jplay', 'glowing');
    }

    // Light up planet
    if (planets[i]) {
      planets[i].classList.add('jplay');
      setTimeout(() => { if (planets[i]) planets[i].classList.add('glowing'); }, 200);
    }

    // Update narration
    joStep.textContent = `Commit ${i + 1} of ${total} — ${t.toUpperCase()}`;
    joText.textContent = journeyNarrations[t](msg, i);

    // Sound + burst
    if (t === 'milestone') {
      playChime(880, 0); playChime(1100, 0.15); playChime(1320, 0.3);
      burst(40);
    } else if (t === 'feat') {
      playChime(660, 0); burst(18);
    } else if (t === 'fix') {
      playChime(550, 0); burst(10);
    } else {
      playChime(440, 0);
    }

    // Fade previous
    if (i > 0) {
      setTimeout(() => {
        if (tlItems[i - 1]) tlItems[i - 1].classList.remove('glowing');
        if (planets[i - 1]) planets[i - 1].classList.remove('glowing');
      }, 900);
    }
  }

  // Journey complete
  if (journeyActive) {
    await new Promise(r => setTimeout(r, 800));
    joStep.textContent = 'Journey Complete';
    joText.textContent = `Explored ${total} commits — your universe is magnificent!`;
    playChime(880, 0); playChime(1100, 0.2); playChime(1320, 0.4); playChime(1760, 0.6);
    burst(80);
    setTimeout(() => burst(60), 400);
  }

  setTimeout(() => overlay.classList.remove('show'), 3500);
  journeyActive = false;
  btn.innerHTML = '<span class="jb-icon">🚀</span> Play My Project Journey';
}

function stopJourney() {
  journeyActive = false;
  if (journeyTimer) clearTimeout(journeyTimer);

  document.getElementById('journeyBtn').innerHTML     = '<span class="jb-icon">🚀</span> Play My Project Journey';
  document.getElementById('journeyOverlay').classList.remove('show');
  document.querySelectorAll('.tl-item').forEach(i => i.classList.remove('glowing', 'jplay'));
  document.querySelectorAll('.p-commit').forEach(p => p.classList.remove('glowing', 'jplay'));
}
