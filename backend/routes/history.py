from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import get_all_history

history_bp = Blueprint("history", __name__)

@history_bp.route("", methods=["GET"])
@jwt_required()
def history():
    user_id = int(get_jwt_identity())

    rows = get_all_history(user_id)

    # 🔥 Convert rows → list (VERY IMPORTANT)
    result = [
        [
            row["type"],
            row["input"],
            row["sentiment"],
            row["confidence"],
            row["created_at"]
        ]
        for row in rows
    ]

    return jsonify(result)
