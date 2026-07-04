import os
import pickle
import numpy as np
import tensorflow as tf
from tensorflow.keras.datasets import imdb
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Embedding, LSTM, Dense, Dropout, Bidirectional
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer

vocab_size = 10000
max_length = 100
embedding_dim = 200

print("Loading IMDB dataset...")
(x_train_ids, y_train), (x_test_ids, y_test) = imdb.load_data(num_words=vocab_size)

print("Decoding IMDB dataset back to text...")
word_index = imdb.get_word_index()
# Index offset is 3 for IMDB dataset in Keras
index_to_word = {i + 3: w for w, i in word_index.items()}
index_to_word[0] = "<PAD>"
index_to_word[1] = "<START>"
index_to_word[2] = "<OOV>"

train_texts = []
for seq in x_train_ids:
    text = " ".join([index_to_word.get(i, "?") for i in seq if i > 2])
    train_texts.append(text)

test_texts = []
for seq in x_test_ids:
    text = " ".join([index_to_word.get(i, "?") for i in seq if i > 2])
    test_texts.append(text)

print("Fitting Tokenizer on decoded texts...")
tokenizer = Tokenizer(num_words=vocab_size, oov_token='<OOV>')
tokenizer.fit_on_texts(train_texts)

print("Tokenizing and padding sequences...")
x_train = pad_sequences(tokenizer.texts_to_sequences(train_texts), maxlen=max_length, padding='post')
x_test = pad_sequences(tokenizer.texts_to_sequences(test_texts), maxlen=max_length, padding='post')

# Use a subset of 12000 samples for fast training on CPU (takes ~1-2 min)
subset_size = 12000
x_train_sub = x_train[:subset_size]
y_train_sub = y_train[:subset_size]
x_test_sub = x_test[:subset_size]
y_test_sub = y_test[:subset_size]

print("Building LSTM model...")
input_layer = Input(shape=(max_length,))
embedding = Embedding(vocab_size, embedding_dim)(input_layer)
lstm = Bidirectional(LSTM(64, return_sequences=True))(embedding)
lstm = Dropout(0.2)(lstm)
lstm = Bidirectional(LSTM(32))(lstm)
lstm = Dropout(0.2)(lstm)
dense = Dense(16, activation='relu')(lstm)
output = Dense(1, activation='sigmoid')(dense)

model = Model(inputs=input_layer, outputs=output)
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

print("Training model (2 epochs)...")
model.fit(
    x_train_sub, y_train_sub,
    validation_data=(x_test_sub, y_test_sub),
    epochs=2,
    batch_size=64,
    verbose=1
)

print("Saving correctly aligned model and tokenizer...")
model.save('backend/sentiment_model.h5')
with open('backend/tokenizer.pickle', 'wb') as f:
    pickle.dump(tokenizer, f)

print("Done! Aligned model and tokenizer saved successfully.")
