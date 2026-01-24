from flask import Flask
from flask_cors import CORS

from routes.sentiment import sentiment_bp
from routes.history import history_bp
from routes.analytics import analytics_bp
from database.db import init_db

app = Flask(__name__)
CORS(app)

init_db()

app.register_blueprint(sentiment_bp, url_prefix="/api")
app.register_blueprint(history_bp, url_prefix="/api")
app.register_blueprint(analytics_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True)
