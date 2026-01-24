import os
import whisper

# 🔴 Force FFmpeg path (Windows fix)
os.environ["PATH"] += os.pathsep + r"C:\ffmpeg\bin"

# Load Whisper model once
model = whisper.load_model("base")

def transcribe_audio(audio_path):
    """
    Takes audio file path and returns transcribed text
    """
    result = model.transcribe(audio_path)
    return result["text"]
