import re
import sys
import urllib.parse
import urllib.request
import urllib.error

BASE="https://bais-solutions.de"
PAGES=["/","/preise/","/kontakt/","/referenzen/","/referenzen/n8n-live-demo/"]
seen=set()
broken=[]

for page in PAGES:
    req=urllib.request.Request(BASE+page,headers={"User-Agent":"BAIS-Market-Audit/1.0"})
    try:
        with urllib.request.urlopen(req,timeout=20) as r:
            html=r.read().decode("utf-8","replace")
    except Exception as exc:
        broken.append((page,"PAGE",str(exc)))
        continue

    for _,url in re.findall(r'\\b(href|src)=["\\\']([^"\\\']+)["\\\']',html,re.I):
        if url.startswith(("mailto:","tel:","#","javascript:","data:")):
            continue
        absolute=urllib.parse.urljoin(BASE+page,url)
        parsed=urllib.parse.urlparse(absolute)
        if parsed.netloc!="bais-solutions.de":
            continue
        key=parsed.scheme+"://"+parsed.netloc+parsed.path
        if key in seen:
            continue
        seen.add(key)
        req=urllib.request.Request(key,headers={"User-Agent":"BAIS-Market-Audit/1.0"})
        try:
            with urllib.request.urlopen(req,timeout=15) as r:
                if r.status>=400:
                    broken.append((page,key,str(r.status)))
        except urllib.error.HTTPError as exc:
            broken.append((page,key,str(exc.code)))
        except Exception as exc:
            broken.append((page,key,str(exc)))

print(f"CHECKED_INTERNAL={len(seen)}")
for item in broken[:50]:
    print("BROKEN",*item)
sys.exit(1 if broken else 0)
