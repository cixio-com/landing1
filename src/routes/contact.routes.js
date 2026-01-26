const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
    submitContact,
    getAllContacts,
    getContactById,
    updateContactStatus,
    assignContact,
    respondToContact,
    addInternalNote,
    deleteContact
} = require('../controllers/contact.controller');

/**
 * @route   POST /api/contacts
 * @desc    Submit new contact form
 * @access  Public
 */
router.post('/', submitContact);

/**
 * @route   GET /api/contacts
 * @desc    Get all contacts with filters and pagination
 * @access  Private/Admin
 * @query   status, priority, category, assignedTo, isRead, isArchived, isImportant, search, page, limit, sortBy, sortOrder
 */
router.get('/', authenticate, authorize('admin'), getAllContacts);

/**
 * @route   GET /api/contacts/:id
 * @desc    Get contact by ID
 * @access  Private/Admin
 */
router.get('/:id', authenticate, authorize('admin'), getContactById);

/**
 * @route   PATCH /api/contacts/:id/status
 * @desc    Update contact status
 * @access  Private/Admin
 * @body    status, resolutionNotes (optional)
 */
router.patch('/:id/status', authenticate, authorize('admin'), updateContactStatus);

/**
 * @route   PATCH /api/contacts/:id/assign
 * @desc    Assign contact to admin user
 * @access  Private/Admin
 * @body    userId
 */
router.patch('/:id/assign', authenticate, authorize('admin'), assignContact);

/**
 * @route   POST /api/contacts/:id/respond
 * @desc    Send response to contact and update status
 * @access  Private/Admin
 * @body    message, updateStatus (optional)
 */
router.post('/:id/respond', authenticate, authorize('admin'), respondToContact);

/**
 * @route   POST /api/contacts/:id/notes
 * @desc    Add internal note to contact
 * @access  Private/Admin
 * @body    note
 */
router.post('/:id/notes', authenticate, authorize('admin'), addInternalNote);

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Delete contact
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, authorize('admin'), deleteContact);

module.exports = router;
