from pydantic import BaseModel, EmailStr
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    profiles: Optional[List[dict]] = None

class ProfileSelect(BaseModel):
    profile_id: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    system: Optional[str] = None # Added System Code
    role: Optional[str] = None # Added Role

class UserLogin(BaseModel):
    email: str
    password: str
    device_fingerprint: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@jpm.com",
                "password": "password123",
                "device_fingerprint": "a8f9c0..."
            }
        }

class UserCreate(BaseModel):
    email: EmailStr
    role: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str
