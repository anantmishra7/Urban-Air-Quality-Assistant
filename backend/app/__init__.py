from pathlib import Path

from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# Application root
BASE_DIR = Path(__file__).resolve().parent.parent
