"""
Secret Key Manager

Automatically generates and persists SECRET_KEY for JWT authentication.
The key is stored in the database (system_config table).
"""

import secrets
import sqlite3
from pathlib import Path
from typing import Optional


def get_db_path() -> str:
    """Get database file path from environment or use default"""
    import os
    db_url = os.getenv('DATABASE_URL', 'sqlite+aiosqlite:///./data/o365_manager.db')
    # Extract file path from SQLAlchemy URL
    if 'sqlite' in db_url:
        db_path = db_url.split(':///')[-1]
        return db_path
    return './data/o365_manager.db'


def generate_secret_key() -> str:
    """Generate a secure random secret key"""
    return secrets.token_urlsafe(32)


def ensure_system_config_table(conn: sqlite3.Connection) -> None:
    """Create system_config table if it doesn't exist"""
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS system_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)
        conn.commit()
    except Exception as e:
        print(f"Warning: Could not create system_config table: {e}")


def get_secret_key_from_db(conn: sqlite3.Connection) -> Optional[str]:
    """Get SECRET_KEY from database"""
    try:
        cursor = conn.execute(
            "SELECT value FROM system_config WHERE key = 'SECRET_KEY'"
        )
        row = cursor.fetchone()
        if row and row[0] and len(row[0]) >= 32:
            return row[0]
    except Exception as e:
        print(f"Warning: Could not read SECRET_KEY from database: {e}")
    return None


def save_secret_key_to_db(conn: sqlite3.Connection, key: str) -> bool:
    """Save SECRET_KEY to database"""
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO system_config (key, value, description, updated_at)
            VALUES ('SECRET_KEY', ?, 'Auto-generated JWT secret key', CURRENT_TIMESTAMP)
            """,
            (key,)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"Warning: Could not save SECRET_KEY to database: {e}")
        return False


def get_or_create_secret_key() -> str:
    """
    Get existing secret key from database or create a new one.
    
    Returns:
        str: The secret key
    """
    db_path = get_db_path()
    
    # Ensure data directory exists
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        
        # Ensure table exists
        ensure_system_config_table(conn)
        
        # Try to read existing key
        existing_key = get_secret_key_from_db(conn)
        if existing_key:
            conn.close()
            return existing_key
        
        # Generate new key
        print("Generating new SECRET_KEY...")
        new_key = generate_secret_key()
        
        # Save to database
        if save_secret_key_to_db(conn, new_key):
            print(f"SECRET_KEY saved to database: {db_path}")
            print(f"Key length: {len(new_key)} characters")
        else:
            print("Warning: Using in-memory key (will be regenerated on restart)")
        
        conn.close()
        return new_key
        
    except Exception as e:
        print(f"Error accessing database: {e}")
        print("Generating temporary SECRET_KEY (will be regenerated on restart)")
        return generate_secret_key()


def rotate_secret_key() -> str:
    """
    Rotate (regenerate) the secret key.
    WARNING: This will invalidate all existing JWT tokens!
    
    Returns:
        str: The new secret key
    """
    print("WARNING: Rotating SECRET_KEY - all existing tokens will be invalidated!")
    
    db_path = get_db_path()
    
    try:
        conn = sqlite3.connect(db_path)
        ensure_system_config_table(conn)
        
        # Backup old key
        old_key = get_secret_key_from_db(conn)
        if old_key:
            try:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO system_config (key, value, description, updated_at)
                    VALUES ('SECRET_KEY_BACKUP', ?, 'Backup of previous SECRET_KEY', CURRENT_TIMESTAMP)
                    """,
                    (old_key,)
                )
                conn.commit()
                print("Old key backed up in database (SECRET_KEY_BACKUP)")
            except Exception as e:
                print(f"Warning: Could not backup old key: {e}")
        
        # Generate new key
        new_key = generate_secret_key()
        
        # Save new key
        if save_secret_key_to_db(conn, new_key):
            print(f"New SECRET_KEY saved to database: {db_path}")
            print(f"Key length: {len(new_key)} characters")
        
        conn.close()
        return new_key
        
    except Exception as e:
        print(f"Error rotating key: {e}")
        return generate_secret_key()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "rotate":
        # Rotate key
        new_key = rotate_secret_key()
        print(f"\nNew SECRET_KEY: {new_key}")
    else:
        # Get or create key
        key = get_or_create_secret_key()
        print(f"\nSECRET_KEY: {key}")
        print(f"Storage: Database (system_config table)")
