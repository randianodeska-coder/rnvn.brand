from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    orders = relationship("Order", back_populates="owner")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    image_url = Column(String)
    material_detail = Column(String)
    
    variants = relationship("ProductVariant", back_populates="product")

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    size = Column(String) # M, L, XL, Boxy
    color = Column(String)
    stock = Column(Integer, default=0)
    
    product = relationship("Product", back_populates="variants")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Billing & Customer Details
    customer_name = Column(String, index=True)
    customer_email = Column(String)
    customer_phone = Column(String)
    
    # Shipping Address Details
    shipping_address = Column(String)
    shipping_city = Column(String)
    shipping_postcode = Column(String)
    
    # Amounts
    subtotal = Column(Float, default=0.0)
    shipping_cost = Column(Float, default=20000.0) # Flat rate
    grand_total = Column(Float, default=0.0)
    
    # Midtrans & Status Details
    status = Column(String, default="PENDING") # PENDING, SETTLEMENT, EXPIRED, CANCEL, DENY
    midtrans_transaction_id = Column(String, unique=True, index=True, nullable=True)
    payment_type = Column(String, nullable=True)
    
    owner = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, nullable=False)
    product_name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    image_url = Column(String, nullable=True)
    
    order = relationship("Order", back_populates="items")

class NewsletterSub(Base):
    __tablename__ = "newsletter_subs"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)

