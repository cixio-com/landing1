const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const subscriptionRoutes = require('./src/routes/subscription.routes');
const contactRoutes = require('./src/routes/contact.routes');
const newsletterRoutes = require('./src/routes/newsletter.routes');

// Initialize Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxies like Heroku)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
        'http://localhost:8000',
        'http://localhost:3000',
        'http://localhost',
        'https://www.cixio.com',
        'https://cixio.com',
        'https://www.cixio.ai',
        'https://cixio.ai',
        'https://www.cixio.io',
        'https://cixio.io',
        'https://www.cixio.in',
        'https://cixio.in'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 requests per 15 minutes (20 per minute)
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health';
    }
});
app.use('/api/', limiter);

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Allow 30 auth attempts per 15 minutes (2 per minute on average)
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
    }
});

// Rate limiting for static files (generous limit)
const staticLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // More generous for static assets
    message: 'Too many requests for static files.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Add cache headers for static assets
        if (path.endsWith('.css') || path.endsWith('.js') || path.endsWith('.svg')) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        }
    }
}));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'CIXIO API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve index.html for all other routes (SPA support) - with rate limiting
app.get('*', staticLimiter, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cixio';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

// Start server
const PORT = process.env.PORT || 80;
const server = app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('🚀 CIXIO API Server Started Successfully');
    console.log('='.repeat(60));
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Port: ${PORT}`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   API Base: http://localhost:${PORT}/api`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(60));
    console.log('');
});

module.exports = app;
