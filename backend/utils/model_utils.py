import pickle
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

MODEL_PATH = "ml/sentiment/sentiment_model.h5"
TOKENIZER_PATH = "ml/sentiment/tokenizer.pkl"

model = load_model(MODEL_PATH)

with open(TOKENIZER_PATH, "rb") as f:
    tokenizer = pickle.load(f)

LABELS = ["negative", "neutral", "positive"]

def predict_sentiment(text):
    sequence = tokenizer.texts_to_sequences([text])
    padded = pad_sequences(sequence, maxlen=20, padding="post")

    prediction = model.predict(padded)[0]
    sentiment_index = int(np.argmax(prediction))

    sentiment = LABELS[sentiment_index]
    confidence = float(prediction[sentiment_index])

    return sentiment, round(confidence * 100, 2)
