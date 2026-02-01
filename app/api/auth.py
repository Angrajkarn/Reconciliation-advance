from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.api import deps
from app.core import security, jwt
from app.models.user import User, AuditLog
from app.schemas.auth import UserLogin, Token
from app.db.session import get_db
from pydantic import BaseModel

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    try:
        print(f"DEBUG: Login attempt for {login_data.email}")
        
        # 1. Fetch User
        result = db.execute(select(User).where(User.email == login_data.email))
        user = result.scalars().first()
        
        print(f"DEBUG: User found: {user}")

        # 2. Authenticate
        if not user:
            print("DEBUG: User not found")
            raise HTTPException(status_code=400, detail="Incorrect email or password")
            
        print("DEBUG: Verifying password...")
        if not security.verify_password(login_data.password, user.hashed_password):
            print("DEBUG: Password verification failed")
            # Log Failure
            fail_log = AuditLog(
                event_type="LOGIN_FAILURE",
                actor_id=login_data.email,
                outcome="FAILURE",
                risk_score=90
            )
            db.add(fail_log)
            db.commit()
            raise HTTPException(status_code=400, detail="Incorrect email or password")

        # 3. Check Active
        if not user.is_active:
             print("DEBUG: User inactive")
             raise HTTPException(status_code=400, detail="Account is inactive")

        # 4. Generate Tokens
        print("DEBUG: Generating tokens...")
        access_token = jwt.create_access_token(data={"sub": user.email})
        refresh_token = jwt.create_refresh_token(subject=user.email)

        # 5. Log Success
        success_log = AuditLog(
            event_type="LOGIN_SUCCESS",
            actor_id=user.id,
            outcome="SUCCESS",
            resource="AUTH_GATEWAY",
            risk_score=10 
        )
        db.add(success_log)
        db.commit()

        # [REAL-TIME] Broadcast Event
        from app.core.events import manager
        import asyncio
        from datetime import datetime
        
        # We use a non-blocking fire-and-forget approach or ensure this is async compatible
        # Since this path is async, we can await
        await manager.broadcast({
            "id": str(datetime.now().timestamp()),
            "type": "LOGIN",
            "message": f"User Login: {user.email}",
            "timestamp": datetime.now().isoformat(),
            "severity": "success"
        })

        # 6. Fetch Profiles
        profiles_data = []
        for p in user.profiles:
            if p.status == "ACTIVE":
                profiles_data.append({
                    "id": p.id,
                    "system_code": p.system.code,
                    "system_name": p.system.name,
                    "role": p.role,
                    "username": p.username
                })

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token,
            "profiles": profiles_data
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL ERROR IN LOGIN: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from app.schemas.auth import ProfileSelect
from app.models.system import System, SystemProfile

@router.post("/select-profile", response_model=Token)
def select_profile(
    data: ProfileSelect,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exchange Identity Token for a System-Specific Access Token.
    """
    # Verify ownership
    profile = db.query(SystemProfile).filter(
        SystemProfile.id == data.profile_id,
        SystemProfile.identity_id == current_user.id,
        SystemProfile.status == "ACTIVE"
    ).first()
    
    if not profile:
        raise HTTPException(status_code=403, detail="Invalid or Inactive Profile")
        
    # Generate System-Scoped Token
    # We embed system_code and role in the JWT
    access_token = jwt.create_access_token(
        data={
            "sub": current_user.email,
            "system": profile.system.code,
            "role": profile.role,
            "username": profile.username
        }
    )
    
    # Log Entry
    audit = AuditLog(
        event_type="SYSTEM_ENTRY",
        actor_id=current_user.id,
        resource=profile.system.code,
        outcome="SUCCESS",
        risk_score=0
    )
    db.add(audit)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

class MFAVerify(BaseModel):
    code: str

@router.post("/mfa/verify")
def verify_mfa(
    data: MFAVerify,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulate MFA Verification.
    """
    if data.code == "123456":
        current_user.is_active = True # Dummy update
        # In real world: Update user.mfa_verified = True or issue new token
        return {"status": "verified"}
    
    raise HTTPException(status_code=400, detail="Invalid Code")

