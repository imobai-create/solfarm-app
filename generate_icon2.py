#!/usr/bin/env python3
"""
SolFarm App Icon — baseado no logo do site (Leaf icon lucide + fundo verde)
1024x1024px full bleed, sem cantos arredondados
"""
from PIL import Image, ImageDraw, ImageFilter
import math

SIZE = 1024
img = Image.new('RGB', (SIZE, SIZE))
draw = ImageDraw.Draw(img)

# ── Fundo: gradiente verde igual ao site (#16a34a → #145232) ──
for y in range(SIZE):
    t = y / SIZE
    r = int(22  + (20  - 22)  * t)
    g = int(163 + (83  - 163) * t)
    b = int(74  + (45  - 74)  * t)
    draw.line([(0, y), (SIZE, y)], fill=(r, g, b))

cx, cy = SIZE // 2, SIZE // 2

# ── Folha estilo Lucide "Leaf" ──────────────────────────────
# A folha do Lucide é: corpo curvo de baixo-esquerda → cima-direita,
# com haste saindo da base
# Vamos desenhar em escala grande centralizada

scale = 3.8
offset_x = cx
offset_y = cy - 30

def pt(x, y):
    """Converte coordenadas do viewBox 24x24 para pixels, centralizado"""
    return (
        int(offset_x + (x - 12) * scale * 8.5),
        int(offset_y + (y - 12) * scale * 8.5)
    )

# Folha do Lucide Leaf (path original viewBox 24x24):
# M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2
# c1 2 2 4.18 2 6 0 6.63-4.55 9.71-10 12z
# M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12

# Vou desenhar manualmente a forma da folha como polígonos suaves

# Corpo principal da folha (forma arredondada tipo gota/folha)
leaf_points = []

# Geramos a folha como uma forma de Bezier aproximada
# Folha apontando para cima-direita, com base à esquerda

# Definição manual dos pontos da silhueta da folha lucide
# Escala: leaf_size é o "raio" da folha
leaf_size = 310

# Centro da folha ligeiramente acima do centro do ícone
lx = cx + 20
ly = cy - 20

# Forma da folha: usa polígono com muitos pontos para suavidade
num_pts = 120
for i in range(num_pts):
    angle = 2 * math.pi * i / num_pts
    # Forma de folha: raio varia com o ângulo
    # Folha apontando para cima (ângulo 0 = direita)
    a = angle - math.pi / 2  # rotaciona para apontar pra cima

    # Fórmula de folha: r = leaf_size * (1 + 0.3*cos(a)) * abs(sin(a/2))^0.4
    r = leaf_size * (0.85 + 0.3 * math.cos(a)) * (abs(math.sin(a / 2)) ** 0.3)

    # Inclina 20 graus para a direita (como o Lucide Leaf)
    tilt = math.radians(20)
    px = lx + r * math.sin(a + tilt)
    py = ly - r * math.cos(a + tilt)
    leaf_points.append((px, py))

# Sombra da folha
shadow_layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow_layer)
shadow_pts = [(x + 18, y + 18) for x, y in leaf_points]
sd.polygon(shadow_pts, fill=(0, 0, 0, 50))
shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(25))
img_rgba = img.convert('RGBA')
img_rgba = Image.alpha_composite(img_rgba, shadow_layer)
img = img_rgba.convert('RGB')
draw = ImageDraw.Draw(img)

# Corpo da folha — branco
draw.polygon(leaf_points, fill=(255, 255, 255))

# ── Nervura central ──────────────────────────────────────────
# Da base da folha até a ponta
nerve_color = (22, 163, 74)  # verde do site

# Ponta da folha (topo)
top_x = lx + leaf_size * 0.15
top_y = ly - leaf_size * 1.05

# Base da folha
base_x = lx - leaf_size * 0.05
base_y = ly + leaf_size * 0.72

draw.line(
    [(int(base_x), int(base_y)), (int(top_x), int(top_y))],
    fill=nerve_color, width=22
)

# Nervuras laterais
nerve_pairs = [
    (0.15, -0.65, 0.55, -0.55),
    (0.10, -0.25, 0.58,  -0.20),
    (0.05,  0.15, 0.52,   0.18),
    (0.00,  0.50, 0.40,   0.50),
]
for t, dy1, dx2, dy2 in nerve_pairs:
    sx = base_x + (top_x - base_x) * (1 - t)
    sy = base_y + (top_y - base_y) * (1 - t)
    # Direita
    ex = sx + leaf_size * dx2
    ey = sy + leaf_size * dy2
    draw.line([(int(sx), int(sy)), (int(ex), int(ey))], fill=nerve_color, width=12)
    # Esquerda (espelhado suavemente)
    draw.line([(int(sx), int(sy)), (int(sx - leaf_size * dx2 * 0.5), int(ey))], fill=nerve_color, width=10)

# ── Haste ────────────────────────────────────────────────────
stem_x1 = base_x
stem_y1 = base_y
stem_x2 = cx - 40
stem_y2 = cy + leaf_size * 0.95

draw.line(
    [(int(stem_x1), int(stem_y1)), (int(stem_x2), int(stem_y2))],
    fill=(255, 255, 255), width=28
)

# Pontinho arredondado no fim da haste
draw.ellipse(
    [int(stem_x2) - 18, int(stem_y2) - 18,
     int(stem_x2) + 18, int(stem_y2) + 18],
    fill=(255, 255, 255)
)

# Salva
out = "/Users/antonioterra/solfarm-app/assets/icon.png"
img.save(out, "PNG")
print(f"✅ Ícone salvo: {out}")

# Preview menor para verificar
preview = img.resize((256, 256), Image.LANCZOS)
preview.save("/tmp/icon_preview.png")
print("✅ Preview salvo em /tmp/icon_preview.png")
