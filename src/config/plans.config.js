const SUBSCRIPTION_PLANS = {
    starter: {
        planName: 'Starter',
        planType: 'starter',
        description: 'Perfect for small teams getting started',
        pricing: {
            monthly: {
                price: 29,
                savings: 0,
                displayPrice: '$29/month'
            },
            annually: {
                price: 290,
                monthlyEquivalent: 24.17,
                savings: 17,
                displayPrice: '$290/year'
            }
        },
        features: {
            users: 5,
            storage: '10GB',
            apiCalls: '10K',
            support: 'Email support',
            customIntegration: false,
            advancedAnalytics: false,
            prioritySupport: false,
            dedicatedManager: false,
            sla: 'Standard'
        },
        limits: {
            maxUsers: 5,
            storageGB: 10,
            apiCallsPerMonth: 10000
        },
        highlights: [
            'Up to 5 users',
            '10GB storage',
            '10,000 API calls/month',
            'Email support',
            'Basic analytics',
            'Community access'
        ]
    },
    professional: {
        planName: 'Professional',
        planType: 'professional',
        description: 'For growing teams that need more power',
        pricing: {
            monthly: {
                price: 99,
                savings: 0,
                displayPrice: '$99/month'
            },
            annually: {
                price: 990,
                monthlyEquivalent: 82.50,
                savings: 17,
                displayPrice: '$990/year'
            }
        },
        features: {
            users: 25,
            storage: '100GB',
            apiCalls: '100K',
            support: 'Priority support',
            customIntegration: false,
            advancedAnalytics: true,
            prioritySupport: true,
            dedicatedManager: false,
            sla: 'Enhanced'
        },
        limits: {
            maxUsers: 25,
            storageGB: 100,
            apiCallsPerMonth: 100000
        },
        highlights: [
            'Up to 25 users',
            '100GB storage',
            '100,000 API calls/month',
            'Priority support',
            'Advanced analytics',
            'Custom integrations',
            'Team collaboration tools',
            'API access'
        ]
    },
    enterprise: {
        planName: 'Enterprise',
        planType: 'enterprise',
        description: 'For large organizations with advanced needs',
        pricing: {
            monthly: {
                price: 299,
                savings: 0,
                displayPrice: '$299/month'
            },
            annually: {
                price: 2990,
                monthlyEquivalent: 249.17,
                savings: 17,
                displayPrice: '$2990/year'
            }
        },
        features: {
            users: -1, // Unlimited
            storage: '1TB',
            apiCalls: 'Unlimited',
            support: '24/7 support',
            customIntegration: true,
            advancedAnalytics: true,
            prioritySupport: true,
            dedicatedManager: true,
            sla: '99.9% SLA'
        },
        limits: {
            maxUsers: -1, // Unlimited
            storageGB: 1024,
            apiCallsPerMonth: -1 // Unlimited
        },
        highlights: [
            'Unlimited users',
            '1TB storage',
            'Unlimited API calls',
            '24/7 dedicated support',
            'Dedicated account manager',
            'Custom integrations',
            'Advanced analytics & reporting',
            'SSO & advanced security',
            '99.9% SLA',
            'Custom contracts',
            'Priority feature requests',
            'White-label options'
        ]
    }
};

/**
 * Get all available plans
 * @returns {Object} All subscription plans
 */
const getAllPlans = () => {
    return SUBSCRIPTION_PLANS;
};

/**
 * Get specific plan details
 * @param {String} planType - Plan type (starter, professional, enterprise)
 * @returns {Object|null} Plan details or null if not found
 */
const getPlan = (planType) => {
    return SUBSCRIPTION_PLANS[planType] || null;
};

/**
 * Get plan pricing for specific billing cycle
 * @param {String} planType - Plan type
 * @param {String} billingCycle - Billing cycle (monthly, annually)
 * @returns {Number|null} Price or null if not found
 */
const getPlanPrice = (planType, billingCycle) => {
    const plan = getPlan(planType);
    if (!plan) return null;
    
    return plan.pricing[billingCycle]?.price || null;
};

/**
 * Get plan features
 * @param {String} planType - Plan type
 * @returns {Object|null} Features object or null if not found
 */
const getPlanFeatures = (planType) => {
    const plan = getPlan(planType);
    if (!plan) return null;
    
    return plan.features;
};

/**
 * Calculate total with discount
 * @param {Number} price - Original price
 * @param {Number} discountPercent - Discount percentage
 * @returns {Number} Discounted price
 */
const calculateDiscount = (price, discountPercent) => {
    return price - (price * discountPercent / 100);
};

/**
 * Validate plan and billing cycle
 * @param {String} planType - Plan type
 * @param {String} billingCycle - Billing cycle
 * @returns {Boolean} True if valid
 */
const isValidPlanConfig = (planType, billingCycle) => {
    const plan = getPlan(planType);
    if (!plan) return false;
    
    return ['monthly', 'annually'].includes(billingCycle);
};

/**
 * Get plan comparison data
 * @returns {Array} Array of plans with comparison data
 */
const getPlanComparison = () => {
    return Object.values(SUBSCRIPTION_PLANS).map(plan => ({
        planType: plan.planType,
        planName: plan.planName,
        description: plan.description,
        monthlyPrice: plan.pricing.monthly.price,
        annualPrice: plan.pricing.annually.price,
        annualSavings: plan.pricing.annually.savings,
        features: plan.highlights
    }));
};

module.exports = {
    SUBSCRIPTION_PLANS,
    getAllPlans,
    getPlan,
    getPlanPrice,
    getPlanFeatures,
    calculateDiscount,
    isValidPlanConfig,
    getPlanComparison
};
