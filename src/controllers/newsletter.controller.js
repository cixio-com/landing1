const crypto = require('crypto');
const Newsletter = require('../models/newsletter.model');
const { sendEmail } = require('../utils/email.utils');

/**
 * Subscribe to newsletter (Public)
 * POST /api/newsletter/subscribe
 */
const subscribe = async (req, res) => {
    try {
        const { email, mobile, name, company, interests, preferences, source, sourceUrl, referrer } = req.body;

        // Validate that at least one contact method is provided
        if (!email && !mobile) {
            return res.status(400).json({
                success: false,
                message: 'Either email or mobile number is required'
            });
        }

        // Check if subscriber already exists
        const existingSubscriber = await Newsletter.findOne({
            $or: [
                email ? { email } : null,
                mobile ? { mobile } : null
            ].filter(Boolean)
        });

        if (existingSubscriber) {
            if (existingSubscriber.status === 'active' && existingSubscriber.isVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'You are already subscribed to our newsletter'
                });
            }

            if (existingSubscriber.status === 'unsubscribed') {
                // Re-subscribe - generate new verification token
                const verificationToken = crypto.randomBytes(32).toString('hex');
                const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                existingSubscriber.status = 'pending';
                existingSubscriber.isVerified = false;
                existingSubscriber.verificationToken = verificationToken;
                existingSubscriber.verificationExpires = verificationExpires;
                existingSubscriber.subscribedAt = new Date();
                existingSubscriber.unsubscribedAt = undefined;
                existingSubscriber.unsubscribeReason = undefined;
                existingSubscriber.unsubscribeFeedback = undefined;

                if (name) existingSubscriber.name = name;
                if (company) existingSubscriber.company = company;
                if (interests) existingSubscriber.interests = interests;
                if (preferences) existingSubscriber.preferences = { ...existingSubscriber.preferences, ...preferences };

                await existingSubscriber.save();

                // Send verification email
                if (email) {
                    await sendNewsletterVerificationEmail(email, name, verificationToken);
                }

                return res.status(200).json({
                    success: true,
                    message: 'Welcome back! Please check your email to verify your subscription',
                    data: {
                        subscriber: {
                            id: existingSubscriber._id,
                            email: existingSubscriber.email,
                            mobile: existingSubscriber.mobile,
                            contactType: existingSubscriber.contactType,
                            status: existingSubscriber.status
                        }
                    }
                });
            }

            // Pending subscription - resend verification
            if (!existingSubscriber.isVerified && email) {
                await sendNewsletterVerificationEmail(email, name || existingSubscriber.name, existingSubscriber.verificationToken);
            }

            return res.status(200).json({
                success: true,
                message: 'A verification email has been sent. Please check your inbox',
                data: {
                    subscriber: {
                        id: existingSubscriber._id,
                        email: existingSubscriber.email,
                        mobile: existingSubscriber.mobile,
                        contactType: existingSubscriber.contactType,
                        status: existingSubscriber.status
                    }
                }
            });
        }

        // Generate verification and unsubscribe tokens
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create new subscriber
        const subscriber = new Newsletter({
            email,
            mobile,
            name,
            company,
            interests,
            preferences: preferences || {},
            verificationToken,
            verificationExpires,
            unsubscribeToken,
            source: source || 'website',
            sourceUrl,
            referrer,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            status: 'pending',
            isVerified: false
        });

        await subscriber.save();

        // Send verification email
        if (email) {
            await sendNewsletterVerificationEmail(email, name, verificationToken);
        }

        // For mobile subscriptions, implement SMS verification separately
        // TODO: Implement SMS verification for mobile subscriptions

        return res.status(201).json({
            success: true,
            message: email 
                ? 'Subscription successful! Please check your email to verify your subscription'
                : 'Subscription successful! A verification message will be sent shortly',
            data: {
                subscriber: {
                    id: subscriber._id,
                    email: subscriber.email,
                    mobile: subscriber.mobile,
                    contactType: subscriber.contactType,
                    status: subscriber.status
                }
            }
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This email or mobile number is already subscribed'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to process subscription. Please try again later'
        });
    }
};

/**
 * Verify newsletter subscription (Public)
 * GET /api/newsletter/verify/:token
 */
const verifySubscription = async (req, res) => {
    try {
        const { token } = req.params;

        const subscriber = await Newsletter.findOne({
            verificationToken: token,
            verificationExpires: { $gt: Date.now() }
        });

        if (!subscriber) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Verify the subscription
        await subscriber.verify();

        // Send welcome email
        if (subscriber.email) {
            await sendNewsletterWelcomeEmail(subscriber.email, subscriber.name);
        }

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully! You are now subscribed to our newsletter',
            data: {
                subscriber: {
                    id: subscriber._id,
                    email: subscriber.email,
                    mobile: subscriber.mobile,
                    contactType: subscriber.contactType,
                    status: subscriber.status,
                    isVerified: subscriber.isVerified
                }
            }
        });
    } catch (error) {
        console.error('Newsletter verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify subscription. Please try again later'
        });
    }
};

/**
 * Unsubscribe from newsletter (Public)
 * POST /api/newsletter/unsubscribe
 */
const unsubscribe = async (req, res) => {
    try {
        const { token, email, reason, feedback } = req.body;

        let subscriber;

        // Find subscriber by unsubscribe token or email
        if (token) {
            subscriber = await Newsletter.findOne({ unsubscribeToken: token });
        } else if (email) {
            subscriber = await Newsletter.findOne({ email });
        }

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found'
            });
        }

        if (subscriber.status === 'unsubscribed') {
            return res.status(400).json({
                success: false,
                message: 'You are already unsubscribed'
            });
        }

        // Unsubscribe
        await subscriber.unsubscribe(reason, feedback);

        // Send unsubscribe confirmation email
        if (subscriber.email) {
            await sendUnsubscribeConfirmationEmail(subscriber.email, subscriber.name);
        }

        return res.status(200).json({
            success: true,
            message: 'You have been successfully unsubscribed from our newsletter',
            data: {
                subscriber: {
                    id: subscriber._id,
                    email: subscriber.email,
                    status: subscriber.status,
                    unsubscribedAt: subscriber.unsubscribedAt
                }
            }
        });
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process unsubscription. Please try again later'
        });
    }
};

/**
 * Resend verification email (Public)
 * POST /api/newsletter/resend-verification
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

        const subscriber = await Newsletter.findOne({ email });

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found'
            });
        }

        if (subscriber.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Your email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        subscriber.verificationToken = verificationToken;
        subscriber.verificationExpires = verificationExpires;
        await subscriber.save();

        // Send verification email
        await sendNewsletterVerificationEmail(email, subscriber.name, verificationToken);

        return res.status(200).json({
            success: true,
            message: 'Verification email has been resent. Please check your inbox'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to resend verification email. Please try again later'
        });
    }
};

/**
 * Get all subscribers with filters (Admin only)
 * GET /api/newsletter/subscribers
 */
const getAllSubscribers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            isVerified,
            contactType,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter query
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (isVerified !== undefined) {
            filter.isVerified = isVerified === 'true';
        }

        if (contactType) {
            filter.contactType = contactType;
        }

        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Get subscribers
        const subscribers = await Newsletter.find(filter)
            .sort(sortOptions)
            .limit(parseInt(limit))
            .skip(skip)
            .select('-verificationToken -unsubscribeToken');

        // Get total count
        const total = await Newsletter.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: {
                subscribers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get all subscribers error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscribers'
        });
    }
};

/**
 * Get subscriber by ID (Admin only)
 * GET /api/newsletter/subscribers/:id
 */
const getSubscriberById = async (req, res) => {
    try {
        const { id } = req.params;

        const subscriber = await Newsletter.findById(id)
            .select('-verificationToken -unsubscribeToken');

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: { subscriber }
        });
    } catch (error) {
        console.error('Get subscriber error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscriber'
        });
    }
};

/**
 * Update subscriber preferences (Admin only)
 * PUT /api/newsletter/subscribers/:id
 */
const updateSubscriberPreferences = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, company, interests, preferences, tags, segments, notes, status } = req.body;

        const subscriber = await Newsletter.findById(id);

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found'
            });
        }

        // Update fields
        if (name !== undefined) subscriber.name = name;
        if (company !== undefined) subscriber.company = company;
        if (interests !== undefined) subscriber.interests = interests;
        if (preferences !== undefined) {
            subscriber.preferences = { ...subscriber.preferences, ...preferences };
        }
        if (tags !== undefined) subscriber.tags = tags;
        if (segments !== undefined) subscriber.segments = segments;
        if (notes !== undefined) subscriber.notes = notes;
        if (status !== undefined && ['pending', 'active', 'unsubscribed', 'bounced', 'complained'].includes(status)) {
            subscriber.status = status;
            if (status === 'unsubscribed' && !subscriber.unsubscribedAt) {
                subscriber.unsubscribedAt = new Date();
            }
        }

        await subscriber.save();

        return res.status(200).json({
            success: true,
            message: 'Subscriber updated successfully',
            data: { subscriber }
        });
    } catch (error) {
        console.error('Update subscriber error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update subscriber'
        });
    }
};

/**
 * Delete subscriber (Admin only)
 * DELETE /api/newsletter/subscribers/:id
 */
const deleteSubscriber = async (req, res) => {
    try {
        const { id } = req.params;

        const subscriber = await Newsletter.findByIdAndDelete(id);

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Subscriber deleted successfully',
            data: {
                deletedSubscriber: {
                    id: subscriber._id,
                    email: subscriber.email,
                    mobile: subscriber.mobile
                }
            }
        });
    } catch (error) {
        console.error('Delete subscriber error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete subscriber'
        });
    }
};

/**
 * Send newsletter to active subscribers (Admin only)
 * POST /api/newsletter/send
 */
const sendNewsletter = async (req, res) => {
    try {
        const { subject, htmlContent, textContent, campaignId, filters = {} } = req.body;

        if (!subject || !htmlContent) {
            return res.status(400).json({
                success: false,
                message: 'Subject and HTML content are required'
            });
        }

        // Build query for active, verified subscribers
        const query = {
            status: 'active',
            isVerified: true,
            ...filters
        };

        // For email newsletters, ensure email exists
        if (!filters.contactType || filters.contactType === 'email' || filters.contactType === 'both') {
            query.email = { $exists: true, $ne: null };
        }

        const subscribers = await Newsletter.find(query);

        if (subscribers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active subscribers found matching the criteria'
            });
        }

        const emailPromises = [];
        const results = {
            total: subscribers.length,
            sent: 0,
            failed: 0,
            errors: []
        };

        // Send emails to all subscribers
        for (const subscriber of subscribers) {
            if (subscriber.email) {
                const personalizedHtml = htmlContent.replace(/{{name}}/g, subscriber.name || 'Subscriber');
                const unsubscribeUrl = `${process.env.FRONTEND_URL}/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;
                const finalHtml = personalizedHtml + `<br><br><p style="font-size: 12px; color: #666;"><a href="${unsubscribeUrl}">Unsubscribe</a> from this newsletter</p>`;

                emailPromises.push(
                    sendEmail({
                        to: subscriber.email,
                        subject,
                        html: finalHtml,
                        text: textContent
                    })
                    .then(() => {
                        // Record email sent
                        subscriber.recordEmailSent(campaignId || `newsletter-${Date.now()}`, subject);
                        results.sent++;
                    })
                    .catch(error => {
                        results.failed++;
                        results.errors.push({
                            email: subscriber.email,
                            error: error.message
                        });
                    })
                );
            }
        }

        // Wait for all emails to be sent
        await Promise.allSettled(emailPromises);

        return res.status(200).json({
            success: true,
            message: `Newsletter sent successfully to ${results.sent} subscribers`,
            data: results
        });
    } catch (error) {
        console.error('Send newsletter error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send newsletter'
        });
    }
};

// Helper functions for sending emails

/**
 * Send newsletter verification email
 */
const sendNewsletterVerificationEmail = async (email, name, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/newsletter/verify?token=${verificationToken}`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Newsletter Subscription</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">CIXIO Newsletter</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Verify Your Subscription</h2>
                <p>Hi ${name || 'there'},</p>
                <p>Thank you for subscribing to the CIXIO newsletter! We're excited to keep you updated with our latest news, updates, and insights.</p>
                <p>Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Subscription</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">This verification link will expire in 24 hours.</p>
                <p style="color: #666; font-size: 14px;">If you didn't subscribe to our newsletter, please ignore this email.</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                <p>&copy; ${new Date().getFullYear()} CIXIO. All rights reserved.</p>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        to: email,
        subject: 'Verify Your Newsletter Subscription - CIXIO',
        html
    });
};

/**
 * Send newsletter welcome email
 */
const sendNewsletterWelcomeEmail = async (email, name) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to CIXIO Newsletter</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Welcome to CIXIO!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">You're All Set! 🎉</h2>
                <p>Hi ${name || 'there'},</p>
                <p>Your subscription to the CIXIO newsletter has been confirmed! We're thrilled to have you on board.</p>
                <p>Here's what you can expect from us:</p>
                <ul style="color: #555;">
                    <li>📰 Latest product updates and features</li>
                    <li>💡 Expert insights and industry news</li>
                    <li>🎯 Exclusive promotions and offers</li>
                    <li>📅 Upcoming events and webinars</li>
                </ul>
                <p>You can update your preferences or unsubscribe at any time using the link at the bottom of our emails.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Visit Our Website</a>
                </div>
                <p>Thank you for joining our community!</p>
                <p style="margin-top: 30px;">Best regards,<br>The CIXIO Team</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                <p>&copy; ${new Date().getFullYear()} CIXIO. All rights reserved.</p>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        to: email,
        subject: 'Welcome to CIXIO Newsletter!',
        html
    });
};

/**
 * Send unsubscribe confirmation email
 */
const sendUnsubscribeConfirmationEmail = async (email, name) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Unsubscribed from CIXIO Newsletter</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #555; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">CIXIO Newsletter</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">You've Been Unsubscribed</h2>
                <p>Hi ${name || 'there'},</p>
                <p>We've successfully processed your request to unsubscribe from the CIXIO newsletter.</p>
                <p>You will no longer receive marketing emails from us. We're sorry to see you go!</p>
                <p>If you unsubscribed by mistake or change your mind, you can always re-subscribe by visiting our website.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}/newsletter/subscribe" style="background: #555; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Re-subscribe</a>
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">Please note: You will continue to receive transactional emails related to your account, if applicable.</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                <p>&copy; ${new Date().getFullYear()} CIXIO. All rights reserved.</p>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        to: email,
        subject: 'You\'ve Been Unsubscribed - CIXIO Newsletter',
        html
    });
};

module.exports = {
    subscribe,
    verifySubscription,
    unsubscribe,
    resendVerification,
    getAllSubscribers,
    getSubscriberById,
    updateSubscriberPreferences,
    deleteSubscriber,
    sendNewsletter
};
