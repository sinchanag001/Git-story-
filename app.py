from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# -------------------------------
# Helper: classify commit messages
# -------------------------------
def classify_commit(message):
    msg = message.lower()

    if any(word in msg for word in ["fix", "bug", "error", "issue"]):
        return "bug_fixes"
    elif any(word in msg for word in ["add", "implement", "feature", "create"]):
        return "features"
    elif any(word in msg for word in ["update", "improve", "refactor"]):
        return "improvements"
    else:
        return "others"

# -------------------------------
# Health Score
# -------------------------------
def compute_health_score(commits):
    total = len(commits)
    if total == 0:
        return 0

    meaningful = sum(1 for c in commits if len(c) > 5)
    return round((meaningful / total) * 100)

# -------------------------------
# API Endpoint
# -------------------------------
@app.route('/api/commits', methods=['POST'])
def get_commits():
    data = request.get_json()
    repo = data.get("repo")

    if not repo:
        return jsonify({"error": "Repository not provided"}), 400

    url = f"https://api.github.com/repos/{repo}/commits"

    try:
        response = requests.get(url)
        commits_data = response.json()

        if isinstance(commits_data, dict) and commits_data.get("message"):
            return jsonify({"error": "Invalid repo or API limit reached"}), 400

        commits = [c["commit"]["message"] for c in commits_data[:20]]

        result = {
            "features": [],
            "bug_fixes": [],
            "improvements": [],
            "others": []
        }

        for msg in commits:
            category = classify_commit(msg)
            result[category].append(msg)

        health_score = compute_health_score(commits)

        return jsonify({
            "repo": repo,
            "total_commits": len(commits),
            "analysis": result,
            "health_score": health_score
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------
# Home route
# -------------------------------
@app.route('/')
def home():
    return jsonify({
        "status": "CommitVerse backend is running",
        "endpoint": "POST /api/commits"
    })

# -------------------------------
# Run
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)
