// ===== Navigation Functionality =====
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

// Mobile navigation toggle
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    
    // Animate hamburger icon
    const spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = navMenu.classList.contains('active') ? 'rotate(-45deg) translate(-5px, 6px)' : '';
    spans[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
    spans[2].style.transform = navMenu.classList.contains('active') ? 'rotate(45deg) translate(-5px, -6px)' : '';
});

// Close mobile menu when clicking on a link
navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        // Only close for non-modal links
        if (!link.hasAttribute('data-modal')) {
            navMenu.classList.remove('active');
            const spans = navToggle.querySelectorAll('span');
            spans[0].style.transform = '';
            spans[1].style.opacity = '1';
            spans[2].style.transform = '';
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && !this.hasAttribute('data-modal')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ===== Modal Functionality =====
const modals = {
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal')
};

// Open modal
document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = trigger.getAttribute('data-modal');
        if (modals[modalId]) {
            // Close all modals first
            Object.values(modals).forEach(modal => modal.classList.remove('active'));
            // Open the target modal
            modals[modalId].classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
});

// Close modal
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        Object.values(modals).forEach(modal => modal.classList.remove('active'));
        document.body.style.overflow = '';
    });
});

// Close modal when clicking outside
Object.values(modals).forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        Object.values(modals).forEach(modal => modal.classList.remove('active'));
        document.body.style.overflow = '';
    }
});

// ===== Success Message Functionality =====
function showSuccessMessage(message, duration = 3000) {
    const successMsg = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    
    successText.textContent = message;
    successMsg.classList.add('show');
    
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, duration);
}

// ===== Form Validation Utilities =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return phone.length >= 10 && re.test(phone);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
}

function isEmailOrPhone(input) {
    return validateEmail(input) || validatePhone(input);
}

// ===== Contact Form =====
// Contact form is handled by forms.js (real API integration)
// Handler removed from main.js to avoid duplicate submission and simulateApiCall conflicts

// ===== Subscribe Form =====
const subscribeForm = document.getElementById('subscribeForm');

subscribeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const input = document.getElementById('subscribeInput').value;
    
    // Validate email or phone
    if (!isEmailOrPhone(input)) {
        alert('Please enter a valid email address or mobile number');
        return;
    }
    
    // Determine if input is email or mobile
    const isEmail = validateEmail(input);
    
    const subscriptionData = {
        email: isEmail ? input : null,
        mobile: isEmail ? null : input,
        source: 'website',
        sourceUrl: window.location.href
    };
    
    console.log('Newsletter Subscription:', subscriptionData);
    
    try {
        const response = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscriptionData)
        });
        
        const data = await response.json();
        
        console.log('API Response:', data); // Debug log
        
        if (response.ok && data.success) {
            // Show success message (handles both new subscription and already subscribed)
            showSuccessMessage(data.message || 'Successfully subscribed to our newsletter!');
            subscribeForm.reset();
        } else {
            // Handle actual errors
            const errorMessage = data.message || 'Error subscribing to newsletter. Please try again.';
            console.error('Subscription error:', errorMessage, data);
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Network/Fetch Error:', error);
        alert('Sorry, there was an error processing your subscription. Please check your internet connection and try again.');
    }
});

// ===== Login Form =====
// Login form is handled by forms.js (API-based handler)

// ===== Register Form =====
// Register form is handled by forms.js (API-based handler)

// ===== Commented out FT and PT pricing in the UI =====
const pricingCards = document.querySelectorAll('.pricing-card');
pricingCards.forEach(card => {
    const pricingFeatures = card.querySelector('.pricing-features');
    if (pricingFeatures) {
        const ftPtPricing = pricingFeatures.querySelectorAll('li');
        ftPtPricing.forEach(feature => {
            if (feature.textContent.includes('FT:') || feature.textContent.includes('PT:')) {
                feature.style.display = 'none'; // Hide FT and PT pricing
            }
        });
    }
});

// ===== Utility Functions =====
function simulateApiCall(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

// ===== Scroll Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-card, .product-card, .feature-card, .pricing-card, .about-item, .info-card, .stat-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===== Update Current Year in Footer =====
const currentYear = new Date().getFullYear();
const footerYearText = document.querySelector('.footer-bottom p:first-child');
if (footerYearText) {
    footerYearText.textContent = `© ${currentYear} CIXIO. All rights reserved.`;
}

// ===== Console Welcome Message =====
console.log('%c🚀 Welcome to CIXIO!', 'color: #6366f1; font-size: 20px; font-weight: bold;');
console.log('%cAdvanced AI Software Solutions', 'color: #ec4899; font-size: 14px;');
console.log('%cBuilt with ❤️ using modern web technologies', 'color: #666; font-size: 12px;');

// ===== Performance Logging (Development) =====
window.addEventListener('load', () => {
    const pageLoadTime = Math.round(performance.now());
    console.log(`Page loaded in ${pageLoadTime}ms`);
});

// ===== Local Storage for Form Data (Optional Enhancement) =====
function saveFormData(formId, data) {
    try {
        localStorage.setItem(`cixio_${formId}`, JSON.stringify(data));
    } catch (e) {
        console.error('LocalStorage error:', e);
    }
}

function getFormData(formId) {
    try {
        const data = localStorage.getItem(`cixio_${formId}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('LocalStorage error:', e);
        return null;
    }
}

// ===== Initialize =====
console.log('CIXIO Landing Page initialized successfully');

// Auto-open login modal if redirected from verify-email page
(function() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'login' && modals.loginModal) {
        modals.loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Clean up the URL
        window.history.replaceState({}, '', '/');
    }
})();

// ===== Cookie Consent =====
const cookieBanner = document.getElementById('cookieBanner');
if (cookieBanner && !localStorage.getItem('cookie_consent')) {
    setTimeout(() => cookieBanner.classList.add('visible'), 1800);
}
document.getElementById('cookieAccept')?.addEventListener('click', () => {
    localStorage.setItem('cookie_consent', 'accepted');
    cookieBanner?.classList.remove('visible');
});
document.getElementById('cookieDismiss')?.addEventListener('click', () => {
    localStorage.setItem('cookie_consent', 'declined');
    cookieBanner?.classList.remove('visible');
});
