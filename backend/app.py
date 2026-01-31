from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from routes.sentiment import sentiment_bp
from routes.history import history_bp
from routes.analytics import analytics_bp
from routes.auth import auth_bp   # ✅ THIS MUST EXIST
from database.db import init_db

app = Flask(__name__)

app.config["SECRET_KEY"] = "super-secret-key"
app.config["JWT_SECRET_KEY"] = "jwt-super-secret-key"

JWTManager(app)

CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True
)

init_db()

# ✅ REGISTER BLUEPRINTS (ORDER DOESN’T MATTER)
app.register_blueprint(auth_bp, url_prefix="/api/auth")   # 🔥 THIS WAS MISSING
app.register_blueprint(history_bp, url_prefix="/api/history")
app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
app.register_blueprint(sentiment_bp, url_prefix="/api/sentiment")

@app.route("/api/test")
def test():
    return {"status": "ok"}

if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True)
