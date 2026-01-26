const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {Object} payload - Data to encode in token
 * @param {String} expiresIn - Token expiration time
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = '7d') => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
        issuer: 'cixio-api'
    });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET, {
            issuer: 'cixio-api'
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw error;
    }
};

module.exports = {
    generateToken,
    verifyToken
};
