const User = require('../models/user.model');

/**
 * Get user profile
 * GET /api/users/profile
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -emailVerificationToken -passwordResetToken')
            .populate('subscription');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile'
        });
    }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
    try {
        const { 
            firstName, 
            lastName, 
            mobile, 
            company, 
            phone, 
            address,
            preferences 
        } = req.body;
        
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update allowed fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (mobile !== undefined) user.mobile = mobile;
        if (company !== undefined) user.company = company;
        if (phone !== undefined) user.phone = phone;
        
        if (address) {
            user.address = {
                street: address.street || user.address?.street,
                city: address.city || user.address?.city,
                state: address.state || user.address?.state,
                country: address.country || user.address?.country,
                zipCode: address.zipCode || user.address?.zipCode
            };
        }
        
        if (preferences) {
            user.preferences = {
                newsletter: preferences.newsletter !== undefined ? preferences.newsletter : user.preferences.newsletter,
                notifications: preferences.notifications !== undefined ? preferences.notifications : user.preferences.notifications,
                marketingEmails: preferences.marketingEmails !== undefined ? preferences.marketingEmails : user.preferences.marketingEmails
            };
        }
        
        await user.save();
        
        // Log activity
        await user.logActivity('profile_updated', req.ip, req.get('user-agent'));
        
        // Remove sensitive fields
        const updatedUser = user.toObject();
        delete updatedUser.password;
        delete updatedUser.emailVerificationToken;
        delete updatedUser.passwordResetToken;
        
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

/**
 * Change user password
 * PUT /api/users/change-password
 */
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        // Validate input
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both old password and new password'
            });
        }
        
        // Get user with password field
        const user = await User.findById(req.user._id).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Verify old password
        const isPasswordValid = await user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Validate new password
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long'
            });
        }
        
        // Check if new password is same as old password
        const isSamePassword = await user.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        // Log activity
        await user.logActivity('password_changed', req.ip, req.get('user-agent'));
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

/**
 * Soft delete user account
 * DELETE /api/users/account
 */
const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        
        // Require password confirmation
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password confirmation is required to delete account'
            });
        }
        
        // Get user with password field
        const user = await User.findById(req.user._id).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }
        
        // Soft delete - set isActive to false
        user.isActive = false;
        await user.save();
        
        // Log activity
        await user.logActivity('account_deleted', req.ip, req.get('user-agent'));
        
        res.status(200).json({
            success: true,
            message: 'Account deactivated successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
};

/**
 * Get all users with pagination (Admin only)
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build query
        const query = {};
        
        // Filter by status
        if (req.query.status) {
            query.isActive = req.query.status === 'active';
        }
        
        // Filter by role
        if (req.query.role) {
            query.role = req.query.role;
        }
        
        // Filter by subscription status
        if (req.query.subscriptionStatus) {
            query.subscriptionStatus = req.query.subscriptionStatus;
        }
        
        // Search by name or email
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex }
            ];
        }
        
        // Get users with pagination
        const users = await User.find(query)
            .select('-password -emailVerificationToken -passwordResetToken')
            .populate('subscription')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        // Get total count
        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);
        
        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalUsers,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users'
        });
    }
};

/**
 * Get user by ID (Admin only)
 * GET /api/users/:userId
 */
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId)
            .select('-password -emailVerificationToken -passwordResetToken')
            .populate('subscription');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user'
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getAllUsers,
    getUserById
};
