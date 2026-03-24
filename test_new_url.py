"""
Test the NEW Google Apps Script URL with POST.
"""
import urllib.request
import urllib.parse
import json
import ssl

context = ssl._create_unverified_context()

NEW_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxU9MAbE4HYCZzfk4GbWZXkKXYyQ2ZYQ4VVw7VLlcAMgcH3wtm0T6BeBj6iU1Wl_pEl/exec"
email_to = "maxcontrerasl@gmail.com"
test_code = "555333"

print(f"Testing NEW Google Script URL with POST...")
print(f"Sending code {test_code} to {email_to}")

data = json.dumps({
    "to": email_to,
    "code": test_code,
    "subject": "PRUEBA NUEVA URL - CoachPro"
}).encode('utf-8')

req = urllib.request.Request(NEW_SCRIPT_URL, data=data, method='POST')
req.add_header('Content-Type', 'application/json')

try:
    with urllib.request.urlopen(req, context=context, timeout=30) as resp:
        status = resp.getcode()
        body = resp.read().decode('utf-8')
        is_html = "<!DOCTYPE html>" in body or "<html>" in body
        
        if is_html:
            print(f"❌ Got HTML page (script not executing). Status: {status}")
        elif "success" in body.lower() or body.strip():
            print(f"✅ Script responded! Status: {status}")
            print(f"Response: {body.strip()[:200]}")
            print(f"\nCheck {email_to} inbox now!")
        else:
            print(f"⚠️ Unexpected response. Status: {status}, Body: {body[:200]}")
except urllib.error.HTTPError as e:
    print(f"❌ HTTP Error {e.code}: {e.read().decode('utf-8')[:300]}")
except Exception as e:
    print(f"❌ Error: {e}")
