const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create nodemailer transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: parseInt(process.env.EMAIL_PORT) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
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
 * Send email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email address
 * @param {String} options.subject - Email subject
 * @param {String} options.html - HTML content
 * @param {String} options.text - Plain text content (optional)
 * @returns {Object} Email send result
 */
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `${process.env.EMAIL_FROM_NAME || 'CIXIO'} <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

/**
 * Send verification email
 * @param {String} email - Recipient email
 * @param {String} firstName - User's first name
 * @param {String} verificationToken - Email verification token
 */
const sendVerificationEmail = async (email, firstName, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const html = await loadTemplate('verification', {
        firstName,
        verificationUrl,
        year: new Date().getFullYear()
    });
    
    await sendEmail({
        to: email,
        subject: 'Verify Your CIXIO Account',
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
        firstName,
        resetUrl,
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
        firstName,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
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
    sendWelcomeEmail
};
