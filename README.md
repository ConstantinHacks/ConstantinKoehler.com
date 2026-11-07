# constantinkoehler.com

Personal site for Constantin Koehler, Partner Solutions Engineer at numo (previously at Google), done up as a pixel-art game.

It's a plain static site: no framework, no build step, no dependencies.

```
index.html            page content
assets/css/style.css  styles (colors are tokens at the top; night mode swaps them)
assets/js/main.js     hero scene, day/night toggle, coins, easter eggs
assets/img/           generated pixel art (portrait, item icons, social image)
favicon.svg           generated
tools/pixel_art.py    draws everything in assets/img from text maps
```

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Edit the pixel art

Sprites are drawn as text grids in `tools/pixel_art.py` (portrait and icons) and at the top of
`assets/js/main.js` (the little character in the hero scene). Each letter maps to a palette color;
`.` is transparent. After changing `tools/pixel_art.py`, regenerate the images:

```bash
python3 tools/pixel_art.py
```

## Deploy

Any static host works (GitHub Pages, Cloudflare Pages, Netlify). Serve the repo root as-is.

## Secrets

- Click the character in the hero to collect coins.
- ↑ ↑ ↓ ↓ ← → ← → B A
