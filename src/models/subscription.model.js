const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    // User Reference
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Plan Details
    planName: {
        type: String,
        required: true,
        enum: ['Starter', 'Professional', 'Enterprise']
    },
    planType: {
        type: String,
        required: true,
        enum: ['starter', 'professional', 'enterprise']
    },
    
    // Billing
    billingCycle: {
        type: String,
        required: true,
        enum: ['monthly', 'annually'],
        default: 'monthly'
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'suspended', 'trial'],
        default: 'active'
    },
    
    // Dates
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    nextBillingDate: Date,
    cancelledAt: Date,
    
    // Auto-renewal
    autoRenew: {
        type: Boolean,
        default: true
    },
    
    // Features (based on plan)
    features: {
        users: {
            type: Number,
            required: true
        },
        storage: {
            type: String,
            required: true
        },
        apiCalls: {
            type: String,
            required: true
        },
        support: {
            type: String,
            required: true
        },
        customIntegration: {
            type: Boolean,
            default: false
        },
        advancedAnalytics: {
            type: Boolean,
            default: false
        },
        prioritySupport: {
            type: Boolean,
            default: false
        },
        dedicatedManager: {
            type: Boolean,
            default: false
        },
        sla: {
            type: String,
            default: 'Standard'
        }
    },
    
    // Payment Information
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'other'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    lastPaymentDate: Date,
    lastPaymentAmount: Number,
    
    // Payment History
    paymentHistory: [{
        date: { type: Date, default: Date.now },
        amount: Number,
        status: String,
        transactionId: String,
        method: String,
        invoiceUrl: String
    }],
    
    // Usage Tracking
    usage: {
        apiCallsUsed: { type: Number, default: 0 },
        storageUsed: { type: Number, default: 0 },
        lastUpdated: Date
    },
    
    // Trial Information
    isTrial: {
        type: Boolean,
        default: false
    },
    trialEndDate: Date,
    
    // Cancellation
    cancellationReason: String,
    cancellationFeedback: String,
    
    // Notes
    notes: String,
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ planType: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
});

// Virtual for is active
subscriptionSchema.virtual('isActive').get(function() {
    return this.status === 'active' && new Date() < new Date(this.endDate);
});

// Pre-save hook to calculate end date
subscriptionSchema.pre('save', function(next) {
    if (this.isNew || this.isModified('startDate') || this.isModified('billingCycle')) {
        const start = new Date(this.startDate);
        
        if (this.billingCycle === 'monthly') {
            this.endDate = new Date(start.setMonth(start.getMonth() + 1));
            this.nextBillingDate = this.autoRenew ? this.endDate : null;
        } else if (this.billingCycle === 'annually') {
            this.endDate = new Date(start.setFullYear(start.getFullYear() + 1));
            this.nextBillingDate = this.autoRenew ? this.endDate : null;
        }
    }
    next();
});

// Method to add payment record
subscriptionSchema.methods.addPayment = function(amount, status, transactionId, method, invoiceUrl) {
    this.paymentHistory.push({
        date: new Date(),
        amount,
        status,
        transactionId,
        method,
        invoiceUrl
    });
    
    if (status === 'paid') {
        this.lastPaymentDate = new Date();
        this.lastPaymentAmount = amount;
        this.paymentStatus = 'paid';
    }
    
    return this.save();
};

// Method to cancel subscription
subscriptionSchema.methods.cancel = function(reason, feedback) {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.autoRenew = false;
    this.cancellationReason = reason;
    this.cancellationFeedback = feedback;
    return this.save();
};

// Method to renew subscription
subscriptionSchema.methods.renew = function() {
    const start = new Date();
    this.startDate = start;
    this.status = 'active';
    
    if (this.billingCycle === 'monthly') {
        this.endDate = new Date(start.setMonth(start.getMonth() + 1));
    } else if (this.billingCycle === 'annually') {
        this.endDate = new Date(start.setFullYear(start.getFullYear() + 1));
    }
    
    this.nextBillingDate = this.autoRenew ? this.endDate : null;
    return this.save();
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
