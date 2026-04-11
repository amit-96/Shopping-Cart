const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Logic to fetch all products
        res.status(200).json({ message: 'Get all products' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        // Logic to create a new product
        res.status(201).json({ message: 'Product created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        // Logic to update a product
        res.status(200).json({ message: 'Product updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        // Logic to delete a product
        res.status(204).json();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get low stock products
// @route   GET /low-stock
// @access  Public
router.get('/low-stock', async (req, res) => {
    try {
        // Logic to fetch low stock products
        res.status(200).json({ message: 'Get low stock products' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get product categories
// @route   GET /categories
// @access  Public
router.get('/categories', async (req, res) => {
    try {
        // Logic to fetch product categories
        res.status(200).json({ message: 'Get product categories' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;