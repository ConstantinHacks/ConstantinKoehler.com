(() => {
  "use strict";

  const root = document.documentElement;
  const darkQuery = matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const store = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        /* storage unavailable: fine, nothing important lives here */
      }
    },
  };

  const isNight = () => (root.dataset.theme ? root.dataset.theme === "dark" : darkQuery.matches);

  // ---------------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------------
  const toastEl = document.getElementById("toast");
  let toastTimer = 0;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  // ---------------------------------------------------------------------------
  // Coins (per-visitor, just for fun)
  // ---------------------------------------------------------------------------
  const coinEl = document.getElementById("coin-count");
  const coinBox = coinEl.closest(".hud-coins");
  let coins = parseInt(store.get("ck-coins") || "0", 10) || 0;

  function renderCoins() {
    coinEl.textContent = coins > 99 ? "99+" : String(coins).padStart(2, "0");
  }

  function addCoins(n) {
    coins += n;
    store.set("ck-coins", String(coins));
    renderCoins();
    coinBox.classList.remove("bump");
    void coinBox.offsetWidth;
    coinBox.classList.add("bump");
  }

  renderCoins();

  // ---------------------------------------------------------------------------
  // Pixel helpers
  // ---------------------------------------------------------------------------
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeSprite(rows, palette) {
    const c = document.createElement("canvas");
    c.width = rows[0].length;
    c.height = rows.length;
    const g = c.getContext("2d");
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = palette[row[x]];
        if (color) {
          g.fillStyle = color;
          g.fillRect(x, y, 1, 1);
        }
      }
    });
    return c;
  }

  // The little hero, drawn from the headshot: auburn quiff, round sage
  // glasses, beard, cream sweater.
  const HERO_PAL = {
    k: "#2b1d1c", H: "#93502e", h: "#bd7044", d: "#64321e",
    S: "#f4c9ad", s: "#dda58a", r: "#ec9f8f", b: "#6e3b25",
    G: "#7b8070", E: "#3f5868", B: "#86593c", m: "#9a5550",
    W: "#ebe6d4", w: "#cfc8b2", C: "#f6efdc", c: "#d8cfb5",
    P: "#4a4f63", O: "#3a2b25",
  };
  const HERO = [
    ".....kkkkkkk....",
    "...kkhhhhhhhk...",
    "..kHHHhhhhHHHk..",
    "..kHHHHHHHhHHk..",
    "..kHSSSSSSSHdk..",
    "..kSbbSSSSbbSk..",
    "..kSGGSSSSGGSk..",
    "..kGSEGGGGESGk..",
    "..kSGGSssSGGSk..",
    "..kBrSSSSSSrBk..",
    "..kBBmBBBBmBBk..",
    "..kBBBmmmmBBBk..",
    "...kBBBBBBBBk...",
    "....kkBBBBkk....",
    "...kWCcCcCcWk...",
    "..kWWWCCCCWWWk..",
    ".kWWWWWWWWWWWWk.",
    ".kWWwWWWWWWwWWk.",
    ".kWWwWWWWWWwWWk.",
    ".kSSwWWWWWWwSSk.",
    "..kkkPPPPPPkkk..",
    "....kPPPPPPk....",
    "....kPPkkPPk....",
    "...kOOOkkOOOk...",
  ];
  const HERO_BLINK = HERO.map((row, i) => (i === 7 ? "..kGSSGGGGSSGk.." : row));

  const COIN_PAL = { k: "#2b1d1c", y: "#f6c445", Y: "#c98e1e", l: "#fde68a" };
  const COIN_A = [".kkkk.", "kllyyk", "klyyYk", "kyyyYk", "kyYYYk", ".kkkk."];
  const COIN_B = ["..kk..", ".klyk.", ".kyYk.", ".kyYk.", ".kYYk.", "..kk.."];

  const HOUSE = [
    "....kkk....",
    "...kRRRk...",
    "..kRRRRRk..",
    ".kRRRRRRRk.",
    "kRRRRRRRRRk",
    "kkkkkkkkkkk",
    ".kwwwwwwwk.",
    ".kwbbwddwk.",
    ".kwwwwddwk.",
    ".kkkkkkkkk.",
  ];

  const DAY = {
    sky: ["#4f97e3", "#69aaea", "#86bff0", "#a8d4f5"],
    sun: "#ffd84d", glow: "#fff1a6",
    cloud: "#ffffff", cloudShade: "#d3e9fb",
    far: "#a3c7e8", farShade: "#8cb5dc",
    hill: "#7cc576", hillShade: "#64ae62",
    grass: "#5dbb53", grassLight: "#93df6c", dirt: "#9a6440", dirtDark: "#7a4b2f", stone: "#b9a08a",
    wall: "#76503a", wallDeep: "#5b3b28", wallRock: "#8c6448", strata: "#4a2f1f",
    water: "#3d8ae0", waterLight: "#a9d8ff",
    plank: "#c08a52", plankDark: "#8a5a32", rope: "#e2c189", post: "#6b4423",
    houseWall: "#f4ead7", window: "#8fc4ec", door: "#7a4b2f",
    roofs: ["#d94a3a", "#3f7fd9", "#e2a93a"],
    tree: "#3f9a4c", treeDark: "#2c7339", trunk: "#6b4423",
    tower: "#f4ead7", towerStripe: "#d94a3a", lamp: "#ffe27a",
    flowers: ["#ff6b6b", "#ffe066", "#ffffff"],
    bird: "#2b2d55",
  };

  const NIGHT = {
    sky: ["#0d0f2b", "#141842", "#1c2257", "#262d6b"],
    moon: "#f4efd0", moonShade: "#d3cba4", star: "#fffbe0", starDim: "#8f93c9",
    cloud: "#353c78", cloudShade: "#2b3168",
    far: "#242b63", farShade: "#1e2456",
    hill: "#1f4747", hillShade: "#1a3c3d",
    grass: "#2f7a4f", grassLight: "#3f9a5e", dirt: "#4e3528", dirtDark: "#3a271d", stone: "#6d5a4d",
    wall: "#33241b", wallDeep: "#261a12", wallRock: "#43311f", strata: "#1b110b",
    water: "#1d3d82", waterLight: "#5b84d6",
    plank: "#8a6038", plankDark: "#5e3f24", rope: "#b8996a", post: "#4a2f18",
    houseWall: "#b9b2a0", window: "#ffd451", door: "#4a2f18",
    roofs: ["#9c3a30", "#2f5a9e", "#a8812f"],
    tree: "#1f5a3a", treeDark: "#174630", trunk: "#4a2f18",
    tower: "#c9c2b0", towerStripe: "#a33a2e", lamp: "#ffe27a",
    flowers: [],
    firefly: "#fff27a",
  };

  // ---------------------------------------------------------------------------
  // Hero scene: two cliffs (partners on the left, the platform's lighthouse
  // on the right) joined by a bridge, with the player standing in the middle.
  // ---------------------------------------------------------------------------
  function createScene() {
    const hero = document.querySelector(".hero");
    const canvas = document.getElementById("scene");
    const hit = document.getElementById("hero-player");
    const tip = document.querySelector(".hero-tip");
    if (!hero || !canvas || !canvas.getContext) return { redraw() {} };

    const ctx = canvas.getContext("2d");
    const heroSprite = makeSprite(HERO, HERO_PAL);
    const heroBlink = makeSprite(HERO_BLINK, HERO_PAL);
    const coinA = makeSprite(COIN_A, COIN_PAL);
    const coinB = makeSprite(COIN_B, COIN_PAL);

    let P = 4, W = 0, H = 0, groundY = 0, gapStart = 0, gapEnd = 0, waterTop = 0;
    let charX = 0, charY = 0, tower = null;
    let pal = DAY, night = false;
    let skyLayer = null, landLayer = null;
    let clouds = [], stars = [], flies = [], birds = [];
    let jumpAt = -1, coinFx = [];
    let raf = 0, lastFrame = 0, lastTime = 0, onScreen = true;
    let sizeKey = "";

    const rect = (g, x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(Math.round(x), Math.round(y), w, h);
    };

    function disc(g, cx, cy, r, color) {
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y <= r * r + r * 0.6) rect(g, cx + x, cy + y, 1, 1, color);
        }
      }
    }

    function newLayer() {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      return c;
    }

    // --- layout -------------------------------------------------------------
    function layout() {
      const vw = hero.clientWidth;
      const vh = window.innerHeight;
      P = Math.max(3, Math.min(8, Math.round(Math.min(vw / 240, vh / 150))));
      const groundCss = Math.max(130, Math.min(260, Math.round(vh * 0.25)));
      const wide = vw >= 720 && vw / vh > 1.1;
      hero.style.setProperty("--ground", groundCss + "px");
      // Keep the text clear of the scenery. On narrow screens the player (and
      // its "tap me" bubble) stands right under the text, so leave more room.
      hero.style.setProperty("--clear", (wide ? 18 * P : 27 * P + 48) + "px");

      const hh = hero.clientHeight;
      W = Math.ceil(vw / P);
      H = Math.ceil(hh / P);
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = W * P + "px";
      canvas.style.height = H * P + "px";

      groundY = H - Math.round(groundCss / P);
      gapStart = Math.round(W * (wide ? 0.6 : 0.3));
      gapEnd = Math.round(W * (wide ? 0.86 : 0.7));
      waterTop = H - Math.max(4, Math.round((H - groundY) * 0.18));
      charX = Math.round((gapStart + gapEnd) / 2 - 8);
      charY = groundY - 24;

      hit.style.left = charX * P + "px";
      hit.style.top = charY * P + "px";
      hit.style.width = 16 * P + "px";
      hit.style.height = 24 * P + "px";
      hit.hidden = false;
      if (tip) {
        tip.style.left = (charX + 8) * P + "px";
        tip.style.top = (charY - 3) * P + "px";
        tip.classList.add("is-placed");
      }
    }

    // --- static layers --------------------------------------------------------
    function drawSky(g) {
      const bands = pal.sky;
      const n = bands.length;
      for (let i = 0; i < n; i++) {
        const y0 = Math.round((i * groundY) / n);
        const y1 = Math.round(((i + 1) * groundY) / n);
        rect(g, 0, y0, W, y1 - y0, bands[i]);
      }
      rect(g, 0, groundY, W, H - groundY, bands[n - 1]);
      // dithered seams between bands
      for (let i = 1; i < n; i++) {
        const y = Math.round((i * groundY) / n);
        for (let x = 0; x < W; x += 2) {
          rect(g, x, y, 1, 1, bands[i - 1]);
          rect(g, x + 1, y - 1, 1, 1, bands[i]);
        }
      }

      const wide = W / H > 1.1;
      const cx = Math.round(W * (wide ? 0.9 : 0.84));
      const cy = Math.round(groundY * (wide ? 0.3 : 0.5));
      if (night) {
        for (let y = -6; y <= 6; y++) {
          for (let x = -6; x <= 6; x++) {
            const inMoon = x * x + y * y <= 40;
            const inBite = (x - 3) * (x - 3) + (y + 2) * (y + 2) <= 26;
            if (inMoon && !inBite) rect(g, cx + x, cy + y, 1, 1, pal.moon);
          }
        }
        rect(g, cx - 4, cy + 1, 1, 1, pal.moonShade);
        rect(g, cx - 2, cy + 4, 2, 1, pal.moonShade);
      } else {
        for (let y = -10; y <= 10; y++) {
          for (let x = -10; x <= 10; x++) {
            const d = x * x + y * y;
            if (d <= 90 && d > 60 && (x + y) % 2 === 0) rect(g, cx + x, cy + y, 1, 1, pal.glow);
          }
        }
        disc(g, cx, cy, 7, pal.sun);
        rect(g, cx - 4, cy - 3, 2, 2, pal.glow);
      }
    }

    function ridge(g, seed, base, amp, freqs, color, shade) {
      const rnd = mulberry32(seed);
      const phase = freqs.map(() => rnd() * Math.PI * 2);
      let prev = null;
      for (let x = 0; x < W; x++) {
        let h = 0;
        freqs.forEach((f, i) => {
          h += Math.sin(x * f + phase[i]) / (i + 1);
        });
        const top = Math.round(base - amp * (h * 0.45 + 0.8));
        rect(g, x, top, 1, groundY - top + 1, prev !== null && top > prev ? shade : color);
        prev = top;
      }
    }

    function pine(g, cx, base, size) {
      rect(g, cx - 1, base - 3, 2, 3, pal.trunk);
      const tiers = 3;
      const tierH = Math.max(3, Math.round(size / tiers) + 1);
      for (let t = 0; t < tiers; t++) {
        const top = base - 3 - size + t * (tierH - 1);
        for (let r = 0; r < tierH; r++) {
          const half = t + Math.floor(r * 0.8);
          rect(g, cx - half - 1, top + r, half + 1, 1, pal.tree);
          rect(g, cx, top + r, half + 1, 1, pal.treeDark);
        }
      }
    }

    function bush(g, cx, base) {
      rect(g, cx - 3, base - 2, 7, 2, pal.tree);
      rect(g, cx - 2, base - 3, 5, 1, pal.tree);
      rect(g, cx + 1, base - 3, 2, 3, pal.treeDark);
    }

    function house(g, left, base, roof) {
      const sprite = makeSprite(HOUSE, {
        k: "#2b1d1c", R: roof, w: pal.houseWall, b: pal.window, d: pal.door,
      });
      g.drawImage(sprite, left, base - HOUSE.length);
    }

    function lighthouse(g, cx, base) {
      const outline = "#2b1d1c";
      const bodyH = 18;
      for (let i = 0; i < bodyH; i++) {
        const y = base - 1 - i;
        const half = i < 9 ? 3 : 2;
        const color = Math.floor(i / 4) % 2 ? pal.towerStripe : pal.tower;
        rect(g, cx - half - 1, y, 1, 1, outline);
        rect(g, cx + half + 1, y, 1, 1, outline);
        rect(g, cx - half, y, half * 2 + 1, 1, color);
      }
      rect(g, cx - 1, base - 3, 2, 3, outline); // door
      rect(g, cx, base - 12, 1, 2, outline); // window
      const gallery = base - bodyH - 1;
      rect(g, cx - 4, gallery, 9, 1, outline);
      rect(g, cx - 2, gallery - 3, 1, 3, outline);
      rect(g, cx + 2, gallery - 3, 1, 3, outline);
      const roofY = gallery - 4;
      rect(g, cx - 3, roofY, 7, 1, pal.towerStripe);
      rect(g, cx - 2, roofY - 1, 5, 1, pal.towerStripe);
      rect(g, cx - 1, roofY - 2, 3, 1, pal.towerStripe);
      rect(g, cx, roofY - 3, 1, 1, outline);
      tower = { lampX: cx - 1, lampY: gallery - 3, cx };
    }

    function drawLand(g) {
      ridge(g, 11, groundY - 4, Math.max(10, groundY * 0.3), [0.035, 0.09, 0.21], pal.far, pal.farShade);
      ridge(g, 23, groundY + 1, Math.max(5, groundY * 0.1), [0.05, 0.13], pal.hill, pal.hillShade);

      const rnd = mulberry32(42);
      const left = [];
      const right = [];
      let jl = 0;
      let jr = 0;
      for (let y = groundY; y < H; y++) {
        if (y > groundY + 1 && rnd() < 0.4) jl = Math.max(0, Math.min(3, jl + (rnd() < 0.5 ? -1 : 1)));
        if (y > groundY + 1 && rnd() < 0.4) jr = Math.max(0, Math.min(3, jr + (rnd() < 0.5 ? -1 : 1)));
        left.push(gapStart - jl);
        right.push(gapEnd + jr);
      }

      // ravine back wall: lighter rock up top, darker below, with strata and stones
      const gx = gapStart - 4;
      const gw = gapEnd - gapStart + 8;
      const deepY = groundY + Math.round((waterTop - groundY) * 0.45);
      rect(g, gx, groundY, gw, H - groundY, pal.wall);
      rect(g, gx, deepY, gw, H - deepY, pal.wallDeep);
      for (let x = gx; x < gx + gw; x += 2) rect(g, x + ((deepY >> 0) % 2), deepY - 1, 1, 1, pal.wallDeep);
      for (let y = groundY + 5; y < waterTop - 1; y += 5) {
        let x = gx;
        while (x < gx + gw) {
          const len = 3 + Math.floor(rnd() * 9);
          if (rnd() < 0.6) rect(g, x, y + (rnd() < 0.3 ? 1 : 0), Math.min(len, gx + gw - x), 1, pal.strata);
          x += len + 1 + Math.floor(rnd() * 4);
        }
      }
      for (let n = 0; n < Math.round((gw * (waterTop - groundY)) / 40); n++) {
        const x = gx + Math.floor(rnd() * (gw - 2));
        const y = groundY + 3 + Math.floor(rnd() * Math.max(1, waterTop - groundY - 5));
        rect(g, x, y, 2, 1, pal.wallRock);
        rect(g, x, y + 1, 2, 1, pal.strata);
      }
      rect(g, gx, groundY + 3, gw, 1, pal.strata); // shadow under the bridge
      rect(g, gx, waterTop, gw, H - waterTop, pal.water);
      rect(g, gx, waterTop, gw, 1, pal.waterLight);

      // cliffs
      for (let i = 0, y = groundY; y < H; y++, i++) {
        rect(g, 0, y, left[i], 1, pal.dirt);
        rect(g, right[i], y, W - right[i], 1, pal.dirt);
        rect(g, left[i] - 1, y, 1, 1, pal.dirtDark);
        rect(g, right[i], y, 1, 1, pal.dirtDark);
      }
      const specks = Math.round((W * (H - groundY)) / 16);
      for (let n = 0; n < specks; n++) {
        const x = Math.floor(rnd() * W);
        const y = groundY + 4 + Math.floor(rnd() * Math.max(1, H - groundY - 4));
        const i = y - groundY;
        if (i < left.length && (x < left[i] - 3 || x > right[i] + 2)) {
          if (rnd() < 0.18) rect(g, x, y, 2, 1, pal.stone);
          else rect(g, x, y, 1, 1, pal.dirtDark);
        }
      }

      // grass
      rect(g, 0, groundY, gapStart, 2, pal.grass);
      rect(g, gapEnd, groundY, W - gapEnd, 2, pal.grass);
      for (let x = 0; x < W; x++) {
        if (x >= gapStart - 1 && x <= gapEnd) continue;
        if ((x * 7) % 5 < 2) rect(g, x, groundY, 1, 1, pal.grassLight);
        if (rnd() < 0.3) rect(g, x, groundY + 2, 1, 1, pal.grass);
        if (pal.flowers.length && rnd() < 0.05) {
          rect(g, x, groundY - 1, 1, 1, pal.flowers[Math.floor(rnd() * pal.flowers.length)]);
        }
      }

      // left cliff: the partners' village
      const fits = (l, w) => l >= 1 && l + w <= gapStart - 2;
      const items = [
        { kind: "bush", x: gapStart - 5, w: 7 },
        { kind: "house", x: gapStart - 19, w: 11, roof: 0 },
        { kind: "pine", x: gapStart - 24, w: 9, size: 10 },
        { kind: "house", x: gapStart - 40, w: 11, roof: 1 },
        { kind: "house", x: gapStart - 53, w: 11, roof: 2 },
        { kind: "pine", x: gapStart - 58, w: 11, size: 13 },
        { kind: "bush", x: gapStart - 66, w: 7 },
      ];
      for (let x = gapStart - 76; x > 4; x -= 12 + Math.floor(rnd() * 10)) {
        items.push({ kind: rnd() < 0.7 ? "pine" : "bush", x, w: 11, size: 9 + Math.floor(rnd() * 6) });
      }
      for (const it of items) {
        const l = it.kind === "house" ? it.x : it.x - Math.ceil(it.w / 2);
        if (!fits(l, it.w)) continue;
        if (it.kind === "house") house(g, it.x, groundY, pal.roofs[it.roof]);
        else if (it.kind === "pine") pine(g, it.x, groundY, it.size);
        else bush(g, it.x, groundY);
      }

      // right cliff: the platform's lighthouse
      const towerX = gapEnd + 11;
      tower = null;
      if (towerX + 5 < W) lighthouse(g, towerX, groundY);
      if (gapEnd + 4 + 4 < W) bush(g, gapEnd + 4, groundY);
      for (let x = gapEnd + 22; x + 5 < W; x += 11 + Math.floor(rnd() * 8)) {
        if (rnd() < 0.75) pine(g, x, groundY, 9 + Math.floor(rnd() * 5));
        else bush(g, x, groundY);
      }

      // bridge
      const x0 = gapStart - 4;
      const x1 = gapEnd + 4;
      rect(g, x0, groundY, x1 - x0, 2, pal.plank);
      rect(g, x0, groundY + 2, x1 - x0, 1, pal.plankDark);
      for (let x = x0; x < x1; x += 4) rect(g, x, groundY, 1, 2, pal.plankDark);
      const postH = 9;
      rect(g, x0, groundY - postH, 2, postH, pal.post);
      rect(g, x1 - 2, groundY - postH, 2, postH, pal.post);
      const sag = Math.max(2, Math.round((x1 - x0) / 16));
      for (let x = x0 + 2; x < x1 - 2; x++) {
        const t = (x - x0) / (x1 - x0);
        const y = Math.round(groundY - postH + 1 + sag * Math.sin(Math.PI * t));
        rect(g, x, y, 1, 1, pal.rope);
        if ((x - x0) % 6 === 0) rect(g, x, y + 1, 1, groundY - y - 1, pal.rope);
      }
      // underside rope
      for (let x = x0 + 2; x < x1 - 2; x++) {
        const t = (x - x0) / (x1 - x0);
        rect(g, x, Math.round(groundY + 3 + sag * 0.6 * Math.sin(Math.PI * t)), 1, 1, pal.plankDark);
      }
    }

    function buildClouds() {
      const rnd = mulberry32(7);
      clouds = [];
      const count = Math.max(3, Math.round(W / 45));
      for (let i = 0; i < count; i++) {
        const w = 14 + Math.floor(rnd() * 16);
        const h = 6 + Math.floor(rnd() * 4);
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const g = c.getContext("2d");
        const blobs = [];
        for (let b = 0; b < 4; b++) {
          blobs.push({
            x: 3 + rnd() * (w - 6),
            y: h - 2 - rnd() * (h * 0.4),
            r: 2 + rnd() * (h * 0.5),
          });
        }
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const inside = blobs.some((bl) => (x - bl.x) ** 2 + (y - bl.y) ** 2 <= bl.r * bl.r) || (y >= h - 3 && x > 2 && x < w - 3);
            if (inside) rect(g, x, y, 1, 1, y >= h - 2 ? pal.cloudShade : pal.cloud);
          }
        }
        clouds.push({
          img: c,
          x: rnd() * (W + w) - w,
          y: Math.round(4 + rnd() * Math.max(4, groundY * 0.45)),
          speed: 0.8 + rnd() * 1.6,
        });
      }
    }

    function buildCritters() {
      const rnd = mulberry32(99);
      stars = [];
      for (let i = 0; i < Math.round((W * groundY) / 260); i++) {
        stars.push({
          x: Math.floor(rnd() * W),
          y: Math.floor(rnd() * groundY * 0.8),
          phase: rnd() * 6.28,
          big: rnd() < 0.12,
        });
      }
      flies = [];
      for (let i = 0; i < Math.max(4, Math.round(W / 30)); i++) {
        let x = Math.floor(rnd() * W);
        if (x > gapStart - 4 && x < gapEnd + 4) x = Math.floor(rnd() * Math.max(1, gapStart - 4));
        flies.push({ x, y: groundY - 3 - Math.floor(rnd() * 10), phase: rnd() * 6.28 });
      }
      birds = [
        { x: W * 0.2, y: Math.round(groundY * 0.28), speed: 5 },
        { x: W * 0.32, y: Math.round(groundY * 0.22), speed: 4.3 },
      ];
    }

    function rebuild() {
      night = isNight();
      pal = night ? NIGHT : DAY;
      skyLayer = newLayer();
      drawSky(skyLayer.getContext("2d"));
      landLayer = newLayer();
      drawLand(landLayer.getContext("2d"));
      buildClouds();
      buildCritters();
    }

    // --- per frame ------------------------------------------------------------
    function draw(t, dt) {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(skyLayer, 0, 0);

      if (night) {
        for (const s of stars) {
          const tw = Math.sin(t * 1.7 + s.phase);
          if (tw < -0.7) continue;
          rect(ctx, s.x, s.y, 1, 1, tw > 0.3 ? pal.star : pal.starDim);
          if (s.big && tw > 0.6) {
            rect(ctx, s.x - 1, s.y, 1, 1, pal.starDim);
            rect(ctx, s.x + 1, s.y, 1, 1, pal.starDim);
            rect(ctx, s.x, s.y - 1, 1, 1, pal.starDim);
            rect(ctx, s.x, s.y + 1, 1, 1, pal.starDim);
          }
        }
      }

      for (const c of clouds) {
        c.x += c.speed * dt;
        if (c.x > W + 2) c.x = -c.img.width - 2;
        ctx.drawImage(c.img, Math.round(c.x), c.y);
      }

      if (!night) {
        const flap = Math.floor(t * 4) % 2;
        for (const b of birds) {
          b.x += b.speed * dt;
          if (b.x > W + 6) b.x = -6;
          const x = Math.round(b.x);
          if (flap) {
            rect(ctx, x, b.y, 1, 1, pal.bird);
            rect(ctx, x + 4, b.y, 1, 1, pal.bird);
            rect(ctx, x + 1, b.y + 1, 1, 1, pal.bird);
            rect(ctx, x + 3, b.y + 1, 1, 1, pal.bird);
          } else {
            rect(ctx, x, b.y + 1, 2, 1, pal.bird);
            rect(ctx, x + 3, b.y + 1, 2, 1, pal.bird);
          }
          rect(ctx, x + 2, b.y + 2, 1, 1, pal.bird);
        }
      }

      ctx.drawImage(landLayer, 0, 0);

      // water shimmer
      const span = gapEnd - gapStart + 4;
      for (let k = 0; k < Math.max(3, Math.round(span / 7)); k++) {
        const x = gapStart - 2 + ((k * 13 + Math.floor(t * 5)) % span);
        rect(ctx, x, waterTop + 1 + (k % 3), 2 + (k % 2), 1, pal.waterLight);
      }

      // lighthouse lamp (and its beam at night)
      if (tower) {
        const on = !night || Math.floor(t * 1.25) % 2 === 0;
        rect(ctx, tower.lampX, tower.lampY, 3, 3, on ? pal.lamp : "#5a4a2a");
        if (night && on) {
          ctx.globalAlpha = 0.28;
          for (let d = 2; d < 46; d++) {
            const spread = Math.floor(d * 0.22);
            for (let dy = -spread; dy <= spread; dy++) {
              const x = tower.lampX - d;
              const y = tower.lampY + 1 + dy;
              if (x >= 0 && (x + y) % 2 === 0) rect(ctx, x, y, 1, 1, pal.lamp);
            }
          }
          ctx.globalAlpha = 1;
        }
      }

      if (night) {
        for (const f of flies) {
          if (Math.sin(t * 2.6 + f.phase) < 0.1) continue;
          rect(ctx, f.x + Math.round(Math.sin(t * 0.7 + f.phase) * 3), f.y + Math.round(Math.cos(t * 0.9 + f.phase) * 2), 1, 1, pal.firefly);
        }
      }

      // the player
      let lift = 0;
      if (jumpAt >= 0) {
        const p = (t - jumpAt) / 0.55;
        if (p >= 1) jumpAt = -1;
        else lift = Math.round(16 * 4 * p * (1 - p));
      }
      const blinking = t % 3.6 < 0.14;
      const sprite = blinking ? heroBlink : heroSprite;
      if (lift) {
        ctx.drawImage(sprite, charX, charY - lift);
      } else {
        const bob = !reducedMotion.matches && Math.floor(t * 1.6) % 2 ? 1 : 0;
        ctx.drawImage(sprite, 0, 20, 16, 4, charX, charY + 20, 16, 4);
        ctx.drawImage(sprite, 0, 0, 16, 20, charX, charY + bob, 16, 20);
      }

      // coins popping out
      coinFx = coinFx.filter((c) => t - c.t0 < 0.7);
      for (const c of coinFx) {
        const p = Math.min(1, (t - c.t0) / 0.35);
        const y = Math.round(c.y - 14 * p);
        ctx.drawImage(Math.floor((t - c.t0) * 12) % 2 ? coinB : coinA, c.x, y);
      }
    }

    function frame(now) {
      raf = 0;
      const t = now / 1000;
      if (now - lastFrame >= 33) {
        const dt = lastTime ? Math.min(0.1, t - lastTime) : 0;
        lastTime = t;
        lastFrame = now;
        draw(t, reducedMotion.matches ? 0 : dt);
      }
      if (shouldAnimate()) raf = requestAnimationFrame(frame);
    }

    function shouldAnimate() {
      if (!onScreen || document.hidden) return false;
      return !reducedMotion.matches || jumpAt >= 0 || coinFx.length > 0;
    }

    function start() {
      if (!raf) {
        lastTime = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    function renderStill() {
      draw(performance.now() / 1000, 0);
    }

    function setup(force) {
      const key = hero.clientWidth + "x" + window.innerHeight;
      if (!force && key === sizeKey) return;
      sizeKey = key;
      layout();
      rebuild();
      renderStill();
      start();
    }

    hit.addEventListener("click", () => {
      const t = performance.now() / 1000;
      if (jumpAt < 0) jumpAt = t;
      coinFx.push({ x: charX + 5, y: charY - 8, t0: t });
      addCoins(1);
      if (tip) tip.classList.add("is-done");
      start();
    });

    if (matchMedia("(pointer: coarse)").matches && tip) tip.textContent = "psst · tap me";

    let resizeQueued = false;
    window.addEventListener("resize", () => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => {
        resizeQueued = false;
        setup(false);
      });
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        onScreen = entries[0].isIntersecting;
        if (onScreen) start();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) start();
    });
    reducedMotion.addEventListener("change", () => start());

    setup(true);
    // Re-run once fonts settle, since text height decides the hero height.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setup(true));

    return {
      redraw() {
        rebuild();
        renderStill();
        start();
      },
    };
  }

  const scene = createScene();

  // ---------------------------------------------------------------------------
  // Day / night toggle
  // ---------------------------------------------------------------------------
  const toggle = document.getElementById("theme-toggle");
  function syncToggle() {
    toggle.setAttribute("aria-label", isNight() ? "Switch to day mode" : "Switch to night mode");
  }
  toggle.addEventListener("click", () => {
    const next = isNight() ? "light" : "dark";
    root.dataset.theme = next;
    store.set("ck-theme", next);
    syncToggle();
    scene.redraw();
  });
  darkQuery.addEventListener("change", () => {
    syncToggle();
    if (!root.dataset.theme) scene.redraw();
  });
  syncToggle();

  // ---------------------------------------------------------------------------
  // HUD: highlight the section in view
  // ---------------------------------------------------------------------------
  const navLinks = Array.from(document.querySelectorAll(".hud-nav a"));
  if ("IntersectionObserver" in window && navLinks.length) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) => a.removeAttribute("aria-current"));
          const link = byId.get(entry.target.id);
          if (link) link.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  // ---------------------------------------------------------------------------
  // "Continue?" countdown
  // ---------------------------------------------------------------------------
  const countdown = document.getElementById("countdown");
  if (countdown && "IntersectionObserver" in window) {
    let n = 9;
    let timer = 0;
    new IntersectionObserver((entries) => {
      const visible = entries[0].isIntersecting;
      clearInterval(timer);
      if (visible && !reducedMotion.matches) {
        timer = setInterval(() => {
          n = n > 0 ? n - 1 : 9;
          countdown.textContent = String(n);
        }, 1000);
      }
    }).observe(countdown);
  }

  // ---------------------------------------------------------------------------
  // ↑ ↑ ↓ ↓ ← → ← → B A
  // ---------------------------------------------------------------------------
  const code = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  let progress = 0;
  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    progress = key === code[progress] ? progress + 1 : key === code[0] ? 1 : 0;
    if (progress === code.length) {
      progress = 0;
      const on = root.classList.toggle("crt");
      addCoins(30);
      toast(on ? "CRT mode on · +30 coins" : "CRT mode off");
    }
  });
})();
