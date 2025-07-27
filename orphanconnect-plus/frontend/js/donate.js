// Donations JavaScript
document.addEventListener('DOMContentLoaded', function() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    loadOrphanages();
    loadMyDonations();
    
    // Setup form submission
    document.getElementById('donationForm').addEventListener('submit', handleDonationSubmit);
});

async function loadOrphanages() {
    try {
        const response = await fetch(`${API_BASE}/donations/orphanages`);
        const orphanages = await response.json();
        
        const grid = document.getElementById('orphanagesGrid');
        const select = document.getElementById('orphanageSelect');
        
        // Populate grid
        grid.innerHTML = orphanages.map(orphanage => `
            <div class="orphanage-card">
                <div class="orphanage-header">
                    <h3>${orphanage.name}</h3>
                    <span class="capacity-badge">${orphanage.current_children}/${orphanage.capacity}</span>
                </div>
                <p class="orphanage-description">${orphanage.description || 'Caring for children with love and dedication'}</p>
                <div class="orphanage-details">
                    <div class="detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${orphanage.city}, ${orphanage.state}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-user"></i>
                        <span>${orphanage.contact_person}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-phone"></i>
                        <span>${orphanage.contact_number}</span>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="selectOrphanage(${orphanage.id})">
                    Donate Now
                </button>
            </div>
        `).join('');
        
        // Populate select dropdown
        select.innerHTML = '<option value="">Choose an orphanage...</option>' +
            orphanages.map(orphanage => 
                `<option value="${orphanage.id}">${orphanage.name} - ${orphanage.city}</option>`
            ).join('');
            
    } catch (error) {
        console.error('Error loading orphanages:', error);
        showAlert('Error loading orphanages', 'error');
    }
}

async function loadMyDonations() {
    try {
        const response = await fetch(`${API_BASE}/donations/my-donations`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const donations = await response.json();
            const list = document.getElementById('donationsList');
            
            if (donations.length === 0) {
                list.innerHTML = '<p class="no-data">No donations yet. Start making an impact!</p>';
                return;
            }
            
            list.innerHTML = donations.map(donation => `
                <div class="donation-item">
                    <div class="donation-header">
                        <h4>${donation.orphanage_name}</h4>
                        <span class="status-badge status-${donation.status}">${donation.status}</span>
                    </div>
                    <div class="donation-details">
                        <div class="detail">
                            <strong>Type:</strong> ${donation.type.replace('_', ' ').toUpperCase()}
                        </div>
                        ${donation.amount ? `<div class="detail"><strong>Amount:</strong> ₹${donation.amount}</div>` : ''}
                        ${donation.description ? `<div class="detail"><strong>Description:</strong> ${donation.description}</div>` : ''}
                        <div class="detail">
                            <strong>Date:</strong> ${formatDate(donation.created_at)}
                        </div>
                    </div>
                    ${donation.status === 'pending' ? `
                        <div class="donation-actions">
                            <button class="btn btn-sm btn-success" onclick="updateDonationStatus(${donation.id}, 'confirmed')">Confirm</button>
                            <button class="btn btn-sm btn-danger" onclick="updateDonationStatus(${donation.id}, 'cancelled')">Cancel</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
            
        } else {
            throw new Error('Failed to load donations');
        }
        
    } catch (error) {
        console.error('Error loading donations:', error);
        document.getElementById('donationsList').innerHTML = '<p class="error">Error loading donations</p>';
    }
}

function selectOrphanage(orphanageId) {
    document.getElementById('orphanageSelect').value = orphanageId;
    showDonationModal();
}

function showDonationModal() {
    document.getElementById('donationModal').style.display = 'block';
}

function closeDonationModal() {
    document.getElementById('donationModal').style.display = 'none';
    document.getElementById('donationForm').reset();
}

function toggleAmountField() {
    const type = document.getElementById('donationType').value;
    const amountGroup = document.getElementById('amountGroup');
    const dateGroup = document.getElementById('dateGroup');
    
    if (type === 'money') {
        amountGroup.style.display = 'block';
        document.getElementById('amount').required = true;
        dateGroup.style.display = 'none';
    } else if (type === 'food_service') {
        amountGroup.style.display = 'none';
        document.getElementById('amount').required = false;
        dateGroup.style.display = 'block';
        document.getElementById('scheduledDate').required = true;
    } else {
        amountGroup.style.display = 'none';
        dateGroup.style.display = 'none';
        document.getElementById('amount').required = false;
        document.getElementById('scheduledDate').required = false;
    }
}

async function handleDonationSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const donationData = {
        orphanage_id: parseInt(formData.get('orphanage_id')),
        type: formData.get('type'),
        description: formData.get('description')
    };
    
    if (formData.get('amount')) {
        donationData.amount = parseFloat(formData.get('amount'));
    }
    
    if (formData.get('scheduled_date')) {
        donationData.scheduled_date = formData.get('scheduled_date');
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        const response = await fetch(`${API_BASE}/donations/create`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(donationData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Donation submitted successfully!', 'success');
            closeDonationModal();
            loadMyDonations();
        } else {
            showAlert(result.message || 'Failed to submit donation', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting donation:', error);
        showAlert('Network error. Please try again.', 'error');
    } finally {
        hideLoading(submitBtn, 'Submit Donation');
    }
}

async function updateDonationStatus(donationId, status) {
    try {
        const response = await fetch(`${API_BASE}/donations/${donationId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showAlert(`Donation ${status} successfully!`, 'success');
            loadMyDonations();
        } else {
            const result = await response.json();
            showAlert(result.message || 'Failed to update donation', 'error');
        }
        
    } catch (error) {
        console.error('Error updating donation:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// Modal click outside to close
window.onclick = function(event) {
    const modal = document.getElementById('donationModal');
    if (event.target === modal) {
        closeDonationModal();
    }
}