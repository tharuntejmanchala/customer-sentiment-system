from flask import Blueprint, request
from database.db import create_user, verify_user
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json

    user = create_user(
        data.get("name"),
        data.get("email"),
        data.get("password")
    )

    if not user:
        return {"error": "User already exists"}, 400

    # 🔥 FIX: identity MUST be string
    access_token = create_access_token(identity=str(user["id"]))

    return {
        "message": "Signup successful",
        "token": access_token
    }, 200


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    user = verify_user(data.get("email"), data.get("password"))
    if not user:
        return {"error": "Invalid credentials"}, 401

    # 🔥 FIX: identity MUST be string
    access_token = create_access_token(identity=str(user["id"]))

    return {
        "message": "Login successful",
        "token": access_token
    }, 200
