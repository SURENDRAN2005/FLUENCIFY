import os
from pymongo import MongoClient
from pymongo.database import Database
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI is not set in the environment variables.")
DB_NAME = "fluencify"

# Global client
client: MongoClient = None

def get_db() -> Database:
    global client
    if client is None:
        client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
            maxPoolSize=50,
            minPoolSize=10,
            waitQueueTimeoutMS=5000
        )
    return client[DB_NAME]

def init_db():
    """Explicitly create collections and indexes in MongoDB Atlas to ensure they are visible."""
    db = get_db()
    
    # Ensure collections exist by creating them (if they already exist, this is a no-op or handled gracefully)
    collections = ["users", "sessions", "personal_baselines", "progress", "recommendations", "user_profiles"]
    existing_collections = db.list_collection_names()
    
    for coll in collections:
        if coll not in existing_collections:
            db.create_collection(coll)
            
    # Create indexes for performance and uniqueness
    db.users.create_index("username", unique=True)
    db.sessions.create_index("user_id")
    db.progress.create_index("user_id", unique=True)
    db.personal_baselines.create_index("user_id", unique=True)
    db.user_profiles.create_index("user_id", unique=True)
    print("MongoDB Atlas: All required collections and indexes initialized successfully.")
