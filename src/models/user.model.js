const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Basic Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    mobile: {
        type: String,
        trim: true,
        match: [/^[0-9]{10,15}$/, 'Please provide a valid mobile number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't return password by default
    },
    
    // Email Verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // Password Reset
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // Account Security
    isActive: {
        type: Boolean,
        default: true
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lockUntil: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    
    // Subscription
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    subscriptionStatus: {
        type: String,
        enum: ['none', 'active', 'cancelled', 'expired'],
        default: 'none'
    },
    
    // Activity Tracking
    lastLogin: Date,
    lastPasswordChange: Date,
    activityLog: [{
        action: String,
        timestamp: { type: Date, default: Date.now },
        ipAddress: String,
        userAgent: String
    }],
    
    // Profile
    company: String,
    phone: String,
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    
    // Preferences
    preferences: {
        newsletter: { type: Boolean, default: true },
        notifications: { type: Boolean, default: true },
        marketingEmails: { type: Boolean, default: false }
    },
    
    // Role
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ subscriptionStatus: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Account lockout settings
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Check if account is locked
userSchema.virtual('isAccountLocked').get(function() {
    return !!(this.isLocked && this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash password if it's modified
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        this.lastPasswordChange = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // Reset attempts if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1, isLocked: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after max attempts
    const needsLock = this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked;
    if (needsLock) {
        updates.$set = { 
            isLocked: true,
            lockUntil: Date.now() + LOCK_TIME 
        };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1, isLocked: 1 }
    });
};

// Method to log activity
userSchema.methods.logActivity = function(action, ipAddress, userAgent) {
    this.activityLog.push({
        action,
        ipAddress,
        userAgent,
        timestamp: new Date()
    });
    
    // Keep only last 50 activities
    if (this.activityLog.length > 50) {
        this.activityLog = this.activityLog.slice(-50);
    }
    
    return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
