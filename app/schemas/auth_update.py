from pydantic import BaseModel
from typing import Optional, List

# Update these in app/schemas/auth.py

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    # Add profiles to the initial login response
    profiles: Optional[List[dict]] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    system_id: Optional[str] = None # System Context
    role: Optional[str] = None # Role Context

class UserLogin(BaseModel):
    email: str
    password: str

class ProfileSelect(BaseModel):
    profile_id: str
