from flask import Blueprint, jsonify
from database.db import get_all_history

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/analytics", methods=["GET"])
def analytics():
    rows = get_all_history()

    total = len(rows)

    positive = sum(1 for r in rows if r[2] == "positive")
    neutral  = sum(1 for r in rows if r[2] == "neutral")
    negative = sum(1 for r in rows if r[2] == "negative")

    text_count  = sum(1 for r in rows if r[0] == "text")
    audio_count = sum(1 for r in rows if r[0] == "audio")

    return jsonify({
        "total": total,
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
        "text": text_count,
        "audio": audio_count
    })
