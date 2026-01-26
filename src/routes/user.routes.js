const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getAllUsers,
    getUserById
} = require('../controllers/user.controller');

/**
 * User Profile Routes
 * All routes require authentication
 */

// Get current user profile
router.get('/profile', authenticate, getProfile);

// Update current user profile
router.put('/profile', authenticate, updateProfile);

// Change password
router.put('/change-password', authenticate, changePassword);

// Delete account (soft delete)
router.delete('/account', authenticate, deleteAccount);

/**
 * Admin Routes
 * Require authentication and admin role
 */

// Get all users with pagination (Admin only)
router.get('/', authenticate, authorize('admin'), getAllUsers);

// Get specific user by ID (Admin only)
router.get('/:userId', authenticate, authorize('admin'), getUserById);

module.exports = router;
