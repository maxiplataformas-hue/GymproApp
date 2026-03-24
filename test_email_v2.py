import urllib.request
import json

url = "https://script.google.com/macros/s/AKfycbz_42IVvpHJ2Bw2P34BLUChCXwIf2yiqd-uPb3YWVThY4CCesmEnNsWy0xrX-xGYJ7Xvg/exec"
payload = {
    "to": "test@example.com",
    "code": "123456",
    "subject": "Test from URLLIB"
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, method='POST')
req.add_header('Content-Type', 'application/json')

try:
    with urllib.request.urlopen(req) as response:
        status = response.getcode()
        body = response.read().decode('utf-8')
        print(f"Status Code: {status}")
        print(f"Response Body: {body}")
except Exception as e:
    print(f"Error: {e}")
