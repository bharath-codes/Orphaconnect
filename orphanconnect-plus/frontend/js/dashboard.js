// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    loadUserInfo();
    loadDashboardStats();
    loadRecentActivities();
});

function loadUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
}

async function loadDashboardStats() {
    try {
        // Load donations count
        const donationsResponse = await fetch(`${API_BASE}/donations/my-donations`, {
            headers: getAuthHeaders()
        });
        if (donationsResponse.ok) {
            const donations = await donationsResponse.json();
            document.getElementById('totalDonations').textContent = donations.length;
        }

        // Load food listings count
        const foodResponse = await fetch(`${API_BASE}/food/my-listings`, {
            headers: getAuthHeaders()
        });
        if (foodResponse.ok) {
            const foodListings = await foodResponse.json();
            document.getElementById('foodShared').textContent = foodListings.length;
        }

        // Load blood donations count
        const bloodResponse = await fetch(`${API_BASE}/blood/my-donations`, {
            headers: getAuthHeaders()
        });
        if (bloodResponse.ok) {
            const bloodDonations = await bloodResponse.json();
            document.getElementById('bloodDonations').textContent = bloodDonations.length;
        }

        // Calculate lives impacted (rough estimate)
        const totalImpact = parseInt(document.getElementById('totalDonations').textContent) * 5 +
                          parseInt(document.getElementById('foodShared').textContent) * 3 +
                          parseInt(document.getElementById('bloodDonations').textContent) * 3;
        document.getElementById('livesImpacted').textContent = totalImpact;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentActivities() {
    const activityList = document.getElementById('activityList');
    const activities = [];

    try {
        // Load recent donations
        const donationsResponse = await fetch(`${API_BASE}/donations/my-donations`, {
            headers: getAuthHeaders()
        });
        if (donationsResponse.ok) {
            const donations = await donationsResponse.json();
            donations.slice(0, 3).forEach(donation => {
                activities.push({
                    type: 'donation',
                    text: `Donation of ₹${donation.amount || 'items'} to ${donation.orphanage_name}`,
                    date: donation.created_at,
                    status: donation.status
                });
            });
        }

        // Load recent food listings
        const foodResponse = await fetch(`${API_BASE}/food/my-listings`, {
            headers: getAuthHeaders()
        });
        if (foodResponse.ok) {
            const foodListings = await foodResponse.json();
            foodListings.slice(0, 2).forEach(listing => {
                activities.push({
                    type: 'food',
                    text: `Listed "${listing.title}" for sharing`,
                    date: listing.created_at,
                    status: listing.status
                });
            });
        }

        // Sort by date and display
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (activities.length === 0) {
            activityList.innerHTML = '<p>No recent activities. Start making an impact!</p>';
        } else {
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${activity.type === 'donation' ? 'heart' : 'utensils'}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${activity.text}</p>
                        <small>${formatDate(activity.date)} • ${activity.status}</small>
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading recent activities:', error);
        activityList.innerHTML = '<p>Error loading activities.</p>';
    }
}