const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create nodemailer transporter with timeout
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: parseInt(process.env.EMAIL_PORT) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000,  // 10 second connection timeout
        socketTimeout: 10000,      // 10 second socket timeout
        greetingTimeout: 5000,     // 5 second greeting timeout
        tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
            ciphers: 'SSLv3'
        }
    });
};

/**
 * Verify SMTP connection on startup
 * @returns {Boolean} True if connection is successful
 */
const verifyEmailConnection = async () => {
    try {
        if (!isEmailConfigured()) {
            console.warn('⚠️  Email not configured - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, or EMAIL_PASS missing');
            return false;
        }

        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
        console.log(`📧 Email service ready: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
        console.log(`📤 Sending from: ${process.env.EMAIL_FROM}`);
        return true;
    } catch (error) {
        console.error('❌ SMTP connection failed:', error.message);
        console.error('   Please check your email configuration in .env file');
        return false;
    }
};

/**
 * Load email template from file
 * @param {String} templateName - Name of the template file
 * @param {Object} variables - Variables to replace in template
 * @returns {String} Processed template content
 */
const loadTemplate = async (templateName, variables = {}) => {
    try {
        const templatePath = path.join(__dirname, '..', 'emails', `${templateName}.html`);
        let template = await fs.readFile(templatePath, 'utf-8');
        
        // Replace variables in template
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, variables[key]);
        });
        
        return template;
    } catch (error) {
        console.error(`Error loading template ${templateName}:`, error);
        throw new Error('Failed to load email template');
    }
};

/**
 * Check if email is properly configured
 * @returns {Boolean} True if email configuration exists
 */
const isEmailConfigured = () => {
    return !!(process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

/**
 * Send email - with timeout and error handling
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email address
 * @param {String} options.subject - Email subject
 * @param {String} options.html - HTML content
 * @param {String} options.text - Plain text content (optional)
 * @returns {Object} Email send result
 */
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        // If email is not configured, log warning but don't fail
        if (!isEmailConfigured()) {
            console.warn(`📧 Email not configured. Would send to: ${to}`);
            console.warn(`   Subject: ${subject}`);
            return { success: true, message: 'Email logging mode (not sent - no SMTP config)' };
        }

        const transporter = createTransporter();
        
        // Set a hard timeout for email sending (10 seconds max)
        const emailPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Email send timeout - SMTP server not responding'));
            }, 10000);

            const mailOptions = {
                from: process.env.EMAIL_FROM || `${process.env.EMAIL_FROM_NAME || 'CIXIO'} <${process.env.EMAIL_FROM_ADDRESS || 'noreply@cixio.com'}>`,
                to,
                subject,
                html
            };
            
            if (text) {
                mailOptions.text = text;
            }
            
            transporter.sendMail(mailOptions, (error, info) => {
                clearTimeout(timeout);
                if (error) {
                    reject(error);
                } else {
                    resolve(info);
                }
            });
        });

        const info = await emailPromise;
        console.log('✅ Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        // Don't throw - just log and return. Email is non-critical for API flow.
        return { success: false, message: `Email error: ${error.message}`, error };
    }
};

/**
 * Send verification email
 * @param {String} email - Recipient email
 * @param {String} firstName - User's first name
 * @param {String} verificationToken - Email verification token
 */
const sendVerificationEmail = async (email, firstName, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost'}/verify-email?token=${verificationToken}`;
    const supportUrl = `${process.env.FRONTEND_URL || 'http://localhost'}/support`;
    
    const html = await loadTemplate('email-verification', {
        firstName: firstName,
        verificationLink: verificationUrl,
        verificationToken: verificationToken,
        supportLink: supportUrl,
        year: new Date().getFullYear()
    });
    
    return await sendEmail({
        to: email,
        subject: 'Verify Your Email Address - Cixio',
        html
    });
};

/**
 * Send password reset email
 * @param {String} email - Recipient email
 * @param {String} firstName - User's first name
 * @param {String} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (email, firstName, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = await loadTemplate('password-reset', {
        name: firstName,
        resetLink: resetUrl,
        year: new Date().getFullYear()
    });
    
    await sendEmail({
        to: email,
        subject: 'Reset Your CIXIO Password',
        html
    });
};

/**
 * Send welcome email
 * @param {String} email - Recipient email
 * @param {String} firstName - User's first name
 */
const sendWelcomeEmail = async (email, firstName) => {
    const html = await loadTemplate('welcome', {
        name: firstName,
        email: email,
        year: new Date().getFullYear()
    });
    
    await sendEmail({
        to: email,
        subject: 'Welcome to CIXIO!',
        html
    });
};

module.exports = {
    sendEmail,
    loadTemplate,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    verifyEmailConnection,
    isEmailConfigured
};
