#!/usr/bin/env python3
"""
SolFarm App Icon — renderiza o Lucide Leaf exato do site
"""
import cairosvg

SIZE = 1024

svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg width="{SIZE}" height="{SIZE}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a7a3a"/>
      <stop offset="100%" stop-color="#16a34a"/>
    </linearGradient>
  </defs>

  <!-- Fundo verde -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Lucide Leaf icon — viewBox original 24x24, escalado e centralizado -->
  <!-- Escala: 1024/24 = 42.67, mas usamos ~28x para deixar margem -->
  <g transform="translate(512,512) scale(32) translate(-12,-12)">
    <!-- Corpo da folha -->
    <path
      d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 6 0 6.63-4.55 9.71-10 12z"
      fill="white"
      stroke="none"
    />
    <!-- Haste -->
    <path
      d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
      fill="none"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>"""

out = "/Users/antonioterra/solfarm-app/assets/icon.png"
cairosvg.svg2png(bytestring=svg.encode(), write_to=out, output_width=SIZE, output_height=SIZE)

# Copia para adaptive-icon
import shutil
shutil.copy(out, "/Users/antonioterra/solfarm-app/assets/adaptive-icon.png")

print(f"✅ icon.png salvo — {SIZE}x{SIZE}px")
print(f"✅ adaptive-icon.png copiado")
