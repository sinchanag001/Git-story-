"""
CommitVerse Backend — app.py
Flask server that fetches real GitHub commit data,
classifies it, and calculates a project health score.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import re
from datetime import datetime

# ─────────────────────────────────────────────
#  App setup
# ─────────────────────────────────────────────

app = Flask(__name__)
CORS(app)  # Allow requests from the frontend (any origin)

# Optional: add your GitHub Personal Access Token here to raise
# the API rate limit from 60 → 5000 requests/hour.
# Get one at: https://github.com/settings/tokens (no scopes needed for public repos)
GITHUB_TOKEN = ""   # e.g. "ghp_xxxxxxxxxxxxxxxxxxxx"


# ─────────────────────────────────────────────
#  Helper: build request headers
# ─────────────────────────────────────────────

def _github_headers():
    """Return headers for the GitHub API, with auth if a token is set."""
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


# ─────────────────────────────────────────────
#  Helper: extract owner + repo from URL
# ─────────────────────────────────────────────

def parse_repo_url(url: str):
    """
    Accept any of:
      https://github.com/owner/repo
      https://github.com/owner/repo.git
      github.com/owner/repo
    Returns (owner, repo) or raises ValueError.
    """
    url = url.strip().rstrip("/")
    # Match  github.com/<owner>/<repo>  with optional .git suffix
    pattern = r"github\.com[/:]([^/]+)/([^/]+?)(?:\.git)?$"
    match = re.search(pattern, url)
    if not match:
        raise ValueError(
            "Could not parse GitHub URL. "
            "Expected format: https://github.com/owner/repo"
        )
    owner, repo = match.group(1), match.group(2)
    return owner, repo


# ─────────────────────────────────────────────
#  Helper: classify a commit message
# ─────────────────────────────────────────────

def classify_commit(message: str) -> str:
    """
    Map a commit message to one of five categories:
      feat | fix | milestone | chore | other
    Rules are checked in priority order.
    """
    msg = message.lower().strip()

    milestone_keywords = ["release", "milestone", "v1.", "v2.", "v3.", "v0.",
                          "launch", "ship", "deploy", "go-live"]
    feat_keywords      = ["feat", "add ", "added", "implement", "new ",
                          "support", "integrat", "introduce", "creat"]
    fix_keywords       = ["fix", "bug", "patch", "resolv", "hotfix",
                          "correct", "repair", "address", "closes #", "issue"]
    chore_keywords     = ["chore", "refactor", "test", "ci", "cd", "lint",
                          "style", "doc", "readme", "bump", "update dep",
                          "upgrade", "clean", "format", "build", "config"]

    for kw in milestone_keywords:
        if kw in msg:
            return "milestone"
    for kw in feat_keywords:
        if kw in msg:
            return "feat"
    for kw in fix_keywords:
        if kw in msg:
            return "fix"
    for kw in chore_keywords:
        if kw in msg:
            return "chore"

    return "other"


# ─────────────────────────────────────────────
#  Helper: calculate project health score
# ─────────────────────────────────────────────

def calculate_health_score(commits: list) -> dict:
    """
    Score a project 0–100 across four pillars:

    Pillar          Weight   Logic
    ─────────────── ──────   ──────────────────────────────────────────
    Stability         35     Penalise high fix ratio (ideal 20–35 %)
    Momentum          25     Reward feature density (ideal ≥ 40 %)
    Milestones        20     Expect ≥ 1 milestone per 8 commits
    Consistency       20     Reward even distribution across types
                             (Shannon entropy)

    Returns a dict with score, status, grade, and per-pillar detail.
    """
    import math

    n = len(commits)
    if n == 0:
        return {"score": 0, "status": "No data", "grade": "N/A", "pillars": {}}

    # Count each type
    counts = {"feat": 0, "fix": 0, "milestone": 0, "chore": 0, "other": 0}
    for c in commits:
        counts[c["type"]] = counts.get(c["type"], 0) + 1

    # ── Pillar 1: Stability (35 pts) ──
    fix_ratio = counts["fix"] / n
    if fix_ratio <= 0.20:
        stability_raw = 1.0
    elif fix_ratio <= 0.35:
        stability_raw = 1.0 - (fix_ratio - 0.20) / 0.60
    else:
        stability_raw = max(0.0, 1.0 - (fix_ratio - 0.35) / 0.50)
    stability = round(stability_raw * 35)

    # ── Pillar 2: Momentum (25 pts) ──
    feat_ratio = counts["feat"] / n
    momentum_raw = min(1.0, feat_ratio / 0.40)
    momentum = round(momentum_raw * 25)

    # ── Pillar 3: Milestones (20 pts) ──
    ideal_milestones = max(1, n // 8)
    milestone_raw = min(1.0, counts["milestone"] / ideal_milestones)
    milestones = round(milestone_raw * 20)

    # ── Pillar 4: Consistency / entropy (20 pts) ──
    entropy = 0.0
    for v in counts.values():
        p = v / n
        if p > 0:
            entropy -= p * math.log2(p)
    max_entropy = math.log2(len(counts))          # log2(5) ≈ 2.32
    consistency_raw = min(1.0, entropy / max_entropy)
    consistency = round(consistency_raw * 20)

    # ── Final score ──
    score = stability + momentum + milestones + consistency

    # ── Grade ──
    if score >= 90:
        grade = "A+"
    elif score >= 80:
        grade = "A"
    elif score >= 70:
        grade = "B+"
    elif score >= 60:
        grade = "B"
    elif score >= 50:
        grade = "C+"
    elif score >= 40:
        grade = "C"
    else:
        grade = "D"

    # ── Human-readable status ──
    if score >= 80:
        status = "Healthy"
    elif score >= 60:
        status = "Good"
    elif score >= 40:
        status = "Needs Attention"
    else:
        status = "Critical"

    return {
        "score": score,
        "grade": grade,
        "status": status,
        "pillars": {
            "stability":   {"score": stability,   "max": 35,
                            "fix_ratio_pct":   round(fix_ratio * 100)},
            "momentum":    {"score": momentum,    "max": 25,
                            "feat_ratio_pct":  round(feat_ratio * 100)},
            "milestones":  {"score": milestones,  "max": 20,
                            "count":           counts["milestone"]},
            "consistency": {"score": consistency, "max": 20,
                            "entropy":         round(entropy, 3)},
        },
        "counts": counts,
    }


# ─────────────────────────────────────────────
#  Helper: fetch commits from GitHub API
# ─────────────────────────────────────────────

def fetch_github_commits(owner: str, repo: str, per_page: int = 100) -> list:
    """
    Fetch up to `per_page` commits from the GitHub REST API.
    Returns a list of raw commit objects or raises RuntimeError.
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    params = {"per_page": per_page}

    response = requests.get(url, headers=_github_headers(),
                            params=params, timeout=10)

    # Surface GitHub-specific errors clearly
    if response.status_code == 404:
        raise RuntimeError(f"Repository '{owner}/{repo}' not found. "
                           "Check spelling and make sure it's public.")
    if response.status_code == 403:
        remaining = response.headers.get("X-RateLimit-Remaining", "?")
        reset_ts  = response.headers.get("X-RateLimit-Reset", "?")
        if remaining == "0":
            raise RuntimeError(
                "GitHub API rate limit reached. "
                f"Resets at Unix timestamp {reset_ts}. "
                "Add a GITHUB_TOKEN in app.py to raise the limit to 5000/hour."
            )
        raise RuntimeError("GitHub API access forbidden (403). "
                           "Repository may be private.")
    if response.status_code == 422:
        raise RuntimeError("GitHub returned 422 — repository may be empty.")
    if not response.ok:
        raise RuntimeError(
            f"GitHub API error {response.status_code}: {response.text[:200]}"
        )

    return response.json()


# ─────────────────────────────────────────────
#  Helper: process raw GitHub commits
# ─────────────────────────────────────────────

def process_commits(raw_commits: list) -> list:
    """
    Transform GitHub API commit objects into the flat shape
    the CommitVerse frontend expects:
      { hash, msg, type, author, date }
    """
    processed = []
    for item in raw_commits:
        commit_data = item.get("commit", {})
        message_full = commit_data.get("message", "").strip()

        # Use only the first line of a multi-line commit message
        message = message_full.splitlines()[0] if message_full else "(no message)"

        sha      = item.get("sha", "")[:7]
        author   = (commit_data.get("author") or {}).get("name", "Unknown")
        raw_date = (commit_data.get("author") or {}).get("date", "")

        # Parse ISO date to a clean string  "2024-03-15"
        try:
            date = datetime.fromisoformat(
                raw_date.replace("Z", "+00:00")
            ).strftime("%Y-%m-%d")
        except (ValueError, AttributeError):
            date = raw_date

        processed.append({
            "hash":   sha,
            "msg":    message,
            "type":   classify_commit(message),
            "author": author,
            "date":   date,
        })

    return processed


# ─────────────────────────────────────────────
#  API endpoint:  POST /api/commits
# ─────────────────────────────────────────────

@app.route("/api/commits", methods=["POST"])
def get_commits():
    """
    Accepts:  { "repo_url": "https://github.com/owner/repo" }
    Returns:  { "commits": [...], "health": {...}, "meta": {...} }

    Frontend call example:
        fetch("http://127.0.0.1:5000/api/commits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo_url: "https://github.com/facebook/react" })
        })
        .then(r => r.json())
        .then(data => console.log(data));
    """

    # ── 1. Parse request body ──
    body = request.get_json(silent=True)
    if not body or "repo_url" not in body:
        return jsonify({
            "error": "Missing 'repo_url' in request body.",
            "example": {"repo_url": "https://github.com/owner/repo"}
        }), 400

    repo_url = body["repo_url"].strip()
    if not repo_url:
        return jsonify({"error": "'repo_url' cannot be empty."}), 400

    # ── 2. Extract owner / repo from URL ──
    try:
        owner, repo = parse_repo_url(repo_url)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # ── 3. Fetch from GitHub ──
    try:
        raw_commits = fetch_github_commits(owner, repo)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 502   # bad gateway — upstream issue

    # ── 4. Process & classify ──
    commits = process_commits(raw_commits)

    # ── 5. Health score ──
    health = calculate_health_score(commits)

    # ── 6. Build response ──
    return jsonify({
        "meta": {
            "owner":        owner,
            "repo":         repo,
            "commit_count": len(commits),
            "fetched_at":   datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
        "commits": commits,
        "health":  health,
    })


# ─────────────────────────────────────────────
#  Health-check endpoint  GET /
# ─────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    """Simple health-check so you can confirm the server is running."""
    return jsonify({
        "status":  "CommitVerse backend is running",
        "version": "1.0.0",
        "endpoints": {
            "POST /api/commits": "Fetch & analyse a GitHub repository"
        }
    })


# ─────────────────────────────────────────────
#  Entry point
# ─────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)
