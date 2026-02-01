from app.core.security import get_password_hash, verify_password

def test_crypto():
    print("Testing Password Hashing...")
    try:
        pwd = "testpassword"
        hashed = get_password_hash(pwd)
        print(f"✅ Hash generated: {hashed}")
        
        is_valid = verify_password(pwd, hashed)
        print(f"✅ Verification result: {is_valid}")
        
    except Exception as e:
        print(f"❌ Crypto Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_crypto()
