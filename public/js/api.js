// ===== API Configuration =====
const API_CONFIG = {
    baseURL: window.location.origin + '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Set auth token
const setAuthToken = (token) => localStorage.setItem('authToken', token);

// Remove auth token
const removeAuthToken = () => localStorage.removeItem('authToken');

// API request wrapper
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const token = getAuthToken();
    
    const config = {
        ...options,
        headers: {
            ...API_CONFIG.headers,
            ...options.headers,
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            const errorMsg = (data.errors && data.errors.length)
                ? data.errors.join('. ')
                : (data.message || 'Request failed');
            throw new Error(errorMsg);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const iconMap = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle', warning: 'exclamation-triangle' };
    const icon = iconMap[type] || 'info-circle';

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Show loading state
function setLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}
