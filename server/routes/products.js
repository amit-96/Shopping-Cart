const express = require('express');
const { getDb } = require('../db');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/low-stock', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT * FROM products WHERE stock_qty <= reorder_level ORDER BY stock_qty ASC, name`
      )
      .all();
    res.json({ success: true, data: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/categories', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
    res.json({ success: true, data: rows.map((r) => r.category) });
  } catch (e) {
    next(e);
  }
});

router.get('/search', (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) {
      return res.json({ success: true, data: [] });
    }
    const db = getDb();
    const like = `%${q}%`;
    const rows = db
      .prepare(
        `SELECT * FROM products
         WHERE name LIKE ? OR sku LIKE ? OR category LIKE ?
         ORDER BY name LIMIT 50`
      )
      .all(like, like, like);
    res.json({ success: true, data: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
});

router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const category = req.query.category;
    let rows;
    if (category) {
      rows = db
        .prepare('SELECT * FROM products WHERE category = ? ORDER BY name')
        .all(String(category));
    } else {
      rows = db.prepare('SELECT * FROM products ORDER BY name').all();
    }
    res.json({ success: true, data: rows });
  } catch (e) {
    next(e);
  }
});

router.post('/', protect, authorize('admin'), (req, res, next) => {
  try {
    const {
      sku,
      name,
      description,
      category,
      unitPrice,
      costPrice,
      stockQty,
      reorderLevel,
    } = req.body || {};
    if (!sku || !name) {
      return res.status(400).json({ success: false, message: 'sku and name are required' });
    }
    const db = getDb();
    const r = db
      .prepare(
        `INSERT INTO products (sku, name, description, category, unit_price, cost_price, stock_qty, reorder_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(sku).slice(0, 64),
        String(name).slice(0, 200),
        String(description || '').slice(0, 2000),
        String(category || 'General').slice(0, 100),
        Number(unitPrice) || 0,
        Number(costPrice) || 0,
        parseInt(stockQty, 10) || 0,
        parseInt(reorderLevel, 10) || 10
      );
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    if (e && e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, message: 'SKU already exists' });
    }
    next(e);
  }
});

router.put('/:id', protect, authorize('admin'), (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const b = req.body || {};
    const sku = b.sku != null ? String(b.sku).slice(0, 64) : existing.sku;
    const name = b.name != null ? String(b.name).slice(0, 200) : existing.name;
    const description = b.description != null ? String(b.description).slice(0, 2000) : existing.description;
    const category = b.category != null ? String(b.category).slice(0, 100) : existing.category;
    const unit_price = b.unitPrice != null ? Number(b.unitPrice) : existing.unit_price;
    const cost_price = b.costPrice != null ? Number(b.costPrice) : existing.cost_price;
    const stock_qty = b.stockQty != null ? parseInt(b.stockQty, 10) : existing.stock_qty;
    const reorder_level = b.reorderLevel != null ? parseInt(b.reorderLevel, 10) : existing.reorder_level;

    db.prepare(
      `UPDATE products SET sku = ?, name = ?, description = ?, category = ?, unit_price = ?, cost_price = ?,
       stock_qty = ?, reorder_level = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(sku, name, description, category, unit_price, cost_price, stock_qty, reorder_level, id);
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ success: true, data: row });
  } catch (e) {
    if (e && e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, message: 'SKU already exists' });
    }
    next(e);
  }
});

router.delete('/:id', protect, authorize('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const r = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if (r.changes === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
