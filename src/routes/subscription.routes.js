const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
    getPlans,
    createSubscription,
    getUserSubscriptions,
    getSubscriptionById,
    updateSubscription,
    cancelSubscription,
    renewSubscription,
    getSubscriptionUsage
} = require('../controllers/subscription.controller');

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get all available subscription plans
 * @access  Public
 */
router.get('/plans', getPlans);

/**
 * @route   POST /api/subscriptions
 * @desc    Create new subscription for authenticated user
 * @access  Private
 */
router.post('/', authenticate, createSubscription);

/**
 * @route   GET /api/subscriptions
 * @desc    Get user's subscriptions
 * @access  Private
 */
router.get('/', authenticate, getUserSubscriptions);

/**
 * @route   GET /api/subscriptions/:id
 * @desc    Get specific subscription details
 * @access  Private
 */
router.get('/:id', authenticate, getSubscriptionById);

/**
 * @route   PUT /api/subscriptions/:id
 * @desc    Update subscription (change plan, billing cycle)
 * @access  Private
 */
router.put('/:id', authenticate, updateSubscription);

/**
 * @route   POST /api/subscriptions/:id/cancel
 * @desc    Cancel subscription with reason
 * @access  Private
 */
router.post('/:id/cancel', authenticate, cancelSubscription);

/**
 * @route   POST /api/subscriptions/:id/renew
 * @desc    Renew subscription
 * @access  Private
 */
router.post('/:id/renew', authenticate, renewSubscription);

/**
 * @route   GET /api/subscriptions/:id/usage
 * @desc    Get subscription usage statistics
 * @access  Private
 */
router.get('/:id/usage', authenticate, getSubscriptionUsage);

module.exports = router;
