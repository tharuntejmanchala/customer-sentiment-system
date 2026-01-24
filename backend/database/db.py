import sqlite3
from datetime import datetime

DB_NAME = "sentiment.db"

def get_connection():
    return sqlite3.connect(DB_NAME)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sentiment_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        input TEXT,
        sentiment TEXT,
        confidence REAL,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()


def save_result(type_, input_, sentiment, confidence):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO sentiment_history (type, input, sentiment, confidence, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (
        type_,
        input_,
        sentiment,
        confidence,
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()


def get_all_history():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT type, input, sentiment, confidence, created_at
    FROM sentiment_history
    ORDER BY id DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    return rows
