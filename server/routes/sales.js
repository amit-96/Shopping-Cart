const express = require('express');
const { getDb } = require('../db');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, (req, res, next) => {
  try {
    const db = getDb();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const sales = db
      .prepare(
        `SELECT s.*, u.username AS created_by_name
         FROM sales s
         LEFT JOIN users u ON u.id = s.created_by
         ORDER BY s.id DESC LIMIT ? OFFSET ?`
      )
      .all(limit, offset);
    res.json({ success: true, data: sales });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', protect, (req, res, next) => {
  try {
    const db = getDb();
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    const items = db
      .prepare(
        `SELECT si.*, p.name AS product_name, p.sku
         FROM sale_items si
         JOIN products p ON p.id = si.product_id
         WHERE si.sale_id = ?`
      )
      .all(sale.id);
    res.json({ success: true, data: { ...sale, items } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
