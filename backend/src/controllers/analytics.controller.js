const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/analytics/dashboard
const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalAssets,
      totalUsers,
      totalBookings,
      pendingBookings,
      activeBookings,
      overdueBookings,
      assetsByCategory,
      bookingsByStatus,
      recentBookings,
      topAssets,
      monthlyBookings
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: { in: ['APPROVED', 'ISSUED'] } } }),
      prisma.booking.count({ where: { status: 'OVERDUE' } }),

      // Assets by category
      prisma.asset.groupBy({ by: ['category'], _count: { id: true } }),

      // Bookings by status
      prisma.booking.groupBy({ by: ['status'], _count: { id: true } }),

      // Recent bookings
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: { select: { name: true, category: true } },
          user: { select: { name: true, email: true } }
        }
      }),

      // Top 5 most booked assets
      prisma.booking.groupBy({
        by: ['assetId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),

      // Monthly bookings (last 6 months)
      prisma.booking.findMany({
        where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
        select: { createdAt: true, status: true }
      })
    ]);

    // Enrich top assets with names
    const topAssetsEnriched = await Promise.all(
      topAssets.map(async (ta) => {
        const asset = await prisma.asset.findUnique({
          where: { id: ta.assetId },
          select: { name: true, category: true }
        });
        return { ...ta, asset };
      })
    );

    // Process monthly data
    const monthlyMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: key, count: 0 };
    }
    monthlyBookings.forEach(b => {
      const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) monthlyMap[key].count++;
    });

    res.json({
      summary: {
        totalAssets,
        totalUsers,
        totalBookings,
        pendingBookings,
        activeBookings,
        overdueBookings
      },
      assetsByCategory: assetsByCategory.map(c => ({ name: c.category, value: c._count.id })),
      bookingsByStatus: bookingsByStatus.map(b => ({ name: b.status, value: b._count.id })),
      recentBookings,
      topAssets: topAssetsEnriched.map(ta => ({
        name: ta.asset?.name || 'Unknown',
        category: ta.asset?.category || '',
        bookings: ta._count.id
      })),
      monthlyTrend: Object.values(monthlyMap)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
  }
};

// GET /api/analytics/utilization
const getUtilization = async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        bookings: {
          where: { status: { in: ['APPROVED', 'ISSUED', 'RETURNED'] } }
        }
      }
    });

    const utilization = assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      totalQty: asset.totalQuantity,
      availableQty: asset.availableQty,
      utilizationRate: asset.totalQuantity > 0
        ? Math.round(((asset.totalQuantity - asset.availableQty) / asset.totalQuantity) * 100)
        : 0,
      totalBookings: asset.bookings.length
    }));

    res.json(utilization);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch utilization', message: error.message });
  }
};

module.exports = { getDashboard, getUtilization };