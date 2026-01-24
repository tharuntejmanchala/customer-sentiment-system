from flask import Blueprint, jsonify
from database.db import get_all_history

history_bp = Blueprint("history", __name__)

@history_bp.route("/history", methods=["GET"])
def history():
    rows = get_all_history()

    data = []
    for r in rows:
        data.append({
            "type": r[0],
            "input": r[1],
            "sentiment": r[2],
            "confidence": r[3],
            "created_at": r[4]
        })

    return jsonify(data)
