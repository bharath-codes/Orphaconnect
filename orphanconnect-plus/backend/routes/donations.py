from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.donation import Donation
from models.orphanage import Orphanage
from app import db

bp = Blueprint('donations', __name__)

@bp.route('/orphanages', methods=['GET'])
def get_orphanages():
    try:
        orphanages = Orphanage.query.filter_by(is_active=True, is_verified=True).all()
        return jsonify([orphanage.to_dict() for orphanage in orphanages]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/create', methods=['POST'])
@jwt_required()
def create_donation():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        donation = Donation(
            donor_id=user_id,
            orphanage_id=data['orphanage_id'],
            type=data['type'],
            amount=data.get('amount'),
            description=data.get('description'),
            scheduled_date=data.get('scheduled_date')
        )
        
        db.session.add(donation)
        db.session.commit()
        
        return jsonify({'message': 'Donation created successfully', 'donation': donation.to_dict()}), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/my-donations', methods=['GET'])
@jwt_required()
def get_my_donations():
    try:
        user_id = get_jwt_identity()
        donations = Donation.query.filter_by(donor_id=user_id).order_by(Donation.created_at.desc()).all()
        return jsonify([donation.to_dict() for donation in donations]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/<int:donation_id>/status', methods=['PUT'])
@jwt_required()
def update_donation_status():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        donation = Donation.query.filter_by(id=donation_id, donor_id=user_id).first()
        if not donation:
            return jsonify({'message': 'Donation not found'}), 404
        
        donation.status = data['status']
        db.session.commit()
        
        return jsonify({'message': 'Donation status updated'}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500