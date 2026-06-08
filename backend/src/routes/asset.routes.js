const express = require('express');
const router = express.Router();
const { getAssets, getAsset, createAsset, updateAsset, deleteAsset, getCategories } = require('../controllers/asset.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', authenticate, getAssets);
router.get('/categories/list', authenticate, getCategories);
router.get('/:id', authenticate, getAsset);
router.post('/', authenticate, requireAdmin, createAsset);
router.put('/:id', authenticate, requireAdmin, updateAsset);
router.delete('/:id', authenticate, requireAdmin, deleteAsset);

module.exports = router;