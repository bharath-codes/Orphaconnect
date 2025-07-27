// Blood Donation JavaScript
document.addEventListener('DOMContentLoaded', function() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    loadBloodRequests();
    loadMyRequests();
    loadMyDonations();
    loadRequestsForDonation();
    
    // Setup form submissions
    document.getElementById('bloodRequestForm').addEventListener('submit', handleRequestSubmit);
    document.getElementById('bloodDonationForm').addEventListener('submit', handleDonationSubmit);
    
    // Set minimum datetime for inputs
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minDateTime = now.toISOString().slice(0, 16);
    document.getElementById('neededBy').min = minDateTime;
    document.getElementById('donationDate').min = minDateTime;
});

async function loadBloodRequests() {
    try {
        const response = await fetch(`${API_BASE}/blood/requests?status=active`);
        const requests = await response.json();
        
        displayBloodRequests(requests, 'bloodRequestsList');
        
    } catch (error) {
        console.error('Error loading blood requests:', error);
        document.getElementById('bloodRequestsList').innerHTML = '<p class="error">Error loading blood requests</p>';
    }
}

async function loadMyRequests() {
    try {
        const response = await fetch(`${API_BASE}/blood/my-requests`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const requests = await response.json();
            displayBloodRequests(requests, 'myRequestsList', true);
        } else {
            throw new Error('Failed to load requests');
        }
        
    } catch (error) {
        console.error('Error loading my requests:', error);
        document.getElementById('myRequestsList').innerHTML = '<p class="error">Error loading your requests</p>';
    }
}

async function loadMyDonations() {
    try {
        const response = await fetch(`${API_BASE}/blood/my-donations`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const donations = await response.json();
            const container = document.getElementById('myDonationsList');
            
            if (donations.length === 0) {
                container.innerHTML = '<p class="no-data">No donations registered yet. Help save lives by donating blood!</p>';
                return;
            }
            
            container.innerHTML = donations.map(donation => `
                <div class="donation-card">
                    <div class="donation-header">
                        <h3>Blood Donation</h3>
                        <span class="status-badge status-${donation.status}">${donation.status}</span>
                    </div>
                    <div class="donation-details">
                        <div class="detail">
                            <i class="fas fa-calendar"></i>
                            <span>Date: ${formatDate(donation.donation_date)}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Location: ${donation.location}</span>
                        </div>
                        ${donation.notes ? `
                            <div class="detail">
                                <i class="fas fa-sticky-note"></i>
                                <span>Notes: ${donation.notes}</span>
                            </div>
                        ` : ''}
                        <div class="detail">
                            <i class="fas fa-clock"></i>
                            <span>Registered: ${formatDate(donation.created_at)}</span>
                        </div>
                    </div>
                    ${donation.status === 'scheduled' ? `
                        <div class="donation-actions">
                            <button class="btn btn-sm btn-success" onclick="updateDonationStatus(${donation.id}, 'completed')">Mark Completed</button>
                            <button class="btn btn-sm btn-danger" onclick="updateDonationStatus(${donation.id}, 'cancelled')">Cancel</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
            
        } else {
            throw new Error('Failed to load donations');
        }
        
    } catch (error) {
        console.error('Error loading my donations:', error);
        document.getElementById('myDonationsList').innerHTML = '<p class="error">Error loading your donations</p>';
    }
}

async function loadRequestsForDonation() {
    try {
        const user = getCurrentUser();
        if (!user.blood_group) return;
        
        const response = await fetch(`${API_BASE}/blood/requests?status=active&blood_group=${user.blood_group}`);
        const requests = await response.json();
        
        const select = document.getElementById('requestSelect');
        select.innerHTML = '<option value="">General donation (not for specific request)</option>' +
            requests.map(request => 
                `<option value="${request.id}">${request.patient_name} - ${request.hospital_name} (${request.urgency})</option>`
            ).join('');
            
    } catch (error) {
        console.error('Error loading requests for donation:', error);
    }
}

function displayBloodRequests(requests, containerId, isMyRequests = false) {
    const container = document.getElementById(containerId);
    
    if (requests.length === 0) {
        container.innerHTML = `<p class="no-data">${isMyRequests ? 'No requests created yet.' : 'No active blood requests at the moment.'}</p>`;
        return;
    }
    
    container.innerHTML = requests.map(request => {
        const timeLeft = getTimeRemaining(request.needed_by);
        const isUrgent = request.urgency === 'critical' || request.urgency === 'high';
        
        return `
            <div class="blood-request-card ${isUrgent ? 'urgent' : ''}">
                <div class="request-header">
                    <div class="patient-info">
                        <h3>${request.patient_name}</h3>
                        <span class="blood-group-badge">${request.blood_group}</span>
                    </div>
                    <div class="urgency-info">
                        <span class="urgency-badge urgency-${request.urgency}">${request.urgency.toUpperCase()}</span>
                        <span class="time-badge">${timeLeft}</span>
                    </div>
                </div>
                
                <div class="request-details">
                    <div class="detail">
                        <i class="fas fa-hospital"></i>
                        <span>${request.hospital_name}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${request.hospital_address}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-tint"></i>
                        <span>${request.units_needed} units needed</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-phone"></i>
                        <span>${request.contact_number}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-clock"></i>
                        <span>Needed by: ${formatDate(request.needed_by)}</span>
                    </div>
                    ${request.description ? `
                        <div class="detail description">
                            <i class="fas fa-info-circle"></i>
                            <span>${request.description}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${!isMyRequests ? `
                    <div class="request-actions">
                        <button class="btn btn-primary" onclick="respondToRequest(${request.id})">
                            <i class="fas fa-hand-holding-medical"></i> I Can Help
                        </button>
                        <button class="btn btn-secondary" onclick="shareRequest(${request.id})">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                ` : `
                    <div class="request-status">
                        <span class="status-badge status-${request.status}">${request.status}</span>
                        <span class="created-date">Created: ${formatDate(request.created_at)}</span>
                    </div>
                `}
            </div>
        `;
    }).join('');
}

async function filterRequests() {
    const bloodGroup = document.getElementById('bloodGroupFilter').value;
    const urgency = document.getElementById('urgencyFilter').value;
    
    let url = `${API_BASE}/blood/requests?status=active`;
    if (bloodGroup) url += `&blood_group=${bloodGroup}`;
    if (urgency) url += `&urgency=${urgency}`;
    
    try {
        const response = await fetch(url);
        const requests = await response.json();
        displayBloodRequests(requests, 'bloodRequestsList');
    } catch (error) {
        console.error('Error filtering requests:', error);
    }
}

function respondToRequest(requestId) {
    document.getElementById('requestSelect').value = requestId;
    showDonationModal();
}

function shareRequest(requestId) {
    // Simple share functionality
    if (navigator.share) {
        navigator.share({
            title: 'Urgent Blood Donation Needed',
            text: 'Someone needs blood donation urgently. Please help if you can donate.',
            url: window.location.href
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showAlert('Link copied to clipboard! Share it to help spread the word.', 'success');
        });
    }
}

function showBloodRequestModal() {
    document.getElementById('bloodRequestModal').style.display = 'block';
}

function closeBloodRequestModal() {
    document.getElementById('bloodRequestModal').style.display = 'none';
    document.getElementById('bloodRequestForm').reset();
}

function showDonationModal() {
    document.getElementById('bloodDonationModal').style.display = 'block';
}

function closeDonationModal() {
    document.getElementById('bloodDonationModal').style.display = 'none';
    document.getElementById('bloodDonationForm').reset();
}

async function handleRequestSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const requestData = {
        patient_name: formData.get('patient_name'),
        blood_group: formData.get('blood_group'),
        units_needed: parseInt(formData.get('units_needed')),
        hospital_name: formData.get('hospital_name'),
        hospital_address: formData.get('hospital_address'),
        contact_number: formData.get('contact_number'),
        urgency: formData.get('urgency'),
        needed_by: formData.get('needed_by'),
        description: formData.get('description')
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        const response = await fetch(`${API_BASE}/blood/requests/create`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Blood request submitted successfully!', 'success');
            closeBloodRequestModal();
            loadMyRequests();
            loadBloodRequests();
        } else {
            showAlert(result.message || 'Failed to submit request', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting request:', error);
        showAlert('Network error. Please try again.', 'error');
    } finally {
        hideLoading(submitBtn, 'Submit Request');
    }
}

async function handleDonationSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const donationData = {
        donation_date: formData.get('donation_date'),
        location: formData.get('location'),
        notes: formData.get('notes')
    };
    
    const requestId = formData.get('request_id');
    if (requestId) {
        donationData.request_id = parseInt(requestId);
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        const response = await fetch(`${API_BASE}/blood/donate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(donationData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Blood donation registered successfully!', 'success');
            closeDonationModal();
            loadMyDonations();
        } else {
            showAlert(result.message || 'Failed to register donation', 'error');
        }
        
    } catch (error) {
        console.error('Error registering donation:', error);
        showAlert('Network error. Please try again.', 'error');
    } finally {
        hideLoading(submitBtn, 'Register Donation');
    }
}

async function updateDonationStatus(donationId, status) {
    try {
        const response = await fetch(`${API_BASE}/blood/donations/${donationId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showAlert(`Donation ${status} successfully!`, 'success');
            loadMyDonations();
        } else {
            const result = await response.json();
            showAlert(result.message || 'Failed to update status', 'error');
        }
        
    } catch (error) {
        console.error('Error updating donation status:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

function getTimeRemaining(neededBy) {
    const now = new Date().getTime();
    const needed = new Date(neededBy).getTime();
    const total = needed - now;
    
    if (total <= 0) {
        return 'Overdue';
    }
    
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
        return `${days}d ${hours}h left`;
    } else if (hours > 0) {
        return `${hours}h left`;
    } else {
        const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes}m left`;
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
    const requestModal = document.getElementById('bloodRequestModal');
    const donationModal = document.getElementById('bloodDonationModal');
    
    if (event.target === requestModal) {
        closeBloodRequestModal();
    }
    if (event.target === donationModal) {
        closeDonationModal();
    }
}

// Auto refresh requests every 2 minutes
setInterval(loadBloodRequests, 120000);