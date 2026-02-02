from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from routes.auth import auth_bp
from routes.sentiment import sentiment_bp
from routes.history import history_bp
from routes.analytics import analytics_bp
from database.db import init_db


def create_app():
    app = Flask(__name__)

    # ======================
    # CONFIG
    # ======================
    app.config["JWT_SECRET_KEY"] = "jwt-super-secret-key"

    JWTManager(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": "http://localhost:5173"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "OPTIONS"],
    )

    # ======================
    # INIT DB
    # ======================
    init_db()

    # ======================
    # ROUTES
    # ======================
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(sentiment_bp, url_prefix="/api/sentiment")
    app.register_blueprint(history_bp, url_prefix="/api/history")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    @app.route("/api/test")
    def test():
        return {"status": "ok"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
