"""
Vercel Serverless Function Entry Point
This wraps the FastAPI app for Vercel deployment
"""

import sys
from pathlib import Path

# Add parent directory to path to import main
sys.path.append(str(Path(__file__).parent.parent))

from main import app

# Vercel expects this handler
handler = app
