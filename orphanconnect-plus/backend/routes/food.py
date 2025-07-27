from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.food import FoodListing
from app import db
from datetime import datetime

bp = Blueprint('food', __name__)

@bp.route('/listings', methods=['GET'])
def get_food_listings():
    try:
        status = request.args.get('status', 'available')
        listings = FoodListing.query.filter_by(status=status).order_by(FoodListing.created_at.desc()).all()
        return jsonify([listing.to_dict() for listing in listings]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/create', methods=['POST'])
@jwt_required()
def create_food_listing():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        listing = FoodListing(
            provider_id=user_id,
            title=data['title'],
            description=data.get('description'),
            quantity=data['quantity'],
            location=data['location'],
            pickup_time=datetime.fromisoformat(data['pickup_time']),
            expiry_time=datetime.fromisoformat(data['expiry_time'])
        )
        
        db.session.add(listing)
        db.session.commit()
        
        return jsonify({'message': 'Food listing created successfully', 'listing': listing.to_dict()}), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/<int:listing_id>/claim', methods=['POST'])
@jwt_required()
def claim_food_listing():
    try:
        user_id = get_jwt_identity()
        listing = FoodListing.query.get(listing_id)
        
        if not listing:
            return jsonify({'message': 'Food listing not found'}), 404
        
        if listing.status != 'available':
            return jsonify({'message': 'Food listing not available'}), 400
        
        listing.claimed_by = user_id
        listing.status = 'claimed'
        db.session.commit()
        
        return jsonify({'message': 'Food listing claimed successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/my-listings', methods=['GET'])
@jwt_required()
def get_my_listings():
    try:
        user_id = get_jwt_identity()
        listings = FoodListing.query.filter_by(provider_id=user_id).order_by(FoodListing.created_at.desc()).all()
        return jsonify([listing.to_dict() for listing in listings]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500