const express = require('express');
const router = express.Router();
const {
  createBooking, getBookings, getBooking,
  approveBooking, rejectBooking, issueBooking, returnBooking, cancelBooking,
  getAuditLogs
} = require('../controllers/booking.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

router.get('/audit', authenticate, requireAdmin, getAuditLogs);
router.get('/', authenticate, getBookings);
router.post('/', authenticate, createBooking);
router.get('/:id', authenticate, getBooking);
router.patch('/:id/approve', authenticate, requireAdmin, approveBooking);
router.patch('/:id/reject', authenticate, requireAdmin, rejectBooking);
router.patch('/:id/issue', authenticate, requireAdmin, issueBooking);
router.patch('/:id/return', authenticate, requireAdmin, returnBooking);
router.patch('/:id/cancel', authenticate, cancelBooking);

module.exports = router;