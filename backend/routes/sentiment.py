from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import save_result
from utils.model_utils import predict_sentiment
from utils.audio_utils import transcribe_audio

sentiment_bp = Blueprint("sentiment", __name__)

@sentiment_bp.route("/text", methods=["POST"])
@jwt_required()
def text_sentiment():
    user_id = get_jwt_identity()

    data = request.get_json()
    if not data or "text" not in data:
        return {"error": "Text required"}, 400

    text = data["text"].strip()
    if not text:
        return {"error": "Empty text"}, 400

    sentiment, confidence = predict_sentiment(text)
    save_result(user_id, "text", text, sentiment, confidence)

    return jsonify({
        "sentiment": sentiment,
        "confidence": confidence
    })


@sentiment_bp.route("/audio", methods=["POST"])
@jwt_required()
def audio_sentiment():
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return {"error": "Audio file missing"}, 400

    audio_file = request.files["file"]
    text = transcribe_audio(audio_file)

    sentiment, confidence = predict_sentiment(text)
    save_result(user_id, "audio", text, sentiment, confidence)

    return jsonify({
        "transcription": text,
        "sentiment": sentiment,
        "confidence": confidence
    })
