from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import get_connection

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("", methods=["GET"])
@jwt_required()
def analytics():
    user_id = int(get_jwt_identity())

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            COUNT(*) as total,
            SUM(sentiment = 'positive') as positive,
            SUM(sentiment = 'neutral') as neutral,
            SUM(sentiment = 'negative') as negative,
            SUM(type = 'text') as text,
            SUM(type = 'audio') as audio
        FROM sentiment_history
        WHERE user_id = ?
    """, (user_id,))

    row = cursor.fetchone()
    conn.close()

    return jsonify(dict(row))
