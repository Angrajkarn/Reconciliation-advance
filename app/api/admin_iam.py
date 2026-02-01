from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.models.system import System, SystemProfile
from app.core.security import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter()

# --- Schemas ---
class ProfileSchema(BaseModel):
    id: str
    system_code: str
    role: str
    status: str
    username: str

class IdentitySchema(BaseModel):
    id: str
    email: str
    full_name: str
    status: str = "ACTIVE"
    profiles: List[ProfileSchema] = []
    
    class Config:
        from_attributes = True

class IdentityCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class ProfileAssign(BaseModel):
    identity_id: str
    system_code: str
    role: str

# --- Endpoints ---

@router.get("/identities", response_model=List[IdentitySchema])
def list_identities(db: Session = Depends(get_db)):
    """
    List all Identities with their System Profiles.
    """
    users = db.query(User).all()
    
    # Transform to Schema (Manual mapping needed for nested profiles due to joined loads logic)
    results = []
    for u in users:
        profiles = []
        for p in u.profiles:
            profiles.append({
                "id": p.id,
                "system_code": p.system.code,
                "role": p.role,
                "status": p.status,
                "username": p.username
            })
        
        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "status": "ACTIVE" if u.is_active else "SUSPENDED",
            "profiles": profiles
        })
        
    return results

@router.post("/identities")
def create_identity(
    data: IdentityCreate,
    db: Session = Depends(get_db)
):
    # Check existing
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed = get_password_hash(data.password)
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hashed,
        is_active=True
    )
    db.add(user)
    db.commit()
    return user

@router.post("/profiles")
def assign_profile(
    data: ProfileAssign,
    db: Session = Depends(get_db)
):
    # 1. Get User
    user = db.query(User).filter(User.id == data.identity_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Identity not found")
        
    # 2. Get System
    system = db.query(System).filter(System.code == data.system_code).first()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
        
    # 3. Create Profile
    # Check if exists
    exists = db.query(SystemProfile).filter(
        SystemProfile.identity_id == user.id,
        SystemProfile.system_id == system.id
    ).first()
    
    if exists:
        raise HTTPException(status_code=400, detail="Profile already exists for this system")
        
    profile = SystemProfile(
        identity_id=user.id,
        system_id=system.id,
        username=f"{user.email.split('@')[0]}.{system.code.lower()}",
        role=data.role,
        status="ACTIVE"
    )
    db.add(profile)
    db.commit()
    return {"status": "assigned", "profile_id": profile.id}
