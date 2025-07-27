from app import db
from datetime import datetime

class FoodListing(db.Model):
    __tablename__ = 'food_listings'
    
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    quantity = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    pickup_time = db.Column(db.DateTime, nullable=False)
    expiry_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum('available', 'claimed', 'delivered', 'expired', name='food_status'), default='available')
    claimed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    provider = db.relationship('User', foreign_keys=[provider_id], backref='food_listings')
    claimer = db.relationship('User', foreign_keys=[claimed_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'provider_id': self.provider_id,
            'title': self.title,
            'description': self.description,
            'quantity': self.quantity,
            'location': self.location,
            'pickup_time': self.pickup_time.isoformat(),
            'expiry_time': self.expiry_time.isoformat(),
            'status': self.status,
            'claimed_by': self.claimed_by,
            'created_at': self.created_at.isoformat(),
            'provider_name': self.provider.name if self.provider else None,
            'claimer_name': self.claimer.name if self.claimer else None
        }