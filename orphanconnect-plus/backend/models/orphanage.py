from app import db
from datetime import datetime

class Orphanage(db.Model):
    __tablename__ = 'orphanages'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    pincode = db.Column(db.String(10), nullable=False)
    contact_person = db.Column(db.String(100), nullable=False)
    contact_number = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    current_children = db.Column(db.Integer, default=0)
    registration_number = db.Column(db.String(100), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'pincode': self.pincode,
            'contact_person': self.contact_person,
            'contact_number': self.contact_number,
            'email': self.email,
            'capacity': self.capacity,
            'current_children': self.current_children,
            'registration_number': self.registration_number,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat()
        }