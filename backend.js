/* ═══════════════════════════════════════════════════════
   backend.js — CommitVerse AI Backend
   All Anthropic API calls live here.
   
   Functions exported to main.js:
     - CV_Backend.analyzeCommits(raw, commits)       → standup/release/descriptions
     - CV_Backend.chatWithCommits(history, context)  → AI chat reply
     - CV_Backend.predictFuture(commits)             → predictions JSON
   ═══════════════════════════════════════════════════════ */

const CV_Backend = (() => {

  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL   = 'claude-sonnet-4-20250514';

  /* ── Core fetch wrapper ── */
  async function callClaude({ system, messages, max_tokens = 1000 }) {
    const body = { model: MODEL, max_tokens, messages };
    if (system) body.system = system;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.content.map(b => b.text || '').join('');
  }

  /* ── Helper: parse JSON safely, strip markdown fences ── */
  function parseJSON(txt) {
    return JSON.parse(txt.replace(/```json|```/g, '').trim());
  }

  /* ════════════════════════════════════════════════════
     1.  ANALYZE COMMITS
         Called by: runAnalysis() in main.js
         Returns:   { standup, release, descriptions }
     ════════════════════════════════════════════════════ */
  async function analyzeCommits(raw, commits) {
    const prompt = `Analyze these git commits and respond ONLY with valid JSON, no markdown.

Commits:
${raw}

Return:
{
  "standup": "3-4 sentence standup with <strong> tags.",
  "release": "4-5 sentence release notes with <strong> tags.",
  "descriptions": { "HASH7": "one sentence" }
}`;

    const txt = await callClaude({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500
    });

    return parseJSON(txt);
  }

  /* ════════════════════════════════════════════════════
     2.  AI CHAT
         Called by: sendAIChat() in main.js
         Returns:   string (HTML reply)
     ════════════════════════════════════════════════════ */
  async function chatWithCommits(history, commitContext) {
    const system = `You are an expert code historian and developer analyst embedded inside CommitVerse, a git commit visualizer. You have full access to the following commit history:

<commits>
${commitContext}
</commits>

Answer questions about these commits clearly and concisely. Use <strong> tags to highlight important terms, commit hashes, version numbers, and names. Keep answers focused and helpful. If asked something outside the commits, say so politely. Never make up commits that aren't listed.`;

    const messages = history.map(m => ({ role: m.role, content: m.content }));

    return await callClaude({ system, messages, max_tokens: 1000 });
  }

  /* ════════════════════════════════════════════════════
     3.  AI PREDICTIONS
         Called by: runPredictions() in main.js
         Returns:   { predictions[], summary, healthChips[] }
     ════════════════════════════════════════════════════ */
  async function predictFuture(commits) {
    const commitLines = commits.map(c =>
      `[${c.hash}] ${c.msg}${c.date ? ' (' + c.date + ')' : ''}${c.author && c.author !== 'You' ? ' by ' + c.author : ''}`
    ).join('\n');

    const prompt = `You are an expert software analyst. Analyze these git commits and predict the future of this project.

Commits:
${commitLines}

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "predictions": [
    {
      "type": "bug",
      "icon": "🐛",
      "title": "Short prediction title",
      "body": "2-3 sentence explanation of why this bug is likely. Reference specific commit patterns.",
      "confidence": "87%",
      "evidence": "Brief reference to the specific commits that suggest this"
    },
    {
      "type": "feat",
      "icon": "✨",
      "title": "Short feature prediction title",
      "body": "2-3 sentence explanation of why this feature is coming next based on patterns.",
      "confidence": "74%",
      "evidence": "Brief reference to the specific commits that suggest this"
    },
    {
      "type": "bug",
      "icon": "⚠️",
      "title": "Another likely bug area",
      "body": "2-3 sentence explanation.",
      "confidence": "65%",
      "evidence": "Brief evidence"
    },
    {
      "type": "opportunity",
      "icon": "💡",
      "title": "Growth opportunity",
      "body": "2-3 sentence explanation of an opportunity the commit patterns point toward.",
      "confidence": "81%",
      "evidence": "Brief evidence"
    },
    {
      "type": "risk",
      "icon": "🔥",
      "title": "Technical debt risk",
      "body": "2-3 sentence explanation of a risk area based on chore/fix patterns.",
      "confidence": "70%",
      "evidence": "Brief evidence"
    },
    {
      "type": "feat",
      "icon": "🚀",
      "title": "Next milestone prediction",
      "body": "2-3 sentence prediction of the next likely release or milestone based on velocity.",
      "confidence": "79%",
      "evidence": "Brief evidence"
    }
  ],
  "summary": "2-3 sentence overall forecast of where this project is headed, with tone matching the commit health.",
  "healthChips": ["🏃 High velocity", "⚠️ Auth debt growing", "📈 Feature focus"]
}

Make predictions specific to the ACTUAL commits shown, not generic. Reference real patterns you see.`;

    const txt = await callClaude({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    });

    return parseJSON(txt);
  }

  /* ── Public API ── */
  return { analyzeCommits, chatWithCommits, predictFuture };

})();