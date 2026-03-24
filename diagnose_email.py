import urllib.request
import urllib.parse
import json
import ssl

context = ssl._create_unverified_context()

# =============================================
# Test 1: Google Script URL directly (GET)
# =============================================
print("=" * 60)
print("TEST 1: Google Script URL (GET with params)")
print("=" * 60)

script_url = "https://script.google.com/macros/s/AKfycbz_42IVvpHJ2Bw2P34BLUChCXwIf2yiqd-uPb3YWVThY4CCesmEnNsWy0xrX-xGYJ7Xvg/exec"
params = urllib.parse.urlencode({
    "to": "maxcontrerasl@gmail.com",
    "code": "TEST99",
    "subject": "TEST - CoachPro OTP Check"
})
full_url = f"{script_url}?{params}"

req = urllib.request.Request(full_url, method='GET')
try:
    with urllib.request.urlopen(req, context=context) as resp:
        print(f"Status: {resp.getcode()}")
        body = resp.read().decode('utf-8')
        print(f"Response: {body[:500]}")
except Exception as e:
    print(f"ERROR: {e}")

# =============================================
# Test 2: Live Backend /api/auth/send-otp
# =============================================
print()
print("=" * 60)
print("TEST 2: Backend API /api/auth/send-otp")
print("=" * 60)

backend_url = "https://gymproapp.onrender.com/api/auth/send-otp"
payload = json.dumps({
    "email": "maxcontrerasl@gmail.com",
    "deviceId": "test-device-diag"
}).encode('utf-8')

req2 = urllib.request.Request(backend_url, data=payload, method='POST')
req2.add_header('Content-Type', 'application/json')
try:
    with urllib.request.urlopen(req2, context=context, timeout=30) as resp:
        status = resp.getcode()
        body = resp.read().decode('utf-8')
        print(f"Status: {status}")
        print(f"Response: {body[:1000]}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"ERROR: {e}")
