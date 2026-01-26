const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    // Contact Information
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    
    // Message Details
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        minlength: [10, 'Message must be at least 10 characters'],
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    
    // Status Tracking
    status: {
        type: String,
        enum: ['new', 'in_progress', 'resolved', 'closed', 'spam'],
        default: 'new'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedAt: Date,
    
    // Response
    response: {
        message: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    },
    
    // Communication History
    communications: [{
        message: String,
        sender: {
            type: String,
            enum: ['user', 'admin']
        },
        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: { type: Date, default: Date.now },
        emailSent: { type: Boolean, default: false }
    }],
    
    // Metadata
    source: {
        type: String,
        enum: ['website', 'email', 'phone', 'chat', 'other'],
        default: 'website'
    },
    ipAddress: String,
    userAgent: String,
    referrer: String,
    
    // Follow-up
    followUpRequired: {
        type: Boolean,
        default: false
    },
    followUpDate: Date,
    
    // Tags & Categories
    tags: [String],
    category: {
        type: String,
        enum: ['general', 'sales', 'support', 'technical', 'billing', 'partnership', 'other'],
        default: 'general'
    },
    
    // Internal Notes
    internalNotes: [{
        note: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: { type: Date, default: Date.now }
    }],
    
    // Resolution
    resolvedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolutionNotes: String,
    
    // Customer Satisfaction
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    feedback: String,
    
    // Flags
    isRead: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isImportant: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ priority: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ assignedTo: 1 });
contactSchema.index({ category: 1 });

// Virtual for response time
contactSchema.virtual('responseTime').get(function() {
    if (this.response && this.response.respondedAt) {
        const diffTime = this.response.respondedAt - this.createdAt;
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        return `${diffHours} hours`;
    }
    return null;
});

// Pre-save hook to auto-set priority based on keywords
contactSchema.pre('save', function(next) {
    if (this.isNew) {
        const urgentKeywords = ['urgent', 'emergency', 'critical', 'asap', 'immediately'];
        const highKeywords = ['important', 'priority', 'soon'];
        
        const combinedText = `${this.subject} ${this.message}`.toLowerCase();
        
        if (urgentKeywords.some(keyword => combinedText.includes(keyword))) {
            this.priority = 'urgent';
        } else if (highKeywords.some(keyword => combinedText.includes(keyword))) {
            this.priority = 'high';
        }
    }
    next();
});

// Method to add communication
contactSchema.methods.addCommunication = function(message, sender, sentBy, emailSent = false) {
    this.communications.push({
        message,
        sender,
        sentBy,
        timestamp: new Date(),
        emailSent
    });
    return this.save();
};

// Method to add internal note
contactSchema.methods.addInternalNote = function(note, addedBy) {
    this.internalNotes.push({
        note,
        addedBy,
        addedAt: new Date()
    });
    return this.save();
};

// Method to assign contact
contactSchema.methods.assign = function(userId) {
    this.assignedTo = userId;
    this.assignedAt = new Date();
    this.status = 'in_progress';
    return this.save();
};

// Method to resolve contact
contactSchema.methods.resolve = function(resolvedBy, resolutionNotes) {
    this.status = 'resolved';
    this.resolvedAt = new Date();
    this.resolvedBy = resolvedBy;
    this.resolutionNotes = resolutionNotes;
    return this.save();
};

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
