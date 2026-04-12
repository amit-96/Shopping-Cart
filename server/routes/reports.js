const express = require('express');
const { getDb } = require('../db');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/rate-list', protect, (req, res, next) => {
  try {
    const db = getDb();
    const category = req.query.category;
    let rows;
    if (category) {
      rows = db
        .prepare(
          `SELECT sku, name, category, unit_price, stock_qty
           FROM products WHERE category = ? ORDER BY category, name`
        )
        .all(String(category));
    } else {
      rows = db
        .prepare(
          `SELECT sku, name, category, unit_price, stock_qty FROM products ORDER BY category, name`
        )
        .all();
    }
    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      data: rows,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/rate-list.csv', protect, (req, res, next) => {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT sku, name, category, unit_price, stock_qty FROM products ORDER BY category, name`
      )
      .all();
    const header = 'SKU,Name,Category,Unit Price,Stock Qty\n';
    const body = rows
      .map((r) => {
        const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
        return [r.sku, r.name, r.category, r.unit_price, r.stock_qty].map(esc).join(',');
      })
      .join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rate-list.csv"');
    res.send(header + body);
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard', protect, (req, res, next) => {
  try {
    const db = getDb();
    const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
    const lowStock = db
      .prepare('SELECT COUNT(*) AS c FROM products WHERE stock_qty <= reorder_level')
      .get().c;
    const todaySales = db
      .prepare(
        `SELECT IFNULL(SUM(total_amount), 0) AS s FROM sales
         WHERE date(created_at) = date('now')`
      )
      .get().s;
    const pendingOrders = db
      .prepare(`SELECT COUNT(*) AS c FROM purchase_orders WHERE status = 'pending'`)
      .get().c;
    res.json({
      success: true,
      data: {
        productCount,
        lowStockCount: lowStock,
        todaySalesTotal: todaySales,
        pendingPurchaseOrders: pendingOrders,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
