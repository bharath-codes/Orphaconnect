from app import db
from datetime import datetime

class BloodRequest(db.Model):
    __tablename__ = 'blood_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    patient_name = db.Column(db.String(100), nullable=False)
    blood_group = db.Column(db.String(5), nullable=False)
    units_needed = db.Column(db.Integer, nullable=False)
    hospital_name = db.Column(db.String(200), nullable=False)
    hospital_address = db.Column(db.Text, nullable=False)
    contact_number = db.Column(db.String(15), nullable=False)
    urgency = db.Column(db.Enum('low', 'medium', 'high', 'critical', name='urgency_levels'), default='medium')
    needed_by = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum('active', 'fulfilled', 'expired', 'cancelled', name='request_status'), default='active')
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    requester = db.relationship('User', backref='blood_requests')
    
    def to_dict(self):
        return {
            'id': self.id,
            'requester_id': self.requester_id,
            'patient_name': self.patient_name,
            'blood_group': self.blood_group,
            'units_needed': self.units_needed,
            'hospital_name': self.hospital_name,
            'hospital_address': self.hospital_address,
            'contact_number': self.contact_number,
            'urgency': self.urgency,
            'needed_by': self.needed_by.isoformat(),
            'status': self.status,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'requester_name': self.requester.name if self.requester else None
        }

class BloodDonation(db.Model):
    __tablename__ = 'blood_donations'
    
    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey('blood_requests.id'), nullable=True)
    donation_date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    status = db.Column(db.Enum('scheduled', 'completed', 'cancelled', name='donation_status'), default='scheduled')
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    donor = db.relationship('User', backref='blood_donations')
    request = db.relationship('BloodRequest', backref='donations')
    
    def to_dict(self):
        return {
            'id': self.id,
            'donor_id': self.donor_id,
            'request_id': self.request_id,
            'donation_date': self.donation_date.isoformat(),
            'location': self.location,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'donor_name': self.donor.name if self.donor else None
        }