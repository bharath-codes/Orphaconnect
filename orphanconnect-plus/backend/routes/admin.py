from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.donation import Donation
from models.blood import BloodRequest
from models.food import FoodListing
from models.user import User
from app import db

bp = Blueprint('admin', __name__, url_prefix='/admin')

@bp.route('/overview', methods=['GET'])
@jwt_required()
def admin_overview():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != 'admin':
            return jsonify({'message': 'Unauthorized'}), 403

        donation_count = Donation.query.count()
        blood_request_count = BloodRequest.query.count()
        food_listing_count = FoodListing.query.count()
        user_count = User.query.count()

        return jsonify({
            'users': user_count,
            'donations': donation_count,
            'blood_requests': blood_request_count,
            'food_listings': food_listing_count
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
