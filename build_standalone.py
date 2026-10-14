#!/usr/bin/env python3
"""Bundle a parallax project folder into ONE self-contained HTML file.

- Inlines every local <link rel="stylesheet" href="..."> as <style>
- Inlines every local <script src="..."> as <script>
- Embeds local images (src="img/..", url(img/..)) as base64 data URIs,
  optionally resized with --max-width (needs Pillow)
- Leaves remote URLs (cdnjs GSAP, Google Fonts) untouched

Usage:
  python3 build_standalone.py <project_dir> <output.html> [--max-width 800] [--quality 75]
"""
import argparse, base64, io, mimetypes, os, re, sys
mimetypes.add_type('font/woff2', '.woff2'); mimetypes.add_type('font/woff', '.woff'); mimetypes.add_type('image/svg+xml', '.svg')

def data_uri(path, max_width, quality):
    mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
    raw = open(path, 'rb').read()
    if max_width and mime in ('image/jpeg', 'image/png', 'image/webp'):
        try:
            from PIL import Image
            im = Image.open(io.BytesIO(raw))
            if im.width > max_width:
                im.thumbnail((max_width, max_width * 10))
            buf = io.BytesIO()
            if mime == 'image/png':
                im.save(buf, 'PNG', optimize=True)
            else:
                im.convert('RGB').save(buf, 'JPEG', quality=quality, optimize=True, progressive=True)
                mime = 'image/jpeg'
            raw = buf.getvalue()
        except ImportError:
            print('Pillow not installed; embedding images unresized', file=sys.stderr)
    return f'data:{mime};base64,' + base64.b64encode(raw).decode()

def is_local(url):
    return not re.match(r'^(https?:)?//|^data:', url)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project_dir'); ap.add_argument('output')
    ap.add_argument('--max-width', type=int, default=0)
    ap.add_argument('--quality', type=int, default=78)
    a = ap.parse_args()
    base = os.path.abspath(a.project_dir)
    html = open(os.path.join(base, 'index.html'), encoding='utf-8').read()
    cache = {}

    def embed(rel, rel_base=base):
        p = os.path.normpath(os.path.join(rel_base, rel))
        if not os.path.exists(p):
            print(f'warning: missing {rel}', file=sys.stderr); return rel
        if p not in cache:
            cache[p] = data_uri(p, a.max_width, a.quality)
        return cache[p]

    def css_inline(m):
        href = m.group(1)
        if not is_local(href): return m.group(0)
        p = os.path.join(base, href)
        css = open(p, encoding='utf-8').read()
        css = re.sub(r'url\(["\']?([^)"\']+)["\']?\)',
                     lambda u: f'url("{embed(u.group(1), os.path.dirname(p))}")' if is_local(u.group(1)) else u.group(0), css)
        return f'<style>\n{css}\n</style>'
    html = re.sub(r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>', css_inline, html)

    def js_inline(m):
        src = m.group(1)
        if not is_local(src): return m.group(0)
        js = open(os.path.join(base, src), encoding='utf-8').read().replace('</script', '<\\/script')
        return f'<script>\n{js}\n</script>'
    html = re.sub(r'<script[^>]*src=["\']([^"\']+)["\'][^>]*>\s*</script>', js_inline, html)

    # url(...) inside inline style attributes (quotes may be HTML-escaped as &#x27; / &quot;)
    html = re.sub(r'url\((?:&#x27;|&quot;|["\'])?([^)"\'&]+?)(?:&#x27;|&quot;|["\'])?\)',
                  lambda u: f"url('{embed(u.group(1))}')" if is_local(u.group(1)) and os.path.exists(os.path.join(base, u.group(1))) else u.group(0), html)
    # drop <link rel="preload"> for local fonts (they're inlined into the CSS now)
    html = re.sub(r'<link rel="preload" href="(?!https?:)[^"]+" as="font"[^>]*>\s*', '', html)
    html = re.sub(r'(src|href)=["\']([^"\']+\.(?:jpe?g|png|webp|gif|svg|ico))["\']',
                  lambda m: f'{m.group(1)}="{embed(m.group(2))}"' if is_local(m.group(2)) else m.group(0), html)

    # asset paths inside inline JS strings (e.g. data arrays that build markup at runtime)
    def js_asset(m):
        q, rel = m.group(1), m.group(2)
        return f'{q}{embed(rel)}{q}' if os.path.exists(os.path.join(base, rel)) else m.group(0)
    html = re.sub(r'([\'"`])((?:assets|img|images)/[^\'"`\s]+?\.(?:svg|png|jpe?g|webp|gif|mp4))\1', js_asset, html)

    os.makedirs(os.path.dirname(os.path.abspath(a.output)), exist_ok=True)
    open(a.output, 'w', encoding='utf-8').write(html)
    print(f'wrote {a.output} ({os.path.getsize(a.output)/1024:.0f} KB, {len(cache)} assets embedded)')

if __name__ == '__main__':
    main()
