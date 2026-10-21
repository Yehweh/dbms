import os
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from models import db, User, Category, Supplier, Item, Stock, Order, AuditLog, TransactionHistory, OrderDetail
from datetime import datetime
import json
import io
from fpdf import FPDF

load_dotenv()

app = Flask(__name__)

# Database configuration (Oracle SQL / SQL*Plus)
oracle_user = os.getenv('ORACLE_USER', 'system')
oracle_password = os.getenv('ORACLE_PASSWORD', '')
oracle_host = os.getenv('ORACLE_HOST', 'localhost')
oracle_port = os.getenv('ORACLE_PORT', '1521')
oracle_service = os.getenv('ORACLE_SERVICE', 'XEPDB1')
oracle_sid = os.getenv('ORACLE_SID')

if os.getenv('DATABASE_URL'):
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
elif oracle_sid:
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"oracle+oracledb://{oracle_user}:{oracle_password}@{oracle_host}:{oracle_port}/?sid={oracle_sid}"
    )
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"oracle+oracledb://{oracle_user}:{oracle_password}@{oracle_host}:{oracle_port}/?service_name={oracle_service}"
    )
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False

db.init_app(app)
CORS(app)

# ==================== PDF GENERATION ====================

class PDF(FPDF):
    def header(self):
        # Logo placeholder (could be a stylized box)
        self.set_fill_color(20, 110, 180)
        self.rect(10, 10, 10, 10, 'F')
        
        self.set_font('Arial', 'B', 15)
        self.set_text_color(20, 110, 180)
        self.cell(15) # Move to the right
        self.cell(0, 10, 'InventoryHub Professional', 0, 1, 'L')
        
        self.set_font('Arial', 'I', 8)
        self.set_text_color(100, 100, 100)
        self.cell(15)
        self.cell(0, 5, 'Advanced Inventory & Warehouse Management System', 0, 1, 'L')
        
        self.ln(10)
        self.set_draw_color(20, 110, 180)
        self.line(10, 32, 200, 32)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.set_draw_color(200, 200, 200)
        self.line(10, 282, 200, 282)
        self.cell(0, 10, f'Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M")} | Confidential | Page {self.page_no()}', 0, 0, 'C')

def generate_inventory_pdf():
    pdf = PDF()
    pdf.add_page()
    
    # Title Section
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(33, 33, 33)
    pdf.cell(0, 15, 'INVENTORY STATUS REPORT', 0, 1, 'C')
    pdf.ln(5)

    # Summary Stats
    stocks = Stock.query.all()
    total_items = len(stocks)
    total_units = sum(s.quantity_available for s in stocks)
    
    pdf.set_fill_color(245, 245, 245)
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(60, 10, f'Total Unique Items: {total_items}', 1, 0, 'C', True)
    pdf.cell(60, 10, f'Total Stock Units: {total_units}', 1, 0, 'C', True)
    pdf.cell(70, 10, f'Report Type: Full Inventory', 1, 1, 'C', True)
    pdf.ln(10)

    # Table Header
    pdf.set_fill_color(20, 110, 180)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(70, 10, 'Product Name', 1, 0, 'C', True)
    pdf.cell(30, 10, 'SKU', 1, 0, 'C', True)
    pdf.cell(30, 10, 'Warehouse', 1, 0, 'C', True)
    pdf.cell(30, 10, 'Price', 1, 0, 'C', True)
    pdf.cell(15, 10, 'Qty', 1, 0, 'C', True)
    pdf.cell(15, 10, 'Stat', 1, 1, 'C', True)

    # Table Body
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('Arial', '', 9)
    
    fill = False
    for stock in stocks:
        item = db.session.get(Item, stock.item_id)
        if item:
            pdf.set_fill_color(240, 248, 255) if fill else pdf.set_fill_color(255, 255, 255)
            pdf.cell(70, 8, item.item_name[:35], 1, 0, 'L', True)
            pdf.cell(30, 8, item.sku, 1, 0, 'C', True)
            pdf.cell(30, 8, stock.warehouse, 1, 0, 'C', True)
            pdf.cell(30, 8, f'Rs. {item.price:,.0f}', 1, 0, 'R', True)
            pdf.cell(15, 8, str(stock.quantity_available), 1, 0, 'C', True)
            
            # Status color
            if stock.quantity_available < 10:
                pdf.set_text_color(200, 0, 0)
            status_text = (stock.status or 'Healthy')[:1]
            pdf.cell(15, 8, status_text, 1, 1, 'C', True)
            pdf.set_text_color(0, 0, 0)
            fill = not fill

    return pdf.output(dest='S')

def generate_orders_pdf():
    pdf = PDF()
    pdf.add_page()
    
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(0, 15, 'ORDER HISTORY REPORT', 0, 1, 'C')
    pdf.ln(5)

    # Summary
    orders = Order.query.all()
    sales = len([o for o in orders if o.order_type == 'SALE'])
    purchases = len([o for o in orders if o.order_type == 'PURCHASE'])
    
    pdf.set_fill_color(245, 245, 245)
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(95, 10, f'Total Sales: {sales}', 1, 0, 'C', True)
    pdf.cell(95, 10, f'Total Purchases: {purchases}', 1, 1, 'C', True)
    pdf.ln(10)

    # Table Header
    pdf.set_fill_color(20, 110, 180)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(30, 10, 'Order ID', 1, 0, 'C', True)
    pdf.cell(40, 10, 'Customer/User', 1, 0, 'C', True)
    pdf.cell(30, 10, 'Type', 1, 0, 'C', True)
    pdf.cell(60, 10, 'Date & Time', 1, 0, 'C', True)
    pdf.cell(30, 10, 'Status', 1, 1, 'C', True)

    # Table Body
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('Arial', '', 9)
    
    fill = False
    for order in orders:
        user = db.session.get(User, order.user_id)
        pdf.set_fill_color(240, 248, 255) if fill else pdf.set_fill_color(255, 255, 255)
        pdf.cell(30, 8, str(order.order_id), 1, 0, 'C', True)
        pdf.cell(40, 8, (user.username if user else 'N/A')[:20], 1, 0, 'L', True)
        pdf.cell(30, 8, str(order.order_type or 'SALE'), 1, 0, 'C', True)
        pdf.cell(60, 8, order.order_date.strftime('%Y-%m-%d %H:%M') if order.order_date else '', 1, 0, 'C', True)
        pdf.cell(30, 8, 'COMPLETED', 1, 1, 'C', True)
        fill = not fill

    return pdf.output(dest='S')

def generate_product_analytics_pdf():
    pdf = PDF()
    pdf.add_page()
    
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(0, 15, 'PRODUCT ANALYTICS REPORT', 0, 1, 'C')
    pdf.ln(5)

    items = Item.query.all()
    avg_price = sum(i.price for i in items) / len(items) if items else 0
    
    pdf.set_fill_color(245, 245, 245)
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(95, 10, f'Total Products: {len(items)}', 1, 0, 'C', True)
    pdf.cell(95, 10, f'Average Item Price: Rs. {avg_price:,.2f}', 1, 1, 'C', True)
    pdf.ln(10)

    # Table Header
    pdf.set_fill_color(20, 110, 180)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(80, 10, 'Product Name', 1, 0, 'C', True)
    pdf.cell(30, 10, 'SKU', 1, 0, 'C', True)
    pdf.cell(40, 10, 'Category', 1, 0, 'C', True)
    pdf.cell(40, 10, 'Supplier', 1, 1, 'C', True)

    # Table Body
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('Arial', '', 9)
    
    fill = False
    for item in items:
        cat = db.session.get(Category, item.category_id)
        sup = db.session.get(Supplier, item.supplier_id)
        pdf.set_fill_color(240, 248, 255) if fill else pdf.set_fill_color(255, 255, 255)
        pdf.cell(80, 8, item.item_name[:40], 1, 0, 'L', True)
        pdf.cell(30, 8, item.sku, 1, 0, 'C', True)
        pdf.cell(40, 8, (cat.category_name if cat else 'N/A')[:20], 1, 0, 'C', True)
        pdf.cell(40, 8, (sup.supplier_name if sup else 'N/A')[:20], 1, 1, 'C', True)
        fill = not fill

    return pdf.output(dest='S')

def generate_db_schema_pdf():
    pdf = PDF()
    pdf.add_page()
    
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(0, 15, 'DATABASE SCHEMA DOCUMENTATION', 0, 1, 'C')
    pdf.ln(5)

    tables = {
        'user': ['user_id', 'username', 'password', 'role', 'email'],
        'category': ['category_id', 'category_name'],
        'supplier': ['supplier_id', 'supplier_name', 'contact_no', 'address'],
        'item': ['item_id', 'item_name', 'sku', 'price', 'image_url', 'popularity', 'category_id', 'supplier_id'],
        'stock': ['stock_id', 'item_id', 'quantity_available', 'warehouse', 'status', 'last_updated'],
        'order': ['order_id', 'order_date', 'order_type', 'user_id'],
        'orderdetail': ['order_detail_id', 'order_id', 'item_id', 'quantity', 'price']
    }

    for table, columns in tables.items():
        pdf.set_font('Arial', 'B', 12)
        pdf.set_text_color(20, 110, 180)
        pdf.cell(0, 10, f'Table: {table.upper()}', 0, 1, 'L')
        
        pdf.set_font('Arial', 'B', 10)
        pdf.set_fill_color(240, 240, 240)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(0, 8, '  Columns', 1, 1, 'L', True)
        
        pdf.set_font('Arial', '', 10)
        pdf.set_text_color(0, 0, 0)
        for col in columns:
            pdf.cell(10)
            pdf.cell(0, 7, f'- {col}', 0, 1, 'L')
        pdf.ln(5)

    return pdf.output(dest='S')

@app.route('/api/reports/<type>/pdf', methods=['GET'])
def get_pdf_report(type):
    try:
        if type == 'inventory':
            pdf_content = generate_inventory_pdf()
        elif type == 'orders':
            pdf_content = generate_orders_pdf()
        elif type == 'product-analytics':
            pdf_content = generate_product_analytics_pdf()
        elif type == 'db-schema':
            pdf_content = generate_db_schema_pdf()
        if isinstance(pdf_content, str):
            pdf_bytes = pdf_content.encode('latin1')
        else:
            pdf_bytes = bytes(pdf_content)
            
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{type}_report_{datetime.now().strftime("%Y%m%d")}.pdf'
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== HELPERS ====================
def calculate_status(qty):
    """Automatically calculate stock status based on quantity"""
    if qty <= 0:
        return 'Out of Stock'
    elif qty <= 5:
        return 'Critical'
    elif qty <= 15:
        return 'Warning'
    else:
        return 'Healthy'

def record_audit(table, record_id, action, old_vals=None, new_vals=None, user_id=1):
    """Log database changes to AuditLog table"""
    try:
        log = AuditLog(
            table_name=table,
            record_id=record_id,
            action=action,
            changed_by=user_id,
            old_values=json.dumps(old_vals) if old_vals else None,
            new_values=json.dumps(new_vals) if new_vals else None,
            changed_at=datetime.now()
        )
        db.session.add(log)
    except Exception as e:
        print(f"Audit log failed: {e}")

def record_transaction(item_id, type, qty, ref_type='MANUAL', ref_id=None, notes=None, user_id=1):
    """Log stock movements to TransactionHistory table"""
    try:
        tx = TransactionHistory(
            item_id=item_id,
            transaction_type=type,
            quantity_changed=qty,
            reference_type=ref_type,
            reference_id=str(ref_id) if ref_id else None,
            notes=notes,
            created_by=user_id,
            transaction_date=datetime.now()
        )
        db.session.add(tx)
    except Exception as e:
        print(f"Transaction history failed: {e}")

# ==================== ERROR HANDLING ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# ==================== ROUTES ====================

@app.route('/')
def index():
    return render_template('index.html')

# ==================== DASHBOARD ====================
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """Get comprehensive dashboard metrics"""
    try:
        # Order metrics
        total_orders = Order.query.count()
        sale_orders = Order.query.filter(Order.order_type == 'SALE').count()
        purchase_orders = Order.query.filter(Order.order_type == 'PURCHASE').count()
        
        # Calculate Real Revenue from SALE orders
        from sqlalchemy import func
        total_revenue = db.session.query(func.sum(OrderDetail.quantity * OrderDetail.price))\
            .join(Order, OrderDetail.order_id == Order.order_id)\
            .filter(Order.order_type == 'SALE').scalar() or 0
        
        # Inventory metrics
        inventory_value = 0
        inventory_units = 0
        stocks = Stock.query.all()
        for stock in stocks:
            item = db.session.get(Item, stock.item_id)
            if item:
                inventory_value += item.price * stock.quantity_available
                inventory_units += stock.quantity_available
        
        # Low stock items
        low_stock_items = Stock.query.filter(Stock.quantity_available < 20).all()
        low_stock_data = []
        for stock in low_stock_items:
            item = db.session.get(Item, stock.item_id)
            if item:
                low_stock_data.append({
                    'sku': item.sku,
                    'item_name': item.item_name,
                    'warehouse': stock.warehouse,
                    'units': stock.quantity_available,
                    'status': stock.status,
                    'imageUrl': item.image_url or ''
                })
        
        # Top selling items (using popularity column)
        top_selling_data = []
        popular_items = Item.query.order_by(Item.popularity.desc()).limit(5).all()
         
        if not popular_items:
            items = Item.query.limit(5).all()
            for item in items:
                top_selling_data.append({
                    'item_name': item.item_name,
                    'sku': item.sku,
                    'unitsSold': 0,
                    'progress': 0
                })
        else:
            max_popularity = popular_items[0].popularity if popular_items[0].popularity > 0 else 1
            for item in popular_items:
                top_selling_data.append({
                    'item_name': item.item_name,
                    'sku': item.sku,
                    'unitsSold': item.popularity,
                    'progress': int((item.popularity / max_popularity) * 100) if max_popularity > 0 else 0
                })
        
        return jsonify({
            'metrics': {
                'revenue': float(total_revenue),
                'activeOrders': sale_orders,
                'purchaseOrders': purchase_orders,
                'inventoryValue': float(inventory_value),
                'inventoryUnits': int(inventory_units),
                'lowStockCount': len(low_stock_data),
                'criticalItems': len([s for s in low_stock_data if s['units'] < 10]),
                'totalProducts': Item.query.count(),
                'totalSuppliers': Supplier.query.count()
            },
            'lowStock': low_stock_data[:10],
            'topSelling': top_selling_data
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== PRODUCTS ====================
@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products with optional filtering"""
    try:
        query = Item.query
        
        # Apply filters
        category_id = request.args.get('category_id')
        supplier_id = request.args.get('supplier_id')
        
        if category_id:
            query = query.filter_by(category_id=int(category_id))
        if supplier_id:
            query = query.filter_by(supplier_id=int(supplier_id))
        
        items = query.all()
        result = []
        for item in items:
            stock = Stock.query.filter_by(item_id=item.item_id).first()
            cat = db.session.get(Category, item.category_id)
            sup = db.session.get(Supplier, item.supplier_id)
            
            result.append({
                'itemId': item.item_id,
                'item_name': item.item_name,
                'sku': item.sku,
                'category_name': cat.category_name if cat else '',
                'supplier_name': sup.supplier_name if sup else '',
                'price': item.price,
                'quantity': stock.quantity_available if stock else 0,
                'warehouse': stock.warehouse if stock else '',
                'status': stock.status if stock else 'Healthy',
                'imageUrl': item.image_url or '',
                'popularity': item.popularity
            })
            
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:item_id>', methods=['GET'])
def get_product(item_id):
    try:
        item = db.session.get(Item, item_id)
        if not item:
            return jsonify({'error': 'Product not found'}), 404
            
        stock = Stock.query.filter_by(item_id=item.item_id).first()
        cat = db.session.get(Category, item.category_id)
        sup = db.session.get(Supplier, item.supplier_id)
        
        return jsonify({
            'itemId': item.item_id,
            'item_name': item.item_name,
            'sku': item.sku,
            'category_name': cat.category_name if cat else '',
            'supplier_name': sup.supplier_name if sup else '',
            'price': item.price,
            'quantity': stock.quantity_available if stock else 0,
            'quantity_available': stock.quantity_available if stock else 0,
            'warehouse': stock.warehouse if stock else '',
            'status': stock.status if stock else 'Healthy',
            'imageUrl': item.image_url or '',
            'popularity': item.popularity
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products', methods=['POST'])
def create_product():
    try:
        from sqlalchemy import func
        data = request.json
        
        cat_name = data.get('category_name', '').strip()
        cat = Category.query.filter(func.lower(Category.category_name) == func.lower(cat_name)).first() if cat_name else None
        if not cat and cat_name:
            cat = Category(category_name=cat_name)
            db.session.add(cat)
            db.session.flush()
            
        sup_name = data.get('supplier_name', '').strip()
        sup = Supplier.query.filter(func.lower(Supplier.supplier_name) == func.lower(sup_name)).first() if sup_name else None
        if not sup and sup_name:
            sup = Supplier(supplier_name=sup_name)
            db.session.add(sup)
            db.session.flush()
            
        new_item = Item(
            item_name=data.get('item_name'),
            sku=data.get('sku'),
            price=float(data.get('price', 0)),
            image_url=data.get('image_url') or data.get('img_url'),
            category_id=cat.category_id if cat else 1,
            supplier_id=sup.supplier_id if sup else 1
        )
        db.session.add(new_item)
        db.session.flush()
        
        new_stock = Stock(
            item_id=new_item.item_id,
            quantity_available=int(data.get('quantity_available', 0)),
            warehouse=data.get('warehouse', 'WH-01'),
            status=data.get('status', 'Healthy'),
            last_updated=datetime.now()
        )
        db.session.add(new_stock)
        db.session.flush()
        
        # Log to History
        record_audit('item', new_item.item_id, 'INSERT', new_vals=new_item.to_dict())
        record_transaction(new_item.item_id, 'IN', new_stock.quantity_available, notes='Initial stock')
        
        db.session.commit()
        return jsonify({'message': 'Created'}), 201
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:item_id>', methods=['PUT'])
def update_product(item_id):
    try:
        from sqlalchemy import func
        item = db.session.get(Item, item_id)
        if not item:
            return jsonify({'error': 'Product not found'}), 404
        
        data = request.json
        
        # Positivity check
        if 'quantity_available' in data and data['quantity_available'] != "" and int(data['quantity_available']) < 0:
             return jsonify({'error': 'Quantity cannot be negative'}), 400

        cat_name = data.get('category_name', '').strip() if data.get('category_name') else ''
        if cat_name:
            cat = Category.query.filter(func.lower(Category.category_name) == func.lower(cat_name)).first()
            if not cat:
                cat = Category(category_name=cat_name)
                db.session.add(cat)
                db.session.flush()
            item.category_id = cat.category_id
            
        sup_name = data.get('supplier_name', '').strip() if data.get('supplier_name') else ''
        if sup_name:
            sup = Supplier.query.filter(func.lower(Supplier.supplier_name) == func.lower(sup_name)).first()
            if not sup:
                sup = Supplier(supplier_name=sup_name)
                db.session.add(sup)
                db.session.flush()
            item.supplier_id = sup.supplier_id
            
        old_vals = item.to_dict()
        item.item_name = data.get('item_name', item.item_name)
        item.price = float(data.get('price', item.price))
        item.image_url = data.get('image_url') or data.get('img_url') or item.image_url
            
        stock = Stock.query.filter_by(item_id=item.item_id).first()
        raw_qty = data.get('quantity_available')
        if stock and raw_qty is not None and str(raw_qty).strip() != "":
            old_qty = stock.quantity_available
            new_qty = int(raw_qty)
            
            if old_qty != new_qty:
                record_transaction(item.item_id, 'ADJUSTMENT', new_qty - old_qty, notes='Bulk product update')
                if new_qty < old_qty:
                    item.popularity += (old_qty - new_qty)
            
            stock.quantity_available = new_qty
            stock.warehouse = data.get('warehouse', stock.warehouse)
            stock.status = calculate_status(new_qty)
            stock.last_updated = datetime.now()
        
        db.session.flush()
        record_audit('item', item.item_id, 'UPDATE', old_vals=old_vals, new_vals=item.to_dict())
        
        db.session.commit()
        return jsonify({'message': 'Updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:item_id>', methods=['DELETE'])
def delete_product(item_id):
    try:
        item = db.session.get(Item, item_id)
        if not item:
            return jsonify({'error': 'Product not found'}), 404
            
        old_vals = item.to_dict()
        TransactionHistory.query.filter_by(item_id=item.item_id).delete(synchronize_session=False)
        OrderDetail.query.filter_by(item_id=item.item_id).delete(synchronize_session=False)
        Stock.query.filter_by(item_id=item.item_id).delete(synchronize_session=False)
            
        db.session.delete(item)
        db.session.flush()
        record_audit('item', item_id, 'DELETE', old_vals=old_vals)
        
        db.session.commit()
        return jsonify({'message': 'Product deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== STOCK ====================
@app.route('/api/stock', methods=['GET'])
def get_stock():
    """Get all stock with item details"""
    try:
        stocks = Stock.query.all()
        result = []
        for stock in stocks:
            item = db.session.get(Item, stock.item_id)
            stock_dict = stock.to_dict()
            if item:
                stock_dict['item_name'] = item.item_name
                stock_dict['sku'] = item.sku
                stock_dict['price'] = item.price
                stock_dict['popularity'] = item.popularity
            result.append(stock_dict)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock/<int:stock_id>', methods=['GET'])
def get_stock_item(stock_id):
    try:
        stock = db.session.get(Stock, stock_id)
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        result = stock.to_dict()
        item = db.session.get(Item, stock.item_id)
        if item:
            result['item_name'] = item.item_name
            result['sku'] = item.sku
            result['popularity'] = item.popularity
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock', methods=['POST'])
def create_stock():
    try:
        data = request.json
        new_stock = Stock(
            item_id=int(data.get('item_id')),
            quantity_available=int(data.get('quantity_available', 0)),
            warehouse=data.get('warehouse', 'Main'),
            status=data.get('status', 'Healthy'),
            last_updated=datetime.now()
        )
        db.session.add(new_stock)
        db.session.flush()
        record_transaction(new_stock.item_id, 'IN', new_stock.quantity_available, notes='Manual stock entry')
        
        db.session.commit()
        return jsonify(new_stock.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock/<int:stock_id>', methods=['PUT'])
def update_stock(stock_id):
    try:
        stock = db.session.get(Stock, stock_id)
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        
        data = request.json
        new_qty = int(data.get('quantity_available', stock.quantity_available))
        
        if new_qty < 0:
            return jsonify({'error': 'Quantity cannot be negative'}), 400

        old_qty = stock.quantity_available
        if old_qty != new_qty:
            record_transaction(stock.item_id, 'ADJUSTMENT', new_qty - old_qty, notes='Direct stock edit')
            if new_qty < old_qty:
                item = db.session.get(Item, stock.item_id)
                if item:
                    item.popularity += (old_qty - new_qty)
        
        stock.quantity_available = new_qty
        stock.warehouse = data.get('warehouse', stock.warehouse)
        stock.status = calculate_status(new_qty)
        stock.last_updated = datetime.now()
        
        db.session.commit()
        return jsonify(stock.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock/<int:stock_id>', methods=['DELETE'])
def delete_stock(stock_id):
    try:
        stock = db.session.get(Stock, stock_id)
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        db.session.delete(stock)
        db.session.commit()
        return jsonify({'message': 'Stock deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== ORDERS ====================
@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders with user details and summary metrics"""
    try:
        from models import OrderDetail, Item
        orders = Order.query.all()
        result_orders = []
        
        total_amount = 0
        sale_orders = 0
        purchase_orders = 0
        
        for order in orders:
            user = db.session.get(User, order.user_id)
            
            # Fetch details
            details = OrderDetail.query.filter_by(order_id=order.order_id).all()
            lines = []
            order_total = 0
            items_count = 0
            
            for detail in details:
                detail_dict = detail.to_dict()
                line = {
                    'itemName': detail_dict.get('item_name', ''),
                    'sku': '',
                    'quantity': detail.quantity,
                    'price': detail.price
                }
                
                # Fetch SKU from Item
                item = db.session.get(Item, detail.item_id)
                if item:
                    line['sku'] = item.sku
                
                lines.append(line)
                order_total += detail.price * detail.quantity
                items_count += detail.quantity
            
            order_dict = {
                'id': order.order_id,
                'user': user.username if user else '',
                'type': order.order_type,
                'date': order.order_date.isoformat() if order.order_date else '',
                'itemsCount': items_count,
                'totalAmount': order_total,
                'lines': lines
            }
            
            result_orders.append(order_dict)
            
            total_amount += order_total
            if order.order_type == 'SALE':
                sale_orders += 1
            elif order.order_type == 'PURCHASE':
                purchase_orders += 1
                
        result = {
            'summary': {
                'totalOrders': len(orders),
                'totalAmount': total_amount,
                'saleOrders': sale_orders,
                'purchaseOrders': purchase_orders
            },
            'orders': result_orders
        }
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    try:
        order = Order.query.filter_by(order_id=order_id).first()
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        result = order.to_dict()
        user = db.session.get(User, order.user_id)
        if user:
            result['user'] = user.username
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.json
        
        # Support both bulk (list of items) and single item (from form)
        items = data.get('items', [])
        if not items and 'item_id' in data:
            items = [{
                'item_id': int(data.get('item_id')),
                'quantity': int(data.get('quantity')),
                'price': float(data.get('price'))
            }]
        
        if not items:
            return jsonify({'error': 'No items in order'}), 400
            
        order_type = data.get('order_type', 'SALE')
        user_id = int(data.get('user_id', 1))

        # 1. Validate Stock Availability for all items first
        if order_type == 'SALE':
            for item_data in items:
                item_id = item_data.get('item_id')
                qty_to_sell = int(item_data.get('quantity', 0))
                stock = Stock.query.filter_by(item_id=item_id).first()
                if not stock or stock.quantity_available < qty_to_sell:
                    item = db.session.get(Item, item_id)
                    name = item.item_name if item else f"ID: {item_id}"
                    return jsonify({'error': f'Insufficient stock for {name}'}), 400

        # 2. Create Order Header
        new_order = Order(
            order_id=data.get('order_id') or f"ORD-{int(datetime.now().timestamp())}",
            order_date=datetime.now(),
            order_type=order_type,
            user_id=user_id
        )
        db.session.add(new_order)
        db.session.flush()

        # 3. Create Order Details and Update Stock
        for item_data in items:
            item_id = item_data.get('item_id')
            qty = int(item_data.get('quantity', 0))
            price = float(item_data.get('price', 0))
            
            detail = OrderDetail(
                order_id=new_order.order_id,
                item_id=item_id,
                quantity=qty,
                price=price
            )
            db.session.add(detail)
            
            # Update Stock and Popularity
            stock = Stock.query.filter_by(item_id=item_id).first()
            if stock:
                if order_type == 'SALE':
                    stock.quantity_available -= qty
                    # Increase popularity on sale
                    item = db.session.get(Item, item_id)
                    if item:
                        item.popularity += qty
                else:
                    stock.quantity_available += qty
                
                stock.status = calculate_status(stock.quantity_available)
                stock.last_updated = datetime.now()
                
                record_transaction(
                    item_id, 
                    'OUT' if order_type == 'SALE' else 'IN', 
                    qty, 
                    ref_type='ORDER', 
                    ref_id=new_order.order_id
                )

        db.session.commit()
        return jsonify(new_order.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<order_id>', methods=['DELETE'])
def delete_order(order_id):
    try:
        order = Order.query.filter_by(order_id=order_id).first()
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        OrderDetail.query.filter_by(order_id=order.order_id).delete(synchronize_session=False)
        db.session.delete(order)
        db.session.commit()
        return jsonify({'message': 'Order deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== USERS ====================
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    try:
        data = request.json
        new_user = User(
            username=data.get('username'),
            password=data.get('password'),
            email=data.get('email'),
            role=data.get('role', 'USER')
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify(new_user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.json
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.role = data.get('role', user.role)
        if data.get('password'):
            user.password = data.get('password')
        
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        TransactionHistory.query.filter_by(created_by=user.user_id).update({'created_by': None}, synchronize_session=False)
        AuditLog.query.filter_by(changed_by=user.user_id).update({'changed_by': None}, synchronize_session=False)
        
        orders = Order.query.filter_by(user_id=user.user_id).all()
        for order in orders:
            OrderDetail.query.filter_by(order_id=order.order_id).delete(synchronize_session=False)
            db.session.delete(order)
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== ANALYTICS & REPORTS ====================
@app.route('/api/reports/inventory', methods=['GET'])
def inventory_report():
    """Generate comprehensive inventory report"""
    try:
        stocks = Stock.query.all()
        report = {
            'generated_at': datetime.now().isoformat(),
            'total_stock_items': len(stocks),
            'total_units': 0,
            'total_value': 0,
            'by_warehouse': {},
            'by_status': {},
            'items': []
        }
        
        for stock in stocks:
            item = db.session.get(Item, stock.item_id)
            if item:
                value = item.price * stock.quantity_available
                report['total_units'] += stock.quantity_available
                report['total_value'] += value
                
                if stock.warehouse not in report['by_warehouse']:
                    report['by_warehouse'][stock.warehouse] = {'units': 0, 'value': 0}
                report['by_warehouse'][stock.warehouse]['units'] += stock.quantity_available
                report['by_warehouse'][stock.warehouse]['value'] += value
                
                status = stock.status or 'Healthy'
                if status not in report['by_status']:
                    report['by_status'][status] = {'count': 0, 'units': 0, 'value': 0}
                report['by_status'][status]['count'] += 1
                report['by_status'][status]['units'] += stock.quantity_available
                report['by_status'][status]['value'] += value
                
                report['items'].append({
                    'sku': item.sku,
                    'name': item.item_name,
                    'price': item.price,
                    'units': stock.quantity_available,
                    'warehouse': stock.warehouse,
                    'status': status,
                    'total_value': value
                })
        
        return jsonify(report)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/orders', methods=['GET'])
def orders_report():
    """Generate orders report with statistics"""
    try:
        from models import OrderDetail
        orders = Order.query.all()
        report = {
            'generated_at': datetime.now().isoformat(),
            'total_orders': len(orders),
            'by_type': {},
            'by_user': {},
            'orders': []
        }
        
        for order in orders:
            user = db.session.get(User, order.user_id)
            type_name = order.order_type or 'SALE'
            
            # Calculate order value and units
            details = OrderDetail.query.filter_by(order_id=order.order_id).all()
            order_value = sum(d.quantity * d.price for d in details)
            order_units = sum(d.quantity for d in details)
            
            if type_name not in report['by_type']:
                report['by_type'][type_name] = {'count': 0, 'units': 0, 'value': 0}
            
            report['by_type'][type_name]['count'] += 1
            report['by_type'][type_name]['units'] += order_units
            report['by_type'][type_name]['value'] += order_value
            
            username = user.username if user else 'Unknown'
            if username not in report['by_user']:
                report['by_user'][username] = {'count': 0, 'value': 0}
            report['by_user'][username]['count'] += 1
            report['by_user'][username]['value'] += order_value
            
            report['orders'].append({
                'order_id': order.order_id,
                'order_date': order.order_date.isoformat(),
                'order_type': type_name,
                'user': username,
                'value': order_value,
                'units': order_units
            })
        
        return jsonify(report)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/product-analytics', methods=['GET'])
def product_analytics():
    """Generate product analytics report"""
    try:
        items = Item.query.all()
        report = {
            'generated_at': datetime.now().isoformat(),
            'total_products': len(items),
            'by_category': {},
            'by_supplier': {},
            'price_range': {'min': 0, 'max': 0, 'avg': 0},
            'products': []
        }
        
        total_price = 0
        prices = []
        
        for item in items:
            stock = Stock.query.filter_by(item_id=item.item_id).first()
            units = stock.quantity_available if stock else 0
            
            if item.category_id not in report['by_category']:
                report['by_category'][item.category_id] = 0
            report['by_category'][item.category_id] += 1
            
            if item.supplier_id not in report['by_supplier']:
                report['by_supplier'][item.supplier_id] = 0
            report['by_supplier'][item.supplier_id] += 1
            
            prices.append(item.price)
            total_price += item.price
            
            report['products'].append({
                'sku': item.sku,
                'name': item.item_name,
                'price': item.price,
                'units_in_stock': units,
                'category_id': item.category_id,
                'supplier_id': item.supplier_id
            })
        
        if prices:
            report['price_range']['min'] = min(prices)
            report['price_range']['max'] = max(prices)
            report['price_range']['avg'] = total_price / len(items)
        
        return jsonify(report)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/db-schema', methods=['GET'])
def db_schema():
    """Get complete database schema for professor queries"""
    try:
        schema = {
            'tables': {
                'user': {
                    'columns': ['user_id', 'username', 'password', 'role', 'email'],
                    'primary_key': 'user_id',
                    'description': 'User accounts and roles'
                },
                'category': {
                    'columns': ['category_id', 'category_name'],
                    'primary_key': 'category_id',
                    'description': 'Product categories'
                },
                'supplier': {
                    'columns': ['supplier_id', 'supplier_name', 'contact_info'],
                    'primary_key': 'supplier_id',
                    'description': 'Supplier information'
                },
                'item': {
                    'columns': ['item_id', 'item_name', 'sku', 'price', 'category_id', 'supplier_id'],
                    'primary_key': 'item_id',
                    'foreign_keys': ['category_id', 'supplier_id'],
                    'description': 'Product items/inventory'
                },
                'stock': {
                    'columns': ['stock_id', 'item_id', 'quantity_available', 'warehouse', 'status', 'last_updated'],
                    'primary_key': 'stock_id',
                    'foreign_keys': ['item_id'],
                    'description': 'Stock/inventory tracking'
                },
                'order': {
                    'columns': ['order_id', 'order_date', 'order_type', 'user_id'],
                    'primary_key': 'order_id',
                    'foreign_keys': ['user_id'],
                    'description': 'Purchase and sales orders'
                },
                'orderdetail': {
                    'columns': ['order_detail_id', 'order_id', 'item_id', 'quantity', 'price'],
                    'primary_key': 'order_detail_id',
                    'foreign_keys': ['order_id', 'item_id'],
                    'description': 'Order line items'
                }
            }
        }
        return jsonify(schema)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/query-results', methods=['POST'])
def execute_report_query():
    """Execute predefined queries and show results (for professor demos)"""
    try:
        query_type = request.json.get('query_type')
        params = request.json.get('params', {})
        
        result = None
        
        if query_type == 'low_stock':
            threshold = params.get('threshold', 20)
            stocks = Stock.query.filter(Stock.quantity_available < threshold).all()
            result = {
                'query': f'SELECT * FROM stock WHERE quantity_available < {threshold}',
                'count': len(stocks),
                'data': [s.to_dict() for s in stocks]
            }
        
        elif query_type == 'high_value_items':
            items = Item.query.filter(Item.price > params.get('min_price', 1000)).all()
            result = {
                'query': f'SELECT * FROM item WHERE price > {params.get("min_price", 1000)}',
                'count': len(items),
                'data': [i.to_dict() for i in items]
            }
        
        elif query_type == 'order_summary':
            orders = Order.query.all()
            result = {
                'query': 'SELECT COUNT(*), order_type FROM order GROUP BY order_type',
                'count': len(orders),
                'data': {
                    'SALE': len([o for o in orders if o.order_type == 'SALE']),
                    'PURCHASE': len([o for o in orders if o.order_type == 'PURCHASE'])
                }
            }
        
        else:
            return jsonify({'error': 'Unknown query type'}), 400
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ADVANCED ANALYTICS (SQL-HEAVY) ====================

@app.route('/api/reports/stock-valuation', methods=['GET'])
def get_stock_valuation():
    """Get total warehouse value using raw SQL JOIN and AGGREGATIONS"""
    try:
        from sqlalchemy import text
        # Using a raw SQL JOIN with multiple aggregations to show SQL mastery
        query = text("""
            SELECT 
                c.category_name,
                COUNT(DISTINCT i.item_id) as total_items,
                SUM(s.quantity_available) as total_units,
                SUM(s.quantity_available * i.price) as total_value,
                ROUND(AVG(i.price), 2) as avg_price
            FROM category c
            JOIN item i ON c.category_id = i.category_id
            JOIN stock s ON i.item_id = s.item_id
            GROUP BY c.category_id, c.category_name
            ORDER BY total_value DESC
        """)
        
        result = db.session.execute(query).fetchall()
        
        by_category = []
        total_val = 0
        total_units = 0
        
        for row in result:
            val = float(row[3] or 0)
            total_val += val
            total_units += int(row[2] or 0)
            by_category.append({
                'category_name': row[0],
                'items': row[1],
                'units': int(row[2] or 0),
                'value': val,
                'avg_price': float(row[4] or 0)
            })
            
        # Add percentage calculation in Python (or could be done in SQL with a subquery)
        for cat in by_category:
            cat['percentage'] = (cat['value'] / total_val * 100) if total_val > 0 else 0
            
        return jsonify({
            'total_inventory_value': float(total_val),
            'total_unique_items': len(by_category),
            'total_units': total_units,
            'by_category': by_category
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/restock-list', methods=['GET'])
def get_restock_list():
    """Get items below threshold using a CALL to a STORED PROCEDURE with fallback"""
    threshold = request.args.get('threshold', 10, type=int)
    try:
        from sqlalchemy import text
        query = text("CALL sp_get_restock_list(:threshold)")
        result = db.session.execute(query, {'threshold': threshold}).fetchall()
        
        items = []
        for row in result:
            reorder_qty = int(row[11]) if len(row) > 11 else 20
            unit_price = float(row[3]) if len(row) > 3 else 0.0
            items.append({
                'item_id': row[0],
                'item_name': row[1],
                'sku': row[2],
                'price': unit_price,
                'quantity_available': row[4] if len(row) > 4 else 0,
                'warehouse': row[5] if len(row) > 5 else 'Main',
                'status': row[6] if len(row) > 6 else 'Critical',
                'supplier_name': row[7] if len(row) > 7 else 'N/A',
                'supplier_contact': row[8] if len(row) > 8 else 'N/A',
                'reorder_amount': reorder_qty,
                'reorder_cost': float(unit_price * reorder_qty)
            })
            
        return jsonify({
            'threshold': threshold,
            'low_items': len(items),
            'items': items
        })
    except Exception as proc_err:
        try:
            stocks = Stock.query.filter(Stock.quantity_available < threshold).all()
            items = []
            for stock in stocks:
                item = db.session.get(Item, stock.item_id)
                if item:
                    sup = db.session.get(Supplier, item.supplier_id)
                    reorder_qty = max(20 - stock.quantity_available, 10)
                    items.append({
                        'item_id': item.item_id,
                        'item_name': item.item_name,
                        'sku': item.sku,
                        'price': float(item.price),
                        'quantity_available': stock.quantity_available,
                        'warehouse': stock.warehouse,
                        'status': stock.status,
                        'supplier_name': sup.supplier_name if sup else 'N/A',
                        'supplier_contact': sup.contact_no if sup else 'N/A',
                        'reorder_amount': reorder_qty,
                        'reorder_cost': float(item.price * reorder_qty)
                    })
            return jsonify({
                'threshold': threshold,
                'low_items': len(items),
                'items': items
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/reports/transaction-history', methods=['GET'])
def get_transaction_history():
    """Get recent stock transactions using raw SQL with JOINs and ORDER BY"""
    try:
        from sqlalchemy import text
        limit = request.args.get('limit', 50, type=int)
        
        query = text("""
            SELECT 
                th.transaction_id,
                i.item_name,
                i.sku,
                th.transaction_type,
                th.quantity_changed,
                th.reference_type,
                th.transaction_date,
                u.username,
                th.notes
            FROM "TransactionHistory" th
            JOIN item i ON th.item_id = i.item_id
            LEFT JOIN "user" u ON th.created_by = u.user_id
            ORDER BY th.transaction_date DESC
            FETCH FIRST :limit ROWS ONLY
        """)
        
        result = db.session.execute(query, {'limit': limit}).fetchall()
        
        transactions = []
        for row in result:
            transactions.append({
                'transaction_id': row[0],
                'item_name': row[1],
                'sku': row[2],
                'transaction_type': row[3],
                'quantity_changed': row[4],
                'reference_type': row[5],
                'transaction_date': row[6].isoformat() if row[6] else '',
                'created_by': row[7] or 'System',
                'notes': row[8]
            })
            
        return jsonify(transactions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/popular-products', methods=['GET'])
def get_popular_products():
    """Demonstrate a SUBQUERY to find products with sales above average with fallback"""
    try:
        from sqlalchemy import text
        query = text("""
            SELECT i.item_name, i.sku, SUM(od.quantity) as total_sold
            FROM item i
            JOIN orderdetail od ON i.item_id = od.item_id
            GROUP BY i.item_id, i.item_name, i.sku
            HAVING SUM(od.quantity) > (
                SELECT AVG(sub_sold) FROM (
                    SELECT SUM(quantity) as sub_sold 
                    FROM orderdetail 
                    GROUP BY item_id
                ) averages
            )
            ORDER BY total_sold DESC
        """)
        
        result = db.session.execute(query).fetchall()
        if not result:
            items = Item.query.order_by(Item.popularity.desc()).limit(10).all()
            return jsonify([{'name': i.item_name, 'sku': i.sku, 'total_sold': i.popularity} for i in items])
        return jsonify([{'name': r[0], 'sku': r[1], 'total_sold': int(r[2])} for r in result])
    except Exception as e:
        items = Item.query.order_by(Item.popularity.desc()).limit(10).all()
        return jsonify([{'name': i.item_name, 'sku': i.sku, 'total_sold': i.popularity} for i in items])

@app.route('/api/reports/audit-logs', methods=['GET'])
def get_audit_logs():
    """Get audit trail of database changes"""
    try:
        from models import AuditLog
        limit = request.args.get('limit', 100, type=int)
        
        logs = AuditLog.query.order_by(
            AuditLog.changed_at.desc()
        ).limit(limit).all()
        
        return jsonify([log.to_dict() for log in logs])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/audit-logs/<int:audit_id>', methods=['GET'])
def get_audit_log(audit_id):
    """Get details of a specific audit log entry"""
    try:
        from models import AuditLog
        log = db.session.get(AuditLog, audit_id)
        if not log:
            return jsonify({'error': 'Audit log not found'}), 404
        return jsonify(log.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ML PREDICTIONS & PROFIT OPTIMIZATION ====================
@app.route('/api/ml/forecast', methods=['GET'])
def get_ml_forecast():
    """
    Machine Learning endpoint for Sales Forecasting, Profit & Loss analysis,
    and operational recommendations using Scikit-Learn.
    """
    try:
        from ml_engine import analyze_inventory_ml
        days = request.args.get('days', 14, type=int)
        days = max(7, min(days, 60))
        
        items = Item.query.all()
        stocks = Stock.query.all()
        orders = Order.query.all()
        order_details = OrderDetail.query.all()
        
        results = analyze_inventory_ml(items, stocks, orders, order_details, forecast_days=days)
        return jsonify(results)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== CATEGORIES ====================
@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify([c.to_dict() for c in categories])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    try:
        cat = db.session.get(Category, category_id)
        if not cat:
            return jsonify({'error': 'Category not found'}), 404
        return jsonify(cat.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['POST'])
def create_category():
    try:
        from sqlalchemy import func
        data = request.json
        name = data.get('category_name', '').strip()
        if not name:
            return jsonify({'error': 'Category name required'}), 400
        existing = Category.query.filter(func.lower(Category.category_name) == func.lower(name)).first()
        if existing:
            return jsonify(existing.to_dict()), 200
        cat = Category(category_name=name, description=data.get('description'))
        db.session.add(cat)
        db.session.commit()
        return jsonify(cat.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    try:
        cat = db.session.get(Category, category_id)
        if not cat:
            return jsonify({'error': 'Category not found'}), 404
        data = request.json
        cat.category_name = data.get('category_name', cat.category_name)
        cat.description = data.get('description', cat.description)
        db.session.commit()
        return jsonify(cat.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    try:
        cat = db.session.get(Category, category_id)
        if not cat:
            return jsonify({'error': 'Category not found'}), 404
        db.session.delete(cat)
        db.session.commit()
        return jsonify({'message': 'Category deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== SUPPLIERS ====================
@app.route('/api/suppliers', methods=['GET'])
def get_suppliers():
    try:
        suppliers = Supplier.query.all()
        return jsonify([s.to_dict() for s in suppliers])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/suppliers/<int:supplier_id>', methods=['GET'])
def get_supplier(supplier_id):
    try:
        sup = db.session.get(Supplier, supplier_id)
        if not sup:
            return jsonify({'error': 'Supplier not found'}), 404
        return jsonify(sup.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/suppliers', methods=['POST'])
def create_supplier():
    try:
        from sqlalchemy import func
        data = request.json
        name = data.get('supplier_name', '').strip()
        if not name:
            return jsonify({'error': 'Supplier name required'}), 400
        existing = Supplier.query.filter(func.lower(Supplier.supplier_name) == func.lower(name)).first()
        if existing:
            return jsonify(existing.to_dict()), 200
        sup = Supplier(
            supplier_name=name,
            contact_no=data.get('contact_no'),
            address=data.get('address')
        )
        db.session.add(sup)
        db.session.commit()
        return jsonify(sup.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/suppliers/<int:supplier_id>', methods=['PUT'])
def update_supplier(supplier_id):
    try:
        sup = db.session.get(Supplier, supplier_id)
        if not sup:
            return jsonify({'error': 'Supplier not found'}), 404
        data = request.json
        sup.supplier_name = data.get('supplier_name', sup.supplier_name)
        sup.contact_no = data.get('contact_no', sup.contact_no)
        sup.address = data.get('address', sup.address)
        db.session.commit()
        return jsonify(sup.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/suppliers/<int:supplier_id>', methods=['DELETE'])
def delete_supplier(supplier_id):
    try:
        sup = db.session.get(Supplier, supplier_id)
        if not sup:
            return jsonify({'error': 'Supplier not found'}), 404
        db.session.delete(sup)
        db.session.commit()
        return jsonify({'message': 'Supplier deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== SERVER ====================
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)

