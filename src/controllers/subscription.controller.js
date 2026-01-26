const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');
const { sendEmail, loadTemplate } = require('../utils/email.utils');
const { 
    getAllPlans, 
    getPlan, 
    getPlanPrice, 
    getPlanFeatures,
    isValidPlanConfig 
} = require('../config/plans.config');

/**
 * Get all available subscription plans
 * Public endpoint - no authentication required
 * @route GET /api/subscriptions/plans
 */
const getPlans = async (req, res) => {
    try {
        const plans = getAllPlans();
        
        return res.status(200).json({
            success: true,
            message: 'Subscription plans retrieved successfully',
            data: {
                plans: Object.values(plans)
            }
        });
    } catch (error) {
        console.error('Get plans error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscription plans',
            error: error.message
        });
    }
};

/**
 * Create new subscription for authenticated user
 * @route POST /api/subscriptions
 */
const createSubscription = async (req, res) => {
    try {
        const userId = req.user._id;
        const { 
            planType, 
            billingCycle, 
            paymentMethod,
            isTrial = false,
            autoRenew = true
        } = req.body;

        // Validate required fields
        if (!planType || !billingCycle || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Plan type, billing cycle, and payment method are required'
            });
        }

        // Validate plan configuration
        if (!isValidPlanConfig(planType, billingCycle)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan type or billing cycle'
            });
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findOne({
            user: userId,
            status: 'active',
            endDate: { $gte: new Date() }
        });

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription'
            });
        }

        // Get plan details
        const plan = getPlan(planType);
        const price = getPlanPrice(planType, billingCycle);
        const features = getPlanFeatures(planType);

        if (!plan || !price || !features) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan configuration'
            });
        }

        // Calculate dates
        const startDate = new Date();
        let endDate = new Date(startDate);
        
        if (billingCycle === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (billingCycle === 'annually') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const nextBillingDate = autoRenew ? endDate : null;

        // Create subscription
        const subscription = new Subscription({
            user: userId,
            planName: plan.planName,
            planType: planType,
            billingCycle,
            price,
            currency: 'USD',
            status: isTrial ? 'trial' : 'active',
            startDate,
            endDate,
            nextBillingDate,
            autoRenew,
            paymentMethod,
            paymentStatus: isTrial ? 'paid' : 'pending',
            features: {
                users: features.users === -1 ? 999999 : features.users,
                storage: features.storage,
                apiCalls: features.apiCalls,
                support: features.support,
                customIntegration: features.customIntegration,
                advancedAnalytics: features.advancedAnalytics,
                prioritySupport: features.prioritySupport,
                dedicatedManager: features.dedicatedManager,
                sla: features.sla
            },
            usage: {
                apiCallsUsed: 0,
                storageUsed: 0,
                lastUpdated: new Date()
            },
            isTrial,
            trialEndDate: isTrial ? endDate : null
        });

        await subscription.save();

        // Update user's subscription reference and status
        await User.findByIdAndUpdate(userId, {
            subscription: subscription._id,
            subscriptionStatus: 'active'
        });

        // Send subscription confirmation email
        try {
            const user = req.user;
            const emailHtml = await loadTemplate('subscription-confirmation', {
                firstName: user.firstName,
                planName: plan.planName,
                billingCycle: billingCycle === 'monthly' ? 'Monthly' : 'Annual',
                price: `$${price}`,
                startDate: startDate.toLocaleDateString(),
                endDate: endDate.toLocaleDateString(),
                features: plan.highlights.join(', '),
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
                year: new Date().getFullYear()
            });

            await sendEmail({
                to: user.email,
                subject: 'Welcome to CIXIO - Subscription Confirmed',
                html: emailHtml
            });
        } catch (emailError) {
            console.error('Failed to send subscription confirmation email:', emailError);
            // Don't fail the request if email fails
        }

        // Populate user details for response
        await subscription.populate('user', 'firstName lastName email');

        return res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: {
                subscription
            }
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create subscription',
            error: error.message
        });
    }
};

/**
 * Get user's subscriptions
 * @route GET /api/subscriptions
 */
const getUserSubscriptions = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 10 } = req.query;

        const query = { user: userId };
        
        // Filter by status if provided
        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const subscriptions = await Subscription.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'firstName lastName email');

        const total = await Subscription.countDocuments(query);

        return res.status(200).json({
            success: true,
            message: 'Subscriptions retrieved successfully',
            data: {
                subscriptions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get user subscriptions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscriptions',
            error: error.message
        });
    }
};

/**
 * Get specific subscription details
 * @route GET /api/subscriptions/:id
 */
const getSubscriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const subscription = await Subscription.findOne({
            _id: id,
            user: userId
        }).populate('user', 'firstName lastName email company');

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Subscription retrieved successfully',
            data: {
                subscription
            }
        });
    } catch (error) {
        console.error('Get subscription by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscription',
            error: error.message
        });
    }
};

/**
 * Update subscription (change plan, billing cycle)
 * @route PUT /api/subscriptions/:id
 */
const updateSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { planType, billingCycle, autoRenew } = req.body;

        const subscription = await Subscription.findOne({
            _id: id,
            user: userId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Check if subscription is active
        if (subscription.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Only active subscriptions can be updated'
            });
        }

        let updated = false;

        // Update plan type if provided
        if (planType && planType !== subscription.planType) {
            if (!isValidPlanConfig(planType, billingCycle || subscription.billingCycle)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid plan type'
                });
            }

            const plan = getPlan(planType);
            const price = getPlanPrice(planType, billingCycle || subscription.billingCycle);
            const features = getPlanFeatures(planType);

            subscription.planType = planType;
            subscription.planName = plan.planName;
            subscription.price = price;
            subscription.features = {
                users: features.users === -1 ? 999999 : features.users,
                storage: features.storage,
                apiCalls: features.apiCalls,
                support: features.support,
                customIntegration: features.customIntegration,
                advancedAnalytics: features.advancedAnalytics,
                prioritySupport: features.prioritySupport,
                dedicatedManager: features.dedicatedManager,
                sla: features.sla
            };
            updated = true;
        }

        // Update billing cycle if provided
        if (billingCycle && billingCycle !== subscription.billingCycle) {
            if (!['monthly', 'annually'].includes(billingCycle)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid billing cycle'
                });
            }

            const price = getPlanPrice(subscription.planType, billingCycle);
            subscription.billingCycle = billingCycle;
            subscription.price = price;

            // Recalculate end date
            const startDate = new Date();
            let endDate = new Date(startDate);
            
            if (billingCycle === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            } else if (billingCycle === 'annually') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }

            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.nextBillingDate = subscription.autoRenew ? endDate : null;
            updated = true;
        }

        // Update auto-renew if provided
        if (autoRenew !== undefined && autoRenew !== subscription.autoRenew) {
            subscription.autoRenew = autoRenew;
            subscription.nextBillingDate = autoRenew ? subscription.endDate : null;
            updated = true;
        }

        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'No changes provided'
            });
        }

        await subscription.save();
        await subscription.populate('user', 'firstName lastName email');

        return res.status(200).json({
            success: true,
            message: 'Subscription updated successfully',
            data: {
                subscription
            }
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update subscription',
            error: error.message
        });
    }
};

/**
 * Cancel subscription with reason
 * @route POST /api/subscriptions/:id/cancel
 */
const cancelSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { reason, feedback } = req.body;

        const subscription = await Subscription.findOne({
            _id: id,
            user: userId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Check if subscription is already cancelled
        if (subscription.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Subscription is already cancelled'
            });
        }

        // Cancel subscription using model method
        await subscription.cancel(reason, feedback);

        // Update user's subscription status
        await User.findByIdAndUpdate(userId, {
            subscriptionStatus: 'cancelled'
        });

        // Send cancellation confirmation email
        try {
            const user = req.user;
            const emailHtml = await loadTemplate('subscription-cancellation', {
                firstName: user.firstName,
                planName: subscription.planName,
                endDate: subscription.endDate.toLocaleDateString(),
                supportUrl: `${process.env.FRONTEND_URL}/support`,
                year: new Date().getFullYear()
            });

            await sendEmail({
                to: user.email,
                subject: 'Subscription Cancellation Confirmed',
                html: emailHtml
            });
        } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
        }

        await subscription.populate('user', 'firstName lastName email');

        return res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: {
                subscription
            }
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel subscription',
            error: error.message
        });
    }
};

/**
 * Renew subscription
 * @route POST /api/subscriptions/:id/renew
 */
const renewSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { paymentMethod } = req.body;

        const subscription = await Subscription.findOne({
            _id: id,
            user: userId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Check if subscription can be renewed
        if (subscription.status === 'active' && new Date() < new Date(subscription.endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Subscription is still active and does not need renewal'
            });
        }

        // Update payment method if provided
        if (paymentMethod) {
            subscription.paymentMethod = paymentMethod;
        }

        // Renew subscription using model method
        await subscription.renew();

        // Update user's subscription status
        await User.findByIdAndUpdate(userId, {
            subscriptionStatus: 'active'
        });

        // Send renewal confirmation email
        try {
            const user = req.user;
            const emailHtml = await loadTemplate('subscription-renewal', {
                firstName: user.firstName,
                planName: subscription.planName,
                billingCycle: subscription.billingCycle === 'monthly' ? 'Monthly' : 'Annual',
                price: `$${subscription.price}`,
                startDate: subscription.startDate.toLocaleDateString(),
                endDate: subscription.endDate.toLocaleDateString(),
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
                year: new Date().getFullYear()
            });

            await sendEmail({
                to: user.email,
                subject: 'Subscription Renewed Successfully',
                html: emailHtml
            });
        } catch (emailError) {
            console.error('Failed to send renewal email:', emailError);
        }

        await subscription.populate('user', 'firstName lastName email');

        return res.status(200).json({
            success: true,
            message: 'Subscription renewed successfully',
            data: {
                subscription
            }
        });
    } catch (error) {
        console.error('Renew subscription error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to renew subscription',
            error: error.message
        });
    }
};

/**
 * Get subscription usage statistics
 * @route GET /api/subscriptions/:id/usage
 */
const getSubscriptionUsage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const subscription = await Subscription.findOne({
            _id: id,
            user: userId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Get plan details for limits
        const plan = getPlan(subscription.planType);
        const limits = plan?.limits || {};

        // Calculate usage percentages
        const apiCallsLimit = limits.apiCallsPerMonth === -1 ? -1 : limits.apiCallsPerMonth;
        const storageLimit = limits.storageGB || 0;

        const apiCallsPercentage = apiCallsLimit === -1 
            ? 0 
            : (subscription.usage.apiCallsUsed / apiCallsLimit) * 100;

        const storagePercentage = storageLimit === 0 
            ? 0 
            : (subscription.usage.storageUsed / (storageLimit * 1024)) * 100; // Convert GB to MB

        const usageStats = {
            subscription: {
                id: subscription._id,
                planName: subscription.planName,
                planType: subscription.planType,
                status: subscription.status,
                billingCycle: subscription.billingCycle
            },
            usage: {
                apiCalls: {
                    used: subscription.usage.apiCallsUsed,
                    limit: apiCallsLimit === -1 ? 'Unlimited' : apiCallsLimit,
                    percentage: apiCallsPercentage.toFixed(2),
                    remaining: apiCallsLimit === -1 ? 'Unlimited' : apiCallsLimit - subscription.usage.apiCallsUsed
                },
                storage: {
                    used: `${(subscription.usage.storageUsed / 1024).toFixed(2)} GB`,
                    usedMB: subscription.usage.storageUsed,
                    limit: `${storageLimit} GB`,
                    limitMB: storageLimit * 1024,
                    percentage: storagePercentage.toFixed(2),
                    remaining: `${((storageLimit * 1024) - subscription.usage.storageUsed) / 1024} GB`
                },
                lastUpdated: subscription.usage.lastUpdated
            },
            limits: {
                users: limits.maxUsers === -1 ? 'Unlimited' : limits.maxUsers,
                storage: limits.storageGB === -1 ? 'Unlimited' : `${limits.storageGB} GB`,
                apiCalls: limits.apiCallsPerMonth === -1 ? 'Unlimited' : limits.apiCallsPerMonth
            },
            period: {
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                daysRemaining: subscription.daysRemaining,
                isActive: subscription.isActive
            }
        };

        return res.status(200).json({
            success: true,
            message: 'Usage statistics retrieved successfully',
            data: usageStats
        });
    } catch (error) {
        console.error('Get subscription usage error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve usage statistics',
            error: error.message
        });
    }
};

module.exports = {
    getPlans,
    createSubscription,
    getUserSubscriptions,
    getSubscriptionById,
    updateSubscription,
    cancelSubscription,
    renewSubscription,
    getSubscriptionUsage
};
