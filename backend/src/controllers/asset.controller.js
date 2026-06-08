const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/assets - list all assets with search/filter
const getAssets = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.asset.count({ where })
    ]);

    res.json({ assets, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets', message: error.message });
  }
};

// GET /api/assets/:id
const getAsset = async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: {
          where: { status: { in: ['APPROVED', 'ISSUED'] } },
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { startDate: 'asc' }
        }
      }
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch asset', message: error.message });
  }
};

// POST /api/assets - Admin only
const createAsset = async (req, res) => {
  try {
    const { name, category, description, totalQuantity, status, condition, imageUrl } = req.body;

    if (!name || !category || !totalQuantity) {
      return res.status(400).json({ error: 'Name, category, and quantity are required.' });
    }

    const qty = parseInt(totalQuantity);
    const asset = await prisma.asset.create({
      data: {
        name,
        category,
        description: description || '',
        totalQuantity: qty,
        availableQty: qty,
        status: status || 'ACTIVE',
        condition: condition || 'GOOD',
        imageUrl: imageUrl || null
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        assetId: asset.id,
        action: 'ASSET_CREATED',
        details: `Asset "${name}" created with quantity ${qty}`
      }
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create asset', message: error.message });
  }
};

// PUT /api/assets/:id - Admin only
const updateAsset = async (req, res) => {
  try {
    const { name, category, description, totalQuantity, status, condition, imageUrl } = req.body;

    const existing = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Asset not found' });

    // Recalculate available quantity if total changes
    let availableQty = existing.availableQty;
    if (totalQuantity !== undefined) {
      const diff = parseInt(totalQuantity) - existing.totalQuantity;
      availableQty = Math.max(0, existing.availableQty + diff);
    }

    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(totalQuantity && { totalQuantity: parseInt(totalQuantity), availableQty }),
        ...(status && { status }),
        ...(condition && { condition }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        assetId: asset.id,
        action: 'ASSET_UPDATED',
        details: `Asset "${asset.name}" updated`
      }
    });

    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update asset', message: error.message });
  }
};

// DELETE /api/assets/:id - Admin only
const deleteAsset = async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const activeBookings = await prisma.booking.count({
      where: { assetId: req.params.id, status: { in: ['APPROVED', 'ISSUED', 'PENDING'] } }
    });
    if (activeBookings > 0) {
      return res.status(400).json({ error: 'Cannot delete asset with active bookings.' });
    }

    await prisma.booking.deleteMany({ where: { assetId: req.params.id } });
    await prisma.auditLog.deleteMany({ where: { assetId: req.params.id } });
    await prisma.asset.delete({ where: { id: req.params.id } });

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete asset', message: error.message });
  }
};

// GET /api/assets/categories/list
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.asset.findMany({
      select: { category: true },
      distinct: ['category']
    });
    res.json(categories.map(c => c.category));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

module.exports = { getAssets, getAsset, createAsset, updateAsset, deleteAsset, getCategories };