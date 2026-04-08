"""
Startup script for production deployment.
Seeds the database on first run, then starts the app.
"""
import os
from seed_data import seed_db

if __name__ == "__main__":
    seed_db()
