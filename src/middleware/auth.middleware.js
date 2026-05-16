const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt.utils');
const User = require('../models/user.model');

/**
 * Authenticate user using JWT token.
 *
 * Priority:
 *   1. Try cixio-sso shared secret (SSO_JWT_SECRET) — tokens issued by sso.cixio.ai.
 *      SSO tokens carry { userId, email, type: 'access' }.
 *      No DB lookup on SSO path — verified offline via shared secret.
 *   2. Fall back to this service's own JWT_SECRET — tokens issued by /api/auth/login.
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // ── 1. Try SSO JWT (shared secret, no issuer restriction) ────────────
        const ssoSecret = process.env.SSO_JWT_SECRET;
        if (ssoSecret) {
            try {
                const decoded = jwt.verify(token, ssoSecret);
                if (decoded.type === 'access' && decoded.userId) {
                    req.user = {
                        _id: decoded.userId,
                        id: decoded.userId,
                        email: decoded.email || null,
                        role: decoded.role || 'user',
                        isActive: true,
                        isAccountLocked: false,
                        _ssoAuthenticated: true,
                    };
                    req.userId = decoded.userId;
                    return next();
                }
            } catch (_ssoErr) {
                // Not a valid SSO token — fall through to local JWT
            }
        }

        // ── 2. Fall back to local JWT ─────────────────────────────────────
        // Verify token
        const decoded = verifyToken(token);
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }
        
        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated.'
            });
        }
        
        // Check if account is locked
        if (user.isAccountLocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account is locked. Please try again later.'
            });
        }
        
        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.message === 'Token has expired') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.'
            });
        }
        
        if (error.message === 'Invalid token') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Authentication failed.'
        });
    }
};

/**
 * Authorize user based on roles
 * @param  {...String} allowedRoles - Roles allowed to access route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource.'
            });
        }
        
        next();
    };
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't fail if missing.
 * Supports both SSO tokens and local tokens.
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        
        const token = authHeader.substring(7);

        // Try SSO token first
        const ssoSecret = process.env.SSO_JWT_SECRET;
        if (ssoSecret) {
            try {
                const decoded = jwt.verify(token, ssoSecret);
                if (decoded.type === 'access' && decoded.userId) {
                    req.user = {
                        _id: decoded.userId,
                        id: decoded.userId,
                        email: decoded.email || null,
                        role: decoded.role || 'user',
                        isActive: true,
                        _ssoAuthenticated: true,
                    };
                    return next();
                }
            } catch (_ssoErr) {
                // Fall through
            }
        }

        // Try local JWT
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive && !user.isAccountLocked) {
            req.user = user;
        }
        
        next();
    } catch (error) {
        // Silent fail for optional auth
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    optionalAuth
};
