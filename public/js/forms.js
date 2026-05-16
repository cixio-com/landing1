// ===== Authentication Forms =====

// Login Form Handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    const formData = {
        email: e.target.email.value,
        password: e.target.password.value,
        rememberMe: e.target.rememberMe?.checked || false
    };
    
    try {
        setLoading(submitBtn, true);
        
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        // Store auth token
        setAuthToken(response.data.token);
        
        // Store user info
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        showNotification('Login successful! Welcome back.', 'success');
        
        // Close modal
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Reset form
        e.target.reset();
        
        // Update UI for logged-in user
        updateAuthUI(true, response.data.user);
        
    } catch (error) {
        showNotification(error.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
        setLoading(submitBtn, false);
    }
});

// Registration Form Handler
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Password validation
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    // Terms acceptance
    if (!e.target.terms.checked) {
        showNotification('Please accept the Terms & Conditions', 'error');
        return;
    }
    
    const formData = {
        firstName: e.target.firstName.value,
        lastName: e.target.lastName.value,
        email: e.target.email.value,
        mobile: e.target.mobile.value || undefined,
        password: password
    };
    
    try {
        setLoading(submitBtn, true);
        
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showNotification('Registration successful! Please check your email to verify your account.', 'success');
        
        // Close modal
        const registerModal = document.getElementById('registerModal');
        if (registerModal) {
            registerModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Reset form
        e.target.reset();
        
        // Show login modal with message
        setTimeout(() => {
            showNotification('Please verify your email before logging in.', 'info');
        }, 1000);
        
    } catch (error) {
        showNotification(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        setLoading(submitBtn, false);
    }
});

// ===== Contact Form Handler =====
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    const formData = {
        name: e.target.name.value,
        email: e.target.email.value,
        phone: e.target.phone?.value || undefined,
        company: e.target.company?.value || undefined,
        subject: e.target.subject.value,
        message: e.target.message.value
    };
    
    try {
        setLoading(submitBtn, true);
        
        const response = await apiRequest('/contacts', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showNotification('Thank you for contacting us! We will get back to you soon.', 'success');
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        showNotification(error.message || 'Failed to submit contact form. Please try again.', 'error');
    } finally {
        setLoading(submitBtn, false);
    }
});

// ===== Newsletter Subscription Handler =====
document.getElementById('newsletterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    const contact = e.target.contact.value;
    
    // Determine if it's email or mobile
    const isEmail = contact.includes('@');
    const formData = isEmail 
        ? { email: contact }
        : { mobile: contact };
    
    try {
        setLoading(submitBtn, true);
        
        const response = await apiRequest('/newsletter/subscribe', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showNotification('Subscription successful! Please check your email/mobile to verify your subscription.', 'success');
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        showNotification(error.message || 'Subscription failed. Please try again.', 'error');
    } finally {
        setLoading(submitBtn, false);
    }
});

// ===== Subscription Plan Selection =====
document.querySelectorAll('.plan-cta').forEach(button => {
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const planCard = button.closest('.pricing-card');
        const planName = planCard.querySelector('.plan-name').textContent;
        const planType = planName.toLowerCase();
        const billingToggle = document.querySelector('#billingToggle');
        const billingCycle = billingToggle?.checked ? 'annually' : 'monthly';
        
        // Check if user is logged in
        const token = getAuthToken();
        if (!token) {
            showNotification('Please login or register to subscribe', 'info');
            const registerModal = document.getElementById('registerModal');
            if (registerModal) {
                registerModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            return;
        }
        
        try {
            setLoading(button, true);
            
            const response = await apiRequest('/subscriptions', {
                method: 'POST',
                body: JSON.stringify({
                    planType,
                    billingCycle,
                    paymentMethod: 'credit_card' // This would come from a payment form
                })
            });
            
            showNotification(`Successfully subscribed to ${planName} plan!`, 'success');
            
            // Redirect to a success page or show subscription details
            // For now, just log the response
            console.log('Subscription created:', response.data);
            
        } catch (error) {
            showNotification(error.message || 'Subscription failed. Please try again.', 'error');
        } finally {
            setLoading(button, false);
        }
    });
});

// ===== Update UI based on authentication state =====
function updateAuthUI(isLoggedIn, user = null) {
    const loginBtn = document.querySelector('.btn-login');
    const registerBtn = document.querySelector('.btn-register');
    
    if (isLoggedIn && user) {
        // Hide login/register buttons
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        
        // Show user menu (you can create a user dropdown menu)
        const userMenu = document.createElement('li');
        userMenu.innerHTML = `
            <a href="#" class="user-profile">
                <i class="fas fa-user-circle"></i>
                ${user.firstName}
            </a>
        `;
        document.querySelector('.nav-menu').appendChild(userMenu);
        
        // Add logout functionality
        const logoutBtn = document.createElement('li');
        logoutBtn.innerHTML = '<a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a>';
        document.querySelector('.nav-menu').appendChild(logoutBtn);
        
        document.getElementById('logoutBtn').addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                await apiRequest('/auth/logout', { method: 'POST' });
            } catch (error) {
                console.error('Logout error:', error);
            }
            
            // Clear local storage
            removeAuthToken();
            localStorage.removeItem('user');
            
            showNotification('Logged out successfully', 'success');
            
            // Reload page to reset UI
            window.location.reload();
        });
    }
}

// Check authentication state on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = getAuthToken();
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            updateAuthUI(true, user);
        } catch (error) {
            console.error('Error parsing user data:', error);
            removeAuthToken();
            localStorage.removeItem('user');
        }
    }
});

// ===== Password strength indicator =====
const passwordInput = document.querySelector('input[name="password"]');
if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = calculatePasswordStrength(password);
        
        // You can add a strength indicator UI here
        console.log('Password strength:', strength);
    });
}

function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return strength;
}

// ===== Real-time form validation =====
function validateEmail(email) {
    // Simple, safe email validation regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateMobile(mobile) {
    return /^[0-9]{10,15}$/.test(mobile);
}

// Add validation to email inputs
document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', (e) => {
        if (e.target.value && !validateEmail(e.target.value)) {
            e.target.setCustomValidity('Please enter a valid email address');
            e.target.reportValidity();
        } else {
            e.target.setCustomValidity('');
        }
    });
});

// ===== Forgot Password Link =====
document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    // Close login modal
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    // Open forgot password modal
    const forgotModal = document.getElementById('forgotPasswordModal');
    if (forgotModal) {
        forgotModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});

// ===== Forgot Password Form Handler =====
document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const email = e.target.email.value;

    try {
        setLoading(submitBtn, true);
        await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        showNotification('Password reset link sent! Please check your inbox.', 'success');
        const forgotModal = document.getElementById('forgotPasswordModal');
        if (forgotModal) {
            forgotModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        e.target.reset();
    } catch (error) {
        showNotification(error.message || 'Failed to send reset link. Please try again.', 'error');
    } finally {
        setLoading(submitBtn, false);
    }
});

// ===== Reset Password Form Handler (token from URL) =====
document.getElementById('resetPasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const newPassword = e.target.newPassword.value;
    const confirmNewPassword = e.target.confirmNewPassword.value;
    const token = e.target.token.value || new URLSearchParams(window.location.search).get('token');

    if (newPassword !== confirmNewPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    if (!token) {
        showNotification('Reset token is missing. Please use the link from your email.', 'error');
        return;
    }

    try {
        setLoading(submitBtn, true);
        await apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword })
        });
        showNotification('Password updated successfully! You can now log in.', 'success');
        e.target.reset();
        // Open login modal
        setTimeout(() => {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            const resetModal = document.getElementById('resetPasswordModal');
            if (resetModal) resetModal.classList.remove('active');
        }, 1500);
    } catch (error) {
        showNotification(error.message || 'Password reset failed. Please try again.', 'error');
    } finally {
        setLoading(submitBtn, false);
    }
});

// ===== Open Reset Password modal if ?token= in URL =====
// ===== Handle SSO callback tokens from URL =====
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('token');
    const ssoToken = params.get('sso_token');
    const ssoError = params.get('sso_error');
    const page = params.get('page');

    // Handle SSO callback with local token
    if (ssoToken) {
        setAuthToken(ssoToken);
        try {
            const payload = JSON.parse(atob(ssoToken.split('.')[1]));
            localStorage.setItem('user', JSON.stringify({
                id: payload.userId,
                email: payload.email,
                role: payload.role || 'user'
            }));
        } catch (_) {}
        showNotification('Signed in with CIXIO SSO successfully!', 'success');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        return;
    }

    // Handle SSO errors
    if (ssoError) {
        const msgs = {
            missing_token: 'SSO login failed: no token received.',
            sso_not_configured: 'SSO is not configured on this server.',
            invalid_token: 'SSO token is invalid or expired. Please try again.',
            invalid_payload: 'SSO token payload is invalid.',
            account_deactivated: 'Your account has been deactivated. Contact support.',
            server_error: 'SSO login failed due to a server error. Please try again.'
        };
        showNotification(msgs[ssoError] || 'SSO login failed.', 'error');
        window.history.replaceState({}, '', window.location.pathname);
        return;
    }

    // Open Reset Password modal if ?token= in URL
    if (resetToken && (page === 'reset-password' || window.location.pathname === '/reset-password')) {
        const tokenInput = document.getElementById('resetToken');
        if (tokenInput) tokenInput.value = resetToken;
        const resetModal = document.getElementById('resetPasswordModal');
        if (resetModal) {
            resetModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
});

// ===== Google / Microsoft — Coming Soon handlers =====
['googleSignIn', 'microsoftSignIn', 'googleSignUp', 'microsoftSignUp'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
        const provider = id.toLowerCase().includes('google') ? 'Google' : 'Microsoft';
        showNotification(`${provider} sign-in is coming soon. Please use email/password or CIXIO SSO.`, 'info');
    });
});

// ===== CIXIO SSO sign-in =====
document.getElementById('cixioSSOSignIn')?.addEventListener('click', () => {
    const ssoModal = document.getElementById('ssoLoginModal');
    if (ssoModal) {
        ssoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});

document.getElementById('ssoRedirectBtn')?.addEventListener('click', () => {
    // SSO OAuth flow: redirect to SSO portal, which redirects back with a token
    // Use dev SSO for dev.cixio.com, prod SSO for cixio.com, local for localhost
    const host = window.location.hostname;
    const ssoBase = host.includes('dev.') ? 'https://sso.dev.cixio.ai'
        : host === 'localhost' ? 'http://localhost:4000'
        : 'https://sso.cixio.ai';
    const returnUrl = encodeURIComponent(window.location.origin + '/api/auth/sso-callback');
    window.location.href = `${ssoBase}/login?redirect_uri=${returnUrl}&app=cixio-com`;
});
