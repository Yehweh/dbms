// ===================================
// INVENTORYHUB - PROFESSIONAL SYSTEM
// ===================================

// Keep the data layer configurable: the UI can be served independently and
// connected to any compatible backend without editing this file.
const API_BASE = window.INVENTORY_API_BASE || "/api";

// Demo records keep the frontend presentable when it is opened without the
// project's backend. Live API data still takes priority whenever available.
const DEMO_PRODUCTS = [
  { itemId: 1, item_name: "Wireless Keyboard", sku: "WH-KB-001", category_name: "Electronics", quantity: 42, price: 1299, popularity: 92 },
  { itemId: 2, item_name: "USB-C Fast Charger", sku: "WH-CH-002", category_name: "Electronics", quantity: 18, price: 899, popularity: 86 },
  { itemId: 3, item_name: "Ergonomic Office Chair", sku: "FN-CH-003", category_name: "Furniture", quantity: 7, price: 8499, popularity: 74 },
  { itemId: 4, item_name: "A4 Premium Notebook", sku: "ST-NB-004", category_name: "Stationery", quantity: 65, price: 249, popularity: 68 },
  { itemId: 5, item_name: "Bluetooth Speaker", sku: "EL-SP-005", category_name: "Electronics", quantity: 24, price: 2199, popularity: 81 },
  { itemId: 6, item_name: "LED Desk Lamp", sku: "FN-LP-006", category_name: "Furniture", quantity: 4, price: 1599, popularity: 59 },
];

const DEMO_DASHBOARD = {
  metrics: {
    revenue: 186450,
    activeOrders: 28,
    inventoryValue: DEMO_PRODUCTS.reduce((sum, p) => sum + p.price * p.quantity, 0),
    units: DEMO_PRODUCTS.reduce((sum, p) => sum + p.quantity, 0),
    inventoryUnits: DEMO_PRODUCTS.reduce((sum, p) => sum + p.quantity, 0),
  },
  lowStock: DEMO_PRODUCTS.filter((p) => p.quantity < 10).map((p) => ({
    item_name: p.item_name, sku: p.sku, warehouse: "Main Warehouse", units: p.quantity, status: "Critical",
  })),
  topSelling: DEMO_PRODUCTS.slice().sort((a, b) => b.popularity - a.popularity).slice(0, 5).map((p) => ({ ...p, unitsSold: p.popularity })),
};

const DEMO_CATEGORIES = [
  { category_id: 1, category_name: "Electronics", description: "Devices and electronic accessories" },
  { category_id: 2, category_name: "Furniture", description: "Office and workspace furniture" },
  { category_id: 3, category_name: "Stationery", description: "Writing and office supplies" },
];
const DEMO_SUPPLIERS = [
  { supplier_id: 1, supplier_name: "TechWorld Distributors", contact_no: "+91 98765 43210", address: "Bengaluru, Karnataka" },
  { supplier_id: 2, supplier_name: "OfficeMart Supplies", contact_no: "+91 91234 56789", address: "Mumbai, Maharashtra" },
  { supplier_id: 3, supplier_name: "BrightSpace Furnishings", contact_no: "+91 99887 76655", address: "Pune, Maharashtra" },
];
const DEMO_STOCK = DEMO_PRODUCTS.map((p, index) => ({
  ...p, stock_id: index + 1, warehouse: index % 2 ? "Branch Warehouse" : "Main Warehouse",
  status: p.quantity < 10 ? "Critical" : p.quantity < 20 ? "Low" : "Healthy",
  last_updated: new Date().toISOString(),
}));
const DEMO_USERS = [
  { user_id: 1, username: "admin", email: "admin@inventoryhub.local", role: "Administrator" },
  { user_id: 2, username: "manager", email: "manager@inventoryhub.local", role: "Manager" },
  { user_id: 3, username: "staff", email: "staff@inventoryhub.local", role: "Staff" },
];
const DEMO_ORDERS = { orders: [
  { id: "ORD-1001", user: "admin", type: "Sale", date: "2026-08-27" },
  { id: "ORD-1002", user: "manager", type: "Purchase", date: "2026-08-26" },
  { id: "ORD-1003", user: "staff", type: "Sale", date: "2026-08-24" },
] };
const DEMO_REPORTS = {
  inventory: {
    total_stock_items: DEMO_STOCK.length,
    by_status: { Healthy: { count: DEMO_STOCK.filter((s) => s.status === "Healthy").length }, Low: { count: DEMO_STOCK.filter((s) => s.status === "Low").length }, Critical: { count: DEMO_STOCK.filter((s) => s.status === "Critical").length } },
  },
  orders: { total_orders: DEMO_ORDERS.orders.length, by_type: { Sale: { count: 2 }, Purchase: { count: 1 } } },
  valuation: {
    total_inventory_value: DEMO_DASHBOARD.metrics.inventoryValue,
    total_unique_items: DEMO_PRODUCTS.length,
    total_units: DEMO_DASHBOARD.metrics.inventoryUnits,
    by_category: DEMO_CATEGORIES.map((c) => {
      const items = DEMO_PRODUCTS.filter((p) => p.category_name === c.category_name);
      const units = items.reduce((sum, p) => sum + p.quantity, 0);
      const value = items.reduce((sum, p) => sum + p.price * p.quantity, 0);
      return { category_name: c.category_name, items: items.length, units, value, percentage: (value / DEMO_DASHBOARD.metrics.inventoryValue) * 100 };
    }),
  },
  products: { products: DEMO_PRODUCTS.map((p) => ({ name: p.item_name, price: p.price })) },
};

// Supply demo JSON for every read-only view when the API is not running.
const nativeFetch = window.fetch.bind(window);
const demoApiResponse = (data) => ({ ok: true, status: 200, json: async () => data });
window.fetch = async (url, options = {}) => {
  try {
    const response = await nativeFetch(url, options);
    if (response.ok || options.method) return response;
  } catch (_) {
    // Fall through to the matching demo response below.
  }
  const rawUrl = String(url);
  const path = rawUrl.split("?")[0];
  if (path.endsWith("/dashboard")) return demoApiResponse(DEMO_DASHBOARD);
  if (path.endsWith("/products")) return demoApiResponse(DEMO_PRODUCTS);
  if (path.includes("/products/")) return demoApiResponse(DEMO_PRODUCTS.find((p) => String(p.itemId) === path.split("/").pop()) || DEMO_PRODUCTS[0]);
  if (path.endsWith("/categories")) return demoApiResponse(DEMO_CATEGORIES);
  if (path.includes("/categories/")) return demoApiResponse(DEMO_CATEGORIES[0]);
  if (path.endsWith("/suppliers")) return demoApiResponse(DEMO_SUPPLIERS);
  if (path.includes("/suppliers/")) return demoApiResponse(DEMO_SUPPLIERS[0]);
  if (path.endsWith("/stock")) return demoApiResponse(DEMO_STOCK);
  if (path.includes("/stock/")) return demoApiResponse(DEMO_STOCK[0]);
  if (path.endsWith("/orders") && !path.includes("/reports/")) return demoApiResponse(DEMO_ORDERS);
  if (path.endsWith("/users")) return demoApiResponse(DEMO_USERS);
  if (path.includes("/users/")) return demoApiResponse(DEMO_USERS[0]);
  if (path.includes("/reports/restock-list")) {
    const threshold = Number(new URL(rawUrl, window.location.href).searchParams.get("threshold")) || 10;
    return demoApiResponse({ items: DEMO_STOCK.filter((s) => s.quantity < threshold).map((s) => ({ item_name: s.item_name, sku: s.sku, quantity_available: s.quantity, reorder_amount: threshold - s.quantity, supplier_name: "TechWorld Distributors", supplier_contact: "+91 98765 43210", reorder_cost: (threshold - s.quantity) * s.price })) });
  }
  if (path.includes("/reports/transaction-history") || path.includes("/reports/audit-logs")) return demoApiResponse([]);
  if (path.endsWith("/reports/inventory")) return demoApiResponse(DEMO_REPORTS.inventory);
  if (path.endsWith("/reports/orders")) return demoApiResponse(DEMO_REPORTS.orders);
  if (path.endsWith("/reports/stock-valuation")) return demoApiResponse(DEMO_REPORTS.valuation);
  if (path.endsWith("/reports/product-analytics")) return demoApiResponse(DEMO_REPORTS.products);
  if (path.includes("/reports/")) return demoApiResponse({});
  return demoApiResponse([]);
};

// State
let currentView = "dashboard";
let currentEditingType = null;
let currentEditingId = null;
let mainChart = null;
let analyticsData = {};
let currentSearchTerm = "";
let activeFilters = {};

const SEARCH_CONFIG = {
  dashboard: "Search dashboard alerts and top items...",
  products: "Search products by name, SKU, or category...",
  categories: "Search categories or descriptions...",
  suppliers: "Search suppliers, contact, or address...",
  stock: "Search inventory by item, warehouse, or status...",
  orders: "Search orders by id, user, or type...",
  users: "Search users by name, email, or role...",
  analytics: "Search is not needed here; use chart presets below.",
  reports: "Search is not needed here; choose the report by use case.",
  summary: "Search is not needed here; review valuation breakdowns.",
  restock: "Search is not needed here; adjust threshold to narrow results.",
  history: "Search is not needed here; use the tabs to inspect records.",
};

const FILTER_CONFIG = {
  products: ["All", "Low Stock", "Healthy", "Electronics", "Furniture"],
  categories: ["All", "With Description", "Needs Description"],
  suppliers: ["All", "Has Phone", "Has Address"],
  stock: ["All", "Critical", "Low", "Healthy", "Main Warehouse"],
  orders: ["All", "Sale", "Purchase", "Completed"],
  users: ["All", "Administrator", "Manager", "Staff"],
};

const MODAL_GUIDANCE = {
  Product: "Add the product basics first. Use recognizable names, clean SKUs, and assign a supplier so future restocking stays traceable.",
  Category: "Keep category names short and distinct. Descriptions help future search, reporting, and cleanup work.",
  Supplier: "Capture the contact and location details that a stock manager would actually need during reordering.",
  Stock: "Update stock against the correct warehouse and use status values that reflect the real replenishment risk.",
  User: "Create roles intentionally. Give the least access needed for the person's day-to-day work.",
  Order: "Choose the user and product first, then confirm quantity and price before saving the order.",
};

// Currency formatter for Indian Rupees
const formatRupees = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStatusMeta(status) {
  const key = String(status || "unknown").toLowerCase().replace(/[\s_]+/g, "-");
  const map = {
    healthy: { label: "Healthy", cls: "status-badge-healthy", icon: "fa-circle-check" },
    "in-stock": { label: "In Stock", cls: "status-badge-in-stock", icon: "fa-box" },
    low: { label: "Low", cls: "status-badge-warning", icon: "fa-triangle-exclamation" },
    warning: { label: "Warning", cls: "status-badge-warning", icon: "fa-triangle-exclamation" },
    critical: { label: "Critical", cls: "status-badge-critical", icon: "fa-radiation" },
    "out-of-stock": { label: "Out of Stock", cls: "status-badge-out-of-stock", icon: "fa-circle-xmark" },
    completed: { label: "Completed", cls: "status-badge-healthy", icon: "fa-circle-check" },
    sale: { label: "Sale", cls: "status-badge-healthy", icon: "fa-arrow-trend-up" },
    purchase: { label: "Purchase", cls: "status-badge-warning", icon: "fa-cart-arrow-down" },
    administrator: { label: "Administrator", cls: "status-badge-critical", icon: "fa-shield-halved" },
    manager: { label: "Manager", cls: "status-badge-warning", icon: "fa-user-tie" },
    staff: { label: "Staff", cls: "status-badge-healthy", icon: "fa-user" },
    admin: { label: "Admin", cls: "status-badge-critical", icon: "fa-shield-halved" },
    user: { label: "User", cls: "status-badge-healthy", icon: "fa-user" },
  };
  return map[key] || { label: status || "Unknown", cls: "", icon: "fa-circle-info" };
}

function renderStatusBadge(status) {
  const meta = getStatusMeta(status);
  return `<span class="status-badge ${meta.cls}"><i class="fas ${meta.icon}"></i>${escapeHtml(meta.label)}</span>`;
}

function getQuantity(item) {
  return Number(item.quantity ?? item.quantity_available ?? item.units ?? 0);
}

function renderEmptyState(title, message) {
  return `<div class="empty-state"><strong>${escapeHtml(title)}</strong>${escapeHtml(message)}</div>`;
}

function setHtmlOrEmpty(container, html, title, message) {
  if (!container) return;
  if (html && html.trim()) {
    container.innerHTML = html;
    return;
  }
  if (container.tagName === "TBODY") {
    const colspan = container.closest("table")?.querySelectorAll("thead th").length || 1;
    container.innerHTML = `<tr><td colspan="${colspan}">${renderEmptyState(title, message)}</td></tr>`;
    return;
  }
  container.innerHTML = renderEmptyState(title, message);
}

function ensureMobileCardList(anchor, id) {
  if (!anchor?.parentElement) return null;
  let cardList = document.getElementById(id);
  if (!cardList) {
    cardList = document.createElement("div");
    cardList.id = id;
    cardList.className = "table-card-list";
    anchor.parentElement.appendChild(cardList);
  }
  return cardList;
}

function renderMobileCards(id, cards) {
  const cardList = document.getElementById(id);
  if (!cardList) return;
  cardList.innerHTML = cards.length ? cards.join("") : renderEmptyState("Nothing to show", "No records match the current filters.");
}

function renderTableMeta(containerId, count, label) {
  const host = document.getElementById(containerId);
  if (!host) return;
  host.innerHTML = `
    <div class="table-meta">
      <div class="table-count">${count} ${label}</div>
    </div>`;
}

function updateSearchUI(view) {
  const input = document.getElementById("search-input");
  const context = document.getElementById("search-context");
  const placeholder = SEARCH_CONFIG[view] || "Search records...";
  if (input) {
    input.placeholder = placeholder;
    input.disabled = ["analytics", "reports", "summary", "restock", "history"].includes(view);
    if (input.disabled) {
      input.value = "";
      currentSearchTerm = "";
    }
  }
  if (context) {
    context.textContent = input?.disabled
      ? placeholder
      : `Searching ${view} records`;
  }
}

function updateToolbarFilters(view) {
  Object.entries(FILTER_CONFIG).forEach(([key, values]) => {
    const host = document.getElementById(`${key}-filters`);
    if (!host) return;
    host.innerHTML = key === view
      ? values.map((value) => `<button class="filter-chip ${((activeFilters[key] || "All") === value) ? "active" : ""}" data-view="${key}" data-filter="${value}">${escapeHtml(value)}</button>`).join("")
      : "";
  });
}

function matchesFilter(view, item) {
  const filter = activeFilters[view] || "All";
  if (filter === "All") return true;
  const status = String(item.status || "").toLowerCase();
  const role = String(item.role || "").toLowerCase();
  switch (view) {
    case "products":
      if (filter === "Low Stock") return getQuantity(item) < 10;
      if (filter === "Healthy") return getQuantity(item) >= 10;
      return String(item.category_name || "").toLowerCase() === filter.toLowerCase();
    case "categories":
      return filter === "With Description" ? Boolean(item.description) : !item.description;
    case "suppliers":
      return filter === "Has Phone" ? Boolean(item.contact_no) : Boolean(item.address);
    case "stock":
      if (filter === "Main Warehouse") return String(item.warehouse || "").toLowerCase().includes("main");
      return status === filter.toLowerCase();
    case "orders":
      if (filter === "Completed") return true;
      return String(item.type || item.order_type || "").toLowerCase() === filter.toLowerCase();
    case "users":
      return role === filter.toLowerCase() || role.includes(filter.toLowerCase().slice(0, 5));
    default:
      return true;
  }
}

function filterItems(view, items, searchableFields) {
  const term = currentSearchTerm.trim().toLowerCase();
  return items.filter((item) => {
    const inFilter = matchesFilter(view, item);
    if (!inFilter) return false;
    if (!term) return true;
    return searchableFields.some((field) => String(item[field] ?? "").toLowerCase().includes(term));
  });
}

function mountOnboardingTip(view) {
  if (view !== "dashboard") return;
  if (localStorage.getItem("inventoryhub-tip-dismissed") === "1") return;
  const dashboard = document.getElementById("dashboard-view");
  if (!dashboard || document.getElementById("onboarding-tip")) return;
  const tip = document.createElement("div");
  tip.id = "onboarding-tip";
  tip.className = "onboarding-tip";
  tip.innerHTML = `
    <p><strong>Start here:</strong> Use quick actions for day-to-day work, review low-stock alerts first, then move into reports or analytics when you need decisions and exports.</p>
    <button class="btn-secondary" id="dismiss-onboarding">Got it</button>`;
  dashboard.prepend(tip);
  document.getElementById("dismiss-onboarding")?.addEventListener("click", () => {
    localStorage.setItem("inventoryhub-tip-dismissed", "1");
    tip.remove();
  });
}

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
    "ai-optimizer": "AI Sales & Profit Optimizer",
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
  updateSearchUI(view);
  updateToolbarFilters(view);
  mountOnboardingTip(view);

  if (
    [
      "dashboard",
      "ai-optimizer",
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
  const guidance = document.getElementById("modal-guidance");
  if (guidance) {
    guidance.textContent = MODAL_GUIDANCE[type] || "";
    guidance.classList.toggle("active", Boolean(MODAL_GUIDANCE[type]));
  }
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
  const guidance = document.getElementById("modal-guidance");
  if (guidance) {
    guidance.textContent = "";
    guidance.classList.remove("active");
  }
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
        help: "Use the customer-facing or warehouse-recognizable item name.",
      },
      { name: "sku", label: "SKU", type: "text", required: true, help: "Keep SKU short, unique, and easy to scan." },
      {
        name: "category_name",
        label: "Category",
        type: "text",
        required: true,
        list: "category-datalist",
        id: "product-category-input",
        help: "Choose an existing category name when possible.",
      },
      {
        name: "supplier_name",
        label: "Supplier",
        type: "text",
        required: true,
        list: "supplier-datalist",
        id: "product-supplier-input",
        help: "Link a supplier so restock actions stay actionable.",
      },
      {
        name: "price",
        label: "Price (₹)",
        type: "number",
        required: true,
        step: "0.01",
        help: "Store the current unit price in rupees.",
      },
      {
        name: "quantity_available",
        label: "Stock Quantity",
        type: "number",
        required: true,
        help: "Use the latest confirmed available quantity.",
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
        help: "Optional, but useful for filtering and reporting.",
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
        help: "Use a number the team can actually call during replenishment.",
      },
      {
        name: "address",
        label: "Address / Details",
        type: "text",
        required: false,
        help: "Warehouse, city, or logistics notes help future coordination.",
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
        help: "Pick the exact product record for this warehouse entry.",
      },
      { name: "warehouse", label: "Warehouse", type: "text", required: true, help: "Use the real warehouse or zone name." },
      {
        name: "quantity_available",
        label: "Quantity",
        type: "number",
        required: true,
        help: "Enter the physically available stock count.",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Healthy", "Critical", "Warning", "Out of Stock"],
        required: true,
        help: "Choose the status based on urgency, not guesswork.",
      },
    ],
    User: [
      { name: "username", label: "Username", type: "text", required: true, help: "Keep it simple and identifiable." },
      { name: "email", label: "Email", type: "email", required: true, help: "Use a valid work email for access and alerts." },
      {
        name: "role",
        label: "Role",
        type: "select",
        options: ["USER", "MANAGER", "ADMIN"],
        required: true,
        help: "Assign the least privilege needed for the role.",
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        required: !data,
        help: data ? "Leave blank unless you want to reset the password." : "Required for new users.",
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
        help: "Choose the buyer or request owner.",
      },
      {
        name: "item_id",
        label: "Product",
        type: "select",
        options: [],
        required: true,
        id: "order-item-select",
        help: "Select the product before setting quantity and price.",
      },
      {
        name: "quantity",
        label: "Quantity",
        type: "number",
        required: true,
        min: 1,
        help: "Record the quantity being sold or purchased.",
      },
      {
        name: "price",
        label: "Unit Price (₹)",
        type: "number",
        required: true,
        step: "0.01",
        id: "order-price-input",
        help: "Unit price auto-fills after product selection.",
      },
      {
        name: "order_type",
        label: "Type",
        type: "select",
        options: ["SALE", "PURCHASE"],
        required: true,
        help: "This controls how the transaction is interpreted downstream.",
      },
    ],
  };

  let html = '<div class="form-grid">';
  const formFields = fields[type] || [];

  formFields.forEach((field) => {
    const value = data ? (data[field.name] !== undefined ? data[field.name] : "") : "";
    html += `<div class="form-group ${field.required ? "required" : ""}">
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

    if (field.help) {
      html += `<div class="field-help">${field.help}</div>`;
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
    const response = await fetch(`${API_BASE}/dashboard`).catch(() => ({
      ok: true,
      json: async () => DEMO_DASHBOARD,
    }));
    const data = response.ok ? await response.json() : DEMO_DASHBOARD;

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
      const lowStock = filterItems("dashboard", data.lowStock || [], ["item_name", "sku", "warehouse", "status"]);
      lowStockBody.innerHTML = lowStock
        .map(
          (item) => `
              <tr>
                <td><strong>${item.item_name}</strong></td>
                <td>${item.sku}</td>
                <td>${item.warehouse}</td>
                <td><strong>${item.units}</strong></td>
                <td>${renderStatusBadge(item.status)}</td>
              </tr>
            `,
        )
        .join("");
      setHtmlOrEmpty(lowStockBody, lowStockBody.innerHTML, "No low-stock items", "Current dashboard filters do not show any stock risks.");
    }

    // Top selling with corrected progress bar

    // Top selling with corrected progress bar
    const topSellingBody = document.getElementById("top-selling-body");
    if (topSellingBody) {
      const items = filterItems("dashboard", data.topSelling || [], ["item_name", "sku"]);
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
                    <div style="width: ${((item.unitsSold || 0) / maxPop) * 100}%; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald));"></div>
                  </div>
                </td>
              </tr>
            `,
        )
        .join("");
      setHtmlOrEmpty(topSellingBody, topSellingBody.innerHTML, "No top items found", "Try clearing the current search to restore product leaders.");
    }

    updateNotifications();
  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

// ==================== PRODUCTS ====================
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`).catch(() => ({
      ok: true,
      json: async () => DEMO_PRODUCTS,
    }));
    const products = response.ok ? await response.json() : DEMO_PRODUCTS;

    const tbody = document.getElementById("products-body");
    if (!tbody) return;

    const filteredProducts = filterItems("products", products, ["item_name", "sku", "category_name"]);
    const maxPop = Math.max(...filteredProducts.map((p) => p.popularity || 0), 1);

    const tableWrap = tbody.closest("div");
    if (tableWrap && !document.getElementById("products-meta")) {
      const meta = document.createElement("div");
      meta.id = "products-meta";
      tableWrap.parentElement.insertBefore(meta, tableWrap);
    }
    ensureMobileCardList(tableWrap, "products-cards");
    renderTableMeta("products-meta", filteredProducts.length, "products");

    tbody.innerHTML = filteredProducts
      .map(
        (p) => `
          <tr>
            <td><strong>${p.item_name}</strong></td>
            <td>${p.sku}</td>
            <td>${p.category_name || "N/A"}</td>
            <td>${renderStatusBadge(getQuantity(p) < 10 ? "Critical" : "Healthy")} <span class="status-detail">${getQuantity(p)} units</span></td>
            <td>${formatRupees(p.price)}</td>
            <td>
              <div class="popularity-bar">
                <div style="width: ${((p.popularity || 0) / maxPop) * 100}%; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald));"></div>
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
    setHtmlOrEmpty(tbody, tbody.innerHTML, "No products found", "Try a different search or filter, or add a new product.");
    renderMobileCards(
      "products-cards",
      filteredProducts.map((p) => `
        <article class="mobile-data-card">
          <h4>${escapeHtml(p.item_name)}</h4>
          <div class="mobile-data-grid">
            <div><span>SKU</span><span>${escapeHtml(p.sku)}</span></div>
            <div><span>Category</span><span>${escapeHtml(p.category_name || "N/A")}</span></div>
            <div><span>Stock</span><span>${getQuantity(p)} units</span></div>
            <div><span>Price</span><span>${formatRupees(p.price)}</span></div>
          </div>
          <div>${renderStatusBadge(getQuantity(p) < 10 ? "Critical" : "Healthy")}</div>
          <div class="mobile-card-actions">
            <button class="btn-warning" onclick="editProduct(${p.itemId})">Edit</button>
            <button class="btn-danger" onclick="deleteProduct(${p.itemId})">Delete</button>
          </div>
        </article>`),
    );
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

    const filteredCategories = filterItems("categories", categories, ["category_name", "description"]);
    const tableWrap = tbody.closest("div");
    if (tableWrap && !document.getElementById("categories-meta")) {
      const meta = document.createElement("div");
      meta.id = "categories-meta";
      tableWrap.parentElement.insertBefore(meta, tableWrap);
    }
    ensureMobileCardList(tableWrap, "categories-cards");
    renderTableMeta("categories-meta", filteredCategories.length, "categories");

    tbody.innerHTML = filteredCategories
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
    setHtmlOrEmpty(tbody, tbody.innerHTML, "No categories found", "Add a category or adjust the current filter.");
    renderMobileCards(
      "categories-cards",
      filteredCategories.map((c) => `
        <article class="mobile-data-card">
          <h4>${escapeHtml(c.category_name)}</h4>
          <div class="mobile-data-grid">
            <div><span>ID</span><span>#${c.category_id}</span></div>
            <div><span>Description</span><span>${escapeHtml(c.description || "-")}</span></div>
          </div>
          <div class="mobile-card-actions">
            <button class="btn-warning" onclick="editCategory(${c.category_id})">Edit</button>
            <button class="btn-danger" onclick="deleteCategory(${c.category_id})">Delete</button>
          </div>
        </article>`),
    );
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

    const filteredSuppliers = filterItems("suppliers", suppliers, ["supplier_name", "contact_no", "address"]);
    const tableWrap = tbody.closest("div");
    if (tableWrap && !document.getElementById("suppliers-meta")) {
      const meta = document.createElement("div");
      meta.id = "suppliers-meta";
      tableWrap.parentElement.insertBefore(meta, tableWrap);
    }
    ensureMobileCardList(tableWrap, "suppliers-cards");
    renderTableMeta("suppliers-meta", filteredSuppliers.length, "suppliers");

    tbody.innerHTML = filteredSuppliers
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
    setHtmlOrEmpty(tbody, tbody.innerHTML, "No suppliers found", "Add a supplier or loosen the current filter.");
    renderMobileCards(
      "suppliers-cards",
      filteredSuppliers.map((s) => `
        <article class="mobile-data-card">
          <h4>${escapeHtml(s.supplier_name)}</h4>
          <div class="mobile-data-grid">
            <div><span>Phone</span><span>${escapeHtml(s.contact_no || "-")}</span></div>
            <div><span>Address</span><span>${escapeHtml(s.address || "-")}</span></div>
          </div>
          <div class="mobile-card-actions">
            <button class="btn-warning" onclick="editSupplier(${s.supplier_id})">Edit</button>
            <button class="btn-danger" onclick="deleteSupplier(${s.supplier_id})">Delete</button>
          </div>
        </article>`),
    );
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

    const filteredStocks = filterItems("stock", stocks, ["item_name", "sku", "warehouse", "status"]);
    const tableWrap = tbody.closest("div");
    if (tableWrap && !document.getElementById("stock-meta")) {
      const meta = document.createElement("div");
      meta.id = "stock-meta";
      tableWrap.parentElement.insertBefore(meta, tableWrap);
    }
    ensureMobileCardList(tableWrap, "stock-cards");
    renderTableMeta("stock-meta", filteredStocks.length, "stock records");

    tbody.innerHTML = filteredStocks
      .map(
        (s) => `
          <tr>
            <td><strong>${s.item_name}</strong></td>
            <td>${s.sku}</td>
            <td>${s.warehouse}</td>
            <td><strong>${getQuantity(s)}</strong></td>
            <td>${formatRupees(s.price)}</td>
            <td><strong>${formatRupees(s.price * getQuantity(s))}</strong></td>
            <td>${renderStatusBadge(s.status || "Healthy")}</td>
            <td>${new Date(s.last_updated || Date.now()).toLocaleDateString()}</td>
            <td>
              <button class="btn-warning" onclick="editStock(${s.stock_id})">Edit</button>
              <button class="btn-danger" onclick="deleteStock(${s.stock_id})">Delete</button>
            </td>
          </tr>
        `,
      )
      .join("");
    setHtmlOrEmpty(tbody, tbody.innerHTML, "No inventory records found", "Try another stock filter or create a new stock entry.");
    renderMobileCards(
      "stock-cards",
      filteredStocks.map((s) => `
        <article class="mobile-data-card">
          <h4>${escapeHtml(s.item_name)}</h4>
          <div class="mobile-data-grid">
            <div><span>SKU</span><span>${escapeHtml(s.sku)}</span></div>
            <div><span>Warehouse</span><span>${escapeHtml(s.warehouse)}</span></div>
            <div><span>Quantity</span><span>${getQuantity(s)}</span></div>
            <div><span>Value</span><span>${formatRupees(s.price * getQuantity(s))}</span></div>
          </div>
          <div>${renderStatusBadge(s.status || "Healthy")}</div>
          <div class="mobile-card-actions">
            <button class="btn-warning" onclick="editStock(${s.stock_id})">Edit</button>
            <button class="btn-danger" onclick="deleteStock(${s.stock_id})">Delete</button>
          </div>
        </article>`),
    );
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

    const orders = filterItems("orders", data.orders || [], ["id", "user", "type"]);
    const tableWrap = tbody.closest("div");
    if (tableWrap && !document.getElementById("orders-meta")) {
      const meta = document.createElement("div");
      meta.id = "orders-meta";
      tableWrap.parentElement.insertBefore(meta, tableWrap);
    }
    ensureMobileCardList(tableWrap, "orders-cards");
    renderTableMeta("orders-meta", orders.length, "orders");

    tbody.innerHTML = orders
      .map(
        (o) => `
          <tr>
            <td><strong>${o.id}</strong></td>
            <td>${o.user || "N/A"}</td>
            <td>${renderStatusBadge(o.type)}</td>
            <td>${new Date(o.date).toLocaleDateString()}</td>
            <td>${renderStatusBadge("Completed")}</td>
            <td>
              <button class="btn-danger" onclick="deleteOrder('${o.id}')">Delete</button>
            </td>
          </tr>
        `,
      )
      .join("");
    setHtmlOrEmpty(tbody, tbody.innerHTML, "No orders found", "Try another search or create a new order.");
    renderMobileCards(
      "orders-cards",
      orders.map((o) => `
        <article class="mobile-data-card">
          <h4>${escapeHtml(o.id)}</h4>
          <div class="mobile-data-grid">
            <div><span>User</span><span>${escapeHtml(o.user || "N/A")}</span></div>
            <div><span>Type</span><span>${escapeHtml(o.type)}</span></div>
            <div><span>Date</span><span>${new Date(o.date).toLocaleDateString()}</span></div>
            <div><span>Status</span><span>Completed</span></div>
          </div>
          <div class="mobile-card-actions">
            <button class="btn-danger" onclick="deleteOrder('${o.id}')">Delete</button>
          </div>
        </article>`),
    );
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

    const filteredUsers = filterItems("users", users, ["username", "email", "role"]);
    const tableWrap = tbody.closest("div");
    if (tableWrap && !document.getElementById("users-meta")) {
      const meta = document.createElement("div");
      meta.id = "users-meta";
      tableWrap.parentElement.insertBefore(meta, tableWrap);
    }
    ensureMobileCardList(tableWrap, "users-cards");
    renderTableMeta("users-meta", filteredUsers.length, "users");

    tbody.innerHTML = filteredUsers
      .map(
        (u) => `
          <tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.email}</td>
            <td>${renderStatusBadge(u.role)}</td>
            <td>
              <button class="btn-warning" onclick="editUser(${u.user_id})">Edit</button>
              <button class="btn-danger" onclick="deleteUser(${u.user_id})">Delete</button>
            </td>
          </tr>
        `,
      )
      .join("");
    setHtmlOrEmpty(tbody, tbody.innerHTML, "No users found", "Create a user or remove the current role filter.");
    renderMobileCards(
      "users-cards",
      filteredUsers.map((u) => `
        <article class="mobile-data-card">
          <h4>${escapeHtml(u.username)}</h4>
          <div class="mobile-data-grid">
            <div><span>Email</span><span>${escapeHtml(u.email)}</span></div>
            <div><span>Role</span><span>${escapeHtml(u.role)}</span></div>
          </div>
          <div>${renderStatusBadge(u.role)}</div>
          <div class="mobile-card-actions">
            <button class="btn-warning" onclick="editUser(${u.user_id})">Edit</button>
            <button class="btn-danger" onclick="deleteUser(${u.user_id})">Delete</button>
          </div>
        </article>`),
    );
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

  if (type === "inventory" && analyticsData.inventory) {
    labels = Object.keys(analyticsData.inventory.by_status || {});
    data = Object.values(analyticsData.inventory.by_status || {}).map(
      (v) => v.count,
    );
    label = "Items by Stock Status (Count)";
    chartType = "doughnut";
    if (summaryText)
      summaryText.innerHTML = `Total items tracked: <strong>${analyticsData.inventory.total_stock_items || 0}</strong>. Use this view to spot replenishment risk quickly.`;
  } else if (type === "category" && analyticsData.valuation) {
    const categories = analyticsData.valuation.by_category || [];
    labels = categories.map((c) => c.category_name);
    const metric = metricSelect?.value || "units";
    data = categories.map((c) => (metric === "value" ? c.value : c.units));
    label = `Category Breakdown (${metric === "value" ? "Total Value ₹" : "Total Units"})`;
    chartType = "pie";
    if (summaryText)
      summaryText.innerHTML = `Category breakdown by <strong>${metric}</strong>. Compare mix to decide where capital and shelf space are concentrated.`;
  } else if (type === "prices" && analyticsData.products) {
    const products = analyticsData.products.products || [];
    labels = products.slice(0, 10).map((p) => p.name);
    data = products.slice(0, 10).map((p) => p.price);
    label = "Top Product Prices (₹)";
    chartType = "bar";
    if (summaryText)
      summaryText.innerHTML = `Showing prices for <strong>${products.length}</strong> products. This helps identify premium items and pricing spread.`;
  } else if (type === "orders" && analyticsData.orders) {
    labels = Object.keys(analyticsData.orders.by_type || {});
    data = Object.values(analyticsData.orders.by_type || {}).map(
      (v) => v.count,
    );
    label = "Orders by Type (Count)";
    chartType = "bar";
    if (summaryText)
      summaryText.innerHTML = `Total orders processed: <strong>${analyticsData.orders.total_orders || 0}</strong>. Use this to balance demand and purchasing flow.`;
  } else {
    if (summaryText)
      summaryText.innerHTML = "No telemetry data available for this chart.";
    return;
  }

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const textColor = isDark ? "#f5f7ff" : "#172033";
  const mutedTextColor = isDark ? "#aeb6d0" : "#64748b";
  const gridColor = isDark ? "rgba(129, 140, 248, 0.08)" : "rgba(0, 0, 0, 0.07)";
  const sliceBorderColor = isDark ? "rgba(15, 18, 48, 0.9)" : "#ffffff";

  const darkColors = [
    "rgba(99, 102, 241, 0.88)",  // Primary Indigo (#6366F1)
    "rgba(129, 140, 248, 0.85)", // Soft Indigo (#818CF8)
    "rgba(165, 180, 252, 0.85)", // Light Indigo (#A5B4FC)
    "rgba(45, 212, 191, 0.85)",  // Teal / Electric Cyan (#2DD4BF)
    "rgba(167, 139, 250, 0.85)", // Soft Violet (#A78BFA)
    "rgba(251, 191, 36, 0.85)",  // Warm Amber (#FBBF24)
    "rgba(248, 113, 113, 0.85)", // Rose (#F87171)
  ];

  const lightColors = [
    "rgba(15, 23, 42, 0.88)",    // Slate Navy
    "rgba(2, 132, 199, 0.85)",   // Vivid Sky Blue
    "rgba(124, 58, 237, 0.85)",  // Deep Violet
    "rgba(5, 150, 105, 0.85)",   // Emerald Green
    "rgba(217, 119, 6, 0.85)",   // Warm Amber
    "rgba(225, 29, 72, 0.85)",   // Crimson Rose
    "rgba(71, 85, 105, 0.85)",   // Slate Gray
  ];

  const colors = isDark ? darkColors : lightColors;

  mainChart = new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: data,
          backgroundColor: chartType === "bar" ? colors.slice(0, data.length) : colors,
          borderColor: sliceBorderColor,
          borderWidth: 1.5,
          borderRadius: chartType === "bar" ? 6 : 0,
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
            font: { family: "'Rubik', sans-serif", size: 12, weight: 500 },
            padding: 16,
            usePointStyle: true,
            pointStyle: "circle"
          }
        },
        tooltip: {
          backgroundColor: isDark ? "rgba(15, 18, 48, 0.95)" : "rgba(255, 255, 255, 0.95)",
          titleColor: isDark ? "#f5f7ff" : "#0f172a",
          bodyColor: isDark ? "#aeb6d0" : "#334155",
          borderColor: isDark ? "rgba(129, 140, 248, 0.25)" : "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          titleFont: { family: "'Rubik', sans-serif", size: 12, weight: 600 },
          bodyFont: { family: "'Rubik', sans-serif", size: 12 }
        }
      },
      scales: chartType === "bar" ? {
        x: {
          ticks: { color: mutedTextColor, font: { family: "'Rubik', sans-serif", size: 11 } },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          ticks: { color: mutedTextColor, font: { family: "'Rubik', sans-serif", size: 11 } },
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
      categoryDiv.innerHTML = data.by_category.length
        ? data.by_category
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
        .join("")
        : renderEmptyState("No valuation data", "Category totals will appear here when stock valuation is available.");
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
        renderEmptyState("No restocking needed", "All items are above the selected threshold.");
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
              <td>${renderStatusBadge("Critical")} <span class="status-detail">${item.quantity_available} left</span></td>
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
  if (currentView === "analytics") updateAnalyticsChart();
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
                        <p><strong>Restock needed:</strong> ${item.item_name} (${item.sku}) has ${item.units} units remaining.</p>
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
    "ai-optimizer": loadMlForecast,
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
      filterCurrentView(e.target.value);
    });
  }
}

function filterCurrentView(term) {
  currentSearchTerm = String(term || "").toLowerCase();
  loadViewData(currentView);
}

function initQuickActions() {
  document.querySelectorAll("[data-quick-action]").forEach((button) => {
    button.addEventListener("click", () => openModal(button.dataset.quickAction));
  });
  document.querySelectorAll("[data-quick-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.quickView));
  });
}

function initFilters() {
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;
    activeFilters[chip.dataset.view] = chip.dataset.filter;
    updateToolbarFilters(chip.dataset.view);
    if (currentView === chip.dataset.view) loadViewData(currentView);
  });
}

let currentContentScale = parseInt(localStorage.getItem("inventoryhub-content-scale"), 10) || 100;

function setContentScale(scalePercent) {
  const scale = Math.min(Math.max(parseInt(scalePercent, 10), 75), 135);
  currentContentScale = scale;
  localStorage.setItem("inventoryhub-content-scale", scale);

  const scaleFactor = scale / 100;
  const contentArea = document.getElementById("content-area");
  if (contentArea) {
    contentArea.style.zoom = scaleFactor;
    contentArea.style.setProperty("--content-scale", scaleFactor);
  }

  // Update slider input value
  const slider = document.getElementById("content-scale-slider");
  if (slider && parseInt(slider.value, 10) !== scale) {
    slider.value = scale;
  }

  // Update button value & popup badge
  const currentValEl = document.getElementById("scale-current-val");
  if (currentValEl) {
    currentValEl.textContent = `${scale}%`;
  }

  const popoverBadge = document.getElementById("scale-popover-badge");
  if (popoverBadge) {
    popoverBadge.textContent = `${scale}%`;
  }

  // Update preset buttons active state
  document.querySelectorAll(".scale-preset-chip").forEach((chip) => {
    const presetVal = parseInt(chip.dataset.preset, 10);
    chip.classList.toggle("active", presetVal === scale);
  });

  // Update slider fill track
  if (slider) {
    const fillPercent = ((scale - 75) / (135 - 75)) * 100;
    slider.style.setProperty("--slider-fill", `${fillPercent}%`);
  }

  // Ensure chart canvases redraw crisply to fit new dimensions
  window.dispatchEvent(new Event("resize"));
}

function initContentScalePopover() {
  setContentScale(currentContentScale);

  const triggerBtn = document.getElementById("scale-toggle-btn");
  const popoverCard = document.getElementById("scale-popover-card");
  const popoverWrapper = document.getElementById("scale-popover-wrapper");

  if (!triggerBtn || !popoverCard) return;

  triggerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = popoverCard.classList.contains("show");
    if (isOpen) {
      popoverCard.classList.remove("show");
      triggerBtn.classList.remove("open");
      triggerBtn.setAttribute("aria-expanded", "false");
    } else {
      popoverCard.classList.add("show");
      triggerBtn.classList.add("open");
      triggerBtn.setAttribute("aria-expanded", "true");
    }
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (popoverWrapper && !popoverWrapper.contains(e.target)) {
      popoverCard.classList.remove("show");
      triggerBtn.classList.remove("open");
      triggerBtn.setAttribute("aria-expanded", "false");
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popoverCard.classList.contains("show")) {
      popoverCard.classList.remove("show");
      triggerBtn.classList.remove("open");
      triggerBtn.setAttribute("aria-expanded", "false");
    }
  });

  // Slider input
  const slider = document.getElementById("content-scale-slider");
  if (slider) {
    slider.addEventListener("input", (e) => {
      setContentScale(e.target.value);
    });
  }

  // Steppers
  const stepDown = document.getElementById("scale-step-down");
  if (stepDown) {
    stepDown.addEventListener("click", (e) => {
      e.stopPropagation();
      setContentScale(currentContentScale - 5);
    });
  }

  const stepUp = document.getElementById("scale-step-up");
  if (stepUp) {
    stepUp.addEventListener("click", (e) => {
      e.stopPropagation();
      setContentScale(currentContentScale + 5);
    });
  }

  // Preset chips
  document.querySelectorAll(".scale-preset-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      const val = parseInt(chip.dataset.preset, 10);
      if (!isNaN(val)) setContentScale(val);
    });
  });

  // Reset button
  const resetBtn = document.getElementById("scale-reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setContentScale(100);
    });
  }
}

function initAnalyticsPresets() {
  // Redundant preset chips removed in favor of the primary Chart Type dropdown
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
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
  updateSearchUI(currentView);
  updateToolbarFilters(currentView);
  mountOnboardingTip(currentView);
  loadDashboard();
  updateNotifications();
  initSearch();
  initSorting();
  initQuickActions();
  initFilters();
  initContentScalePopover();
  initAnalyticsPresets();

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

// ==================== ML DEMAND & PROFIT OPTIMIZER ====================
let currentMlHorizon = 14;
let mlSalesChartInstance = null;
let mlProfitChartInstance = null;

function changeMlHorizon(days) {
  currentMlHorizon = days;
  document.querySelectorAll(".ml-horizon-btn").forEach((btn) => {
    btn.classList.toggle("active", parseInt(btn.dataset.days, 10) === days);
  });
  loadMlForecast(days);
}

async function loadMlForecast(days = currentMlHorizon) {
  try {
    showNotification(`Training ML models & forecasting ${days} days ahead...`, "info");
    const response = await fetch(`${API_BASE}/ml/forecast?days=${days}`);
    if (!response.ok) throw new Error("Failed to load forecast data");
    const data = await response.json();

    // 1. Update KPI Metric Cards
    const summary = data.summary;
    const projRevEl = document.getElementById("ml-proj-revenue");
    const projProfitEl = document.getElementById("ml-proj-profit");
    const projCostsEl = document.getElementById("ml-proj-costs");
    const opsSavingsEl = document.getElementById("ml-ops-savings");
    const marginEl = document.getElementById("ml-proj-margin");
    const holdingSavedEl = document.getElementById("ml-holding-saved");

    if (projRevEl) projRevEl.textContent = `₹${Math.round(summary.projected_revenue).toLocaleString("en-IN")}`;
    if (projProfitEl) projProfitEl.textContent = `₹${Math.round(summary.projected_net_profit).toLocaleString("en-IN")}`;
    if (projCostsEl) projCostsEl.textContent = `₹${Math.round(summary.projected_cogs + summary.projected_holding_cost + summary.projected_opex).toLocaleString("en-IN")}`;
    if (opsSavingsEl) opsSavingsEl.textContent = `${summary.ops_savings?.hours_saved_monthly || 24} hrs/mo`;

    if (marginEl) {
      marginEl.innerHTML = `<i class="fas fa-percentage"></i> ${summary.projected_margin_pct}% Margin`;
      marginEl.className = `metric-trend ${summary.is_profitable ? "positive" : "negative"}`;
    }

    if (holdingSavedEl) {
      holdingSavedEl.innerHTML = `<i class="fas fa-shield-halved"></i> Saves ₹${Math.round(summary.ops_savings?.holding_cost_reduced || 0).toLocaleString("en-IN")} holding`;
    }

    // 2. Render Sales & Demand Forecast Chart
    renderMlSalesChart(data.daily_aggregate);

    // 3. Render Profit & Loss Breakdown Chart
    renderMlProfitChart(summary);

    // 4. Render Prescriptive AI Recommendation Cards
    renderMlRecommendations(data.recommendations);

    // 5. Render Product Predictive Table
    renderMlProductsTable(data.products);

    showNotification("ML sales prediction and profit models updated!", "success");
  } catch (err) {
    console.error("ML Forecast Error:", err);
    showNotification("Could not load ML forecast: " + err.message, "error");
  }
}

function renderMlSalesChart(dailyAggregate) {
  const ctx = document.getElementById("ml-sales-chart");
  if (!ctx) return;

  if (mlSalesChartInstance) {
    mlSalesChartInstance.destroy();
  }

  const labels = dailyAggregate.map((d) => `${d.day_name} (${d.date.slice(5)})`);
  const predictedUnits = dailyAggregate.map((d) => d.predicted_units);
  const upperBounds = dailyAggregate.map((d) => d.upper_bound);
  const lowerBounds = dailyAggregate.map((d) => d.lower_bound);

  mlSalesChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Predicted Daily Demand (Units)",
          data: predictedUnits,
          borderColor: "#818cf8",
          backgroundColor: "rgba(129, 140, 248, 0.2)",
          borderWidth: 3,
          tension: 0.35,
          fill: false,
          pointBackgroundColor: "#818cf8",
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Upper Confidence Bound (+1.28σ)",
          data: upperBounds,
          borderColor: "rgba(99, 102, 241, 0.4)",
          backgroundColor: "rgba(99, 102, 241, 0.08)",
          borderWidth: 1,
          borderDash: [4, 4],
          fill: "+1",
          pointRadius: 0,
        },
        {
          label: "Lower Confidence Bound (-1.28σ)",
          data: lowerBounds,
          borderColor: "rgba(99, 102, 241, 0.4)",
          backgroundColor: "rgba(99, 102, 241, 0.08)",
          borderWidth: 1,
          borderDash: [4, 4],
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#94a3b8", font: { size: 11, family: "Inter" } },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          ticks: { color: "#64748b", font: { size: 10 } },
          grid: { color: "rgba(255, 255, 255, 0.04)" },
        },
        y: {
          ticks: { color: "#64748b", font: { size: 10 } },
          grid: { color: "rgba(255, 255, 255, 0.06)" },
          title: { display: true, text: "Units Forecasted", color: "#64748b" },
        },
      },
    },
  });
}

function renderMlProfitChart(summary) {
  const ctx = document.getElementById("ml-profit-chart");
  if (!ctx) return;

  if (mlProfitChartInstance) {
    mlProfitChartInstance.destroy();
  }

  const cogs = Math.round(summary.projected_cogs);
  const holding = Math.round(summary.projected_holding_cost);
  const opex = Math.round(summary.projected_opex);
  const netProfit = Math.max(0, Math.round(summary.projected_net_profit));

  mlProfitChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [
        "Net Profit",
        "Cost of Goods Sold (COGS)",
        "Storage & Holding Costs",
        "Order Processing & Dispatch",
      ],
      datasets: [
        {
          data: [netProfit, cogs, holding, opex],
          backgroundColor: [
            "#10b981",
            "#6366f1",
            "#f59e0b",
            "#0ea5e9",
          ],
          borderColor: "#0f1123",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { color: "#94a3b8", font: { size: 11, family: "Inter" } },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const val = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${context.label}: ₹${val.toLocaleString("en-IN")} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

function renderMlRecommendations(recommendations) {
  const container = document.getElementById("ml-recommendations-container");
  const countBadge = document.getElementById("ml-rec-count");
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${recommendations.length} Actions Ready`;
  }

  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No immediate optimization actions needed. Inventory velocity is balanced!</div>`;
    return;
  }

  container.innerHTML = recommendations
    .map(
      (r) => `
    <div class="ml-rec-card priority-${r.priority}">
      <div>
        <div class="ml-rec-header">
          <div class="ml-rec-title">
            <i class="fas ${r.icon}" style="color: var(--accent-${r.color || "cyan"});"></i>
            <span>${r.title}</span>
          </div>
          <span class="badge ${r.priority === "HIGH" ? "badge-danger" : r.priority === "MEDIUM" ? "badge-warning" : "badge-success"}">${r.priority} PRIORITY</span>
        </div>
        <p class="ml-rec-desc">${r.description}</p>
        <div class="ml-rec-action-box">
          <strong><i class="fas fa-bullseye"></i> Recommended Action:</strong> ${r.action}
        </div>
      </div>
      <div class="ml-rec-footer">
        <span class="ml-rec-impact"><i class="fas fa-bolt"></i> ${r.impact}</span>
      </div>
    </div>
  `
    )
    .join("");
}

function renderMlProductsTable(products) {
  const tbody = document.getElementById("ml-products-table-body");
  if (!tbody) return;

  if (!products || products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #999;">No products available for predictive modeling.</td></tr>`;
    return;
  }

  tbody.innerHTML = products
    .map((p) => {
      return `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${p.item_name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${p.sku}</div>
        </td>
        <td>₹${Math.round(p.price).toLocaleString("en-IN")}</td>
        <td>₹${Math.round(p.unit_cost).toLocaleString("en-IN")}</td>
        <td><span style="font-weight: 500;">${p.current_stock} units</span></td>
        <td>
          <span style="color: ${p.days_of_inventory < 10 ? 'var(--accent-rose)' : p.days_of_inventory > 40 ? 'var(--accent-amber)' : 'var(--accent-emerald)'}; font-weight: 600;">
            ${p.days_of_inventory} d
          </span>
        </td>
        <td style="font-weight: 600; color: #818cf8;">${p.predicted_units} units</td>
        <td>₹${Math.round(p.predicted_revenue).toLocaleString("en-IN")}</td>
        <td style="font-weight: 600; color: ${p.projected_net_profit >= 0 ? "#34d399" : "var(--accent-rose)"};">
          ₹${Math.round(p.projected_net_profit).toLocaleString("en-IN")}
        </td>
        <td><span class="badge ${p.badge_class}">${p.status_label} (${p.profit_margin_pct}%)</span></td>
      </tr>
    `;
    })
    .join("");
}
