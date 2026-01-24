import whisper
import tempfile

def transcribe_audio(audio_file):
    # Load model INSIDE function to avoid KV cache crash
    model = whisper.load_model("base")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp:
        audio_file.save(temp.name)
        result = model.transcribe(temp.name)

    return result["text"]
