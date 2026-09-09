const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'logo.webp');
const outputDir = path.join(__dirname, 'assets');
const iconPath = path.join(outputDir, 'icon.png');
const splashPath = path.join(outputDir, 'splash.png');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Convert WebP to PNG for Capacitor Assets (Background preto de acordo com o seu tema)
sharp(inputPath)
  .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }) // Icon (with transparency)
  .toFile(iconPath)
  .then(() => {
    console.log('Ícone gerado com sucesso!');
    // Splash screen (with solid black background as per your manifest)
    return sharp(inputPath)
      .resize(2732, 2732, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .toFile(splashPath);
  })
  .then(() => {
    console.log('Splash screen gerada com sucesso!');
  })
  .catch(err => {
    console.error('Erro na conversão:', err);
  });
