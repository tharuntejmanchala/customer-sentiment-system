from flask import Blueprint, request
from services.auth_service import create_user, authenticate_user
from flask_jwt_extended import create_access_token
from flask_jwt_extended import jwt_required, get_jwt_identity

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return {"error": "Missing fields"}, 400

    user = create_user(name, email, password)
    if not user:
        return {"error": "User already exists"}, 400

    return {"message": "Signup successful"}

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    access_token = create_access_token(identity=email)

    user = authenticate_user(email, password)
    if not user:
        return {"error": "Invalid credentials"}, 401

    return {"message": "Login successful",
    "token": access_token}

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_email = get_jwt_identity()
    return {"email": user_email}
