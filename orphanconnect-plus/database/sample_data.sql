-- Sample data for OrphanConnect+

-- Insert admin user
INSERT INTO users (name, email, phone, password, role, is_verified) VALUES
('Administrator', 'admin@orphanconnect.com', '9999999999', 'scrypt:32768:8:1$salt$hash', 'admin', TRUE);

-- Insert sample orphanages
INSERT INTO orphanages (name, description, address, city, state, pincode, contact_person, contact_number, email, capacity, current_children, registration_number, is_verified, is_active) VALUES
('Hope Children Home', 'A caring home for underprivileged children', 'Plot 123, Gandhi Nagar', 'Hyderabad', 'Telangana', '500001', 'Mrs. Sharma', '9876543210', 'hope@childcare.org', 50, 35, 'REG001', TRUE, TRUE),
('Sunshine Orphanage', 'Providing education and care since 1995', '45 MG Road', 'Bangalore', 'Karnataka', '560001', 'Mr. Kumar', '9876543211', 'sunshine@care.org', 40, 28, 'REG002', TRUE, TRUE),
('Little Angels Home', 'Special care for differently abled children', '78 Park Street', 'Chennai', 'Tamil Nadu', '600001', 'Sister Mary', '9876543212', 'angels@home.org', 30, 22, 'REG003', TRUE, TRUE);

-- Insert sample users
INSERT INTO users (name, email, phone, password, role, blood_group, location, is_verified) VALUES
('Rajesh Patel', 'rajesh@email.com', '9876543213', 'scrypt:32768:8:1$salt$hash', 'donor', 'O+', 'Hyderabad, Telangana', TRUE),
('Priya Sharma', 'priya@email.com', '9876543214', 'scrypt:32768:8:1$salt$hash', 'donor', 'A+', 'Bangalore, Karnataka', TRUE),
('Mohammed Ali', 'ali@email.com', '9876543215', 'scrypt:32768:8:1$salt$hash', 'volunteer', 'B+', 'Chennai, Tamil Nadu', TRUE),
('Deepika Singh', 'deepika@email.com', '9876543216', 'scrypt:32768:8:1$salt$hash', 'donor', 'AB+', 'Mumbai, Maharashtra', TRUE);

-- Insert sample donations
INSERT INTO donations (donor_id, orphanage_id, type, amount, description, status, created_at) VALUES
(2, 1, 'money', 5000.00, 'Monthly donation for children education', 'completed', NOW() - INTERVAL '7 days'),
(3, 2, 'essentials', NULL, 'Books, clothes, and toys donation', 'confirmed', NOW() - INTERVAL '3 days'),
(4, 1, 'food_service', NULL, 'Birthday celebration meal service', 'pending', NOW() - INTERVAL '1 day');

-- Insert sample food listings
INSERT INTO food_listings (provider_id, title, description, quantity, location, pickup_time, expiry_time, status, created_at) VALUES
(2, 'Wedding Surplus Food', 'Fresh vegetarian food from wedding reception', '100 plates', 'Banjara Hills, Hyderabad', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '6 hours', 'available', NOW()),
(3, 'Restaurant Daily Special', 'Biryani and curry surplus from restaurant', '50 plates', 'Koramangala, Bangalore', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '4 hours', 'available', NOW()),
(4, 'Office Party Leftover', 'Snacks and lunch items', '30 plates', 'T-Nagar, Chennai', NOW() + INTERVAL '3 hours', NOW() + INTERVAL '8 hours', 'claimed', NOW() - INTERVAL '2 hours');

-- Insert sample blood requests
INSERT INTO blood_requests (requester_id, patient_name, blood_group, units_needed, hospital_name, hospital_address, contact_number, urgency, needed_by, status, description, created_at) VALUES
(2, 'Ravi Kumar', 'O+', 2, 'Apollo Hospital', 'Road No 72, Film Nagar, Hyderabad', '9876543217', 'high', NOW() + INTERVAL '24 hours', 'active', 'Urgent surgery requirement', NOW()),
(3, 'Baby Meera', 'A+', 1, 'Fortis Hospital', 'Bannerghatta Road, Bangalore', '9876543218', 'critical', NOW() + INTERVAL '12 hours', 'active', 'Newborn emergency', NOW()),
(4, 'Elderly Patient', 'B+', 3, 'CMC Hospital', 'Vellore, Tamil Nadu', '9876543219', 'medium', NOW() + INTERVAL '48 hours', 'active', 'Planned surgery', NOW());

-- Insert sample blood donations
INSERT INTO blood_donations (donor_id, request_id, donation_date, location, status, notes, created_at) VALUES
(2, 1, NOW() + INTERVAL '6 hours', 'Apollo Hospital Blood Bank', 'scheduled', 'First time donor, completed screening', NOW()),
(3, 2, NOW() + INTERVAL '3 hours', 'Fortis Hospital', 'scheduled', 'Regular donor, last donation 4 months ago', NOW());