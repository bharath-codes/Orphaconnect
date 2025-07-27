from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
import os

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db = SQLAlchemy(app)
cors = CORS(app)
jwt = JWTManager(app)

# Import models
from models import user, donation, food, blood, orphanage

# Import routes
from routes import auth, donations, food as food_routes, blood as blood_routes, admin

# Register blueprints
app.register_blueprint(auth.bp, url_prefix='/api/auth')
app.register_blueprint(donations.bp, url_prefix='/api/donations')
app.register_blueprint(food_routes.bp, url_prefix='/api/food')
app.register_blueprint(blood_routes.bp, url_prefix='/api/blood')
app.register_blueprint(admin.bp, url_prefix='/api/admin')

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'OrphanConnect+ API is running'})

def create_tables_and_admin():
    db.create_all()

    from models.user import User
    from werkzeug.security import generate_password_hash

    admin = User.query.filter_by(email='admin@orphanconnect.com').first()
    if not admin:
        admin_user = User(
            name='Administrator',
            email='admin@orphanconnect.com',
            phone='9999999999',
            password=generate_password_hash('admin123'),
            role='admin',
            is_verified=True
        )
        db.session.add(admin_user)
        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        create_tables_and_admin()
    app.run(debug=True, host='0.0.0.0', port=5000)
