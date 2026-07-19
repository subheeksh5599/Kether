"""SQLite store wrapper for Kether indexer data."""

import sqlite3
import os

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "..", "data", "kether.db"))


def get_db() -> sqlite3.Connection:
    """Get a read-only connection to the indexer database."""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode = WAL")
    db.execute("PRAGMA busy_timeout = 5000")
    return db
