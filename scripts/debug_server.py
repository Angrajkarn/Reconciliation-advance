from app.api.auth import login
from app.schemas.auth import UserLogin
from app.db.session import SessionLocal
from app.models.user import User
from sqlalchemy import select
from fastapi import HTTPException

def debug_login():
    print("DEBUGGING LOGIN DIRECTLY...")
    db = SessionLocal()
    try:
        email = "admin@jpm.com"
        password = "SuperSecurePassword123!"
        print(f"Checking user: {email}")
        
        # 1. Test Query
        user = db.query(User).filter(User.email == email).first()
        print(f"User Object: {user}")
        if user:
            print(f"Hash: {user.hashed_password}")
        else:
            print("User NOT FOUND in DB.")

        # 2. Test Login Logic (Mocking the API call)
        login_data = UserLogin(email=email, password=password, device_fingerprint="debug")
        
        # We need to run the async/sync function. 
        # Wait, I converted it to sync `def login(...)`? Yes.
        # But wait, did I update the calls inside?
        
        print("Invoking login function...")
        # Note: I can't easily call the route function due to Depends, 
        # but I can copy the logic here to verify it.
        
        from app.core import security
        if not security.verify_password(password, user.hashed_password):
            print("❌ Password Verify FAILED")
        else:
            print("✅ Password Verify PASSED")
            
        print("Done.")

    except Exception as e:
        print(f"❌ CRASH: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_login()
