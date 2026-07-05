import os
import logging
import sys
import tempfile
import pickle
import sqlite3
import uuid
import numpy as np
import base64
import urllib.parse

# ---------------------------------------------------------------------------
# Optional: TensorFlow
# ---------------------------------------------------------------------------
HAS_TENSORFLOW = False
try:
    import tensorflow as tf
    from tensorflow.keras.preprocessing.text import Tokenizer
    from tensorflow.keras.preprocessing.sequence import pad_sequences
    from tensorflow.keras.models import Model
    from tensorflow.keras.layers import Input, Embedding, LSTM, Dense, Dropout, Bidirectional
    from tensorflow.keras.callbacks import EarlyStopping
    HAS_TENSORFLOW = True
except Exception:
    tf = Tokenizer = pad_sequences = Model = None
    Input = Embedding = LSTM = Dense = Dropout = Bidirectional = EarlyStopping = None

# ---------------------------------------------------------------------------
# Optional: Whisper Mock using Gemini API
# ---------------------------------------------------------------------------
HAS_WHISPER = True
whisper = "GeminiTranscriptionEngine"

# ---------------------------------------------------------------------------
# Gemini REST API (no SDK — avoids protobuf conflicts)
# ---------------------------------------------------------------------------
import requests as _requests

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk
import re
from dotenv import load_dotenv
import uvicorn
import aiofiles
from datetime import datetime, timedelta
import hashlib
import json
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# TF env tweaks
# ---------------------------------------------------------------------------
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
logging.getLogger('tensorflow').setLevel(logging.ERROR)
logging.getLogger('tensorflow').disabled = True

# FFmpeg path (Windows)
os.environ["PATH"] += os.pathsep + r"C:\ffmpeg-master-latest-win64-gpl\bin"
winget_base = r"C:\Users\THARUN\AppData\Local\Microsoft\WinGet\Packages"
if os.path.exists(winget_base):
    for root, dirs, files in os.walk(winget_base):
        if "ffmpeg.exe" in files:
            os.environ["PATH"] += os.pathsep + root
            break

# ---------------------------------------------------------------------------
# Load .env
# ---------------------------------------------------------------------------
load_dotenv()

# ---------------------------------------------------------------------------
# Security & Email Helpers
# ---------------------------------------------------------------------------
# Initialize Firebase Admin SDK
firebase_initialized = False
firebase_creds_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
if firebase_creds_json:
    try:
        creds_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(creds_dict)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
else:
    try:
        firebase_admin.initialize_app()
        firebase_initialized = True
        logger.info("Firebase Admin SDK initialized with default credentials.")
    except Exception as e:
        logger.warning(f"Firebase Admin SDK not initialized: {e}. Running with mock validation fallback.")

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid token")
    token = authorization.split(" ")[1]
    
    # Dev mock token fallback
    if token.startswith("mock-token-"):
        mock_user = token.replace("mock-token-", "")
        return mock_user
        
    try:
        if not firebase_initialized:
            # Fallback if admin SDK is completely unconfigured
            logger.warning("Firebase not initialized. Attempting mock decoding fallback.")
            return "mock_user@example.com"
            
        decoded_token = firebase_auth.verify_id_token(token)
        email = decoded_token.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token: missing email")
        return email
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

def send_email(to_email: str, subject: str, body: str):
    logger.info(f"[EMAIL SEND ATTEMPT] To: {to_email} | Subject: {subject}")
    if RESEND_API_KEY:
        try:
            from_email = os.getenv("SMTP_FROM", "onboarding@resend.dev")
            if from_email == "noreply@cests.com":
                from_email = "onboarding@resend.dev"
                
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": from_email,
                "to": to_email,
                "subject": subject,
                "html": body
            }
            res = _requests.post(url, json=payload, headers=headers, timeout=10)
            if res.status_code in [200, 201]:
                logger.info(f"Email sent successfully via Resend API to {to_email}")
                return True
            else:
                logger.error(f"Resend API error: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Failed to send email via Resend API: {e}")
            
    # Dev / Local Simulation mode fallback logger print
    logger.warning(f"[EMAIL SIMULATION LOG] To: {to_email} | Subject: {subject} | Body: {body}")
    return True

# ---------------------------------------------------------------------------
# Gemini REST helper (no SDK)
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
_GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


def _call_gemini(prompt: str, max_tokens: int = 1500) -> str:
    """Call Gemini via REST. Returns the generated text, or raises on error."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.7},
    }
    resp = _requests.post(
        f"{_GEMINI_URL}?key={GEMINI_API_KEY}",
        json=body,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def transcribe_audio_via_gemini(audio_path: str) -> str:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")
    try:
        with open(audio_path, 'rb') as f:
            audio_data = f.read()
        
        ext = os.path.splitext(audio_path)[-1].lower()
        if ext == '.mp3':
            mime_type = 'audio/mp3'
        elif ext == '.wav':
            mime_type = 'audio/wav'
        elif ext in ['.webm', '.weba']:
            mime_type = 'audio/webm'
        elif ext == '.ogg':
            mime_type = 'audio/ogg'
        else:
            mime_type = 'audio/wav'
            
        base64_audio = base64.b64encode(audio_data).decode('utf-8')
        
        payload = {
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": base64_audio
                        }
                    },
                    {
                        "text": "Transcribe this audio file accurately. Return only the transcription text, nothing else. If there is no speech, return an empty string."
                    }
                ]
            }]
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        url = f"{_GEMINI_URL}?key={GEMINI_API_KEY}"
        res = _requests.post(url, headers=headers, json=payload, timeout=60)
        if res.status_code != 200:
            logger.error(f"Gemini API returned status {res.status_code}: {res.text}")
            raise ValueError(f"Gemini transcription failed: {res.text}")
            
        data = res.json()
        text = data['candidates'][0]['content']['parts'][0]['text']
        return text.strip()
    except Exception as e:
        logger.error(f"Error in Gemini transcription: {e}")
        raise


if GEMINI_API_KEY:
    logger.info("Gemini REST API configured (gemini-2.5-flash).")
else:
    logger.warning("GEMINI_API_KEY not set — using extractive summariser fallback.")

# ---------------------------------------------------------------------------
# Model parameters
# ---------------------------------------------------------------------------
MAX_WORDS = 10000
MAX_LEN = 100
EMBEDDING_DIM = 200

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'sentiment_model.h5')
TOKENIZER_PATH = os.path.join(BASE_DIR, 'tokenizer.pickle')
DB_PATH = os.path.join(BASE_DIR, 'recordings.db')
UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOADS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Whisper (loaded once at startup)
# ---------------------------------------------------------------------------
whisper_model = "GeminiTranscriptionEngine"

# Try importing pymongo for MongoDB connectivity
MONGO_AVAILABLE = False
try:
    import pymongo
    from pymongo import MongoClient
    MONGO_AVAILABLE = True
except ImportError:
    pymongo = None
    MongoClient = None

def clean_mongo_uri(uri: str) -> str:
    if not uri:
        return uri
    try:
        prefix = ""
        if uri.startswith("mongodb+srv://"):
            prefix = "mongodb+srv://"
        elif uri.startswith("mongodb://"):
            prefix = "mongodb://"
        else:
            return uri
            
        rest = uri[len(prefix):]
        if '@' not in rest:
            return uri
            
        cred_part, host_part = rest.rsplit('@', 1)
        if ':' not in cred_part:
            return uri
            
        user, password = cred_part.split(':', 1)
        escaped_user = urllib.parse.quote_plus(user)
        escaped_password = urllib.parse.quote_plus(password)
        
        return f"{prefix}{escaped_user}:{escaped_password}@{host_part}"
    except Exception:
        return uri

# Database Adapter
class DatabaseAdapter:
    def __init__(self):
        raw_uri = os.getenv("MONGO_URI")
        self.mongo_uri = clean_mongo_uri(raw_uri)
        self.mode = "sqlite"
        self.client = None
        self.mongo_db = None

        if self.mongo_uri:
            if MONGO_AVAILABLE:
                try:
                    # Set a short connection timeout so it fails quickly if offline/wrong URI
                    self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=2000)
                    # Trigger server check
                    self.client.admin.command('ping')
                    try:
                        self.mongo_db = self.client.get_default_database()
                    except Exception:
                        self.mongo_db = self.client["cests"]
                    self.mode = "mongo"
                    logger.info("Database Adapter: Connected successfully to MongoDB Atlas.")
                except Exception as e:
                    logger.error(f"Database Adapter: MongoDB Atlas connection failed ({e}). Falling back to SQLite.")
                    self.mode = "sqlite"
            else:
                logger.warning("Database Adapter: MONGO_URI is set but 'pymongo' library is not available. Falling back to SQLite.")
        else:
            logger.info("Database Adapter: Running with SQLite database.")

    def init_db(self):
        if self.mode == "mongo":
            # MongoDB collections initialization
            try:
                self.mongo_db.recordings.create_index("id", unique=True)
                self.mongo_db.users.create_index("username", unique=True)
                logger.info("Database Adapter: MongoDB collections and indexes initialized.")
            except Exception as e:
                logger.error(f"Database Adapter: MongoDB initialization failed: {e}")
        else:
            conn = sqlite3.connect(DB_PATH)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS recordings (
                    id            TEXT PRIMARY KEY,
                    filename      TEXT,
                    file_path     TEXT,
                    timestamp     TEXT,
                    duration      REAL DEFAULT 0,
                    transcription TEXT,
                    sentiment     TEXT,
                    confidence    REAL DEFAULT 0,
                    polarity      REAL DEFAULT 0,
                    compound      REAL DEFAULT 0,
                    negative      REAL DEFAULT 0,
                    neutral       REAL DEFAULT 0,
                    positive      REAL DEFAULT 0,
                    summary       TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    username      TEXT PRIMARY KEY,
                    password      TEXT
                )
            """)
            try:
                conn.execute("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0")
                conn.execute("ALTER TABLE users ADD COLUMN otp_code TEXT")
                conn.execute("ALTER TABLE users ADD COLUMN otp_expires TEXT")
                conn.execute("ALTER TABLE users ADD COLUMN reset_token TEXT")
                conn.execute("ALTER TABLE users ADD COLUMN reset_token_expires TEXT")
            except Exception:
                pass
            try:
                conn.execute("ALTER TABLE recordings ADD COLUMN username TEXT")
            except Exception:
                pass
            conn.commit()
            conn.close()
            logger.info("Database Adapter: SQLite tables initialized.")

    def save_recording(self, recording_id, filename, file_path, timestamp, duration, transcription, sentiment, confidence, summary, username=None):
        if self.mode == "mongo":
            doc = {
                "id": recording_id,
                "filename": filename,
                "file_path": file_path,
                "timestamp": timestamp,
                "duration": duration,
                "transcription": transcription,
                "sentiment": sentiment,
                "confidence": confidence,
                "summary": summary,
                "username": username.lower() if username else None
            }
            self.mongo_db.recordings.replace_one({"id": recording_id}, doc, upsert=True)
        else:
            conn = sqlite3.connect(DB_PATH)
            conn.execute(
                """INSERT OR REPLACE INTO recordings
                   (id, filename, file_path, timestamp, duration, transcription, sentiment, confidence, summary, username)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (recording_id, filename, file_path, timestamp, duration, transcription, sentiment, confidence, summary, username.lower() if username else None)
            )
            conn.commit()
            conn.close()

    def get_all_recordings(self, username=None):
        if self.mode == "mongo":
            query = {}
            if username:
                query["username"] = username.lower()
            cursor = self.mongo_db.recordings.find(query, {"_id": 0}).sort("timestamp", -1)
            return list(cursor)
        else:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            if username:
                rows = conn.execute("SELECT * FROM recordings WHERE lower(username) = ? ORDER BY timestamp DESC", (username.lower(),)).fetchall()
            else:
                rows = conn.execute("SELECT * FROM recordings ORDER BY timestamp DESC").fetchall()
            res = [dict(r) for r in rows]
            conn.close()
            return res

    def get_recording(self, recording_id):
        if self.mode == "mongo":
            return self.mongo_db.recordings.find_one({"id": recording_id}, {"_id": 0})
        else:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM recordings WHERE id = ?", (recording_id,)).fetchone()
            res = dict(row) if row else None
            conn.close()
            return res

    def get_user(self, username):
        if self.mode == "mongo":
            return self.mongo_db.users.find_one({"username": username.lower()}, {"_id": 0})
        else:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM users WHERE lower(username) = ?", (username.lower(),)).fetchone()
            res = dict(row) if row else None
            conn.close()
            return res

    def save_user(self, username, password, is_verified=False, otp_code=None, otp_expires=None):
        if self.mode == "mongo":
            doc = {
                "username": username.lower(),
                "password": password,
                "is_verified": is_verified,
                "otp_code": otp_code,
                "otp_expires": otp_expires
            }
            self.mongo_db.users.replace_one({"username": username.lower()}, doc, upsert=True)
        else:
            conn = sqlite3.connect(DB_PATH)
            conn.execute(
                "INSERT OR REPLACE INTO users (username, password, is_verified, otp_code, otp_expires) VALUES (?, ?, ?, ?, ?)",
                (username.lower(), password, int(is_verified), otp_code, otp_expires)
            )
            conn.commit()
            conn.close()

    def update_user(self, username, fields: dict):
        if self.mode == "mongo":
            self.mongo_db.users.update_one({"username": username.lower()}, {"$set": fields})
        else:
            conn = sqlite3.connect(DB_PATH)
            set_clause = ", ".join([f"{k} = ?" for k in fields.keys()])
            values = list(fields.values())
            values.append(username.lower())
            conn.execute(f"UPDATE users SET {set_clause} WHERE lower(username) = ?", values)
            conn.commit()
            conn.close()

    def get_user_by_reset_token(self, token):
        if self.mode == "mongo":
            return self.mongo_db.users.find_one({"reset_token": token}, {"_id": 0})
        else:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM users WHERE reset_token = ?", (token,)).fetchone()
            res = dict(row) if row else None
            conn.close()
            return res

db_adapter = DatabaseAdapter()

def init_db():
    db_adapter.init_db()


# ---------------------------------------------------------------------------
# TextAnalyzer
# ---------------------------------------------------------------------------
class TextAnalyzer:
    def __init__(self):
        self.tokenizer = None
        self.model = None
        try:
            nltk.download('vader_lexicon', quiet=True)
            self.sia = SentimentIntensityAnalyzer()
        except Exception as e:
            logger.error(f"Error initialising VADER: {e}")
            self.sia = None

    # ------------------------------------------------------------------
    def clean_text(self, text: str) -> str:
        if not isinstance(text, str):
            return ''
        try:
            text = text.lower()
            text = re.sub(r'[^a-zA-Z\s]', '', text)
            text = ' '.join(text.split())
            return text
        except Exception:
            return ''

    # ------------------------------------------------------------------
    def build_model(self):
        if not HAS_TENSORFLOW:
            return None
        try:
            input_layer = Input(shape=(MAX_LEN,))
            embedding = Embedding(MAX_WORDS, EMBEDDING_DIM)(input_layer)
            lstm = Bidirectional(LSTM(64, return_sequences=True))(embedding)
            lstm = Dropout(0.2)(lstm)
            lstm = Bidirectional(LSTM(32))(lstm)
            lstm = Dropout(0.2)(lstm)
            dense = Dense(16, activation='relu')(lstm)
            output = Dense(1, activation='sigmoid')(dense)
            model = Model(inputs=input_layer, outputs=output)
            model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
            return model
        except Exception as e:
            logger.error(f"Error building model: {e}")
            return None

    # ------------------------------------------------------------------
    def generate_summary(self, text: str) -> str:
        """Generate an AI summary using Gemini REST; fall back to extractive if unavailable."""
        if GEMINI_API_KEY:
            try:
                prompt = (
                    "You are an expert customer engagement analyst. "
                    "Provide a concise 2-3 sentence summary of the following text, "
                    "highlighting key themes, emotions, and actionable insights:\n\n"
                    f"{text}"
                )
                return _call_gemini(prompt)
            except Exception as e:
                logger.error(f"Gemini summary error: {e}")

        # Fallback — extractive TF-score summariser
        try:
            sentences = re.split(r'(?<=[.!?])\s+', text)
            sentences = [s.strip() for s in sentences if s.strip()]
            if not sentences:
                return "No content to summarize."
            if len(sentences) <= 2:
                return text

            words = re.findall(r'\w+', text.lower())
            freq: dict = {}
            for w in words:
                if len(w) > 4:
                    freq[w] = freq.get(w, 0) + 1

            scores = {s: sum(freq.get(w, 0) for w in re.findall(r'\w+', s.lower())) for s in sentences}
            top = sorted(sentences, key=lambda s: scores.get(s, 0), reverse=True)[:2]
            summary_sentences = [s for s in sentences if s in top]
            return " ".join(summary_sentences)
        except Exception as e:
            logger.error(f"Extractive summariser error: {e}")
            return text[:200] + "..." if len(text) > 200 else text

    # ------------------------------------------------------------------
    def predict_sentiment(self, text: str) -> dict:
        if not text:
            return {'sentiment': 'neutral', 'score': 0.5, 'error': 'Empty text'}

        try:
            if self.sia is None:
                return {'sentiment': 'neutral', 'score': 0.5, 'error': 'VADER not available'}

            vader_scores = self.sia.polarity_scores(text)

            if self.model is None or self.tokenizer is None:
                combined_score = (vader_scores['compound'] + 1) / 2
            else:
                cleaned = self.clean_text(text)
                sequence = self.tokenizer.texts_to_sequences([cleaned])
                padded = pad_sequences(sequence, maxlen=MAX_LEN, padding='post')
                prediction = float(self.model.predict(padded, verbose=0)[0][0])
                combined_score = prediction * 0.3 + (vader_scores['compound'] + 1) / 2 * 0.7

            sentiment = 'neutral'
            if combined_score < 0.45:
                sentiment = 'negative'
            elif combined_score > 0.55:
                sentiment = 'positive'

            return {
                'sentiment': sentiment,
                'score': round(float(combined_score), 4),
                'vader_scores': vader_scores
            }
        except Exception as e:
            logger.error(f"Sentiment prediction error: {e}")
            return {'sentiment': 'neutral', 'score': 0.5, 'error': str(e)}

    # ------------------------------------------------------------------
    def analyze_text(self, text: str) -> dict:
        if not text or not text.strip():
            return {'error': 'No text provided', 'text': '', 'summary': '', 'sentiment': 'neutral', 'score': 0.5}
        try:
            sentiment_result = self.predict_sentiment(text)
            summary = self.generate_summary(text)
            return {'text': text, 'summary': summary, **sentiment_result}
        except Exception as e:
            logger.error(f"analyze_text error: {e}")
            return {'text': text, 'error': str(e), 'summary': '', 'sentiment': 'neutral', 'score': 0.5}

    # ------------------------------------------------------------------
    def train(self, texts: list, labels: list, validation_split: float = 0.2):
        if not HAS_TENSORFLOW:
            raise ValueError("TensorFlow not available.")
        if not texts or not labels:
            raise ValueError("Empty training data.")
        cleaned = [self.clean_text(t) for t in texts]
        self.tokenizer = Tokenizer(num_words=MAX_WORDS, oov_token='<OOV>')
        self.tokenizer.fit_on_texts(cleaned)
        sequences = self.tokenizer.texts_to_sequences(cleaned)
        padded = pad_sequences(sequences, maxlen=MAX_LEN, padding='post')
        labels_arr = np.array(labels)
        self.model = self.build_model()
        if self.model is None:
            raise ValueError("Failed to build model.")
        history = self.model.fit(
            padded, labels_arr,
            epochs=10,
            validation_split=validation_split,
            callbacks=[EarlyStopping(monitor='val_loss', patience=2)],
            verbose=1
        )
        return history

    # ------------------------------------------------------------------
    def save(self, model_path=MODEL_PATH, tokenizer_path=TOKENIZER_PATH):
        if not HAS_TENSORFLOW or self.model is None:
            return
        self.model.save(model_path)
        with open(tokenizer_path, 'wb') as f:
            pickle.dump(self.tokenizer, f, protocol=pickle.HIGHEST_PROTOCOL)
        logger.info("Model and tokenizer saved.")

    # ------------------------------------------------------------------
    def load(self, model_path=MODEL_PATH, tokenizer_path=TOKENIZER_PATH) -> bool:
        if not HAS_TENSORFLOW:
            logger.warning("TensorFlow not available – VADER fallback active.")
            return False
        if not os.path.exists(model_path) or not os.path.exists(tokenizer_path):
            logger.info("No saved model – VADER fallback active.")
            return False
        try:
            self.model = tf.keras.models.load_model(model_path)
            with open(tokenizer_path, 'rb') as f:
                self.tokenizer = pickle.load(f)
            logger.info("Model and tokenizer loaded.")
            return True
        except Exception as e:
            logger.error(f"Model load error: {e}")
            return False


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    text: str


class TrainRequest(BaseModel):
    texts: List[str]
    labels: List[float]


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="CESTS API", version="3.0.0", description="Customer Engagement Sentiment Tracking System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

text_analyzer = TextAnalyzer()


@app.on_event("startup")
async def startup_event():
    init_db()
    text_analyzer.load()


# ===========================================================================
# Routes
# ===========================================================================

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": "3.0.0",
        "gemini_enabled": bool(GEMINI_API_KEY),
        "whisper_enabled": HAS_WHISPER and whisper_model is not None,
        "tensorflow_enabled": HAS_TENSORFLOW
    }


@app.post("/analyze")
async def analyze_text_route(body: AnalyzeRequest, current_user: str = Depends(get_current_user)):
    try:
        result = text_analyzer.analyze_text(body.text)
        return result
    except Exception as e:
        logger.error(f"Error in /analyze: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/transcribe")
async def transcribe_audio_route(
    audio: UploadFile = File(None),
    text: str = Form(None),
    current_user: str = Depends(get_current_user)
):
    try:
        if text:
            result = text_analyzer.analyze_text(text)
            return {"transcription": text, "analysis_result": result}

        if audio is None:
            raise HTTPException(status_code=400, detail="No audio or text provided")

        if not HAS_WHISPER or whisper_model is None:
            raise HTTPException(status_code=500, detail="Whisper not available")

        content = await audio.read()
        suffix = os.path.splitext(audio.filename or '')[-1] or '.wav'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            transcription = transcribe_audio_via_gemini(tmp_path)
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass

        analysis = text_analyzer.analyze_text(transcription)
        return {"transcription": transcription, "analysis_result": analysis}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /transcribe: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/train")
async def train_model_route(body: TrainRequest, current_user: str = Depends(get_current_user)):
    try:
        if not HAS_TENSORFLOW:
            raise HTTPException(status_code=400, detail="TensorFlow not available")
        if not body.texts or not body.labels:
            raise HTTPException(status_code=400, detail="Training data missing")
        text_analyzer.train(body.texts, body.labels)
        text_analyzer.save()
        return {"message": "Model trained successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/audio")
async def audio_analysis_route(audio: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    tmp_path = None
    try:
        if not HAS_WHISPER or whisper_model is None:
            raise HTTPException(status_code=500, detail="Whisper not available")
        if not audio.filename:
            raise HTTPException(status_code=400, detail="Empty file")

        content = await audio.read()
        suffix = os.path.splitext(audio.filename)[-1].lower() or '.wav'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        transcription = transcribe_audio_via_gemini(tmp_path)
        if not transcription.strip():
            raise HTTPException(status_code=400, detail="No speech detected")

        analysis_result = text_analyzer.analyze_text(transcription)
        return {"transcription": transcription, "analysis_result": analysis_result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@app.post("/upload")
async def upload_file(audio: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    dest = os.path.join(UPLOADS_DIR, audio.filename or f"upload_{uuid.uuid4()}")
    async with aiofiles.open(dest, 'wb') as f:
        await f.write(await audio.read())
    return {"message": "File uploaded", "filename": audio.filename}


@app.post("/save-recording")
async def save_recording(
    audio: UploadFile = File(None),
    timestamp: str = Form(None),
    duration: float = Form(0.0),
    transcription: str = Form(""),
    sentiment: str = Form(""),
    confidence: float = Form(0.0),
    summary: str = Form(""),
    current_user: str = Depends(get_current_user)
):
    try:
        recording_id = str(uuid.uuid4())
        file_path = None

        if audio and audio.filename:
            ext = os.path.splitext(audio.filename)[-1] or '.webm'
            dest = os.path.join(UPLOADS_DIR, f"{recording_id}{ext}")
            async with aiofiles.open(dest, 'wb') as f:
                await f.write(await audio.read())
            file_path = dest

        ts = timestamp or datetime.utcnow().isoformat()
        db_adapter.save_recording(
            recording_id, audio.filename if audio else None, file_path, ts, duration, transcription, sentiment, confidence, summary, username=current_user
        )
        return {"recordingId": recording_id, "message": "Recording saved"}

    except Exception as e:
        logger.error(f"Error in /save-recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# OTP routes removed (authentication is now standard Firebase Email/Password & Google Sign-In)

@app.get("/recordings")
async def list_recordings(current_user: str = Depends(get_current_user)):
    try:
        return db_adapter.get_all_recordings(username=current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recordings/{recording_id}")
async def get_recording(recording_id: str, current_user: str = Depends(get_current_user)):
    try:
        row = db_adapter.get_recording(recording_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Not found")
        return row
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/audio-file/{recording_id}")
async def get_audio_file(recording_id: str, current_user: str = Depends(get_current_user)):
    try:
        row = db_adapter.get_recording(recording_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Not found")
        fp = row.get("file_path")
        if not fp or not os.path.exists(fp):
            raise HTTPException(status_code=404, detail="File not found on disk")
        return FileResponse(fp, media_type="audio/mpeg", filename=row.get("filename") or "recording.webm")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics")
async def get_analytics(current_user: str = Depends(get_current_user)):
    """Aggregated sentiment analytics for charts and dashboard."""
    try:
        data = db_adapter.get_all_recordings(username=current_user)

        dist = {"positive": 0, "negative": 0, "neutral": 0}
        total_conf = 0.0
        timeline: dict = {}

        for rec in data:
            s = (rec.get("sentiment") or "neutral").lower()
            if s in dist:
                dist[s] += 1
            total_conf += float(rec.get("confidence") or 0)

            date_str = (rec.get("timestamp") or "")[:10]
            if date_str:
                if date_str not in timeline:
                    timeline[date_str] = {"date": date_str, "positive": 0, "negative": 0, "neutral": 0, "total": 0}
                if s in timeline[date_str]:
                    timeline[date_str][s] += 1
                timeline[date_str]["total"] += 1

        total = len(data)
        return {
            "total": total,
            "sentiment_distribution": dist,
            "average_confidence": round(total_conf / total, 4) if total > 0 else 0.0,
            "timeline": sorted(timeline.values(), key=lambda x: x["date"]),
            "recent": list(data[:5]) if data else []
        }
    except Exception as e:
        logger.error(f"Error in /analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
