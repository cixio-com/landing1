const Contact = require('../models/contact.model');
const User = require('../models/user.model');
const { sendEmail } = require('../utils/email.utils');

/**
 * Submit new contact form (Public endpoint)
 * @route POST /api/contacts
 * @access Public
 */
const submitContact = async (req, res) => {
    try {
        const { name, email, phone, company, subject, message, category, source } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, email, subject, and message'
            });
        }

        // Get IP address and user agent
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const referrer = req.headers.referer || req.headers.referrer;

        // Create contact
        const contact = await Contact.create({
            name,
            email,
            phone,
            company,
            subject,
            message,
            category: category || 'general',
            source: source || 'website',
            ipAddress,
            userAgent,
            referrer
        });

        // Send acknowledgment email to user
        try {
            await sendEmail({
                to: email,
                subject: 'We received your message - CIXIO',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; background-color: #f9f9f9; }
                            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                            .message-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Thank You for Contacting Us!</h1>
                            </div>
                            <div class="content">
                                <p>Dear ${name},</p>
                                <p>Thank you for reaching out to CIXIO. We have received your message and will get back to you as soon as possible.</p>
                                
                                <div class="message-box">
                                    <h3>Your Message Details:</h3>
                                    <p><strong>Subject:</strong> ${subject}</p>
                                    <p><strong>Message:</strong><br>${message}</p>
                                    <p><strong>Reference ID:</strong> ${contact._id}</p>
                                </div>
                                
                                <p>Our team typically responds within 24-48 hours during business days. If your inquiry is urgent, please mention "URGENT" in the subject line.</p>
                                
                                <p>Best regards,<br>The CIXIO Team</p>
                            </div>
                            <div class="footer">
                                <p>&copy; ${new Date().getFullYear()} CIXIO. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });
        } catch (emailError) {
            console.error('Error sending acknowledgment email:', emailError);
            // Don't fail the request if email fails
        }

        // Send notification to support team
        try {
            await sendEmail({
                to: 'support@cixio.com',
                subject: `New Contact Form Submission - ${subject}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; background-color: #f9f9f9; }
                            .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
                            .info-row { margin: 10px 0; }
                            .label { font-weight: bold; color: #4F46E5; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🔔 New Contact Form Submission</h1>
                            </div>
                            <div class="content">
                                <p>A new contact form has been submitted on the website.</p>
                                
                                <div class="info-box">
                                    <h3>Contact Information:</h3>
                                    <div class="info-row"><span class="label">Name:</span> ${name}</div>
                                    <div class="info-row"><span class="label">Email:</span> ${email}</div>
                                    ${phone ? `<div class="info-row"><span class="label">Phone:</span> ${phone}</div>` : ''}
                                    ${company ? `<div class="info-row"><span class="label">Company:</span> ${company}</div>` : ''}
                                    <div class="info-row"><span class="label">Category:</span> ${category || 'general'}</div>
                                    <div class="info-row"><span class="label">Source:</span> ${source || 'website'}</div>
                                    <div class="info-row"><span class="label">Reference ID:</span> ${contact._id}</div>
                                </div>
                                
                                <div class="info-box">
                                    <h3>Message Details:</h3>
                                    <div class="info-row"><span class="label">Subject:</span> ${subject}</div>
                                    <div class="info-row"><span class="label">Message:</span><br><br>${message.replace(/\n/g, '<br>')}</div>
                                </div>

                                <div class="info-box">
                                    <h3>Technical Details:</h3>
                                    <div class="info-row"><span class="label">IP Address:</span> ${ipAddress}</div>
                                    <div class="info-row"><span class="label">Submitted At:</span> ${new Date().toLocaleString()}</div>
                                </div>
                                
                                <p><strong>Action Required:</strong> Please respond to this inquiry within 24-48 hours.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });
        } catch (emailError) {
            console.error('Error sending notification email to support:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.',
            data: {
                id: contact._id,
                name: contact.name,
                email: contact.email,
                subject: contact.subject,
                status: contact.status,
                createdAt: contact.createdAt
            }
        });
    } catch (error) {
        console.error('Submit contact error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while submitting your message. Please try again later.'
        });
    }
};

/**
 * Get all contacts with filters and pagination (Admin only)
 * @route GET /api/contacts
 * @access Private/Admin
 */
const getAllContacts = async (req, res) => {
    try {
        const {
            status,
            priority,
            category,
            assignedTo,
            isRead,
            isArchived,
            isImportant,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter query
        const filter = {};
        
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (isRead !== undefined) filter.isRead = isRead === 'true';
        if (isArchived !== undefined) filter.isArchived = isArchived === 'true';
        if (isImportant !== undefined) filter.isImportant = isImportant === 'true';

        // Search functionality
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const contacts = await Contact.find(filter)
            .populate('assignedTo', 'firstName lastName email')
            .populate('response.respondedBy', 'firstName lastName email')
            .populate('resolvedBy', 'firstName lastName email')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        const total = await Contact.countDocuments(filter);

        // Get statistics
        const stats = await Contact.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: contacts,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            },
            stats: stats.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Get all contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching contacts.'
        });
    }
};

/**
 * Get contact by ID (Admin only)
 * @route GET /api/contacts/:id
 * @access Private/Admin
 */
const getContactById = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findById(id)
            .populate('assignedTo', 'firstName lastName email role')
            .populate('response.respondedBy', 'firstName lastName email')
            .populate('resolvedBy', 'firstName lastName email')
            .populate('communications.sentBy', 'firstName lastName email')
            .populate('internalNotes.addedBy', 'firstName lastName email');

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        // Mark as read if it wasn't already
        if (!contact.isRead) {
            contact.isRead = true;
            await contact.save();
        }

        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('Get contact by ID error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching contact.'
        });
    }
};

/**
 * Update contact status (Admin only)
 * @route PATCH /api/contacts/:id/status
 * @access Private/Admin
 */
const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolutionNotes } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const validStatuses = ['new', 'in_progress', 'resolved', 'closed', 'spam'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        contact.status = status;

        // If marking as resolved or closed, set resolution details
        if ((status === 'resolved' || status === 'closed') && !contact.resolvedAt) {
            contact.resolvedAt = new Date();
            contact.resolvedBy = req.user._id;
            if (resolutionNotes) {
                contact.resolutionNotes = resolutionNotes;
            }
        }

        await contact.save();

        res.status(200).json({
            success: true,
            message: 'Contact status updated successfully',
            data: contact
        });
    } catch (error) {
        console.error('Update contact status error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while updating contact status.'
        });
    }
};

/**
 * Assign contact to admin user (Admin only)
 * @route PATCH /api/contacts/:id/assign
 * @access Private/Admin
 */
const assignContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Verify the user exists and is an admin
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Contacts can only be assigned to admin users'
            });
        }

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        // Use the assign method from the model
        await contact.assign(userId);

        // Populate the assigned user details
        await contact.populate('assignedTo', 'firstName lastName email');

        res.status(200).json({
            success: true,
            message: 'Contact assigned successfully',
            data: contact
        });
    } catch (error) {
        console.error('Assign contact error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact or user ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while assigning contact.'
        });
    }
};

/**
 * Respond to contact and send email (Admin only)
 * @route POST /api/contacts/:id/respond
 * @access Private/Admin
 */
const respondToContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, updateStatus } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Response message is required'
            });
        }

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        // Set response
        contact.response = {
            message,
            respondedBy: req.user._id,
            respondedAt: new Date()
        };

        // Add to communications
        await contact.addCommunication(message, 'admin', req.user._id, false);

        // Update status if specified
        if (updateStatus) {
            const validStatuses = ['new', 'in_progress', 'resolved', 'closed', 'spam'];
            if (validStatuses.includes(updateStatus)) {
                contact.status = updateStatus;
                
                if (updateStatus === 'resolved' || updateStatus === 'closed') {
                    contact.resolvedAt = new Date();
                    contact.resolvedBy = req.user._id;
                }
            }
        }

        await contact.save();

        // Send response email to user
        let emailSent = false;
        try {
            await sendEmail({
                to: contact.email,
                subject: `Re: ${contact.subject} - CIXIO`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; background-color: #f9f9f9; }
                            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                            .message-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
                            .original-message { background-color: #f0f0f0; padding: 15px; margin: 15px 0; border-left: 4px solid #999; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Response to Your Inquiry</h1>
                            </div>
                            <div class="content">
                                <p>Dear ${contact.name},</p>
                                <p>Thank you for your patience. We have reviewed your inquiry and here is our response:</p>
                                
                                <div class="message-box">
                                    <h3>Our Response:</h3>
                                    <p>${message}</p>
                                </div>
                                
                                <div class="original-message">
                                    <h4>Your Original Message:</h4>
                                    <p><strong>Subject:</strong> ${contact.subject}</p>
                                    <p>${contact.message}</p>
                                </div>
                                
                                <p>If you have any further questions, please don't hesitate to reach out to us.</p>
                                
                                <p>Best regards,<br>${req.user.firstName} ${req.user.lastName}<br>CIXIO Team</p>
                            </div>
                            <div class="footer">
                                <p>Reference ID: ${contact._id}</p>
                                <p>&copy; ${new Date().getFullYear()} CIXIO. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });
            emailSent = true;

            // Update the communication to mark email as sent
            const lastComm = contact.communications[contact.communications.length - 1];
            lastComm.emailSent = true;
            await contact.save();
        } catch (emailError) {
            console.error('Error sending response email:', emailError);
            // Don't fail the request if email fails
        }

        await contact.populate('response.respondedBy', 'firstName lastName email');

        res.status(200).json({
            success: true,
            message: `Response saved${emailSent ? ' and email sent' : ' but email delivery failed'}`,
            data: contact
        });
    } catch (error) {
        console.error('Respond to contact error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while responding to contact.'
        });
    }
};

/**
 * Add internal note to contact (Admin only)
 * @route POST /api/contacts/:id/notes
 * @access Private/Admin
 */
const addInternalNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        if (!note) {
            return res.status(400).json({
                success: false,
                message: 'Note is required'
            });
        }

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        // Use the addInternalNote method from the model
        await contact.addInternalNote(note, req.user._id);

        // Populate the note's addedBy field
        await contact.populate('internalNotes.addedBy', 'firstName lastName email');

        res.status(200).json({
            success: true,
            message: 'Internal note added successfully',
            data: contact
        });
    } catch (error) {
        console.error('Add internal note error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while adding internal note.'
        });
    }
};

/**
 * Delete contact (Admin only)
 * @route DELETE /api/contacts/:id
 * @access Private/Admin
 */
const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        await Contact.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Contact deleted successfully',
            data: { id }
        });
    } catch (error) {
        console.error('Delete contact error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting contact.'
        });
    }
};

module.exports = {
    submitContact,
    getAllContacts,
    getContactById,
    updateContactStatus,
    assignContact,
    respondToContact,
    addInternalNote,
    deleteContact
};
