"""
Test BOTH GET and POST approaches to find which one works with the current script URL.
Also tries the old and new script URL formats.
"""
import urllib.request
import urllib.parse
import json
import ssl

context = ssl._create_unverified_context()

SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_42IVvpHJ2Bw2P34BLUChCXwIf2yiqd-uPb3YWVThY4CCesmEnNsWy0xrX-xGYJ7Xvg/exec"
email_to = "maxcontrerasl@gmail.com"
test_code = "111222"


def test_get(url):
    params = urllib.parse.urlencode({"to": email_to, "code": test_code, "subject": "PRUEBA GET - CoachPro"})
    full = f"{url}?{params}"
    try:
        req = urllib.request.Request(full, method='GET')
        with urllib.request.urlopen(req, context=context, timeout=20) as resp:
            body = resp.read().decode('utf-8')
            is_html = "<!DOCTYPE html>" in body or "<html>" in body
            return resp.getcode(), body[:200], is_html
    except Exception as e:
        return None, str(e), True


def test_post(url):
    data = json.dumps({"to": email_to, "code": test_code, "subject": "PRUEBA POST - CoachPro"}).encode()
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, context=context, timeout=20) as resp:
            body = resp.read().decode('utf-8')
            is_html = "<!DOCTYPE html>" in body or "<html>" in body
            return resp.getcode(), body[:200], is_html
    except Exception as e:
        return None, str(e), True


print("=" * 60)
print(f"Testing URL: {SCRIPT_URL[:80]}...")
print("=" * 60)

print("\n[1] Testing GET...")
code, body, is_html = test_get(SCRIPT_URL)
if is_html:
    print(f"❌ GET returned HTML page (script not executed). Status: {code}")
else:
    print(f"{'✅' if 'success' in body.lower() else '⚠️'} GET response: {body}")

print("\n[2] Testing POST...")
code, body, is_html = test_post(SCRIPT_URL)
if is_html:
    print(f"❌ POST returned HTML page (script not executed). Status: {code}")
else:
    print(f"{'✅' if 'success' in body.lower() else '⚠️'} POST response: {body}")

print("\nDone. Check your email inbox.")
