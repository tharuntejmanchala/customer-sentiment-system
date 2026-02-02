from database.db import create_user as db_create_user
from database.db import verify_user as db_verify_user

def create_user(name, email, password):
    """
    Creates user in DB.
    Returns user dict {id, name, email} or None
    """
    success = db_create_user(name, email, password)
    if not success:
        return None

    # fetch user again to get id
    return db_verify_user(email, password)


def authenticate_user(email, password):
    """
    Verifies user credentials.
    Returns user dict {id, name, email} or None
    """
    return db_verify_user(email, password)
