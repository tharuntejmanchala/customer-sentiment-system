from flask import Blueprint, jsonify
from database.db import get_all_history

history_bp = Blueprint("history", __name__)

@history_bp.route("/", methods=["GET"], strict_slashes=False)
def history():
    return jsonify(get_all_history())
