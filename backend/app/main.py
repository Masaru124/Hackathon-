# Import the main FastAPI app from the root
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

# Make app available at module level
__all__ = ["app"]
