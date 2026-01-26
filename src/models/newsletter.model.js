const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    // Contact Information
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    mobile: {
        type: String,
        trim: true,
        match: [/^[0-9]{10,15}$/, 'Please provide a valid mobile number']
    },
    
    // Type of subscription
    contactType: {
        type: String,
        enum: ['email', 'mobile', 'both'],
        required: true
    },
    
    // Verification (Double opt-in)
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationExpires: Date,
    verifiedAt: Date,
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'active', 'unsubscribed', 'bounced', 'complained'],
        default: 'pending'
    },
    
    // Subscription Details
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    unsubscribedAt: Date,
    
    // Preferences
    preferences: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'weekly'
        },
        categories: [{
            type: String,
            enum: ['product_updates', 'company_news', 'blog_posts', 'promotions', 'events', 'all']
        }],
        format: {
            type: String,
            enum: ['html', 'text'],
            default: 'html'
        }
    },
    
    // Engagement Metrics
    metrics: {
        totalEmailsSent: { type: Number, default: 0 },
        totalEmailsOpened: { type: Number, default: 0 },
        totalLinksClicked: { type: Number, default: 0 },
        lastEmailSent: Date,
        lastEmailOpened: Date,
        lastLinkClicked: Date,
        engagementScore: { type: Number, default: 0 }
    },
    
    // Email Activity History
    emailActivity: [{
        campaignId: String,
        subject: String,
        sentAt: { type: Date, default: Date.now },
        opened: { type: Boolean, default: false },
        openedAt: Date,
        clicked: { type: Boolean, default: false },
        clickedAt: Date,
        bounced: { type: Boolean, default: false },
        bouncedReason: String
    }],
    
    // Source
    source: {
        type: String,
        enum: ['website', 'landing_page', 'api', 'import', 'manual', 'other'],
        default: 'website'
    },
    sourceUrl: String,
    referrer: String,
    
    // User Information (if linked to registered user)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Additional Info
    name: String,
    company: String,
    interests: [String],
    
    // Metadata
    ipAddress: String,
    userAgent: String,
    language: String,
    timezone: String,
    country: String,
    
    // Bounce Information
    bounceCount: { type: Number, default: 0 },
    lastBounceDate: Date,
    bounceType: {
        type: String,
        enum: ['hard', 'soft', 'none'],
        default: 'none'
    },
    
    // Complaint Information
    complaintDate: Date,
    complaintReason: String,
    
    // Unsubscribe Information
    unsubscribeToken: String,
    unsubscribeReason: String,
    unsubscribeFeedback: String,
    
    // Tags & Segments
    tags: [String],
    segments: [String],
    
    // Notes
    notes: String,
    
    // Custom Fields
    customFields: {
        type: Map,
        of: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
newsletterSchema.index({ email: 1 }, { unique: true, sparse: true });
newsletterSchema.index({ mobile: 1 }, { unique: true, sparse: true });
newsletterSchema.index({ status: 1 });
newsletterSchema.index({ isVerified: 1 });
newsletterSchema.index({ createdAt: -1 });
newsletterSchema.index({ 'metrics.engagementScore': -1 });

// Compound index for email and mobile (at least one must be provided)
newsletterSchema.index({ email: 1, mobile: 1 });

// Virtual for engagement rate
newsletterSchema.virtual('engagementRate').get(function() {
    if (this.metrics.totalEmailsSent === 0) return 0;
    return ((this.metrics.totalEmailsOpened / this.metrics.totalEmailsSent) * 100).toFixed(2);
});

// Virtual for click rate
newsletterSchema.virtual('clickRate').get(function() {
    if (this.metrics.totalEmailsOpened === 0) return 0;
    return ((this.metrics.totalLinksClicked / this.metrics.totalEmailsOpened) * 100).toFixed(2);
});

// Pre-save validation to ensure at least one contact method
newsletterSchema.pre('save', function(next) {
    if (!this.email && !this.mobile) {
        next(new Error('Either email or mobile number must be provided'));
    }
    
    // Set contact type based on what's provided
    if (this.email && this.mobile) {
        this.contactType = 'both';
    } else if (this.email) {
        this.contactType = 'email';
    } else if (this.mobile) {
        this.contactType = 'mobile';
    }
    
    next();
});

// Method to record email sent
newsletterSchema.methods.recordEmailSent = function(campaignId, subject) {
    this.metrics.totalEmailsSent += 1;
    this.metrics.lastEmailSent = new Date();
    
    this.emailActivity.push({
        campaignId,
        subject,
        sentAt: new Date()
    });
    
    // Keep only last 100 email activities
    if (this.emailActivity.length > 100) {
        this.emailActivity = this.emailActivity.slice(-100);
    }
    
    return this.save();
};

// Method to record email opened
newsletterSchema.methods.recordEmailOpened = function(campaignId) {
    this.metrics.totalEmailsOpened += 1;
    this.metrics.lastEmailOpened = new Date();
    
    const activity = this.emailActivity.find(a => a.campaignId === campaignId);
    if (activity) {
        activity.opened = true;
        activity.openedAt = new Date();
    }
    
    this.updateEngagementScore();
    return this.save();
};

// Method to record link clicked
newsletterSchema.methods.recordLinkClicked = function(campaignId) {
    this.metrics.totalLinksClicked += 1;
    this.metrics.lastLinkClicked = new Date();
    
    const activity = this.emailActivity.find(a => a.campaignId === campaignId);
    if (activity) {
        activity.clicked = true;
        activity.clickedAt = new Date();
    }
    
    this.updateEngagementScore();
    return this.save();
};

// Method to update engagement score
newsletterSchema.methods.updateEngagementScore = function() {
    const openRate = this.metrics.totalEmailsSent > 0 
        ? (this.metrics.totalEmailsOpened / this.metrics.totalEmailsSent) * 100 
        : 0;
    const clickRate = this.metrics.totalEmailsOpened > 0 
        ? (this.metrics.totalLinksClicked / this.metrics.totalEmailsOpened) * 100 
        : 0;
    
    // Engagement score: weighted average of open rate and click rate
    this.metrics.engagementScore = Math.round((openRate * 0.6) + (clickRate * 0.4));
};

// Method to record bounce
newsletterSchema.methods.recordBounce = function(bounceType, reason) {
    this.bounceCount += 1;
    this.lastBounceDate = new Date();
    this.bounceType = bounceType;
    
    // Auto-unsubscribe after 3 hard bounces
    if (bounceType === 'hard' && this.bounceCount >= 3) {
        this.status = 'bounced';
    }
    
    return this.save();
};

// Method to unsubscribe
newsletterSchema.methods.unsubscribe = function(reason, feedback) {
    this.status = 'unsubscribed';
    this.unsubscribedAt = new Date();
    this.unsubscribeReason = reason;
    this.unsubscribeFeedback = feedback;
    return this.save();
};

// Method to verify subscription
newsletterSchema.methods.verify = function() {
    this.isVerified = true;
    this.verifiedAt = new Date();
    this.status = 'active';
    this.verificationToken = undefined;
    this.verificationExpires = undefined;
    return this.save();
};

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = Newsletter;
