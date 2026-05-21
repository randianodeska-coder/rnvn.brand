from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import models, database
import re
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

