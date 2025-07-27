from celery import Celery
from config import Config
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Initialize Celery
celery = Celery('orphanconnect', broker=Config.CELERY_BROKER_URL)

@celery.task
def send_email_notification(to_email, subject, message):
    """Send email notification"""
    try:
        msg = MIMEMultipart()
        msg['From'] = Config.MAIL_USERNAME
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(message, 'plain'))
        
        server = smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT)
        server.starttls()
        server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(Config.MAIL_USERNAME, to_email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return False

@celery.task
def cleanup_expired_food_listings():
    """Clean up expired food listings"""
    from app import app, db
    from models.food import FoodListing
    from datetime import datetime
    
    with app.app_context():
        expired_listings = FoodListing.query.filter(
            FoodListing.expiry_time < datetime.utcnow(),
            FoodListing.status == 'available'
        ).all()
        
        for listing in expired_listings:
            listing.status = 'expired'
        
        db.session.commit()
        return f"Cleaned up {len(expired_listings)} expired food listings"

@celery.task
def send_blood_request_alerts():
    """Send alerts for urgent blood requests"""
    from app import app, db
    from models.blood import BloodRequest
    from models.user import User
    from datetime import datetime, timedelta
    
    with app.app_context():
        # Get urgent blood requests from last hour
        urgent_requests = BloodRequest.query.filter(
            BloodRequest.urgency.in_(['high', 'critical']),
            BloodRequest.status == 'active',
            BloodRequest.created_at >= datetime.utcnow() - timedelta(hours=1)
        ).all()
        
        for request in urgent_requests:
            # Find potential donors
            donors = User.query.filter(
                User.blood_group == request.blood_group,
                User.role == 'donor',
                User.is_active == True
            ).all()
            
            for donor in donors:
                subject = f"Urgent Blood Donation Needed - {request.blood_group}"
                message = f"""
                Dear {donor.name},
                
                There is an urgent blood donation request matching your blood group ({request.blood_group}).
                
                Patient: {request.patient_name}
                Hospital: {request.hospital_name}
                Units Needed: {request.units_needed}
                Urgency: {request.urgency.upper()}
                
                Please consider donating if you are eligible.
                
                Thank you for your compassion.
                OrphanConnect+ Team
                """
                
                send_email_notification.delay(donor.email, subject, message)
        
        return f"Sent alerts for {len(urgent_requests)} urgent blood requests"