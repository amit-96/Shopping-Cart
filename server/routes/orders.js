const express = require('express');
const { getDb } = require('../db');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, (req, res, next) => {
  try {
    const db = getDb();
    const orders = db
      .prepare(
        `SELECT po.*, u.username AS created_by_name
         FROM purchase_orders po
         LEFT JOIN users u ON u.id = po.created_by
         ORDER BY po.id DESC`
      )
      .all();
    res.json({ success: true, data: orders });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', protect, (req, res, next) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const items = db
      .prepare(
        `SELECT poi.*, p.name AS product_name, p.sku
         FROM purchase_order_items poi
         JOIN products p ON p.id = poi.product_id
         WHERE poi.order_id = ?`
      )
      .all(order.id);
    res.json({ success: true, data: { ...order, items } });
  } catch (e) {
    next(e);
  }
});

router.post('/', protect, authorize('admin'), (req, res, next) => {
  try {
    const { supplierName, notes, items } = req.body || {};
    if (!supplierName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'supplierName and non-empty items[] required',
      });
    }
    const db = getDb();
    const trx = db.transaction(() => {
      const r = db
        .prepare(
          `INSERT INTO purchase_orders (supplier_name, status, notes, created_by)
           VALUES (?, 'pending', ?, ?)`
        )
        .run(String(supplierName).slice(0, 120), String(notes || '').slice(0, 500), req.user.id);
      const orderId = r.lastInsertRowid;
      const ins = db.prepare(
        `INSERT INTO purchase_order_items (order_id, product_id, quantity, unit_cost)
         VALUES (?, ?, ?, ?)`
      );
      for (const line of items) {
        const productId = parseInt(line.productId, 10);
        const quantity = parseInt(line.quantity, 10);
        const unitCost = Number(line.unitCost);
        if (!productId || quantity < 1 || unitCost < 0) {
          throw new Error('Each line needs productId, quantity >= 1, unitCost >= 0');
        }
        const p = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
        if (!p) throw new Error(`Product ${productId} not found`);
        ins.run(orderId, productId, quantity, unitCost);
      }
      return orderId;
    });
    const orderId = trx();
    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(orderId);
    const orderItems = db
      .prepare(
        `SELECT poi.*, p.name AS product_name FROM purchase_order_items poi
         JOIN products p ON p.id = poi.product_id WHERE poi.order_id = ?`
      )
      .all(orderId);
    res.status(201).json({ success: true, data: { ...order, items: orderItems } });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/receive', protect, authorize('admin'), (req, res, next) => {
  try {
    const db = getDb();
    const orderId = parseInt(req.params.id, 10);
    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status === 'received') {
      return res.status(400).json({ success: false, message: 'Order already received' });
    }

    const trx = db.transaction(() => {
      const lines = db
        .prepare('SELECT * FROM purchase_order_items WHERE order_id = ?')
        .all(orderId);
      const updProduct = db.prepare(
        `UPDATE products SET stock_qty = stock_qty + ?, cost_price = ?, updated_at = datetime('now') WHERE id = ?`
      );
      for (const line of lines) {
        updProduct.run(line.quantity, line.unit_cost, line.product_id);
      }
      db.prepare(
        `UPDATE purchase_orders SET status = 'received', received_at = datetime('now') WHERE id = ?`
      ).run(orderId);
    });
    trx();
    const updated = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(orderId);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
