import pickle
import numpy as np
from keras.models import load_model
from keras.preprocessing.sequence import pad_sequences

MODEL_PATH = "ml/sentiment/sentiment_model.h5"
TOKENIZER_PATH = "ml/sentiment/tokenizer.pkl"

model = load_model(MODEL_PATH)

with open(TOKENIZER_PATH, "rb") as f:
    tokenizer = pickle.load(f)

MAX_LEN = 100

def predict_sentiment(text):
    seq = tokenizer.texts_to_sequences([text])
    padded = pad_sequences(seq, maxlen=MAX_LEN)

    prediction = model.predict(padded)[0][0]

    sentiment = "Positive" if prediction >= 0.5 else "Negative"
    confidence = float(prediction if prediction >= 0.5 else 1 - prediction)

    return {
        "sentiment": sentiment,
        "confidence": confidence
    }
