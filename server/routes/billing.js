const express = require('express');
const { getDb } = require('../db');
const { protect } = require('../middleware/auth');

const router = express.Router();

function nextInvoiceNo(db) {
  const row = db.prepare('SELECT COUNT(*) AS c FROM sales').get();
  const n = (row.c || 0) + 1;
  return `INV-${Date.now()}-${n}`;
}

router.post('/checkout', protect, (req, res, next) => {
  const db = getDb();
  const { items, customerName, paymentMethod } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one line item is required' });
  }

  const trx = db.transaction(() => {
    const invoiceNo = nextInvoiceNo(db);
    let total = 0;
    const lines = [];

    for (const line of items) {
      const productId = parseInt(line.productId, 10);
      const quantity = parseInt(line.quantity, 10);
      if (!productId || quantity < 1) {
        throw new Error('Each item needs productId and quantity >= 1');
      }
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
      if (!product) throw new Error(`Product ${productId} not found`);
      if (product.stock_qty < quantity) {
        throw new Error(`Insufficient stock for "${product.name}" (have ${product.stock_qty})`);
      }
      const unitPrice = Number(product.unit_price);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      total += lineTotal;
      lines.push({ product, quantity, unitPrice, lineTotal });
    }

    total = Math.round(total * 100) / 100;
    const pay = (paymentMethod || 'cash').toString().slice(0, 32);
    const cust = (customerName || '').toString().slice(0, 120);

    const r = db
      .prepare(
        `INSERT INTO sales (invoice_no, customer_name, payment_method, total_amount, created_by)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(invoiceNo, cust, pay, total, req.user.id);

    const saleId = r.lastInsertRowid;
    const insItem = db.prepare(
      `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, line_total)
       VALUES (?, ?, ?, ?, ?)`
    );
    const updStock = db.prepare(
      `UPDATE products SET stock_qty = stock_qty - ?, updated_at = datetime('now') WHERE id = ?`
    );

    for (const { product, quantity, unitPrice, lineTotal } of lines) {
      insItem.run(saleId, product.id, quantity, unitPrice, lineTotal);
      updStock.run(quantity, product.id);
    }

    return { saleId, invoiceNo, total };
  });

  try {
    const result = trx();
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(result.saleId);
    const saleItems = db
      .prepare(
        `SELECT si.*, p.name AS product_name, p.sku
         FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?`
      )
      .all(result.saleId);
    res.status(201).json({ success: true, data: { ...sale, items: saleItems } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Checkout failed' });
  }
});

module.exports = router;
