# ⚡ InventoryHub — Enterprise Inventory System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0%2B-00f0ff.svg?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Oracle Database](https://img.shields.io/badge/Oracle-21c%20XE-F80000.svg?logo=oracle&logoColor=white)](https://oracle.com)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.0%2B-ffb700.svg?logo=chartdotjs&logoColor=white)](https://chartjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-00ff9d.svg)](LICENSE)

**InventoryHub** is a full-stack enterprise inventory and warehouse management web application with an **Enterprise Metallic Dark Glassmorphism UI**. Powered by **Flask**, **SQLAlchemy**, and **Oracle Database (SQL\*Plus / Oracle 21c XE)** via `oracledb`, it provides real-time inventory telemetry, automated low-stock reorder alerts via PL/SQL stored procedures, PL/SQL audit triggers, Chart.js analytics, and automated PDF report generation.

---

## 🌟 Key Features

- 🤖 **ML Sales & Profit Forecasting**: Scikit-Learn Ridge regression predicting 7, 14, and 30-day demand curves, profit & loss projections (COGS, holding storage, net profit), and automated prescriptive recommendations (EOQ batching, deadstock reduction, dynamic pricing).
- 🌌 **Enterprise Glassmorphism UI/UX**: Dark glass mesh background with ambient bloom, metallic 3D accent shapes, responsive sidebar navigation, fluid content zoom slider, and smooth micro-animations.
- 📦 **Product & Stock Management**: Full CRUD operations for products, warehouses, categories, and suppliers with dynamic stock level tracking.
- 🛒 **Purchase & Sales Orders**: Create and process multi-item purchase/sales orders with automatic stock deductions, popularity tracking, and inventory validation.
- 📈 **Real-time Analytics**: Interactive Chart.js graphs displaying inventory status distribution, category breakdown by value/units, product pricing, and order metrics.
- 📄 **Automated PDF Reports**: Instant download of formatted PDF reports for Inventory Status, Orders Summary, Product Analytics, and Database Schema.
- ⚙️ **Oracle SQL\*Plus & PL/SQL**: Complete DDL with Oracle `IDENTITY` columns, PL/SQL stored procedure (`sp_get_restock_list`), PL/SQL triggers (`trg_stock_audit`), and views (`users`, `orders`).
- 🛡️ **Audit Logging & Transaction History**: Complete audit trail tracking inventory movements and stock adjustments automatically via PL/SQL triggers.
- 🔍 **Live Search & Dynamic Modals**: Real-time table filtering, quick action buttons, and responsive modal forms.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | Python 3.10+, Flask, Flask-CORS |
| **Machine Learning** | Scikit-Learn, NumPy, Pandas (Ridge Regression, Time Series, EOQ) |
| **Database & Driver** | Oracle Database 21c (XE / EE), SQL\*Plus, `oracledb`, SQLAlchemy |
| **PDF Generation** | FPDF2 |
| **Frontend Architecture** | HTML5, Vanilla JavaScript (ES6+), CSS3 |
| **UI Theme** | Enterprise Dark Glassmorphism Design System |
| **Visualization** | Chart.js |
| **Typography & Icons** | Rubik, Inter, FontAwesome 6 |

---

## 📁 Project Structure

```
InventoryHub/
├── app.py                  # Main Flask backend application, routes, and PDF generators
├── models.py               # SQLAlchemy ORM models with Oracle Identity columns
├── requirements.txt        # Python package dependencies (including oracledb)
├── schema.sql              # Oracle SQL*Plus DDL, triggers, stored procedures & seed data
├── .env                    # Oracle Database connection configuration
├── README.md               # Project documentation
├── static/
│   ├── css/
│   │   └── style.css       # Enterprise Glassmorphism stylesheet and tokens
│   └── js/
│       └── main.js         # Frontend interactive logic, API client, and Chart.js integration
└── templates/
    └── index.html          # Main single-page application dashboard layout
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.10+** installed.
- **Oracle Database 21c XE** (or 12c/19c) with SQL\*Plus installed and running.

### 2. Database Setup via SQL\*Plus
Run the initialization script directly inside SQL\*Plus to create all tables, views, triggers, stored procedures, and initial seed data:

```bash
sqlplus system/ranse123@localhost:1521/XEPDB1 @schema.sql
```

### 3. Environment Configuration
Verify or edit `.env` in the project root:

```env
ORACLE_USER=system
ORACLE_PASSWORD=ranse123
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE=XEPDB1
FLASK_ENV=development
FLASK_DEBUG=True
```

### 4. Installation
Install the dependencies:

```bash
pip install -r requirements.txt
```

### 5. Run the Application
Start the Flask server:

```bash
python app.py
```

Open your browser and navigate to:  
👉 **`http://localhost:5000`**

---

## 📡 API Reference Endpoint Table

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Returns summary metrics, low stock items, and top products |
| `GET` / `POST` | `/api/products` | Retrieve all products or add a new product |
| `GET` / `PUT` / `DELETE` | `/api/products/<id>` | View, edit, or delete a specific product |
| `GET` / `POST` | `/api/categories` | Retrieve all categories or create a new category |
| `GET` / `PUT` / `DELETE` | `/api/categories/<id>` | View, edit, or delete a category |
| `GET` / `POST` | `/api/suppliers` | Retrieve all suppliers or create a new supplier |
| `GET` / `PUT` / `DELETE` | `/api/suppliers/<id>` | View, edit, or delete a supplier |
| `GET` / `POST` | `/api/stock` | Retrieve all inventory stock records or add a stock entry |
| `GET` / `PUT` / `DELETE` | `/api/stock/<id>` | View, edit, or delete a stock record |
| `GET` / `POST` | `/api/orders` | Retrieve all orders or process a new purchase/sale order |
| `DELETE` | `/api/orders/<id>` | Cancel / delete an order record |
| `GET` / `POST` | `/api/users` | List users or create a new user account |
| `PUT` / `DELETE` | `/api/users/<id>` | Update or delete a user account |
| `GET` | `/api/reports/<type>/pdf` | Generate and download PDF report (`inventory`, `orders`, `stock-valuation`, `product-analytics`) |
| `GET` | `/api/reports/restock-list` | Trigger low stock restock telemetry (via stored procedure `sp_get_restock_list`) |
| `GET` | `/api/reports/transaction-history` | Fetch recent stock movements |
| `GET` | `/api/reports/audit-logs` | Fetch system audit logs |
| `GET` | `/api/ml/forecast` | Scikit-Learn sales demand prediction, profit & loss analysis, and operational recommendations (`?days=7/14/30`) |

---

## 👤 Author

**Abijith Thennarasu**  
*VIT Chennai*

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
