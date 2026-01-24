from flask import Blueprint, request, jsonify
from utils.audio_utils import transcribe_audio
from utils.model_utils import predict_sentiment
from database.db import save_result

sentiment_bp = Blueprint("sentiment", __name__)

@sentiment_bp.route("/sentiment/text", methods=["POST"])
def text_sentiment():
    data = request.get_json()
    text = data.get("text", "")

    sentiment, confidence = predict_sentiment(text)

    save_result("text", text, sentiment, confidence)

    return jsonify({
        "sentiment": sentiment,
        "confidence": confidence
    })


@sentiment_bp.route("/sentiment/audio", methods=["POST"])
def audio_sentiment():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    audio_file = request.files["file"]
    text = transcribe_audio(audio_file)

    sentiment, confidence = predict_sentiment(text)

    save_result("audio", text, sentiment, confidence)

    return jsonify({
        "transcription": text,
        "sentiment": sentiment,
        "confidence": confidence
    })
