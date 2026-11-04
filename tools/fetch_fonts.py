"""Download the Google Fonts the game uses into www/fonts so the app works offline.
If the download fails the online <link> stays, so the build never breaks over fonts."""
import os, re, sys, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, 'www')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def main():
    path = os.path.join(WWW, 'index.html')
    html = open(path, encoding='utf-8').read()
    m = re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com/css2\?[^"]+)">', html)
    if not m:
        print('fonts: no Google Fonts link found, nothing to do'); return
    try:
        css = get(m.group(1).replace('&amp;', '&')).decode('utf-8')
        os.makedirs(os.path.join(WWW, 'fonts'), exist_ok=True)
        urls = sorted(set(re.findall(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', css)))
        for i, u in enumerate(urls):
            name = 'f%02d.woff2' % i
            open(os.path.join(WWW, 'fonts', name), 'wb').write(get(u))
            css = css.replace(u, name)
        open(os.path.join(WWW, 'fonts', 'fonts.css'), 'w', encoding='utf-8').write(css)
        html = html.replace(m.group(0), '<link rel="stylesheet" href="fonts/fonts.css">')
        html = html.replace('<link rel="preconnect" href="https://fonts.googleapis.com">\n', '')
        open(path, 'w', encoding='utf-8').write(html)
        print('fonts: bundled %d font files' % len(urls))
    except Exception as e:
        print('fonts: download failed, keeping the online link:', e, file=sys.stderr)

if __name__ == '__main__':
    main()
