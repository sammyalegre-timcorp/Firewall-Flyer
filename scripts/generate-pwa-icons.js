import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Design a vibrant neon retro arcade icon SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#070817" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="goldFlame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Shield with Rounded Corners -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />
  <rect width="504" height="504" x="4" y="4" rx="96" fill="none" stroke="url(#neonCyan)" stroke-width="6" opacity="0.4" />

  <!-- Outer Neon Pulse Ring -->
  <circle cx="256" cy="256" r="190" fill="none" stroke="url(#neonCyan)" stroke-width="4" stroke-dasharray="16 8" opacity="0.6" />

  <!-- Golden Snitch / Cyber Wings -->
  <path d="M 120 230 C 150 170, 210 190, 230 240 C 190 240, 150 250, 120 230 Z" fill="url(#neonCyan)" opacity="0.85" filter="url(#glow)" />
  <path d="M 392 230 C 362 170, 302 190, 282 240 C 322 240, 362 250, 392 230 Z" fill="url(#neonCyan)" opacity="0.85" filter="url(#glow)" />

  <!-- Center Flying Lightning Core -->
  <circle cx="256" cy="256" r="64" fill="url(#goldFlame)" filter="url(#glow)" />
  <circle cx="256" cy="256" r="56" fill="#fef08a" />
  
  <!-- Arcade Lightning Bolt -->
  <polygon points="266,210 240,256 262,256 246,302 278,250 256,250" fill="#0f172a" />
</svg>`;

// Save SVG to public/icon.svg
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');

async function generateIcons() {
  const svgBuffer = Buffer.from(svgContent);

  // 1. 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 2. 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 3. Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 4. 512x512 Maskable (with 15% safe zone padding)
  const innerIcon = await sharp(svgBuffer).resize(380, 380).toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#070817'
    }
  })
    .composite([{ input: innerIcon, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 5. Favicon 64x64
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Successfully generated all PWA icons in /public!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
