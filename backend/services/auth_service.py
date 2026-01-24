from werkzeug.security import generate_password_hash, check_password_hash

# Temporary in-memory storage
users = {}

def create_user(name, email, password):
    if email in users:
        return None

    hashed_password = generate_password_hash(password)
    users[email] = {
        "name": name,
        "email": email,
        "password": hashed_password
    }
    return users[email]

def authenticate_user(email, password):
    user = users.get(email)
    if not user:
        return None

    if not check_password_hash(user["password"], password):
        return None

    return user
