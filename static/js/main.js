// ===================================
// INVENTORYHUB - PROFESSIONAL SYSTEM
// ===================================

const API_BASE = "/api";

// State
let currentView = "dashboard";
let currentEditingType = null;
let currentEditingId = null;
let mainChart = null;
let analyticsData = {};

// Currency formatter for Indian Rupees
const formatRupees = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// DOM
const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const pageTitle = document.getElementById("page-title");
const addBtn = document.getElementById("add-btn");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalForm = document.getElementById("modal-form");
const modalFields = document.getElementById("modal-fields");
const modalCancel = document.getElementById("modal-cancel");
const modalClose = document.getElementById("modal-close");

// ==================== NAVIGATION ====================
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    switchView(item.dataset.view);
  });
});

function switchView(view) {
  currentView = view;
  views.forEach((v) => v.classList.remove("active"));
  const viewElement = document.getElementById(`${view}-view`);
  if (viewElement) {
    viewElement.classList.add("active");
  }

  // Close mobile sidebar if open
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("open");

  const titles = {
    dashboard: "Dashboard Overview",
    products: "Product Catalog",
    categories: "Categories Management",
    suppliers: "Suppliers Directory",
    stock: "Inventory & Warehouse Stock",
    orders: "Purchase & Sales Orders",
    users: "User Accounts & Access",
    reports: "PDF Reports & Exports",
    analytics: "Real-time Analytics & Charts",
    summary: "Warehouse Valuation Summary",
    restock: "Restock Telemetry",
    history: "Audit & Transaction Logs",
  };
  pageTitle.textContent = titles[view] || "Dashboard";

  if (
    [
      "dashboard",
      "reports",
      "analytics",
      "summary",
      "restock",
      "history",
    ].includes(view)
  ) {
    addBtn.style.display = "none";
  } else {
    addBtn.style.display = "inline-flex";
  }

  loadViewData(view);
}

// ==================== MODAL ====================
function openModal(type, data = null) {
  currentEditingType = type;
  if (data) {
    if (data.quantity_available === undefined && data.quantity !== undefined) {
      data.quantity_available = data.quantity;
    }
  }
  currentEditingId =
    data?.itemId || data?.stock_id || data?.user_id || data?.order_id || data?.category_id || data?.supplier_id || data?.id || null;
  modalTitle.textContent = data ? `Edit ${type}` : `Add New ${type}`;
  modalFields.innerHTML = getFormFields(type, data);
  modal.classList.add("active");

  if (type === "Product") {
    loadProductOptions(data);
  } else if (type === "Order") {
    loadOrderOptions(data);
  } else if (type === "Stock") {
    loadStockOptions(data);
  }
}

function closeModal() {
  modal.classList.remove("active");
  modalFields.innerHTML = "";
  currentEditingType = null;
  currentEditingId = null;
}

modalCancel?.addEventListener("click", closeModal);
modalClose?.addEventListener("click", closeModal);

// ==================== FORM FIELDS ====================
function getFormFields(type, data = null) {
  if (type === "Audit Detail" && data) {
    let oldVals = null;
    let newVals = null;
    try {
      oldVals = data.old_values ? JSON.parse(data.old_values) : null;
    } catch (e) {
      oldVals = null;
    }
    try {
      newVals = data.new_values ? JSON.parse(data.new_values) : null;
    } catch (e) {
      newVals = null;
    }

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldVals || {}),
      ...Object.keys(newVals || {}),
    ]);

    let html = `<div class="audit-detail-modal">
        <div class="audit-meta">
            <p><strong>Table:</strong> ${data.table_name}</p>
            <p><strong>Action:</strong> <span class="status-badge">${data.action}</span></p>
            <p><strong>Changed By:</strong> ${data.changed_by}</p>
            <p><strong>Date:</strong> ${data.changed_at ? new Date(data.changed_at).toLocaleString() : ''}</p>
        </div>
        <table class="modern-table audit-diff-table">
            <thead>
                <tr>
                    <th>Field</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                </tr>
            </thead>
            <tbody>`;

    allKeys.forEach((key) => {
      const oldV = oldVals ? oldVals[key] : "-";
      const newV = newVals ? newVals[key] : "-";
      const isChanged = JSON.stringify(oldV) !== JSON.stringify(newV);

      html += `
            <tr class="${isChanged ? "row-changed" : ""}">
                <td><strong>${key}</strong></td>
                <td class="val-old">${oldV === null ? "<em>null</em>" : oldV}</td>
                <td class="val-new">${newV === null ? "<em>null</em>" : newV}</td>
            </tr>`;
    });

    html += `</tbody></table></div>`;

    // Hide modal footer for details
    setTimeout(() => {
      const footer = document.querySelector(".modal-footer");
      if (footer) footer.style.display = "none";
    }, 0);

    return html;
  }

  // Restore footer for other types
  const footer = document.querySelector(".modal-footer");
  if (footer) footer.style.display = "flex";

  const fields = {
    Product: [
      {
        name: "item_name",
        label: "Product Name",
        type: "text",
        required: true,
      },
      { name: "sku", label: "SKU", type: "text", required: true },
      {
        name: "category_name",
        label: "Category",
        type: "text",
        required: true,
        list: "category-datalist",
        id: "product-category-input"
      },
      {
        name: "supplier_name",
        label: "Supplier",
        type: "text",
        required: true,
        list: "supplier-datalist",
        id: "product-supplier-input"
      },
      {
        name: "price",
        label: "Price (₹)",
        type: "number",
        required: true,
        step: "0.01",
      },
      {
        name: "quantity_available",
        label: "Stock Quantity",
        type: "number",
        required: true,
      },
    ],
    Category: [
      {
        name: "category_name",
        label: "Category Name",
        type: "text",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        type: "text",
        required: false,
      },
    ],
    Supplier: [
      {
        name: "supplier_name",
        label: "Supplier Name",
        type: "text",
        required: true,
      },
      {
        name: "contact_no",
        label: "Contact Phone",
        type: "text",
        required: false,
      },
      {
        name: "address",
        label: "Address / Details",
        type: "text",
        required: false,
      },
    ],
    Stock: [
      {
        name: "item_id",
        label: "Product",
        type: "select",
        options: [],
        required: true,
        id: "stock-item-select",
      },
      { name: "warehouse", label: "Warehouse", type: "text", required: true },
      {
        name: "quantity_available",
        label: "Quantity",
        type: "number",
        required: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Healthy", "Critical", "Warning", "Out of Stock"],
        required: true,
      },
    ],
    User: [
      { name: "username", label: "Username", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      {
        name: "role",
        label: "Role",
        type: "select",
        options: ["USER", "MANAGER", "ADMIN"],
        required: true,
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        required: !data,
      },
    ],
    Order: [
      {
        name: "user_id",
        label: "Customer/User",
        type: "select",
        options: [],
        required: true,
        id: "order-user-select",
      },
      {
        name: "item_id",
        label: "Product",
        type: "select",
        options: [],
        required: true,
        id: "order-item-select",
      },
      {
        name: "quantity",
        label: "Quantity",
        type: "number",
        required: true,
        min: 1,
      },
      {
        name: "price",
        label: "Unit Price (₹)",
        type: "number",
        required: true,
        step: "0.01",
        id: "order-price-input",
      },
      {
        name: "order_type",
        label: "Type",
        type: "select",
        options: ["SALE", "PURCHASE"],
        required: true,
      },
    ],
  };

  let html = '<div class="form-grid">';
  const formFields = fields[type] || [];

  formFields.forEach((field) => {
    const value = data ? (data[field.name] !== undefined ? data[field.name] : "") : "";
    html += `<div class="form-group">
          <label>${field.label}</label>`;

    if (field.type === "select") {
      html += `<select name="${field.name}" id="${field.id || ""}" ${field.required ? "required" : ""}>
            <option value="">Select ${field.label}</option>`;
      field.options.forEach((opt) => {
        html += `<option value="${opt}" ${value === opt ? "selected" : ""}>${opt}</option>`;
      });
      html += `</select>`;
    } else {
      const step = field.step ? `step="${field.step}"` : "";
      const min = field.min !== undefined ? `min="${field.min}"` : "";
      const list = field.list ? `list="${field.list}"` : "";
      html += `<input type="${field.type}" id="${field.id || ""}" name="${field.name}" value="${value}" ${field.required ? "required" : ""} ${step} ${min} ${list}>`;
    }

    html += `</div>`;
  });

  html += "</div>";
  return html;
}

// ==================== PRODUCT DATALISTS ====================
async function loadProductOptions(data = null) {
  try {
    const [categories, suppliers] = await Promise.all([
      fetch(`${API_BASE}/categories`).then((r) => r.json()),
      fetch(`${API_BASE}/suppliers`).then((r) => r.json()),
    ]);

    let catDatalist = document.getElementById("category-datalist");
    if (!catDatalist) {
      catDatalist = document.createElement("datalist");
      catDatalist.id = "category-datalist";
      document.body.appendChild(catDatalist);
    }
    catDatalist.innerHTML = categories.map((c) => `<option value="${c.category_name}"></option>`).join("");

    let supDatalist = document.getElementById("supplier-datalist");
    if (!supDatalist) {
      supDatalist = document.createElement("datalist");
      supDatalist.id = "supplier-datalist";
      document.body.appendChild(supDatalist);
    }
    supDatalist.innerHTML = suppliers.map((s) => `<option value="${s.supplier_name}"></option>`).join("");
  } catch (error) {
    console.error("Error loading product options:", error);
  }
}

// ==================== FORM SUBMISSION ====================
modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(modalForm);
  const data = Object.fromEntries(formData);

  try {
    const endpoint = getEndpoint(currentEditingType);
    const url = currentEditingId
      ? `${API_BASE}/${endpoint}/${currentEditingId}`
      : `${API_BASE}/${endpoint}`;

    const method = currentEditingId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to save");
    }

    closeModal();
    loadViewData(currentView);
    showNotification("Saved successfully!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
});

async function loadOrderOptions(data = null) {
  try {
    const [users, products] = await Promise.all([
      fetch(`${API_BASE}/users`).then((r) => r.json()),
      fetch(`${API_BASE}/products`).then((r) => r.json()),
    ]);

    const userSelect = document.getElementById("order-user-select");
    const itemSelect = document.getElementById("order-item-select");
    const priceInput = document.getElementById("order-price-input");

    if (userSelect) {
      userSelect.innerHTML =
        '<option value="">Select Customer</option>' +
        users
          .map((u) => `<option value="${u.user_id}">${u.username}</option>`)
          .join("");
      if (data && data.user_id) {
        userSelect.value = data.user_id;
      }
    }

    if (itemSelect) {
      itemSelect.innerHTML =
        '<option value="">Select Product</option>' +
        products
          .map(
            (p) =>
              `<option value="${p.itemId}" data-price="${p.price}">${p.item_name} (${p.sku})</option>`,
          )
          .join("");

      if (data && data.item_id) {
        itemSelect.value = data.item_id;
      }

      itemSelect.addEventListener("change", (e) => {
        const selected = e.target.options[e.target.selectedIndex];
        if (selected && selected.dataset.price && priceInput) {
          priceInput.value = selected.dataset.price;
        }
      });
    }
  } catch (error) {
    console.error("Error loading order options:", error);
  }
}

async function loadStockOptions(data = null) {
  try {
    const products = await fetch(`${API_BASE}/products`).then((r) => r.json());
    const stockItemSelect = document.getElementById("stock-item-select");
    if (stockItemSelect) {
      stockItemSelect.innerHTML =
        '<option value="">Select Product</option>' +
        products
          .map(
            (p) =>
              `<option value="${p.itemId}">${p.item_name} (${p.sku})</option>`,
          )
          .join("");
      if (data && data.item_id) {
        stockItemSelect.value = data.item_id;
      }
    }
  } catch (error) {
    console.error("Error loading stock options:", error);
  }
}

function getEndpoint(type) {
  const endpoints = {
    Product: "products",
    Category: "categories",
    Supplier: "suppliers",
    Stock: "stock",
    User: "users",
    Order: "orders",
  };
  return endpoints[type] || "";
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE}/dashboard`);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const data = await response.json();

    if (document.getElementById("metric-revenue"))
      document.getElementById("metric-revenue").textContent = formatRupees(
        data.metrics.revenue,
      );
    if (document.getElementById("metric-orders"))
      document.getElementById("metric-orders").textContent =
        data.metrics.activeOrders;
    if (document.getElementById("metric-inventory"))
      document.getElementById("metric-inventory").textContent = formatRupees(
        data.metrics.inventoryValue,
      );
    if (document.getElementById("metric-units"))
      document.getElementById("metric-units").textContent =
        data.metrics.inventoryUnits;

    // Low stock
    const lowStockBody = document.getElementById("low-stock-body");
    if (lowStockBody) {
      lowStockBody.innerHTML = (data.lowStock || [])
        .map(
          (item) => `
              <tr>
                <td><strong>${item.item_name}</strong></td>
                <td>${item.sku}</td>
                <td>${item.warehouse}</td>
                <td><strong>${item.units}</strong></td>
                <td><span class="status-badge status-badge-${item.status.toLowerCase().replace(" ", "-")}">${item.status}</span></td>
              </tr>
            `,
        )
        .join("");
    }

    // Top selling with corrected progress bar
    const topSellingBody = document.getElementById("top-selling-body");
    if (topSellingBody) {
      const items = data.topSelling || [];
      const maxPop = Math.max(...items.map((i) => i.unitsSold || 0), 1);
      topSellingBody.innerHTML = items
        .map(
          (item) => `
              <tr>
                <td><strong>${item.item_name}</strong></td>
                <td>${item.sku}</td>
                <td>${item.unitsSold || 0}</td>
                <td>
                  <div class="popularity-bar">
                    <div style="width: ${((item.unitsSold || 0) / maxPop) * 100}%; background: var(--primary);"></div>
                  </div>
                </td>
              </tr>
            `,
        )
        .join("");
    }

    updateNotifications();
  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

// ==================== PRODUCTS ====================
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const products = await response.json();

    const tbody = document.getElementById("products-body");
    if (!tbody) return;

    const maxPop = Math.max(...products.map((p) => p.popularity || 0), 1);

    tbody.innerHTML = products
      .map(
        (p) => `
          <tr>
            <td><strong>${p.item_name}</strong></td>
            <td>${p.sku}</td>
            <td>${p.category_name || "N/A"}</td>
            <td><span class="status-badge ${p.quantity < 10 ? "status-badge-critical" : "status-badge-healthy"}">${p.quantity}</span></td>
            <td>${formatRupees(p.price)}</td>
            <td>
              <div class="popularity-bar">
                <div style="width: ${((p.popularity || 0) / maxPop) * 100}%; background: #088638;"></div>
              </div>
              <small>${p.popularity || 0}</small>
            </td>
            <td>
              <button class="btn-warning" onclick="editProduct(${p.itemId})">Edit</button>
              <button class="btn-danger" onclick="deleteProduct(${p.itemId})">Delete</button>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Products load error:", error);
  }
}

function editProduct(id) {
  fetch(`${API_BASE}/products/${id}`)
    .then((r) => r.json())
    .then((product) => {
      openModal("Product", product);
    });
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  try {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete");
    loadProducts();
    showNotification("Product deleted!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// ==================== CATEGORIES ====================
async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE}/categories`);
    const categories = await response.json();

    const tbody = document.getElementById("categories-body");
    if (!tbody) return;

    if (!categories.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">No categories found</td></tr>';
      return;
    }

    tbody.innerHTML = categories
      .map(
        (c) => `
          <tr>
            <td><strong>#${c.category_id}</strong></td>
            <td><strong>${c.category_name}</strong></td>
            <td>${c.description || "-"}</td>
            <td>
              <button class="btn-warning" onclick="editCategory(${c.category_id})">Edit</button>
              <button class="btn-danger" onclick="deleteCategory(${c.category_id})">Delete</button>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Categories load error:", error);
  }
}

function editCategory(id) {
  fetch(`${API_BASE}/categories/${id}`)
    .then((r) => r.json())
    .then((cat) => {
      openModal("Category", cat);
    });
}

async function deleteCategory(id) {
  if (!confirm("Delete this category?")) return;
  try {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete category");
    loadCategories();
    showNotification("Category deleted!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// ==================== SUPPLIERS ====================
async function loadSuppliers() {
  try {
    const response = await fetch(`${API_BASE}/suppliers`);
    const suppliers = await response.json();

    const tbody = document.getElementById("suppliers-body");
    if (!tbody) return;

    if (!suppliers.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#888;">No suppliers found</td></tr>';
      return;
    }

    tbody.innerHTML = suppliers
      .map(
        (s) => `
          <tr>
            <td><strong>#${s.supplier_id}</strong></td>
            <td><strong>${s.supplier_name}</strong></td>
            <td>${s.contact_no || "-"}</td>
            <td>${s.address || "-"}</td>
            <td>
              <button class="btn-warning" onclick="editSupplier(${s.supplier_id})">Edit</button>
              <button class="btn-danger" onclick="deleteSupplier(${s.supplier_id})">Delete</button>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Suppliers load error:", error);
  }
}

function editSupplier(id) {
  fetch(`${API_BASE}/suppliers/${id}`)
    .then((r) => r.json())
    .then((sup) => {
      openModal("Supplier", sup);
    });
}

async function deleteSupplier(id) {
  if (!confirm("Delete this supplier?")) return;
  try {
    const response = await fetch(`${API_BASE}/suppliers/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete supplier");
    loadSuppliers();
    showNotification("Supplier deleted!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// ==================== STOCK ====================
async function loadStock() {
  try {
    const response = await fetch(`${API_BASE}/stock`);
    const stocks = await response.json();

    const tbody = document.getElementById("stock-body");
    if (!tbody) return;

    tbody.innerHTML = stocks
      .map(
        (s) => `
          <tr>
            <td><strong>${s.item_name}</strong></td>
            <td>${s.sku}</td>
            <td>${s.warehouse}</td>
            <td><strong>${s.quantity}</strong></td>
            <td>${formatRupees(s.price)}</td>
            <td><strong>${formatRupees(s.price * s.quantity)}</strong></td>
            <td><span class="status-badge status-badge-${s.status ? s.status.toLowerCase() : "healthy"}">${s.status || "Healthy"}</span></td>
            <td>${new Date(s.last_updated || Date.now()).toLocaleDateString()}</td>
            <td>
              <button class="btn-warning" onclick="editStock(${s.stock_id})">Edit</button>
              <button class="btn-danger" onclick="deleteStock(${s.stock_id})">Delete</button>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading stock:", error);
  }
}

function editStock(id) {
  fetch(`${API_BASE}/stock/${id}`)
    .then((r) => r.json())
    .then((stock) => {
      openModal("Stock", stock);
    });
}

async function deleteStock(id) {
  if (!confirm("Delete this stock entry?")) return;
  try {
    await fetch(`${API_BASE}/stock/${id}`, { method: "DELETE" });
    loadStock();
    showNotification("Stock deleted!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// ==================== ORDERS ====================
async function loadOrders() {
  try {
    const response = await fetch(`${API_BASE}/orders`);
    const data = await response.json();

    const tbody = document.getElementById("orders-body");
    if (!tbody) return;

    tbody.innerHTML = (data.orders || [])
      .map(
        (o) => `
          <tr>
            <td><strong>${o.id}</strong></td>
            <td>${o.user || "N/A"}</td>
            <td><span class="status-badge">${o.type}</span></td>
            <td>${new Date(o.date).toLocaleDateString()}</td>
            <td><span class="status-badge status-badge-healthy">Completed</span></td>
            <td>
              <button class="btn-danger" onclick="deleteOrder('${o.id}')">Delete</button>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading orders:", error);
  }
}

async function deleteOrder(id) {
  if (!confirm("Delete this order?")) return;
  try {
    await fetch(`${API_BASE}/orders/${id}`, { method: "DELETE" });
    loadOrders();
    showNotification("Order deleted!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// ==================== USERS ====================
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/users`);
    const users = await response.json();

    const tbody = document.getElementById("users-body");
    if (!tbody) return;

    tbody.innerHTML = users
      .map(
        (u) => `
          <tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.email}</td>
            <td><span class="status-badge">${u.role}</span></td>
            <td>
              <button class="btn-warning" onclick="editUser(${u.user_id})">Edit</button>
              <button class="btn-danger" onclick="deleteUser(${u.user_id})">Delete</button>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading users:", error);
  }
}

function editUser(id) {
  fetch(`${API_BASE}/users/${id}`)
    .then((r) => r.json())
    .then((user) => {
      openModal("User", user);
    });
}

async function deleteUser(id) {
  if (!confirm("Delete this user?")) return;
  try {
    await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
    loadUsers();
    showNotification("User deleted!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// ==================== REPORTS ====================
async function generateReport(type) {
  try {
    showNotification("Generating PDF report...", "info");

    const response = await fetch(`${API_BASE}/reports/${type}/pdf`);

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${type}_report_${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);

    showNotification("Report downloaded successfully!", "success");
  } catch (error) {
    showNotification("Error generating report: " + error.message, "error");
  }
}

// ==================== ANALYTICS ====================
async function loadAnalytics() {
  try {
    // Individually catch errors so one failing API doesn't kill all graphs
    const endpoints = [
      { key: "inventory", url: `${API_BASE}/reports/inventory` },
      { key: "orders", url: `${API_BASE}/reports/orders` },
      { key: "valuation", url: `${API_BASE}/reports/stock-valuation` },
      { key: "products", url: `${API_BASE}/reports/product-analytics` },
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint.url);
        if (res.ok) analyticsData[endpoint.key] = await res.json();
      } catch (e) {
        console.error(`Error loading ${endpoint.key}:`, e);
      }
    }

    updateAnalyticsChart();
  } catch (error) {
    console.error("Analytics load error:", error);
  }
}

function updateAnalyticsChart() {
  const type = document.getElementById("chart-type-select").value;
  const ctx = document.getElementById("main-analytics-chart")?.getContext("2d");
  const summaryText = document.getElementById("analytics-summary-text");

  if (!ctx) return;

  // Hide metric selector for non-applicable charts to prevent confusion
  const metricSelect = document.getElementById("chart-metric-select");
  if (metricSelect) {
    if (type === "orders" || type === "inventory") {
      metricSelect.style.display = "none";
    } else {
      metricSelect.style.display = "inline-block";
    }
  }

  if (mainChart) mainChart.destroy();

  let labels = [];
  let data = [];
  let label = "";
  let chartType = "bar";
  let colors = [
    "#00f0ff", // Neon Cyan
    "#ff007f", // Electric Pink
    "#ffb700", // Cyber Amber
    "#00ff9d", // Emerald Green
    "#9d00ff", // Neon Purple
    "#0077ff", // Electric Blue
    "#ff2a5f", // Crimson Neon
  ];

  if (type === "inventory" && analyticsData.inventory) {
    labels = Object.keys(analyticsData.inventory.by_status || {});
    data = Object.values(analyticsData.inventory.by_status || {}).map(
      (v) => v.count,
    );
    label = "Items by Stock Status (Count)";
    chartType = "doughnut";
    if (summaryText)
      summaryText.innerHTML = `Total items tracked: <strong>${analyticsData.inventory.total_stock_items || 0}</strong>`;
  } else if (type === "category" && analyticsData.valuation) {
    const categories = analyticsData.valuation.by_category || [];
    labels = categories.map((c) => c.category_name);
    const metric = metricSelect?.value || "units";
    data = categories.map((c) => (metric === "value" ? c.value : c.units));
    label = `Category Breakdown (${metric === "value" ? "Total Value ₹" : "Total Units"})`;
    chartType = "pie";
    if (summaryText)
      summaryText.innerHTML = `Category breakdown by <strong>${metric}</strong>`;
  } else if (type === "prices" && analyticsData.products) {
    const products = analyticsData.products.products || [];
    labels = products.slice(0, 10).map((p) => p.name);
    data = products.slice(0, 10).map((p) => p.price);
    label = "Top Product Prices (₹)";
    chartType = "bar";
    if (summaryText)
      summaryText.innerHTML = `Showing prices for <strong>${products.length}</strong> products.`;
  } else if (type === "orders" && analyticsData.orders) {
    labels = Object.keys(analyticsData.orders.by_type || {});
    data = Object.values(analyticsData.orders.by_type || {}).map(
      (v) => v.count,
    );
    label = "Orders by Type (Count)";
    chartType = "bar";
    if (summaryText)
      summaryText.innerHTML = `Total orders processed: <strong>${analyticsData.orders.total_orders || 0}</strong>`;
  } else {
    if (summaryText)
      summaryText.innerHTML = "No telemetry data available for this chart.";
    return;
  }

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const textColor = isDark ? "#e0f7ff" : "#1a1d36";
  const gridColor = isDark ? "rgba(0, 240, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";

  mainChart = new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: data,
          backgroundColor: chartType === "bar" ? colors.slice(0, data.length) : colors,
          borderColor: isDark ? "#0d0e24" : "#ffffff",
          borderWidth: 2,
          hoverOffset: 6
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          display: true,
          labels: {
            color: textColor,
            font: { family: "Rajdhani, sans-serif", size: 13, weight: "bold" },
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: "rgba(13, 14, 36, 0.95)",
          titleColor: "#00f0ff",
          bodyColor: "#ffffff",
          borderColor: "#ff007f",
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "Orbitron, sans-serif", size: 13 },
          bodyFont: { family: "Space Grotesk, sans-serif", size: 12 }
        }
      },
      scales: chartType === "bar" ? {
        x: {
          ticks: { color: textColor, font: { family: "Space Grotesk, sans-serif", size: 11 } },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColor, font: { family: "Fira Code, monospace", size: 11 } },
          grid: { color: gridColor }
        }
      } : {},
    },
  });
}

// ==================== ADVANCED FEATURES ====================
async function loadSummary() {
  try {
    const response = await fetch(`${API_BASE}/reports/stock-valuation`);
    if (!response.ok) throw new Error("API Failed");
    const data = await response.json();

    const valEl = document.getElementById("total-inventory-value");
    const uniqEl = document.getElementById("total-unique-items");
    const unitEl = document.getElementById("total-units");

    if (valEl) valEl.textContent = formatRupees(data.total_inventory_value);
    if (uniqEl) uniqEl.textContent = data.total_unique_items || 0;
    if (unitEl) unitEl.textContent = data.total_units || 0;

    const categoryDiv = document.getElementById("summary-by-category");
    if (categoryDiv && data.by_category) {
      categoryDiv.innerHTML = data.by_category
        .map(
          (cat) => `
            <div class="category-card">
              <div class="category-info">
                <div class="category-name">${cat.category_name}</div>
                <div class="category-stats"><span>${cat.items} products</span><span>${cat.units} units</span></div>
              </div>
              <div class="category-value">${formatRupees(cat.value)}</div>
              <div class="category-percent">${(cat.percentage || 0).toFixed(1)}%</div>
              <div class="category-bar"><div style="width: ${cat.percentage || 0}%"></div></div>
            </div>
          `,
        )
        .join("");
    }
  } catch (error) {
    console.error("Summary error:", error);
  }
}

async function loadRestockList() {
  try {
    const thresholdInput = document.getElementById("restock-threshold");
    const threshold = thresholdInput ? thresholdInput.value : 20;
    const response = await fetch(
      `${API_BASE}/reports/restock-list?threshold=${threshold}`,
    );
    if (!response.ok) throw new Error("API Failed");
    const data = await response.json();

    const restockDiv = document.getElementById("restock-list");
    if (!restockDiv) return;

    if (!data.items || data.items.length === 0) {
      restockDiv.innerHTML =
        '<div class="empty-state">All items are above the threshold. No restocking needed.</div>';
      return;
    }

    restockDiv.innerHTML = `
      <table class="modern-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>SKU</th>
            <th>Stock</th>
            <th>Required</th>
            <th>Supplier</th>
            <th>Est. Cost</th>
          </tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (item) => `
            <tr>
              <td><strong>${item.item_name}</strong></td>
              <td>${item.sku}</td>
              <td><span class="qty-badge critical">${item.quantity_available}</span></td>
              <td><strong>${item.reorder_amount}</strong></td>
              <td>${item.supplier_name}<br><small>${item.supplier_contact}</small></td>
              <td><strong>${formatRupees(item.reorder_cost)}</strong></td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error("Restock error:", error);
  }
}

async function loadHistory() {
  loadTransactions();
  loadAuditLogs();
}

async function loadTransactions() {
  try {
    const response = await fetch(
      `${API_BASE}/reports/transaction-history?limit=50`,
    );
    const data = await response.json();
    const tbody = document.getElementById("transactions-table-body");
    if (tbody) {
      tbody.innerHTML = data
        .map(
          (tx) => `
            <tr>
              <td>${new Date(tx.transaction_date).toLocaleString()}</td>
              <td>${tx.item_name}</td>
              <td><span class="status-badge">${tx.transaction_type}</span></td>
              <td class="${tx.quantity_changed > 0 ? "text-success" : "text-danger"}">${tx.quantity_changed}</td>
              <td>${tx.reference_type || "-"}</td>
              <td>${tx.created_by}</td>
              <td>${tx.notes || "-"}</td>
            </tr>
          `,
        )
        .join("");
    }
  } catch (error) {
    console.error(error);
  }
}

async function loadAuditLogs() {
  try {
    const response = await fetch(`${API_BASE}/reports/audit-logs?limit=100`);
    const data = await response.json();
    const tbody = document.getElementById("audit-table-body");
    if (tbody) {
      tbody.innerHTML = data
        .map(
          (log) => `
            <tr>
              <td>${new Date(log.changed_at).toLocaleString()}</td>
              <td>${log.table_name}</td>
              <td><span class="status-badge">${log.action}</span></td>
              <td>${log.changed_by}</td>
              <td><button onclick="showAuditDetails(${log.audit_id})" class="btn-warning">View</button></td>
            </tr>
          `,
        )
        .join("");
    }
  } catch (error) {
    console.error(error);
  }
}

function showAuditDetails(id) {
  fetch(`${API_BASE}/reports/audit-logs/${id}`)
    .then((r) => r.json())
    .then((log) => {
      openModal("Audit Detail", log);
    })
    .catch((err) => {
      showNotification("Failed to load audit details", "error");
    });
}

function switchHistoryTab(tab, btnElement = null) {
  document
    .querySelectorAll(".history-tab")
    .forEach((btn) => btn.classList.remove("active"));
  if (btnElement) {
    btnElement.classList.add("active");
  } else if (typeof event !== "undefined" && event && event.target) {
    event.target.closest(".history-tab")?.classList.add("active");
  }
  document
    .querySelectorAll(".history-tab-content")
    .forEach((c) => c.classList.remove("active"));

  if (tab === "transactions") {
    document.getElementById("transactions-tab")?.classList.add("active");
    loadTransactions();
  } else {
    document.getElementById("audit-tab")?.classList.add("active");
    loadAuditLogs();
  }
}

// ==================== THEME ====================
function toggleTheme() {
  const current =
    document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

// ==================== UTILS ====================
function showNotification(message, type = "info") {
  const note = document.createElement("div");
  note.className = `notification notification-${type}`;
  note.textContent = message;
  document.body.appendChild(note);
  setTimeout(() => note.classList.add("show"), 10);
  setTimeout(() => {
    note.classList.remove("show");
    setTimeout(() => note.remove(), 300);
  }, 3000);
}

// ==================== NOTIFICATIONS ====================
function toggleNotifications() {
  const dropdown = document.getElementById("notification-dropdown");
  if (dropdown) dropdown.classList.toggle("active");

  // Close dropdown when clicking outside
  const closeDropdown = (e) => {
    if (!e.target.closest(".notification-wrapper")) {
      if (dropdown) dropdown.classList.remove("active");
      document.removeEventListener("click", closeDropdown);
    }
  };

  if (dropdown && dropdown.classList.contains("active")) {
    document.addEventListener("click", closeDropdown);
  }
}

async function updateNotifications() {
  try {
    const response = await fetch(`${API_BASE}/dashboard`);
    if (!response.ok) return;
    const data = await response.json();

    const badge = document.getElementById("notification-badge");
    const list = document.getElementById("notification-list");

    const lowStock = data.lowStock || [];
    const count = lowStock.length;

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }

    if (list) {
      if (count === 0) {
        list.innerHTML =
          '<div class="notification-empty">No new notifications</div>';
        return;
      }

      list.innerHTML = lowStock
        .map(
          (item) => `
                <div class="notification-item unread" onclick="switchView('restock')">
                    <div class="notification-icon warning">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="notification-content">
                        <p><strong>Low Stock Alert:</strong> ${item.item_name} (${item.sku}) is low on stock (${item.units} units remaining).</p>
                        <span class="notification-time">Warehouse: ${item.warehouse}</span>
                    </div>
                </div>
            `,
        )
        .join("");
    }
  } catch (error) {
    console.error("Error updating notifications:", error);
  }
}

function clearNotifications() {
  const badge = document.getElementById("notification-badge");
  const list = document.getElementById("notification-list");
  if (badge) {
    badge.textContent = "0";
    badge.style.display = "none";
  }
  if (list)
    list.innerHTML =
      '<div class="notification-empty">No new notifications</div>';
  showNotification("Notifications cleared", "info");
}

function loadViewData(view) {
  const loaders = {
    dashboard: loadDashboard,
    products: loadProducts,
    categories: loadCategories,
    suppliers: loadSuppliers,
    stock: loadStock,
    orders: loadOrders,
    users: loadUsers,
    analytics: loadAnalytics,
    summary: loadSummary,
    restock: loadRestockList,
    history: loadHistory,
  };
  if (loaders[view]) loaders[view]();
}

// ==================== SEARCH & SORT FUNCTIONALITY ====================
function initSearch() {
  const globalSearch = document.getElementById("search-input");
  if (globalSearch) {
    globalSearch.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      filterCurrentView(term);
    });
  }

  // View specific search inputs
  document.querySelectorAll(".view .search-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      filterCurrentView(term);
    });
  });
}

function filterCurrentView(term) {
  const mapping = {
    products: ["products-body"],
    categories: ["categories-body"],
    suppliers: ["suppliers-body"],
    stock: ["stock-body"],
    orders: ["orders-body"],
    users: ["users-body"],
    dashboard: ["low-stock-body", "top-selling-body"],
  };

  const tableIds = mapping[currentView];
  if (!tableIds) return;

  tableIds.forEach((tableId) => {
    const tbody = document.getElementById(tableId);
    if (!tbody) return;
    const rows = tbody.querySelectorAll("tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? "" : "none";
    });
  });
}

/**
 * Generic Table Sorter
 * @param {HTMLTableElement} table - The table to sort
 * @param {number} column - Column index
 * @param {boolean} asc - Sort direction
 */
function sortTable(table, column, asc = true) {
  const tbody = table.tBodies[0];
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll("tr"));

  if (rows.length <= 1 && rows[0]?.textContent.includes("Loading")) return;

  const sortedRows = rows.sort((a, b) => {
    const aCell = a.querySelector(`td:nth-child(${column + 1})`);
    const bCell = b.querySelector(`td:nth-child(${column + 1})`);
    if (!aCell || !bCell) return 0;

    let aColText = aCell.textContent.trim();
    let bColText = bCell.textContent.trim();

    const cleanNum = (str) => {
      const cleaned = str.replace(/[₹,]/g, "");
      return isNaN(cleaned) || cleaned === "" ? str : parseFloat(cleaned);
    };

    const aVal = cleanNum(aColText);
    const bVal = cleanNum(bColText);

    if (typeof aVal === "number" && typeof bVal === "number") {
      return asc ? aVal - bVal : bVal - aVal;
    }

    return asc
      ? aVal.toString().localeCompare(bVal.toString())
      : bVal.toString().localeCompare(aVal.toString());
  });

  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
  tbody.append(...sortedRows);

  const headers = table.querySelectorAll("th");
  headers.forEach((th, idx) => {
    th.classList.remove("th-sort-asc", "th-sort-desc");
    if (idx === column) {
      th.classList.add(asc ? "th-sort-asc" : "th-sort-desc");
    }
  });
}

function initSorting() {
  document.addEventListener("click", (e) => {
    const th = e.target.closest("th");
    if (!th) return;

    const table = th.closest("table");
    if (!table || !table.classList.contains("modern-table")) return;

    if (th.textContent.trim().toLowerCase() === "actions") return;

    const column = Array.from(th.parentElement.children).indexOf(th);
    const currentIsAsc = th.classList.contains("th-sort-asc");

    sortTable(table, column, !currentIsAsc);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  updateNotifications();
  initSearch();
  initSorting();

  setInterval(updateNotifications, 5 * 60 * 1000);

  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  const addBtn = document.getElementById("add-btn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      let type = "Product";
      if (currentView === "categories") type = "Category";
      if (currentView === "suppliers") type = "Supplier";
      if (currentView === "users") type = "User";
      if (currentView === "stock") type = "Stock";
      if (currentView === "orders") type = "Order";
      openModal(type);
    });
  }

  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  const notifBtn = document.getElementById("notification-btn");
  if (notifBtn) notifBtn.addEventListener("click", toggleNotifications);

  const clearNotifBtn = document.getElementById("clear-notifications");
  if (clearNotifBtn)
    clearNotifBtn.addEventListener("click", clearNotifications);
});
