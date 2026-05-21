from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import models, database
import re
import base64
import hashlib
import json
import os
import urllib.request
from typing import List, Optional
from database import engine

# Generate schema tabel database
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="RNVN Enterprise API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SubscriptionRequest(BaseModel):
    email: str

@app.get("/")
def read_root():
    return {"message": "Welcome to RNVN Enterprise Backend API. Architecture is active."}

@app.get("/api/v1/products")
def get_products(db: Session = Depends(database.get_db)):
    products = db.query(models.Product).all()
    # Jika database kosong, kembalikan mock data
    if not products:
        return {
            "status": "success",
            "data": [
                {"id": 1, "name": "Signature Boxy Fit", "price": 249000.0, "image_url": "/assets/rnvn4.png"},
                {"id": 2, "name": "Streetwear Core", "price": 249000.0, "image_url": "/assets/IMG_8767.JPG.jpeg"}
            ]
        }
    return products

@app.post("/api/v1/subscribe")
def subscribe(payload: SubscriptionRequest, db: Session = Depends(database.get_db)):
    email = payload.email.strip().lower()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email tidak boleh kosong.")
        
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Format email tidak valid.")
        
    # Check if subscriber already exists
    existing = db.query(models.NewsletterSub).filter(models.NewsletterSub.email == email).first()
    if existing:
        return {"status": "success", "message": "Email sudah terdaftar sebelumnya."}
        
    try:
        new_sub = models.NewsletterSub(email=email)
        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)
        return {"status": "success", "message": "Terima kasih telah bergabung!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan database: {str(e)}")


# ==========================================
# MIDTRANS PAYMENT & PREMIUM CHECKOUT SYSTEM
# ==========================================

# Secure Credential Fallback (Sandbox defaults for instant out-of-the-box demo checks)
MIDTRANS_SERVER_KEY = os.getenv("MIDTRANS_SERVER_KEY", "SB-Mid-server-x8U8J2rXq5pMh02m3XWwX5o9")
MIDTRANS_CLIENT_KEY = os.getenv("MIDTRANS_CLIENT_KEY", "SB-Mid-client-c8o8D2qXq5pMh02m")

class CartItemRequest(BaseModel):
    id: int
    name: str
    price: float
    quantity: int
    image_url: str

class CheckoutRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    shipping_city: str
    shipping_postcode: str
    items: List[CartItemRequest]

@app.post("/api/v1/checkout/create-token")
def create_checkout_token(payload: CheckoutRequest, db: Session = Depends(database.get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Keranjang belanja tidak boleh kosong.")

    # Calculate subtotal
    subtotal = sum(item.price * item.quantity for item in payload.items)
    shipping_cost = 20000.0 # Standard flat delivery fee
    grand_total = subtotal + shipping_cost

    try:
        # 1. Store pending order in SQLite Database
        order = models.Order(
            customer_name=payload.customer_name,
            customer_email=payload.customer_email,
            customer_phone=payload.customer_phone,
            shipping_address=payload.shipping_address,
            shipping_city=payload.shipping_city,
            shipping_postcode=payload.shipping_postcode,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            grand_total=grand_total,
            status="PENDING"
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        # 2. Store Order items
        for item in payload.items:
            order_item = models.OrderItem(
                order_id=order.id,
                product_id=item.id,
                product_name=item.name,
                price=item.price,
                quantity=item.quantity,
                image_url=item.image_url
            )
            db.add(order_item)
        db.commit()

        # 3. Formulate Midtrans Payload
        midtrans_items = []
        for item in payload.items:
            midtrans_items.append({
                "id": str(item.id),
                "price": int(item.price),
                "quantity": int(item.quantity),
                "name": item.name[:50] # API limit 50 chars
            })
            
        # Append express shipping fee as individual detail item
        midtrans_items.append({
            "id": "shipping-fee",
            "price": int(shipping_cost),
            "quantity": 1,
            "name": "Express Shipping Fee"
        })

        midtrans_body = {
            "transaction_details": {
                "order_id": f"RNVN-{order.id}",
                "gross_amount": int(grand_total)
            },
            "item_details": midtrans_items,
            "customer_details": {
                "first_name": payload.customer_name,
                "email": payload.customer_email,
                "phone": payload.customer_phone,
                "billing_address": {
                    "first_name": payload.customer_name,
                    "email": payload.customer_email,
                    "phone": payload.customer_phone,
                    "address": payload.shipping_address,
                    "city": payload.shipping_city,
                    "postal_code": payload.shipping_postcode,
                    "country_code": "IDN"
                },
                "shipping_address": {
                    "first_name": payload.customer_name,
                    "email": payload.customer_email,
                    "phone": payload.customer_phone,
                    "address": payload.shipping_address,
                    "city": payload.shipping_city,
                    "postal_code": payload.shipping_postcode,
                    "country_code": "IDN"
                }
            }
        }

        # 4. Invoke Midtrans snap transactions API (Auto detect Sandbox vs Production)
        is_sandbox = MIDTRANS_SERVER_KEY.startswith("SB-")
        url = "https://app.sandbox.midtrans.com/snap/v1/transactions" if is_sandbox else "https://app.midtrans.com/snap/v1/transactions"
        # Base64 authentication
        auth_string = base64.b64encode(f"{MIDTRANS_SERVER_KEY}:".encode('utf-8')).decode('utf-8')
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Basic {auth_string}"
        }

        req = urllib.request.Request(
            url, 
            data=json.dumps(midtrans_body).encode('utf-8'), 
            headers=headers, 
            method="POST"
        )
        
        with urllib.request.urlopen(req) as res:
            res_body = json.loads(res.read().decode('utf-8'))
            return {
                "status": "success",
                "token": res_body.get("token"),
                "redirect_url": res_body.get("redirect_url"),
                "order_id": order.id
            }

    except urllib.error.HTTPError as e:
        db.rollback()
        err_msg = e.read().decode('utf-8')
        raise HTTPException(status_code=500, detail=f"Midtrans Connection Error: {err_msg}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal checkout token generation failed: {str(e)}")

@app.post("/api/v1/checkout/webhook")
def midtrans_webhook(payload: dict, db: Session = Depends(database.get_db)):
    signature_key = payload.get("signature_key")
    order_id_str = payload.get("order_id")
    status_code = payload.get("status_code")
    gross_amount = payload.get("gross_amount")
    transaction_status = payload.get("transaction_status")
    payment_type = payload.get("payment_type")
    transaction_id = payload.get("transaction_id")

    if not order_id_str or not signature_key:
        raise HTTPException(status_code=400, detail="Payload webhook tidak lengkap.")

    # Validate signature hash
    # SHA512(order_id + status_code + gross_amount + ServerKey)
    local_string = f"{order_id_str}{status_code}{gross_amount}{MIDTRANS_SERVER_KEY}"
    local_hash = hashlib.sha512(local_string.encode('utf-8')).hexdigest()

    if local_hash != signature_key:
         raise HTTPException(status_code=403, detail="Signature key tidak valid.")

    # Match Order ID
    try:
        order_id = int(order_id_str.replace("RNVN-", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="Format order_id salah.")

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan.")

    # Update database order status
    order.midtrans_transaction_id = transaction_id
    order.payment_type = payment_type

    if transaction_status in ["capture", "settlement"]:
        order.status = "SETTLEMENT"
    elif transaction_status == "pending":
        order.status = "PENDING"
    elif transaction_status in ["deny", "expire", "cancel"]:
        order.status = "EXPIRED" if transaction_status == "expire" else "CANCEL"

    db.commit()
    return {"status": "success", "message": "Order status successfully synchronized."}

@app.get("/api/v1/checkout/status/{order_id}")
def check_order_status(order_id: int, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan.")

    order_items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).all()
    items_list = []
    for item in order_items:
        items_list.append({
            "id": item.product_id,
            "name": item.product_name,
            "price": item.price,
            "quantity": item.quantity,
            "image_url": item.image_url
        })

    return {
        "order_id": order.id,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "customer_phone": order.customer_phone,
        "shipping_address": order.shipping_address,
        "shipping_city": order.shipping_city,
        "shipping_postcode": order.shipping_postcode,
        "subtotal": order.subtotal,
        "shipping_cost": order.shipping_cost,
        "grand_total": order.grand_total,
        "status": order.status,
        "payment_type": order.payment_type,
        "items": items_list
    }

