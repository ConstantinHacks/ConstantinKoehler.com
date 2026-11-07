#!/usr/bin/env python3
"""Generates the site's pixel art from the character maps below.

Run from the repo root:  python3 tools/pixel_art.py

Each map is a list of equal-length strings. "." is transparent; every other
character is a key into the palette. Outputs land in assets/img/ plus the
favicon and the social preview image. No third-party packages needed.
"""

import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img")

PALETTE = {
    # outline + hair
    "k": "#2b1d1c", "H": "#93502e", "h": "#bd7044", "d": "#64321e",
    # skin
    "S": "#f4c9ad", "s": "#dda58a", "r": "#ec9f8f", "b": "#6e3b25",
    # glasses + eyes
    "G": "#7b8070", "L": "#ffffff", "E": "#3f5868",
    # beard + mouth
    "B": "#86593c", "n": "#a6765a", "m": "#9a5550", "M": "#cf8f86",
    # sweater
    "W": "#ebe6d4", "w": "#cfc8b2", "C": "#f6efdc", "c": "#d8cfb5",
    # item colors
    "y": "#f6c445", "Y": "#c98e1e", "l": "#fde68a",
    "p": "#f3e2b3", "P": "#c9a96b",
    "R": "#e0504f", "q": "#a83232",
    "g": "#9aa3b2", "x": "#5c6577", "o": "#ffffff",
    "u": "#5b9be6", "U": "#2f5ea8",
    "v": "#5cc06a", "V": "#2f8a46",
    "t": "#1e2433",
    "z": "#f4efd8",
}

PORTRAIT = [
    "................................",
    "..............kkkkkkk...........",
    "...........kkkhhhhhhhhk.........",
    ".........kkHHHHhhhhhhhHk........",
    "........kHHHhhHHHHhhhHHHk.......",
    ".......kdHHhhHHHHHHHhHHHk.......",
    ".......kdHhHHHHHHHHHHHHHk.......",
    ".......kdHHHHddHHHHHHHHdk.......",
    ".......kdHHSSSSSSSSSSHHdk.......",
    ".......kdHSSSSSSSSSSSSHdk.......",
    ".......kHSbbbbSSSSbbbbSHk.......",
    ".......kHSGGGGSSSSGGGGSHk.......",
    ".......kGGSSSLGGGGSSSLGGk.......",
    ".......ksGSEESGSSGSEESGsk.......",
    ".......ksGSSSSGSsGSSSSGsk.......",
    ".......kSGSSSSGSsGSSSSGSk.......",
    ".......kSSGGGGSssSGGGGSSk.......",
    ".......knSrrSSsSSsSSrrSnk.......",
    ".......kBnSnBBBBBBBBnSnBk.......",
    ".......kBBBmBBBBBBBBmBBBk.......",
    "........kBBBBmmmmmmBBBBk........",
    "........kBBBBBnMMnBBBBBk........",
    ".........kBBBBBnnBBBBBk.........",
    "..........kBBBBBBBBBBk..........",
    "..........ksBBBBBBBBsk..........",
    "..........kSsBBBBBBsSk..........",
    "..........kSSsBBBBsSSk..........",
    ".....kkWWCcSSSSssSSSScCWWkk.....",
    "...kkWWWWWCcCcCcCcCcCcWWWWWkk...",
    "..kWWWWWWWWwCCCCCCCCwWWWWWWWWk..",
    ".kWWWWwWWWWWWWWWWWWWWWWWWwWWWWk.",
    ".kWWWWwWWWWWWWWWWWWWWWWWWwWWWWk.",
]

ICONS = {
    "key": [
        "............",
        "............",
        ".kkkk.......",
        "kllyyk......",
        "kl..ykkkkkk.",
        "ky..yyyyyyyk",
        "kyyyYkkykyyk",
        ".kkkk.kk.kk.",
        "............",
        "............",
    ],
    "map": [
        "kkkkkkkkkkkk",
        "kppppppppppk",
        "kpvvppppRpRk",
        "kpvvPppppRpk",
        "kppppPppRpRk",
        "kpppppPPpppk",
        "kpuuuppppppk",
        "kppuuupppppk",
        "kkkkkkkkkkkk",
    ],
    "book": [
        ".kkkkkkkkkk.",
        ".kuuuuuuuuok",
        ".kuyyyyyyuok",
        ".kuuuuuuuuok",
        ".kuuuuuuuuok",
        ".kuuuuuuuuok",
        ".kuuuuuuuuok",
        ".kUUUUUUUUok",
        ".kkkkkkkkkk.",
    ],
    "heart": [
        ".kkk...kkk..",
        "kRRRk.kRRRk.",
        "kRoRRkRRRRk.",
        "kRRRRRRRRRk.",
        "kRRRRRRRRqk.",
        ".kRRRRRRqk..",
        "..kRRRRqk...",
        "...kRRqk....",
        "....kqk.....",
        ".....k......",
    ],
    "lens": [
        "..kkkk......",
        ".kooxxk.....",
        "kouuuuuk....",
        "kuuuuuuk....",
        "kuuuuuuk....",
        ".kuuuukk....",
        "..kkkkkxk...",
        "......kxxk..",
        ".......kxxk.",
        "........kxxk",
        ".........kk.",
    ],
    "phone": [
        "..kkkkkkk...",
        ".kxxxxxxxk..",
        ".kxtttttxk..",
        ".kxtuvytxk..",
        ".kxtttttxk..",
        ".kxtRuvtxk..",
        ".kxtttttxk..",
        ".kxtvyRtxk..",
        ".kxtttttxk..",
        ".kxxxgxxxk..",
        "..kkkkkkk...",
    ],
    "terminal": [
        "kkkkkkkkkkkk",
        "kxRxyxvxxxxk",
        "kttttttttttk",
        "ktvttttttttk",
        "kttvtttttttk",
        "ktvttvvvtttk",
        "kttttttttttk",
        "kkkkkkkkkkkk",
    ],
    "bubble": [
        ".kkkkkkkkkk.",
        "kzzzzzzzzzzk",
        "kzzzzzzzzzzk",
        "kzzuzzuzzuzk",
        "kzzzzzzzzzzk",
        "kzzzzzzzzzzk",
        ".kkkzkkkkkk.",
        "...kzk......",
        "...kk.......",
    ],
    "coin": [
        "..kkkk..",
        ".kllyyk.",
        "klyyyyYk",
        "klyYyyYk",
        "kyyYyyYk",
        "kyyyyYYk",
        ".kyYYYk.",
        "..kkkk..",
    ],
    "star": [
        "....y....",
        "...yly...",
        "yyyylyyyy",
        ".yyyyyyy.",
        "..yyyyy..",
        "..yyYyy..",
        ".yyY.Yyy.",
        ".yY...Yy.",
    ],
    "sun": [
        "....y....",
        ".y.....y.",
        "...yyy...",
        "..yllyy..",
        "y.ylyyy.y",
        "..yyyyy..",
        "...yyy...",
        ".y.....y.",
        "....y....",
    ],
    "moon": [
        "...zzz...",
        ".zzzz....",
        ".zzz.....",
        "zzz......",
        "zzz......",
        "zzz......",
        ".zzz....z",
        ".zzzzzzz.",
        "...zzz...",
    ],
}

# 5x7 bitmap font, only the glyphs the social image needs.
FONT = {
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "C": [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
    "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    "G": [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
    "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "I": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
    "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
    "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
    " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
}


def check(name, rows):
    width = len(rows[0])
    for i, row in enumerate(rows):
        assert len(row) == width, f"{name}: row {i} is {len(row)} wide, expected {width}"
        for ch in row:
            assert ch == "." or ch in PALETTE, f"{name}: row {i} uses unknown key {ch!r}"


def to_svg(rows, title=None):
    """One <path> per color, built from horizontal runs of pixels."""
    h, w = len(rows), len(rows[0])
    paths = {}
    for y, row in enumerate(rows):
        x = 0
        while x < w:
            ch = row[x]
            if ch == ".":
                x += 1
                continue
            run = 1
            while x + run < w and row[x + run] == ch:
                run += 1
            paths.setdefault(PALETTE[ch], []).append(f"M{x} {y}h{run}v1h-{run}z")
            x += run
    body = "".join(f'<path fill="{c}" d="{"".join(d)}"/>' for c, d in paths.items())
    label = f"<title>{title}</title>" if title else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" shape-rendering="crispEdges">{label}{body}</svg>\n'
    )


def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


class Canvas:
    def __init__(self, w, h, color):
        self.w, self.h = w, h
        self.px = [bytearray(bytes(hex_rgb(color)) * w) for _ in range(h)]

    def rect(self, x, y, w, h, color):
        rgb = bytes(hex_rgb(color))
        for yy in range(max(0, y), min(self.h, y + h)):
            row = self.px[yy]
            for xx in range(max(0, x), min(self.w, x + w)):
                row[xx * 3:xx * 3 + 3] = rgb

    def sprite(self, rows, x, y, scale):
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch != ".":
                    self.rect(x + i * scale, y + j * scale, scale, scale, PALETTE[ch])

    def text(self, s, x, y, scale, color):
        for ch in s:
            for j, row in enumerate(FONT[ch]):
                for i, bit in enumerate(row):
                    if bit == "#":
                        self.rect(x + i * scale, y + j * scale, scale, scale, color)
            x += 6 * scale

    def save_png(self, path):
        raw = b"".join(b"\x00" + bytes(row) for row in self.px)

        def chunk(tag, data):
            out = struct.pack(">I", len(data)) + tag + data
            return out + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

        header = struct.pack(">IIBBBBB", self.w, self.h, 8, 2, 0, 0, 0)
        with open(path, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header)
                    + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def social_image(path):
    ink, cream, gold, navy = "#1f1830", "#f3ead7", "#f6c445", "#3d5677"
    c = Canvas(1200, 630, ink)
    # a few fixed "stars"
    seed = 7
    for i in range(70):
        seed = (seed * 1103515245 + 12345) % 2**31
        x = seed % 1200 // 4 * 4
        seed = (seed * 1103515245 + 12345) % 2**31
        y = seed % 630 // 4 * 4
        c.rect(x, y, 4, 4, "#3a3160" if i % 3 else "#5a4f8a")
    # portrait in a pixel frame
    c.rect(70, 65, 500, 500, cream)
    c.rect(80, 55, 480, 520, cream)
    c.rect(80, 75, 480, 480, navy)
    c.sprite(PORTRAIT, 80, 75, 15)
    c.text("CONSTANTIN", 620, 170, 9, cream)
    c.text("KOEHLER", 620, 250, 9, cream)
    c.text("PARTNER SOLUTIONS", 620, 360, 4, gold)
    c.text("ENGINEER", 620, 400, 4, gold)
    c.text("CONSTANTINKOEHLER.COM", 620, 500, 3, "#8f86b8")
    c.save_png(path)


def main():
    os.makedirs(OUT, exist_ok=True)
    check("portrait", PORTRAIT)
    with open(os.path.join(OUT, "portrait.svg"), "w") as f:
        f.write(to_svg(PORTRAIT, "Pixel-art portrait of Constantin Koehler"))
    for name, rows in ICONS.items():
        check(name, rows)
        with open(os.path.join(OUT, f"{name}.svg"), "w") as f:
            f.write(to_svg(rows))
    # favicon: the face, cropped from the portrait
    face = [row[6:26] for row in PORTRAIT[0:24]]
    with open(os.path.join(ROOT, "favicon.svg"), "w") as f:
        f.write(to_svg([r.ljust(20, ".") for r in face]))
    social_image(os.path.join(OUT, "og-image.png"))
    print(f"Wrote sprites to {os.path.relpath(OUT, ROOT)}/, favicon.svg and og-image.png")


if __name__ == "__main__":
    main()
