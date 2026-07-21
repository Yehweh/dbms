from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'user'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='USER', nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'username': self.username,
            'role': self.role,
            'email': self.email
        }

class Category(db.Model):
    __tablename__ = 'category'
    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'category_id': self.category_id,
            'category_name': self.category_name,
            'description': self.description
        }

class Supplier(db.Model):
    __tablename__ = 'supplier'
    supplier_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    supplier_name = db.Column(db.String(255), nullable=False)
    contact_no = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier_name,
            'contact_no': self.contact_no,
            'address': self.address
        }

class Item(db.Model):
    __tablename__ = 'item'
    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    item_name = db.Column(db.String(255), nullable=False)
    sku = db.Column(db.String(100), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.Text, nullable=True)
    popularity = db.Column(db.Integer, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey('category.category_id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.supplier_id'), nullable=False)

    def to_dict(self):
        category = db.session.query(Category).filter_by(category_id=self.category_id).first()
        supplier = db.session.query(Supplier).filter_by(supplier_id=self.supplier_id).first()
        return {
            'item_id': self.item_id,
            'item_name': self.item_name,
            'sku': self.sku,
            'price': self.price,
            'image_url': self.image_url,
            'popularity': self.popularity,
            'category_id': self.category_id,
            'supplier_id': self.supplier_id,
            'category_name': category.category_name if category else '',
            'supplier_name': supplier.supplier_name if supplier else ''
        }

class Stock(db.Model):
    __tablename__ = 'stock'
    stock_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.item_id'), nullable=False)
    quantity_available = db.Column(db.Integer, default=0)
    warehouse = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='IN_STOCK')
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        item = db.session.query(Item).filter_by(item_id=self.item_id).first()
        return {
            'stock_id': self.stock_id,
            'item_id': self.item_id,
            'warehouse': self.warehouse,
            'quantity': self.quantity_available,
            'quantity_available': self.quantity_available,
            'status': self.status,
            'item_name': item.item_name if item else '',
            'sku': item.sku if item else '',
            'price': item.price if item else 0
        }


class Order(db.Model):
    __tablename__ = 'order'
    order_id = db.Column(db.String(191), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    order_type = db.Column(db.String(50), nullable=False)
    order_date = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        user = db.session.query(User).filter_by(user_id=self.user_id).first()
        return {
            'order_id': self.order_id,
            'user_id': self.user_id,
            'user': user.username if user else '',
            'order_type': self.order_type,
            'order_date': self.order_date.isoformat() if self.order_date else ''
        }

class OrderDetail(db.Model):
    __tablename__ = 'orderdetail'
    order_detail_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.String(191), db.ForeignKey('order.order_id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('item.item_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        item = db.session.query(Item).filter_by(item_id=self.item_id).first()
        return {
            'order_detail_id': self.order_detail_id,
            'order_id': self.order_id,
            'item_id': self.item_id,
            'item_name': item.item_name if item else '',
            'quantity': self.quantity,
            'price': self.price
        }

class AuditLog(db.Model):
    __tablename__ = 'AuditLog'
    audit_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    table_name = db.Column(db.String(50), nullable=False)
    record_id = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(10), nullable=False)
    changed_by = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=True)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)
    old_values = db.Column(db.Text, nullable=True)
    new_values = db.Column(db.Text, nullable=True)

    def to_dict(self):
        user = db.session.query(User).filter_by(user_id=self.changed_by).first() if self.changed_by else None
        return {
            'audit_id': self.audit_id,
            'table_name': self.table_name,
            'record_id': self.record_id,
            'action': self.action,
            'changed_by': user.username if user else 'System',
            'changed_at': self.changed_at.isoformat() if self.changed_at else '',
            'old_values': self.old_values,
            'new_values': self.new_values
        }

class TransactionHistory(db.Model):
    __tablename__ = 'TransactionHistory'
    transaction_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.item_id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=True)
    quantity_changed = db.Column(db.Integer, nullable=True)
    reference_type = db.Column(db.String(20), nullable=True)
    reference_id = db.Column(db.String(50), nullable=True)
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        item = db.session.query(Item).filter_by(item_id=self.item_id).first()
        user = db.session.query(User).filter_by(user_id=self.created_by).first() if self.created_by else None
        return {
            'transaction_id': self.transaction_id,
            'item_id': self.item_id,
            'item_name': item.item_name if item else '',
            'sku': item.sku if item else '',
            'transaction_type': self.transaction_type,
            'quantity_changed': self.quantity_changed,
            'reference_type': self.reference_type,
            'reference_id': self.reference_id,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else '',
            'created_by': user.username if user else 'System',
            'notes': self.notes
        }


