#!/usr/bin/env python3
"""
SolFarm App Icon — 1024x1024px full bleed (sem cantos arredondados)
A Apple aplica o squircle automaticamente
"""
from PIL import Image, ImageDraw
import math

SIZE = 1024
img = Image.new('RGB', (SIZE, SIZE))
draw = ImageDraw.Draw(img)

# Gradiente vertical verde escuro → verde vibrante
for y in range(SIZE):
    t = y / SIZE
    r = int(14  + (22  - 14)  * t)
    g = int(90  + (163 - 90)  * t)
    b = int(40  + (74  - 40)  * t)
    draw.line([(0, y), (SIZE, y)], fill=(r, g, b))

cx, cy = SIZE // 2, SIZE // 2

# ── Folha principal ──────────────────────────────────────────
# Corpo da folha: elipse inclinada
leaf_w, leaf_h = 320, 420
leaf_cx, leaf_cy = cx, cy - 40

# Sombra suave da folha
shadow = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.ellipse(
    [leaf_cx - leaf_w + 18, leaf_cy - leaf_h // 2 + 18,
     leaf_cx + leaf_w + 18, leaf_cy + leaf_h // 2 + 18],
    fill=(0, 0, 0, 40)
)
from PIL import ImageFilter
shadow = shadow.filter(ImageFilter.GaussianBlur(20))
img.paste(Image.alpha_composite(img.convert('RGBA'), shadow).convert('RGB'), (0, 0))
draw = ImageDraw.Draw(img)

# Corpo branco da folha
draw.ellipse(
    [leaf_cx - leaf_w, leaf_cy - leaf_h // 2,
     leaf_cx + leaf_w, leaf_cy + leaf_h // 2],
    fill=(255, 255, 255)
)

# Nervura central
vein_color = (20, 120, 50)
draw.line(
    [(leaf_cx, leaf_cy - leaf_h // 2 + 30),
     (leaf_cx, leaf_cy + leaf_h // 2 - 30)],
    fill=vein_color, width=14
)

# Nervuras laterais
for i, (dy_start, dx_end, dy_end) in enumerate([
    (-130, 160, -80),
    (-60,  190, -20),
    (10,   185,  40),
    (80,   160,  95),
    (145,  120, 150),
]):
    # Direita
    draw.line(
        [(leaf_cx, leaf_cy + dy_start),
         (leaf_cx + dx_end, leaf_cy + dy_end)],
        fill=vein_color, width=8
    )
    # Esquerda
    draw.line(
        [(leaf_cx, leaf_cy + dy_start),
         (leaf_cx - dx_end, leaf_cy + dy_end)],
        fill=vein_color, width=8
    )

# ── Haste ────────────────────────────────────────────────────
stem_top    = leaf_cy + leaf_h // 2 - 20
stem_bottom = cy + 270
draw.line([(cx, stem_top), (cx, stem_bottom)], fill=(255, 255, 255), width=22)

# Folhinhas laterais na haste
for side, (ox, oy) in [(1, (55, 40)), (-1, (-55, 100))]:
    pts = [
        (cx, stem_top + oy),
        (cx + side * ox, stem_top + oy - 35),
        (cx + side * ox + side * 10, stem_top + oy + 10),
        (cx, stem_top + oy + 30),
    ]
    draw.polygon(pts, fill=(255, 255, 255))

# ── Sol (semicírculo no topo) ────────────────────────────────
sun_cx, sun_cy = cx, 100
sun_r = 90
draw.ellipse(
    [sun_cx - sun_r, sun_cy - sun_r,
     sun_cx + sun_r, sun_cy + sun_r],
    fill=(255, 220, 60)
)
# Raios do sol
for angle in range(0, 360, 45):
    rad = math.radians(angle)
    x1 = sun_cx + int((sun_r + 12) * math.cos(rad))
    y1 = sun_cy + int((sun_r + 12) * math.sin(rad))
    x2 = sun_cx + int((sun_r + 45) * math.cos(rad))
    y2 = sun_cy + int((sun_r + 45) * math.sin(rad))
    draw.line([(x1, y1), (x2, y2)], fill=(255, 220, 60), width=10)

# ── Texto "SolFarm" ──────────────────────────────────────────
from PIL import ImageFont
font_paths = [
    "/System/Library/Fonts/SFProDisplay-Bold.otf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial Bold.ttf",
]
font = None
for fp in font_paths:
    try:
        font = ImageFont.truetype(fp, 96)
        break
    except:
        pass
if font is None:
    font = ImageFont.load_default()

text = "SolFarm"
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
tx = cx - tw // 2
ty = stem_bottom + 30
draw.text((tx, ty), text, fill=(255, 255, 255), font=font)

# Salva
out = "/Users/antonioterra/solfarm-app/assets/icon.png"
img.save(out, "PNG")
print(f"✅ Ícone salvo: {out} ({SIZE}x{SIZE}px, sem cantos arredondados)")

# Gera também o adaptive-icon (Android)
img.save("/Users/antonioterra/solfarm-app/assets/adaptive-icon.png", "PNG")
print("✅ adaptive-icon.png salvo")
