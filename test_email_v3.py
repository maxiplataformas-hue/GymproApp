import urllib.request
import json
import ssl

context = ssl._create_unverified_context()

url = "https://script.google.com/macros/s/AKfycbz_42IVvpHJ2Bw2P34BLUChCXwIf2yiqd-uPb3YWVThY4CCesmEnNsWy0xrX-xGYJ7Xvg/exec"
payload = {
    "to": "test@example.com",
    "code": "123456",
    "subject": "Test from URLLIB No SSL"
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, method='POST')
req.add_header('Content-Type', 'application/json')

try:
    with urllib.request.urlopen(req, context=context) as response:
        status = response.getcode()
        # Follow redirects manually because urlopen + POST with redirects can be tricky
        body = response.read().decode('utf-8')
        print(f"Status Code: {status}")
        print(f"Response Body: {body}")
except Exception as e:
    print(f"Error: {e}")
