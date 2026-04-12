import { useEffect, useState } from 'react';
import api from '../api';

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([]);
  const [pickId, setPickId] = useState('');
  const [pickQty, setPickQty] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receipt, setReceipt] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data.data || []));
  }, []);

  const addLine = () => {
    setErr('');
    const id = parseInt(pickId, 10);
    const qty = parseInt(pickQty, 10);
    if (!id || qty < 1) {
      setErr('Choose a product and quantity.');
      return;
    }
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const existing = lines.find((l) => l.productId === id);
    if (existing) {
      setLines(lines.map((l) => (l.productId === id ? { ...l, quantity: l.quantity + qty } : l)));
    } else {
      setLines([...lines, { productId: id, name: p.name, sku: p.sku, unitPrice: p.unit_price, quantity: qty }]);
    }
    setPickQty('1');
  };

  const removeLine = (productId) => {
    setLines(lines.filter((l) => l.productId !== productId));
  };

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const checkout = async (e) => {
    e.preventDefault();
    setErr('');
    setReceipt(null);
    if (lines.length === 0) {
      setErr('Add at least one item.');
      return;
    }
    try {
      const { data } = await api.post('/billing/checkout', {
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customerName,
        paymentMethod,
      });
      setReceipt(data.data);
      setLines([]);
      setCustomerName('');
      const refreshed = await api.get('/products');
      setProducts(refreshed.data.data || []);
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message);
    }
  };

  return (
    <div>
      <h1>Billing (POS)</h1>
      <p className="muted">Build a cart and complete sale; inventory updates automatically.</p>
      {err && <p className="error-msg">{err}</p>}

      <div className="card">
        <h2>Add items</h2>
        <div className="form-row two">
          <div>
            <label>Product</label>
            <select value={pickId} onChange={(e) => setPickId(e.target.value)}>
              <option value="">Select…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} (stock {p.stock_qty}, ₹{Number(p.unit_price).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Quantity</label>
            <input type="number" min="1" value={pickQty} onChange={(e) => setPickQty(e.target.value)} />
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={addLine}>
          Add to bill
        </button>
      </div>

      <form className="card" onSubmit={checkout}>
        <h2>Current bill</h2>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Line</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.productId}>
                <td>{l.sku}</td>
                <td>{l.name}</td>
                <td>{l.quantity}</td>
                <td>₹{Number(l.unitPrice).toFixed(2)}</td>
                <td>₹{(l.unitPrice * l.quantity).toFixed(2)}</td>
                <td>
                  <button type="button" className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => removeLine(l.productId)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontWeight: 600, marginTop: '0.75rem' }}>Total: ₹{subtotal.toFixed(2)}</p>

        <div className="form-row two" style={{ marginTop: '1rem' }}>
          <div>
            <label>Customer name (optional)</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label>Payment method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
          Complete sale
        </button>
      </form>

      {receipt && (
        <div className="card" style={{ borderColor: 'var(--success)' }}>
          <h2>Sale complete</h2>
          <p>
            Invoice <strong>{receipt.invoice_no}</strong> · Total ₹{Number(receipt.total_amount).toFixed(2)}
          </p>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Line</th>
              </tr>
            </thead>
            <tbody>
              {(receipt.items || []).map((i) => (
                <tr key={i.id}>
                  <td>{i.product_name}</td>
                  <td>{i.quantity}</td>
                  <td>₹{Number(i.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
