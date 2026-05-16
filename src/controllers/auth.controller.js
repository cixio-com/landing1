const crypto = require('crypto');
const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.utils');
const { 
    sendEmail,
    sendVerificationEmail, 
    sendPasswordResetEmail, 
    sendWelcomeEmail 
} = require('../utils/email.utils');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, mobile, company } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: firstName, lastName, email, password'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }
        
        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        
        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            mobile,
            company,
            emailVerificationToken: hashedToken,
            emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });
        
        // Send verification email - background (non-blocking)
        // This ensures the API response is sent quickly, email is sent asynchronously
        sendVerificationEmail(user.email, user.firstName, verificationToken)
            .catch(err => console.error('Background email error (non-blocking):', err.message));
        
        // Send notification to support team - background (non-blocking)
        sendEmail({
            to: process.env.SUPPORT_EMAIL,
            subject: 'New User Registration',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
                        .info-row { margin: 10px 0; }
                        .label { font-weight: bold; color: #4F46E5; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>👤 New User Registration</h1>
                        </div>
                        <div class="content">
                            <p>A new user has registered on the CIXIO platform.</p>
                            
                            <div class="info-box">
                                <h3>User Information:</h3>
                                <div class="info-row"><span class="label">Name:</span> ${firstName} ${lastName}</div>
                                <div class="info-row"><span class="label">Email:</span> ${email}</div>
                                ${mobile ? `<div class="info-row"><span class="label">Mobile:</span> ${mobile}</div>` : ''}
                                ${company ? `<div class="info-row"><span class="label">Company:</span> ${company}</div>` : ''}
                                <div class="info-row"><span class="label">User ID:</span> ${user._id}</div>
                                <div class="info-row"><span class="label">Status:</span> Pending Email Verification</div>
                                <div class="info-row"><span class="label">Registered At:</span> ${new Date().toLocaleString()}</div>
                            </div>
                            
                            <p><strong>Note:</strong> A verification email has been sent to the user.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        })
        .then(() => console.log('✅ Support notification email sent successfully to:', process.env.SUPPORT_EMAIL))
        .catch(err => console.error('❌ Background support notification error (non-blocking):', err.message));
        
        // Log activity
        await user.logActivity('registration', req.ip, req.get('user-agent'));
        
        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            data: {
                userId: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
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
            message: 'Registration failed. Please try again.'
        });
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        // Find user with password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check if account is locked
        if (user.isAccountLocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account is temporarily locked due to multiple failed login attempts. Please try again later.'
            });
        }
        
        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }
        
        // Verify password
        let isPasswordValid = false;
        try {
            isPasswordValid = await user.comparePassword(password);
        } catch (error) {
            console.error('Password comparison error:', error);
            isPasswordValid = false;
        }
        
        if (!isPasswordValid) {
            // Increment login attempts
            await user.incLoginAttempts();
            
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Reset login attempts on successful login
        await user.resetLoginAttempts();
        
        // Update last login
        user.lastLogin = Date.now();
        await user.save();
        
        // Log activity
        await user.logActivity('login', req.ip, req.get('user-agent'));
        
        // Generate JWT token
        const token = generateToken({
            userId: user._id,
            email: user.email,
            role: user.role
        });
        
        // Remove password from response
        user.password = undefined;
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    subscriptionStatus: user.subscriptionStatus
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
};

/**
 * Verify email address
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }
        
        // Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        
        // Find user with valid token
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }
        
        // Update user
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        
        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.firstName);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
        }
        
        // Log activity
        await user.logActivity('email_verified', req.ip, req.get('user-agent'));
        
        res.status(200).json({
            success: true,
            message: 'Email verified successfully. You can now login.'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed. Please try again.'
        });
    }
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }
        
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }
        
        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        
        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();
        
        // Send verification email
        await sendVerificationEmail(user.email, user.firstName, verificationToken);
        
        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully. Please check your inbox.'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend verification email. Please try again.'
        });
    }
};

/**
 * Forgot password - send reset token
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            // Don't reveal if user exists
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link will be sent.'
            });
        }
        
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();
        
        // Send password reset email
        try {
            await sendPasswordResetEmail(user.email, user.firstName, resetToken);
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again.'
            });
        }
        
        // Log activity
        await user.logActivity('password_reset_requested', req.ip, req.get('user-agent'));
        
        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a password reset link will be sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request. Please try again.'
        });
    }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }
        
        // Hash the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        
        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+password');
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired password reset token'
            });
        }
        
        // Update password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.loginAttempts = 0;
        user.isLocked = false;
        user.lockUntil = undefined;
        await user.save();
        
        // Log activity
        await user.logActivity('password_reset', req.ip, req.get('user-agent'));
        
        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed. Please try again.'
        });
    }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        // Log activity if user is authenticated
        if (req.user) {
            await req.user.logActivity('logout', req.ip, req.get('user-agent'));
        }
        
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

/**
 * SSO Login — exchange a cixio-sso access token for a local JWT
 * POST /api/auth/sso-login
 * Body: { token: "<sso_access_token>" }
 *
 * Flow:
 *   1. Verify SSO token with SSO_JWT_SECRET
 *   2. Find or create a local User record for the SSO identity
 *   3. Return a local JWT (same format as /api/auth/login)
 */
const ssoLogin = async (req, res) => {
    try {
        const { token: ssoToken } = req.body;

        if (!ssoToken) {
            return res.status(400).json({ success: false, message: 'SSO token is required' });
        }

        const ssoSecret = process.env.SSO_JWT_SECRET;
        if (!ssoSecret) {
            return res.status(503).json({ success: false, message: 'SSO integration is not configured' });
        }

        let decoded;
        try {
            const jwt = require('jsonwebtoken');
            decoded = jwt.verify(ssoToken, ssoSecret);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired SSO token' });
        }

        if (!decoded.type || decoded.type !== 'access' || !decoded.userId) {
            return res.status(401).json({ success: false, message: 'Invalid SSO token payload' });
        }

        // Find or auto-create local user record for this SSO identity
        let user = await User.findOne({ email: (decoded.email || '').toLowerCase() });

        if (!user && decoded.email) {
            // Auto-provision: create a local shadow user (no password — SSO-only)
            user = await User.create({
                firstName: decoded.firstName || decoded.email.split('@')[0],
                lastName: decoded.lastName || 'User',
                email: decoded.email.toLowerCase(),
                password: crypto.randomBytes(32).toString('hex'), // random — not usable for local login
                isEmailVerified: true,
                isActive: true,
            });
            await user.logActivity('sso_auto_provision', req.ip, req.get('user-agent'));
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'SSO identity could not be resolved to a user' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();
        await user.logActivity('sso_login', req.ip, req.get('user-agent'));

        // Generate local JWT
        const localToken = generateToken({
            userId: user._id,
            email: user.email,
            role: user.role
        });

        res.status(200).json({
            success: true,
            message: 'SSO login successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    subscriptionStatus: user.subscriptionStatus
                },
                token: localToken
            }
        });
    } catch (error) {
        console.error('SSO login error:', error);
        res.status(500).json({ success: false, message: 'SSO login failed. Please try again.' });
    }
};

/**
 * SSO OAuth Callback — GET /api/auth/sso-callback?token=<sso_access_token>
 * Called after the SSO portal redirects back. Exchanges the SSO token for a
 * local JWT and redirects the browser to the frontend with it.
 */
const ssoCallback = async (req, res) => {
    try {
        const ssoToken = req.query.token;
        const frontendUrl = process.env.FRONTEND_URL || 'https://www.cixio.com';

        if (!ssoToken) {
            return res.redirect(`${frontendUrl}?sso_error=missing_token`);
        }

        const ssoSecret = process.env.SSO_JWT_SECRET;
        if (!ssoSecret) {
            return res.redirect(`${frontendUrl}?sso_error=sso_not_configured`);
        }

        let decoded;
        try {
            const jwt = require('jsonwebtoken');
            decoded = jwt.verify(ssoToken, ssoSecret);
        } catch (_err) {
            return res.redirect(`${frontendUrl}?sso_error=invalid_token`);
        }

        if (!decoded.type || decoded.type !== 'access' || !decoded.userId || !decoded.email) {
            return res.redirect(`${frontendUrl}?sso_error=invalid_payload`);
        }

        // Find or auto-provision local user
        let user = await User.findOne({ email: decoded.email.toLowerCase() });
        if (!user) {
            user = await User.create({
                firstName: decoded.firstName || decoded.email.split('@')[0],
                lastName: decoded.lastName || 'User',
                email: decoded.email.toLowerCase(),
                password: crypto.randomBytes(32).toString('hex'),
                isEmailVerified: true,
                isActive: true,
            });
        }

        if (!user.isActive) {
            return res.redirect(`${frontendUrl}?sso_error=account_deactivated`);
        }

        user.lastLogin = Date.now();
        await user.save();

        const localToken = generateToken({ userId: user._id, email: user.email, role: user.role });

        // Redirect to frontend with local token (frontend JS reads it from query)
        return res.redirect(`${frontendUrl}?sso_token=${encodeURIComponent(localToken)}`);
    } catch (error) {
        console.error('SSO callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'https://www.cixio.com';
        return res.redirect(`${frontendUrl}?sso_error=server_error`);
    }
};

module.exports = {
    register,
    login,
    ssoLogin,
    ssoCallback,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout
};
