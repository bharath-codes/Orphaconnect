from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.blood import BloodRequest, BloodDonation
from app import db
from datetime import datetime

bp = Blueprint('blood', __name__)

@bp.route('/requests', methods=['GET'])
def get_blood_requests():
    try:
        status = request.args.get('status', 'active')
        blood_group = request.args.get('blood_group')
        
        query = BloodRequest.query.filter_by(status=status)
        if blood_group:
            query = query.filter_by(blood_group=blood_group)
        
        requests = query.order_by(BloodRequest.urgency.desc(), BloodRequest.created_at.desc()).all()
        return jsonify([req.to_dict() for req in requests]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/requests/create', methods=['POST'])
@jwt_required()
def create_blood_request():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        blood_request = BloodRequest(
            requester_id=user_id,
            patient_name=data['patient_name'],
            blood_group=data['blood_group'],
            units_needed=data['units_needed'],
            hospital_name=data['hospital_name'],
            hospital_address=data['hospital_address'],
            contact_number=data['contact_number'],
            urgency=data.get('urgency', 'medium'),
            needed_by=datetime.fromisoformat(data['needed_by']),
            description=data.get('description')
        )
        
        db.session.add(blood_request)
        db.session.commit()
        
        return jsonify({'message': 'Blood request created successfully', 'request': blood_request.to_dict()}), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/donate', methods=['POST'])
@jwt_required()
def register_blood_donation():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        donation = BloodDonation(
            donor_id=user_id,
            request_id=data.get('request_id'),
            donation_date=datetime.fromisoformat(data['donation_date']),
            location=data['location'],
            notes=data.get('notes')
        )
        
        db.session.add(donation)
        db.session.commit()
        
        return jsonify({'message': 'Blood donation registered successfully', 'donation': donation.to_dict()}), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/my-requests', methods=['GET'])
@jwt_required()
def get_my_requests():
    try:
        user_id = get_jwt_identity()
        requests = BloodRequest.query.filter_by(requester_id=user_id).order_by(BloodRequest.created_at.desc()).all()
        return jsonify([req.to_dict() for req in requests]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/my-donations', methods=['GET'])
@jwt_required()
def get_my_donations():
    try:
        user_id = get_jwt_identity()
        donations = BloodDonation.query.filter_by(donor_id=user_id).order_by(BloodDonation.created_at.desc()).all()
        return jsonify([donation.to_dict() for donation in donations]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500