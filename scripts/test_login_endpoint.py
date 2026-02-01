import requests

def test_login():
    url = "http://localhost:8000/auth/login"
    payload = {
        "email": "admin@jpm.com",
        "password": "SuperSecurePassword123!",
        "device_fingerprint": "test_script"
    }
    
    print(f"Attempting login to {url} with {payload['email']}...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login Successful!")
            token = response.json().get("access_token")
            print(f"Token: {token[:20]}...")
            
            # Test Dashboard access
            dash_url = "http://localhost:8000/admin/dashboard/stats"
            headers = {"Authorization": f"Bearer {token}"}
            resp2 = requests.get(dash_url, headers=headers)
            print(f"Dashboard Stats: {resp2.status_code}")
        else:
            print("❌ Login Failed.")

    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    test_login()
