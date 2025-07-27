from .auth import bp as auth_bp
from .donations import bp as donations_bp
from .food import bp as food_bp
from .blood import bp as blood_bp
from .admin import bp as admin_bp

# List of blueprints to register in app.py
blueprints = [auth_bp, donations_bp, food_bp, blood_bp, admin_bp]
