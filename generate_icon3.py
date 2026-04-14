#!/usr/bin/env python3
"""
SolFarm App Icon — folha limpa estilo logo do site
Fundo verde, folha branca centralizada
"""
from PIL import Image, ImageDraw, ImageFilter
import math

SIZE = 1024
img = Image.new('RGB', (SIZE, SIZE))
draw = ImageDraw.Draw(img)

# Gradiente verde (#16a34a escuro → claro)
for y in range(SIZE):
    t = y / SIZE
    r = int(14  + (30  - 14)  * t)
    g = int(100 + (170 - 100) * t)
    b = int(40  + (80  - 40)  * t)
    draw.line([(0, y), (SIZE, y)], fill=(r, g, b))

cx, cy = SIZE // 2, SIZE // 2 - 30

# ── Folha: dois arcos formando o corpo da folha ──────────────
# Forma clássica de folha: ponta em cima, arredondada em baixo

W = 260   # metade da largura da folha
H = 380   # metade da altura da folha

# Usa polígono com curvas bezier manuais (aproximado por pontos)
def bezier(p0, p1, p2, p3, steps=50):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        x = (1-t)**3*p0[0] + 3*(1-t)**2*t*p1[0] + 3*(1-t)*t**2*p2[0] + t**3*p3[0]
        y = (1-t)**3*p0[1] + 3*(1-t)**2*t*p1[1] + 3*(1-t)*t**2*p2[1] + t**3*p3[1]
        pts.append((int(x), int(y)))
    return pts

# Ponta do topo
top    = (cx, cy - H)
# Base da folha
bottom = (cx, cy + H * 0.55)
# Controle lado esquerdo
cl1 = (cx - W * 1.4, cy - H * 0.3)
cl2 = (cx - W * 1.2, cy + H * 0.45)
# Controle lado direito
cr1 = (cx + W * 1.4, cy - H * 0.3)
cr2 = (cx + W * 1.2, cy + H * 0.45)

# Borda esquerda: topo → base (lado esquerdo)
left_side  = bezier(top, cl1, cl2, bottom, 80)
# Borda direita: base → topo (lado direito)
right_side = bezier(bottom, cr2, cr1, top, 80)

leaf_poly = left_side + right_side

# Sombra
shadow = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
sd = ImageDraw.Draw(shadow)
sd.polygon([(x+15, y+15) for x,y in leaf_poly], fill=(0,0,0,45))
shadow = shadow.filter(ImageFilter.GaussianBlur(22))
base = img.convert('RGBA')
base = Image.alpha_composite(base, shadow)
img = base.convert('RGB')
draw = ImageDraw.Draw(img)

# Folha branca
draw.polygon(leaf_poly, fill=(255, 255, 255))

# ── Nervura central ──────────────────────────────────────────
nerve_color = (22, 163, 74)
draw.line(
    [(cx, cy - H + 20), (cx, cy + H * 0.50)],
    fill=nerve_color, width=20
)

# Nervuras laterais (5 pares)
nerve_data = [
    (0.75, 55,  -0.62),
    (0.50, 60,  -0.30),
    (0.28, 58,   0.05),
    (0.08, 52,   0.38),
    (-0.10, 40,  0.65),
]
for (t, spread, slope) in nerve_data:
    # Ponto na nervura central
    ny = cy - H * t
    nx = cx
    # Direita
    ex = cx + spread * 3.2
    ey = ny + spread * slope * 2.2
    draw.line([(nx, int(ny)), (int(ex), int(ey))], fill=nerve_color, width=11)
    # Esquerda
    draw.line([(nx, int(ny)), (int(cx - spread * 3.2), int(ey))], fill=nerve_color, width=11)

# ── Haste curva ──────────────────────────────────────────────
stem_pts = bezier(
    (cx, cy + H * 0.55),
    (cx - 20, cy + H * 0.75),
    (cx - 60, cy + H * 0.90),
    (cx - 80, cy + H * 1.05),
    40
)
draw.line(stem_pts, fill=(255, 255, 255), width=24)
# Ponta arredondada
sx, sy = stem_pts[-1]
draw.ellipse([sx-14, sy-14, sx+14, sy+14], fill=(255, 255, 255))

# Salva
out = "/Users/antonioterra/solfarm-app/assets/icon.png"
img.save(out, "PNG")
img.save("/Users/antonioterra/solfarm-app/assets/adaptive-icon.png", "PNG")
print(f"✅ icon.png salvo — {SIZE}x{SIZE}px")
