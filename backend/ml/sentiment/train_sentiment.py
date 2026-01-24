# train_sentiment.py

import pandas as pd
import numpy as np
import pickle

from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense
from sklearn.model_selection import train_test_split


# -------------------------------
# 1️⃣ LOAD KAGGLE DATASET
# -------------------------------

df = pd.read_csv("Tweets.csv")

# Keep only required columns
df = df[["text", "airline_sentiment"]]

# Rename column to match our pipeline
df.rename(columns={"airline_sentiment": "label"}, inplace=True)

# Drop missing values
df.dropna(inplace=True)

texts = df["text"].values
labels_text = df["label"].values



# -------------------------------
# 2️⃣ MAP LABELS TO NUMBERS
# -------------------------------

label_mapping = {
    "negative": 0,
    "neutral": 1,
    "positive": 2
}

labels = np.array([label_mapping[label] for label in labels_text])


# -------------------------------
# 3️⃣ TOKENIZATION
# -------------------------------

tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
tokenizer.fit_on_texts(texts)

sequences = tokenizer.texts_to_sequences(texts)
padded_sequences = pad_sequences(sequences, maxlen=20, padding="post")


# -------------------------------
# 4️⃣ TRAIN–TEST SPLIT
# -------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    padded_sequences,
    labels,
    test_size=0.2,
    random_state=42
)


# -------------------------------
# 5️⃣ BUILD MODEL
# -------------------------------

model = Sequential([
    Embedding(input_dim=5000, output_dim=64, input_length=20),
    LSTM(64),
    Dense(3, activation="softmax")
])

model.compile(
    loss="sparse_categorical_crossentropy",
    optimizer="adam",
    metrics=["accuracy"]
)


# -------------------------------
# 6️⃣ TRAIN MODEL
# -------------------------------

model.fit(
    X_train,
    y_train,
    epochs=15,
    validation_data=(X_test, y_test)
)


# -------------------------------
# 7️⃣ SAVE MODEL & TOKENIZER
# -------------------------------

model.save("sentiment_model.h5")

with open("tokenizer.pkl", "wb") as f:
    pickle.dump(tokenizer, f)

print("✅ Model and tokenizer saved successfully!")
