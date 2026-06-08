const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/bookings - Create booking request
const createBooking = async (req, res) => {
  try {
    const { assetId, quantity, purpose, startDate, endDate } = req.body;

    if (!assetId || !quantity || !purpose || !startDate || !endDate) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ error: 'End date must be after start date.' });
    }
    if (start < new Date()) {
      return res.status(400).json({ error: 'Start date cannot be in the past.' });
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found.' });
    if (asset.status !== 'ACTIVE') return res.status(400).json({ error: 'Asset is not available for booking.' });

    // Check available quantity considering overlapping approved/issued bookings
    const overlapping = await prisma.booking.aggregate({
      where: {
        assetId,
        status: { in: ['APPROVED', 'ISSUED'] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } }
        ]
      },
      _sum: { quantity: true }
    });

    const bookedQty = overlapping._sum.quantity || 0;
    const freeQty = asset.totalQuantity - bookedQty;

    if (parseInt(quantity) > freeQty) {
      return res.status(400).json({
        error: `Only ${freeQty} unit(s) available for the selected dates.`,
        available: freeQty
      });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        assetId,
        quantity: parseInt(quantity),
        purpose,
        startDate: start,
        endDate: end,
        status: 'PENDING'
      },
      include: {
        asset: { select: { id: true, name: true, category: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        assetId,
        action: 'BOOKING_REQUESTED',
        details: `User ${req.user.name} requested ${quantity}x ${asset.name} from ${start.toDateString()} to ${end.toDateString()}`
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking', message: error.message });
  }
};

// GET /api/bookings - Get bookings (admin: all, user: own)
const getBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          asset: { select: { id: true, name: true, category: true, imageUrl: true } },
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.booking.count({ where })
    ]);

    res.json({ bookings, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings', message: error.message });
  }
};

// GET /api/bookings/:id
const getBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        asset: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user.role !== 'ADMIN' && booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking', message: error.message });
  }
};

// PATCH /api/bookings/:id/approve - Admin only
const approveBooking = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { asset: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot approve a booking with status: ${booking.status}` });
    }

    // Deduct from available quantity
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: req.params.id },
        data: { status: 'APPROVED', adminNote: adminNote || null }
      }),
      prisma.asset.update({
        where: { id: booking.assetId },
        data: { availableQty: { decrement: booking.quantity } }
      })
    ]);

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        assetId: booking.assetId,
        action: 'BOOKING_APPROVED',
        details: `Booking for ${booking.quantity}x ${booking.asset.name} approved by admin`
      }
    });

    const updated = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        asset: { select: { id: true, name: true, category: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve booking', message: error.message });
  }
};

// PATCH /api/bookings/:id/reject - Admin only
const rejectBooking = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot reject a booking with status: ${booking.status}` });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', adminNote: adminNote || 'Request rejected by admin' },
      include: {
        asset: { select: { id: true, name: true, category: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        assetId: booking.assetId,
        action: 'BOOKING_REJECTED',
        details: `Booking rejected. Note: ${adminNote || 'None'}`
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject booking', message: error.message });
  }
};

// PATCH /api/bookings/:id/issue - Admin marks as issued
const issueBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { asset: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only approved bookings can be issued.' });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'ISSUED', issuedAt: new Date() },
      include: {
        asset: { select: { id: true, name: true, category: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        assetId: booking.assetId,
        action: 'ASSET_ISSUED',
        details: `${booking.quantity}x ${booking.asset.name} issued to ${updated.user.name}`
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to issue booking', message: error.message });
  }
};

// PATCH /api/bookings/:id/return - Admin marks as returned
const returnBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { asset: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!['ISSUED', 'OVERDUE'].includes(booking.status)) {
      return res.status(400).json({ error: 'Only issued or overdue bookings can be returned.' });
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: req.params.id },
        data: { status: 'RETURNED', returnedAt: new Date() }
      }),
      prisma.asset.update({
        where: { id: booking.assetId },
        data: { availableQty: { increment: booking.quantity } }
      })
    ]);

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        assetId: booking.assetId,
        action: 'ASSET_RETURNED',
        details: `${booking.quantity}x ${booking.asset.name} returned`
      }
    });

    const updated = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        asset: { select: { id: true, name: true, category: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to return booking', message: error.message });
  }
};

// PATCH /api/bookings/:id/cancel - User cancels own pending booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!['PENDING', 'APPROVED'].includes(booking.status)) {
      return res.status(400).json({ error: 'This booking cannot be cancelled.' });
    }

    const ops = [
      prisma.booking.update({
        where: { id: req.params.id },
        data: { status: 'REJECTED', adminNote: 'Cancelled by user' }
      })
    ];

    // If approved, restore quantity
    if (booking.status === 'APPROVED') {
      ops.push(prisma.asset.update({
        where: { id: booking.assetId },
        data: { availableQty: { increment: booking.quantity } }
      }));
    }

    await prisma.$transaction(ops);
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking', message: error.message });
  }
};

// GET /api/bookings/audit - Admin only
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          asset: { select: { id: true, name: true } }
        }
      }),
      prisma.auditLog.count()
    ]);

    res.json({ logs, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs', message: error.message });
  }
};

module.exports = {
  createBooking, getBookings, getBooking,
  approveBooking, rejectBooking, issueBooking, returnBooking, cancelBooking,
  getAuditLogs
};