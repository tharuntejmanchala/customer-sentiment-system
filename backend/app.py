from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity

from routes.auth import auth_bp
from routes.sentiment import sentiment_bp
from routes.history import history_bp
from routes.analytics import analytics_bp
from database.db import init_db

app = Flask(__name__)

app.config["JWT_SECRET_KEY"] = "jwt-super-secret-key"

JWTManager(app)

CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:5173"}},
)

init_db()

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(sentiment_bp, url_prefix="/api/sentiment")
app.register_blueprint(history_bp, url_prefix="/api/history")
app.register_blueprint(analytics_bp, url_prefix="/api/analytics")


@app.route("/api/jwt-test")
@jwt_required()
def jwt_test():
    identity = get_jwt_identity()
    print("JWT IDENTITY:", identity, type(identity))
    return {"identity": identity}


@app.route("/api/test")
def test():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(debug=True)
