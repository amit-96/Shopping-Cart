# Shopping Mall Management System

Automated **shopping mall** back-office: product register, sales register, stock-aware billing, purchase orders (restocking), product lookup, and printable **rate lists**. Data is stored in a local **SQLite** database for long-term retention and easy backup (`data/mall.sqlite`).

## Objectives covered

- **Product register** — SKU, name, category, cost/sell price, stock, reorder level; search and filter.
- **Sales register** — Every checkout creates an invoice and line items; view history and line detail.
- **Product information** — Search by name, SKU, or category; open a single product from the register.
- **Order making** — Purchase orders to suppliers; **Receive stock** updates inventory and cost.
- **Rate list** — Category filter, print-friendly view, CSV export.

## Stack

- **Backend:** Node.js, Express, better-sqlite3, JWT auth, bcryptjs  
- **Frontend:** React (Vite), React Router, Axios

## Prerequisites

- Node.js **18+**
- npm

## Setup

1. From the project root, install dependencies:

   ```bash
   npm install
   npm install --prefix client
   ```

2. Copy environment file and set a strong JWT secret for production:

   ```bash
   copy .env.example .env
   ```

3. Start **API + UI** together (two processes):

   ```bash
   npm run dev
   ```

   - API: `http://localhost:5000`
   - UI: `http://localhost:5173` (proxies `/api` to the server)

4. Open the UI and sign in. On first server start the database is created and seeded:

   - **Username:** `admin`  
   - **Password:** `admin123`

## Production build

```bash
npm install --prefix client
npm run build --prefix client
npm start
```

Serve the built UI from the same origin as the API (static files from `client/dist` when present).

## API overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Products | `GET/POST /api/products`, `PUT/DELETE /api/products/:id`, `GET /api/products/search`, `GET /api/products/low-stock`, `GET /api/products/categories` |
| Billing | `POST /api/billing/checkout` |
| Sales | `GET /api/sales`, `GET /api/sales/:id` |
| Purchase orders | `GET/POST /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/receive` |
| Reports | `GET /api/reports/dashboard`, `GET /api/reports/rate-list`, `GET /api/reports/rate-list.csv` |

Admin-only: product create/update/delete, purchase order create/receive. Billing and sales views require any signed-in user.

## License

Use and modify for your coursework or internal use as needed.
