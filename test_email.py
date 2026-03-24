import requests
import json

url = "https://script.google.com/macros/s/AKfycbz_42IVvpHJ2Bw2P34BLUChCXwIf2yiqd-uPb3YWVThY4CCesmEnNsWy0xrX-xGYJ7Xvg/exec"
payload = {
    "to": "test@example.com",
    "code": "123456",
    "subject": "Test from Script"
}

try:
    response = requests.post(url, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
