from app import db
from datetime import datetime

class Donation(db.Model):
    __tablename__ = 'donations'
    
    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    orphanage_id = db.Column(db.Integer, db.ForeignKey('orphanages.id'), nullable=False)
    type = db.Column(db.Enum('money', 'essentials', 'food_service', name='donation_types'), nullable=False)
    amount = db.Column(db.Float, nullable=True)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum('pending', 'confirmed', 'completed', 'cancelled', name='donation_status'), default='pending')
    scheduled_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    donor = db.relationship('User', backref='donations')
    orphanage = db.relationship('Orphanage', backref='donations')
    
    def to_dict(self):
        return {
            'id': self.id,
            'donor_id': self.donor_id,
            'orphanage_id': self.orphanage_id,
            'type': self.type,
            'amount': self.amount,
            'description': self.description,
            'status': self.status,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'created_at': self.created_at.isoformat(),
            'donor_name': self.donor.name if self.donor else None,
            'orphanage_name': self.orphanage.name if self.orphanage else None
        }