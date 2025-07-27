// Food Sharing JavaScript
document.addEventListener('DOMContentLoaded', function() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    loadAvailableFood();
    loadMyListings();
    
    // Setup form submission
    document.getElementById('foodForm').addEventListener('submit', handleFoodSubmit);
    
    // Set minimum datetime for inputs
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minDateTime = now.toISOString().slice(0, 16);
    document.getElementById('pickupTime').min = minDateTime;
    document.getElementById('expiryTime').min = minDateTime;
});

async function loadAvailableFood() {
    try {
        const response = await fetch(`${API_BASE}/food/listings?status=available`);
        const listings = await response.json();
        
        const container = document.getElementById('availableFoodListings');
        
        if (listings.length === 0) {
            container.innerHTML = '<p class="no-data">No food available for sharing right now.</p>';
            return;
        }
        
        container.innerHTML = listings.map(listing => {
            const timeRemaining = getTimeRemaining(listing.expiry_time);
            const isUrgent = timeRemaining.total < 3600000; // 1 hour in milliseconds
            
            return `
                <div class="food-card ${isUrgent ? 'urgent' : ''}">
                    <div class="food-header">
                        <h3>${listing.title}</h3>
                        <span class="time-badge ${isUrgent ? 'urgent' : ''}">
                            ${timeRemaining.text}
                        </span>
                    </div>
                    <p class="food-description">${listing.description || 'Fresh food available for pickup'}</p>
                    <div class="food-details">
                        <div class="detail">
                            <i class="fas fa-utensils"></i>
                            <span>Quantity: ${listing.quantity}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${listing.location}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-clock"></i>
                            <span>Pickup: ${formatDate(listing.pickup_time)}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-user"></i>
                            <span>By: ${listing.provider_name}</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="claimFood(${listing.id})">
                        <i class="fas fa-hand-holding"></i> Claim Food
                    </button>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading available food:', error);
        document.getElementById('availableFoodListings').innerHTML = '<p class="error">Error loading food listings</p>';
    }
}

async function loadMyListings() {
    try {
        const response = await fetch(`${API_BASE}/food/my-listings`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const listings = await response.json();
            const container = document.getElementById('myFoodListings');
            
            if (listings.length === 0) {
                container.innerHTML = '<p class="no-data">You haven\'t shared any food yet. Start sharing to reduce food waste!</p>';
                return;
            }
            
            container.innerHTML = listings.map(listing => `
                <div class="food-card my-listing">
                    <div class="food-header">
                        <h3>${listing.title}</h3>
                        <span class="status-badge status-${listing.status}">${listing.status}</span>
                    </div>
                    <p class="food-description">${listing.description || 'No description provided'}</p>
                    <div class="food-details">
                        <div class="detail">
                            <i class="fas fa-utensils"></i>
                            <span>Quantity: ${listing.quantity}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${listing.location}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-clock"></i>
                            <span>Pickup: ${formatDate(listing.pickup_time)}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-calendar"></i>
                            <span>Listed: ${formatDate(listing.created_at)}</span>
                        </div>
                        ${listing.claimer_name ? `
                            <div class="detail">
                                <i class="fas fa-user-check"></i>
                                <span>Claimed by: ${listing.claimer_name}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${listing.status === 'claimed' ? `
                        <button class="btn btn-success" onclick="markDelivered(${listing.id})">
                            Mark as Delivered
                        </button>
                    ` : ''}
                </div>
            `).join('');
            
        } else {
            throw new Error('Failed to load listings');
        }
        
    } catch (error) {
        console.error('Error loading my listings:', error);
        document.getElementById('myFoodListings').innerHTML = '<p class="error">Error loading your listings</p>';
    }
}

async function claimFood(listingId) {
    try {
        const response = await fetch(`${API_BASE}/food/${listingId}/claim`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Food claimed successfully! Please coordinate with the provider for pickup.', 'success');
            loadAvailableFood();
        } else {
            showAlert(result.message || 'Failed to claim food', 'error');
        }
        
    } catch (error) {
        console.error('Error claiming food:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

async function markDelivered(listingId) {
    try {
        const response = await fetch(`${API_BASE}/food/${listingId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'delivered' })
        });
        
        if (response.ok) {
            showAlert('Food marked as delivered!', 'success');
            loadMyListings();
        } else {
            const result = await response.json();
            showAlert(result.message || 'Failed to update status', 'error');
        }
        
    } catch (error) {
        console.error('Error updating status:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

function showFoodModal() {
    document.getElementById('foodModal').style.display = 'block';
}

function closeFoodModal() {
    document.getElementById('foodModal').style.display = 'none';
    document.getElementById('foodForm').reset();
}

async function handleFoodSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const foodData = {
        title: formData.get('title'),
        description: formData.get('description'),
        quantity: formData.get('quantity'),
        location: formData.get('location'),
        pickup_time: formData.get('pickup_time'),
        expiry_time: formData.get('expiry_time')
    };
    
    // Validate dates
    const pickupTime = new Date(foodData.pickup_time);
    const expiryTime = new Date(foodData.expiry_time);
    
    if (expiryTime <= pickupTime) {
        showAlert('Expiry time must be after pickup time', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        const response = await fetch(`${API_BASE}/food/create`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(foodData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Food listing created successfully!', 'success');
            closeFoodModal();
            loadMyListings();
            loadAvailableFood();
        } else {
            showAlert(result.message || 'Failed to create food listing', 'error');
        }
        
    } catch (error) {
        console.error('Error creating food listing:', error);
        showAlert('Network error. Please try again.', 'error');
    } finally {
        hideLoading(submit
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
}

/* Navigation */
.navbar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
}

.nav-logo {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
}

.nav-logo i {
    margin-right: 0.5rem;
    color: #ff6b6b;
}

.nav-menu {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.nav-link {
    color: white;
    text-decoration: none;
    transition: color 0.3s;
}

.nav-link:hover {
    color: #ff6b6b;
}

/* Buttons */
.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 5px;
    text-decoration: none;
    display: inline-block;
    transition: all 0.3s;
    cursor: pointer;
    font-size: 1rem;
}

.btn-primary {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: white;
    color: #333;
}

.full-width {
    width: 100%;
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8rem 2rem 4rem;
    text-align: center;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.hero-actions {
    margin-bottom: 3rem;
}

.hero-actions .btn {
    margin: 0 1rem;
}

.hero-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    max-width: 800px;
    margin: 0 auto;
}

.stat {
    text-align: center;
}

.stat h3 {
    font-size: 2.5rem;
    color: #ff6b6b;
    margin-bottom: 0.5rem;
}

/* Features Section */
.features {
    padding: 4rem 2rem;
    background: #f8f9fa;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}

.features h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.feature-card:hover {
    transform: translateY(-5px);
}

.feature-card i {
    font-size: 3rem;
    color: #ff6b6b;
    margin-bottom: 1rem;
}

.feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

/* About Section */
.about {
    padding: 4rem 2rem;
}

.about h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 2rem;
}

.about p {
    text-align: center;
    font-size: 1.1rem;
    max-width: 800px;
    margin: 0 auto 3rem;
}

.impact-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.metric {
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 10px;
}

.metric i {
    font-size: 2rem;
    color: #667eea;
    margin-bottom: 1rem;
}

/* Footer */
footer {
    background: #2c3e50;
    color: white;
    padding: 3rem 2rem 2rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.footer-section h3, .footer-section h4 {
    margin-bottom: 1rem;
}

.social-links {
    display: flex;
    gap: 1rem;
}

.social-links a {
    color: white;
    font-size: 1.5rem;
    transition: color 0.3s;
}

.social-links a:hover {
    color: #ff6b6b;
}

/* Auth Styles */
.auth-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.auth-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    width: 100%;
    max-width: 400px;
}

.auth-header {
    text-align: center;
    margin-bottom: 2rem;
}

.auth-header h2 {
    color: #333;
    margin-bottom: 0.5rem;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #333;
}

.form-group input,
.form-group select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #667eea;
}

.auth-footer {
    text-align: center;
    margin-top: 1rem;
}

.auth-footer a {
    color: #667eea;
    text-decoration: none;
}

/* Dashboard Styles */
.dashboard-container {
    display: flex;
    min-height: 100vh;
}

.sidebar {
    width: 250px;
    background: #2c3e50;
    color: white;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
}

.sidebar-header {
    padding: 2rem 1rem;
    text-align: center;
    border-bottom: 1px solid #34495e;
}

.sidebar-header i {
    font-size: 2rem;
    color: #ff6b6b;
    margin-bottom: 0.5rem;
}

.sidebar-menu {
    list-style: none;
    padding: 1rem 0;
}

.sidebar-menu li {
    margin-bottom: 0.5rem;
}

.sidebar-menu a {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    color: white;
    text-decoration: none;
    transition: background 0.3s;
}

.sidebar-menu a:hover,
.sidebar-menu .active a {
    background: #34495e;
}

.sidebar-menu i {
    margin-right: 1rem;
    width: 20px;
}

.main-content {
    flex: 1;
    margin-left: 250px;
    padding: 2rem;
    background: #f8f9fa;
}

.dashboard-header {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.user-avatar {
    width: 40px;
    height: 40px;
    background: #667eea;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
}

.stat-card:nth-child(1) .stat-icon { background: #ff6b6b; }
.stat-card:nth-child(2) .stat-icon { background: #4ecdc4; }
.stat-card:nth-child(3) .stat-icon { background: #45b7d1; }
.stat-card:nth-child(4) .stat-icon { background: #96ceb4; }

.stat-info h3 {
    font-size: 2rem;
    margin-bottom: 0.25rem;
}

.dashboard-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
}

.recent-activities,
.quick-actions {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.action-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.action-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 2px solid #f1f2f6;
    border-radius: 10px;
    text-decoration: none;
    color: #333;
    transition: all 0.3s;
}

.action-card:hover {
    border-color: #667eea;
    transform: translateY(-2px);
}

.action-card i {
    font-size: 1.5rem;
    color: #667eea;
}

.action-card h3 {
    margin-bottom: 0.25rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .hero-content h1 {
        font-size: 2rem;
    }
    
    .hero-actions .btn {
        display: block;
        margin: 0.5rem 0;
        text-align: center;
    }
    
    .features-grid,
    .impact-metrics {
        grid-template-columns: 1fr;
    }
    
    .dashboard-container {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
        position: relative;
        height: auto;
    }
    
    .main-content {
        margin-left: 0;
    }
    
    .dashboard-content {
        grid-template-columns: 1fr;
    }
    
    .nav-menu {
        display: none;
    }
}

/* Loading Spinner */
.loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Alert Messages */
.alert {
    padding: 1rem;
    border-radius: 5px;
    margin-bottom: 1rem;
}

.alert-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.alert-error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.alert-warning {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}