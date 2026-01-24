from app import app
from config import db
from models.sentiment_model import SentimentHistory

with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully")
