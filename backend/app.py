from flask import Flask
from flask_cors import CORS

from routes.sentiment import sentiment_bp
from routes.history import history_bp
from routes.analytics import analytics_bp
from database.db import init_db

app = Flask(__name__)

CORS(
    app,
    supports_credentials=True,
    resources={r"/api/*": {"origins": "http://localhost:5173"}}
)

init_db()

# ✅ CORRECT blueprint prefixes
app.register_blueprint(history_bp,   url_prefix="/api/history")
app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
app.register_blueprint(sentiment_bp, url_prefix="/api/sentiment")

@app.route("/api/test")
def test():
    return {"status": "ok"}

if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True)
