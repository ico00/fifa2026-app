/**
 * Script za generiranje PWA ikona
 * 
 * Korištenje:
 * 1. Instaliraj sharp: npm install sharp --save-dev
 * 2. Pokreni: node scripts/generate-icons.js
 * 
 * Ili koristi online alat:
 * - https://www.pwabuilder.com/imageGenerator
 * - https://realfavicongenerator.net/
 */

const fs = require('fs');
const path = require('path');

// Provjeri da li je sharp instaliran
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('⚠️  sharp nije instaliran. Instalirajte ga sa: npm install sharp --save-dev');
  console.log('');
  console.log('Alternativno, možete koristiti online alate:');
  console.log('- https://www.pwabuilder.com/imageGenerator');
  console.log('- https://realfavicongenerator.net/');
  console.log('');
  console.log('Ili koristite SVG ikone koje će raditi u većini modernih preglednika.');
  process.exit(0);
}

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_SVG = path.join(__dirname, '../public/icons/icon-512x512.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('🎨 Generiranje PWA ikona...');
  
  // Provjeri da li postoji source SVG
  if (!fs.existsSync(SOURCE_SVG)) {
    console.error('❌ Source SVG ne postoji:', SOURCE_SVG);
    process.exit(1);
  }

  // Kreiraj output direktorij ako ne postoji
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generiraj ikone za svaku veličinu
  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    try {
      await sharp(SOURCE_SVG)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generirana ikona: ${size}x${size}`);
    } catch (error) {
      console.error(`❌ Greška pri generiranju ${size}x${size}:`, error.message);
    }
  }

  // Generiraj badge ikonu (manja, za notifikacije)
  try {
    await sharp(SOURCE_SVG)
      .resize(72, 72)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'badge-72x72.png'));
    
    console.log('✅ Generirana badge ikona: 72x72');
  } catch (error) {
    console.error('❌ Greška pri generiranju badge ikone:', error.message);
  }

  // Generiraj shortcut ikone
  const SHORTCUT_ICONS = [
    { name: 'matches', emoji: '⚽' },
    { name: 'standings', emoji: '📊' }
  ];

  console.log('');
  console.log('ℹ️  Za shortcut ikone, možete kreirati vlastite dizajne ili koristiti emoji ikone.');
  console.log('');
  console.log('✅ Generiranje ikona završeno!');
}

generateIcons().catch(console.error);
