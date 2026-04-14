// Gera o ícone SolFarm usando Canvas (sharp + SVG)
import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

const SIZE = 1024;

// SVG do logo SolFarm — Lucide Leaf exato, escalado para 1024x1024
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#15803d"/>
      <stop offset="100%" stop-color="#16a34a"/>
    </linearGradient>
  </defs>

  <!-- Fundo verde igual ao site -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Lucide Leaf escalado para 1024x1024 -->
  <!-- Original viewBox: 24x24. Escala: 1024/24 = 42.666 -->
  <!-- Mas usamos escala 30 com translate para centralizar + padding -->
  <g transform="translate(512, 490) scale(30) translate(-12, -12)">
    <path
      d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 6 0 6.63-4.55 9.71-10 12z"
      fill="white"
    />
    <path
      d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
      fill="none"
      stroke="white"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>`;

const svgPath = '/tmp/solfarm_icon.svg';
writeFileSync(svgPath, svg);
console.log('✅ SVG escrito');

// Verifica se sharp está disponível
try {
  const sharp = (await import('sharp')).default;
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(SIZE, SIZE)
    .png()
    .toBuffer();

  writeFileSync('/Users/antonioterra/solfarm-app/assets/icon.png', pngBuffer);
  writeFileSync('/Users/antonioterra/solfarm-app/assets/adaptive-icon.png', pngBuffer);
  console.log(`✅ icon.png gerado via sharp — ${SIZE}x${SIZE}px`);
} catch(e) {
  console.log('sharp não disponível, tentando qlmanage...');

  // Usa qlmanage do macOS para converter SVG → PNG
  try {
    execSync(`qlmanage -t -s ${SIZE} -o /tmp/ ${svgPath} 2>/dev/null`);
    execSync(`cp /tmp/solfarm_icon.svg.png /Users/antonioterra/solfarm-app/assets/icon.png 2>/dev/null || true`);
    console.log('✅ Convertido via qlmanage');
  } catch(e2) {
    console.log('❌ Erro:', e2.message);
  }
}
