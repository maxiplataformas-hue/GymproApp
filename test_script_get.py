"""
Test: Send a real OTP email via Google Apps Script (GET approach)
We test the EXACT same way the backend calls the script.
"""
import urllib.request
import urllib.parse
import ssl

context = ssl._create_unverified_context()

# Current script URL in application.properties
SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_42IVvpHJ2Bw2P34BLUChCXwIf2yiqd-uPb3YWVThY4CCesmEnNsWy0xrX-xGYJ7Xvg/exec"

# Real email address where the test code should arrive
email_to = "maxcontrerasl@gmail.com"
test_code = "987654"

params = urllib.parse.urlencode({
    "to": email_to,
    "code": test_code,
    "subject": "PRUEBA DIAGNÓSTICO - CoachPro"
})
url = f"{SCRIPT_URL}?{params}"

print(f"Testing Google Script URL (GET)...")
print(f"URL: {url[:100]}...")
print(f"Sending to: {email_to}")
print(f"Code: {test_code}")
print()

try:
    req = urllib.request.Request(url, method='GET')
    with urllib.request.urlopen(req, context=context, timeout=30) as resp:
        status = resp.getcode()
        body = resp.read().decode('utf-8')
        
        print(f"HTTP Status: {status}")
        
        # Check if it actually executed or just returned the Google login page
        if "success" in body.lower():
            print(f"✅ SCRIPT RESPONDED: {body}")
            print()
            print(f"Check your inbox at {email_to} for the code {test_code}")
        elif "<!DOCTYPE html>" in body or "<html>" in body:
            print(f"❌ SCRIPT NOT EXECUTED - Got HTML page instead (script URL is wrong/stale)")
            print(f"First 200 chars: {body[:200]}")
        else:
            print(f"⚠️ Unexpected response: {body[:500]}")
            
except urllib.error.HTTPError as e:
    print(f"❌ HTTP Error {e.code}: {e.read().decode('utf-8')[:300]}")
except Exception as e:
    print(f"❌ Error: {e}")
