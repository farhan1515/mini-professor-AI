import requests

API_URL = "https://nutty-cherise-farhan15-fe9dd3e0.koyeb.app"

# 1. Login
r = requests.post(f"{API_URL}/auth/login", json={"email": "test2@test.com", "password": "password123"})
if r.status_code != 200:
    print("Login failed:", r.text)
    exit(1)

token = r.json()["data"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get Courses
r = requests.get(f"{API_URL}/courses/browse", headers=headers)
print("Browse Courses:", r.status_code)

