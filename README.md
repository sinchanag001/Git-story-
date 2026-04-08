# CommitVerse

> Explore your project like a universe of commits.

CommitVerse transforms raw git history into a cinematic, interactive story — complete with a Milky Way galaxy backdrop, planet-based commit visualization, journey playback, and AI-generated narratives.

## Features

- **Rocket launch landing** — animated rocket with 5-layer audio engine (rumble, thrust, hiss, bang, Doppler)
- **Galaxy canvas** — Milky Way star field with shooting stars across all pages
- **AI-powered analysis** — Claude generates standup summaries, release notes, and per-commit descriptions
- **Journey playback** — step through every commit with narration, sound chimes, and star bursts
- **Planet orbit row** — each commit rendered as a planet sized by type
- **Timeline** — color-coded with glow-on-click interactions
- **Drag & drop** — drop a `.txt` or `.log` file directly from GitHub
- **Filter checkboxes + planet tabs** — slice by features, bug fixes, milestones, chores

## Project Structure

```
commitverse/
├── index.html          # Main HTML — structure only, no inline styles or scripts
├── css/
│   ├── base.css        # Design tokens, reset, page transition system
│   ├── landing.css     # Landing page (rocket, title, nebula rings)
│   ├── input.css       # Commit input page (textarea, buttons, drop zone)
│   └── results.css     # Results page (timeline, planets, journey, stats)
├── js/
│   ├── audio.js        # Web Audio API — rocket sound, glow chime, journey chimes
│   ├── galaxy.js       # Canvas — Milky Way, shooting stars, burst particles, flame
│   ├── commits.js      # Commit parsing, classify, filter, render, API call
│   ├── journey.js      # Animated journey playback with narration overlay
│   └── app.js          # Page navigation (switchPage, goToInput, goBack)
└── README.md
```

## Getting Started

### Option 1 — Open directly in browser
Just open `index.html` in any modern browser. No build step needed.

### Option 2 — VS Code Live Server
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**

### Option 3 — GitHub Pages
1. Push this folder to a GitHub repo
2. Go to **Settings → Pages**
3. Set source to `main` branch, root folder
4. Your site will be live at `https://<username>.github.io/<repo>/`

## Usage

1. Click the rocket on the landing page to launch
2. Paste your git log output into the text area:
   ```
   git log --oneline
   ```
   Or drag and drop a `.txt` / `.log` file
3. Click **Generate Story** to send to Claude AI
4. Explore via planet filter tabs, timeline, or hit **Play My Project Journey**

## API Key Note

CommitVerse calls the Anthropic API directly from the browser. This works in the Claude.ai widget environment where the key is injected automatically. For standalone deployment, you will need to proxy the API call through a backend to keep your key secret.

## Commit Format

Works best with standard git log output:
```
abc1234 feat: add user authentication
def5678 fix: resolve login redirect bug
ghi9012 release: v2.1.0 — dashboard milestone
```

Supports `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `release`, `milestone` prefixes.

## Color Language

| Color  | Type       |
|--------|------------|
| Purple | Features   |
| Teal   | Bug fixes  |
| Gold   | Milestones |
| Gray   | Chores     |
