# Krithika Anand — portfolio

Static site (HTML/CSS/JS, no build step). Upload the whole folder to Netlify, Vercel, GitHub Pages or Hostinger.
Local preview: `python -m http.server 5173`, then open http://localhost:5173.

## Still to replace
| What | Where |
|---|---|
| Profile photo (currently a low-res crop from the CV) | `assets/photos/krithika.jpg`: a square image of at least 800×800 px, same filename |
| Lab photos for the fling cards (4) | `assets/placeholders/lab-1..4.svg`: drop in `lab-1.jpg`… and update the 4 `src`s in `index.html` |
| Research thumbnails in the "research" nav pop-out (3) | `assets/placeholders/research-1..3.svg` (4:3) |
| LinkedIn URL | search `index.html` for `REPLACE-ME` (4 places, including the JSON-LD) |
| Publication link (DOI) | search `index.html` for `journal/chemosphere` (2 places) |
| "site by" credit link | footer credits in `index.html` |

## Where things live
- Colours: `:root` at the top of `css/style.css` (fluorescent-protein palette)
- Marquee words, cursor-bubble labels, tab-away title: `CONFIG` at the top of `js/main.js`
- Custom styles for the portfolio sections: the `portfolio.css` block at the end of `css/style.css`
- Stickers: `assets/stickers/` (original SVGs drawn for this site)

## Single-file build (optional)
`python build_standalone.py . krithika-portfolio.html`
