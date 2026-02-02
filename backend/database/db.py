import sqlite3
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DB_NAME = "sentiment.db"

def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sentiment_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        input TEXT NOT NULL,
        sentiment TEXT NOT NULL,
        confidence REAL NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    conn.commit()
    conn.close()


def create_user(name, email, password):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        hashed = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (name, email, hashed)
        )
        conn.commit()
        return {
            "id": cursor.lastrowid,
            "name": name,
            "email": email
        }
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_user_by_email(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, password FROM users WHERE email = ?",
        (email,)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def verify_user(email, password):
    user = get_user_by_email(email)
    if not user:
        return None
    if not check_password_hash(user["password"], password):
        return None
    return user


def save_result(user_id, type_, input_, sentiment, confidence):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO sentiment_history
    (user_id, type, input, sentiment, confidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        type_,
        input_,
        sentiment,
        confidence,
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()


def get_all_history(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT type, input, sentiment, confidence, created_at
    FROM sentiment_history
    WHERE user_id = ?
    ORDER BY id DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return rows
