#!/usr/bin/env python3
"""Build the single-file offline copy of the notes.

Everything the site needs (styles, scripts, every topic page and the icon) is packed into one
HTML file that opens straight from a laptop's Downloads folder, with no internet and no server.

    python3 tools/build_offline.py [build-id] [output.html]

The build id (normally the commit it was made from) lets the downloaded copy tell when a newer
one has been published. The GitHub Actions workflow in .github/workflows/offline.yml runs this
on every change and attaches the result to the "offline" release.
"""
import base64, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
build = sys.argv[1] if len(sys.argv) > 1 else "local"
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / "ib-cs-notes-offline.html")


def local(path):
    return (ROOT / path.split("?")[0]).read_text(encoding="utf-8")


def safe_js(src):
    # A script's text ends at the first "</script", so hide any inside strings.
    return re.sub(r"</(script)", r"<\\/\1", src, flags=re.I)


html = local("index.html")

html = re.sub(
    r'<link rel="stylesheet" href="(assets/[^"]+)">',
    lambda m: "<style>" + local(m.group(1)).replace("</style", "<\\/style") + "</style>",
    html,
)

icon = base64.b64encode((ROOT / "favicon.svg").read_bytes()).decode()
html = html.replace('href="favicon.svg"', 'href="data:image/svg+xml;base64,' + icon + '"')

pages = json.dumps(local("assets/pages.html"), ensure_ascii=False)
shim = (
    "<script>window.CS_BUILD=" + json.dumps(build) + ";window.CS_PAGES=" + safe_js(pages) + ";"
    # The site fetches its topic pages after the first screen. A file opened from disk can't
    # fetch, so hand it the copy packed above instead.
    "(function(){var f=window.fetch;window.fetch=function(u){if(typeof u==='string'&&u.indexOf('assets/pages.html')===0)"
    "return Promise.resolve(new Response(window.CS_PAGES,{status:200,headers:{'Content-Type':'text/html'}}));"
    "return f?f.apply(this,arguments):Promise.reject(new Error('offline'))}})();</script>\n"
)

scripts = re.findall(r'<script src="(assets/[^"]+)"( defer)?></script>\n?', html)
html = re.sub(r'<script src="(assets/[^"]+)"( defer)?></script>\n?', "", html)
normal = [s for s, d in scripts if not d]
deferred = [s for s, d in scripts if d]
inline = shim + "".join("<script>" + safe_js(local(s)) + "</script>\n" for s in normal + deferred)
html = html.replace("</body>", inline + "</body>", 1)

# No canonical link in the copy, so it never competes with the live site.
html = re.sub(r'<link rel="canonical"[^>]*>', "", html)

out.write_text(html, encoding="utf-8")
print(f"Wrote {out} ({out.stat().st_size / 1e6:.1f} MB, build {build})")
