const express = require('express');
const router = express.Router();
const {
    subscribe,
    verifySubscription,
    unsubscribe,
    resendVerification,
    getAllSubscribers,
    getSubscriberById,
    updateSubscriberPreferences,
    deleteSubscriber,
    sendNewsletter
} = require('../controllers/newsletter.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Public routes
/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe to newsletter (double opt-in)
 * @access  Public
 */
router.post('/subscribe', subscribe);

/**
 * @route   GET /api/newsletter/verify/:token
 * @desc    Verify newsletter subscription with token
 * @access  Public
 */
router.get('/verify/:token', verifySubscription);

/**
 * @route   POST /api/newsletter/unsubscribe
 * @desc    Unsubscribe from newsletter
 * @access  Public
 */
router.post('/unsubscribe', unsubscribe);

/**
 * @route   POST /api/newsletter/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', resendVerification);

// Admin routes - require authentication and admin role
/**
 * @route   GET /api/newsletter/subscribers
 * @desc    Get all subscribers with filters and pagination
 * @access  Admin only
 */
router.get('/subscribers', authenticate, authorize('admin', 'superadmin'), getAllSubscribers);

/**
 * @route   GET /api/newsletter/subscribers/:id
 * @desc    Get specific subscriber by ID
 * @access  Admin only
 */
router.get('/subscribers/:id', authenticate, authorize('admin', 'superadmin'), getSubscriberById);

/**
 * @route   PUT /api/newsletter/subscribers/:id
 * @desc    Update subscriber preferences
 * @access  Admin only
 */
router.put('/subscribers/:id', authenticate, authorize('admin', 'superadmin'), updateSubscriberPreferences);

/**
 * @route   DELETE /api/newsletter/subscribers/:id
 * @desc    Delete subscriber
 * @access  Admin only
 */
router.delete('/subscribers/:id', authenticate, authorize('admin', 'superadmin'), deleteSubscriber);

/**
 * @route   POST /api/newsletter/send
 * @desc    Send newsletter to active subscribers
 * @access  Admin only
 */
router.post('/send', authenticate, authorize('admin', 'superadmin'), sendNewsletter);

module.exports = router;
