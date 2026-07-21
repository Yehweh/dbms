# ⚡ InventoryHub — Inventory Management System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0%2B-00f0ff.svg?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-ff007f.svg?logo=mysql&logoColor=white)](https://mysql.com)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.0%2B-ffb700.svg?logo=chartdotjs&logoColor=white)](https://chartjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-00ff9d.svg)](LICENSE)

**InventoryHub** is a high-performance, full-stack inventory and warehouse management web application featuring a **Retro Futuristic Synthwave / Cyberpunk HUD UI**. Built with **Flask**, **SQLAlchemy**, and **MySQL**, it offers real-time inventory telemetry, automated low-stock reorder triggers via stored procedures, detailed audit trails, interactive Chart.js analytics, and automated PDF report generation.

---

## 🌟 Key Features

- 🌌 **Retro Futuristic UI/UX**: Dark cyber void backdrop, neon cyan & magenta accents, glowing telemetry badges, glassmorphism paneling, and smooth micro-animations.
- 📦 **Product & Stock Management**: Full CRUD operations for products, warehouses, categories, and suppliers with dynamic stock level tracking.
- 🛒 **Purchase & Sales Orders**: Create and process multi-item purchase/sales orders with automatic stock deductions, popularity tracking, and inventory validation.
- 📈 **Real-time Analytics**: Interactive Chart.js graphs displaying inventory status distribution, category breakdown by value/units, product pricing, and order metrics.
- 📄 **Automated PDF Reports**: Instant client-side download of formatted PDF reports for Inventory Status, Orders Summary, Product Analytics, and Database Schema.
- ⚙️ **Stored Procedures & Advanced SQL**: Demonstrates MySQL Stored Procedures (`sp_get_restock_list`), complex JOINs, aggregation queries, and subqueries.
- 🛡️ **Audit Logging & Transaction History**: Complete audit trail tracking every insert, update, and delete action alongside transaction movement logs.
- 🔍 **Live Search & Column Sorting**: Global and view-specific real-time table filtering and ascending/descending column sorting.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | Python 3.10+, Flask, Flask-CORS |
| **Database & ORM** | MySQL 8.0, SQLAlchemy, PyMySQL |
| **PDF Generation** | FPDF / PyFPDF |
| **Frontend Architecture** | HTML5, Vanilla JavaScript (ES6+), CSS3 |
| **UI Theme** | Retro Futuristic Synthwave Design System |
| **Visualization** | Chart.js |
| **Typography & Icons** | Orbitron, Rajdhani, Space Grotesk, Fira Code, FontAwesome 6 |

---

## 📁 Project Structure

```
inventory_management/
├── app.py                  # Main Flask backend application, routes, and PDF generators
├── models.py               # SQLAlchemy ORM models and schema definitions
├── requirements.txt        # Python package dependencies
├── .env                    # Database configuration environment variables
├── README.md               # Project documentation
├── static/
│   ├── css/
│   │   └── style.css       # Retro Futuristic CSS stylesheet and design tokens
│   └── js/
│       └── main.js         # Frontend interactive logic, API client, and Chart.js integration
└── templates/
    └── index.html          # Main single-page application dashboard layout
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.10+** installed.
- **MySQL Server 8.0+** running locally or remotely.

### 2. Environment Configuration
Create or edit the `.env` file in the root directory:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=YourPasswordHere
MYSQL_DB=inventory_management
FLASK_ENV=development
FLASK_DEBUG=True
```

### 3. Installation
Activate your virtual environment and install the required dependencies:

```bash
# Windows PowerShell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

### 4. Run the Application
Start the Flask development server:

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
| `GET` | `/api/reports/<type>/pdf` | Generate and download PDF report (`inventory`, `orders`, `product-analytics`, `db-schema`) |
| `GET` | `/api/reports/restock-list` | Trigger low stock restock telemetry (via stored procedure `sp_get_restock_list`) |
| `GET` | `/api/reports/transaction-history` | Fetch recent stock movements |
| `GET` | `/api/reports/audit-logs` | Fetch system audit logs |

---

## 👤 Author

**Abijith Thennarasu**  
*VIT Chennai*

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
