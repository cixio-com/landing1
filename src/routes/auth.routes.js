const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', authController.resendVerification);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @route   POST /api/auth/sso-login
 * @desc    Exchange a cixio-sso access token for a local JWT
 * @access  Public
 */
router.post('/sso-login', authController.ssoLogin);

/**
 * @route   GET /api/auth/sso-callback
 * @desc    SSO OAuth redirect callback — token in query param, redirects to frontend
 * @access  Public
 */
router.get('/sso-callback', authController.ssoCallback);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private (optional authentication for activity logging)
 */
router.post('/logout', optionalAuth, authController.logout);

module.exports = router;
