const fs = require('fs');
const path = require('path');
const https = require('https');

const outDir = path.join(__dirname, '..', 'frontend', 'public', 'vendor');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const assets = [
  { url: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js', name: 'jspdf.umd.min.js' },
  { url: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js', name: 'html2canvas.min.js' },
  { url: 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js', name: 'katex.min.js' },
  { url: 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css', name: 'katex.min.css' }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('Failed to download ' + url));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  for (const a of assets) {
    const dest = path.join(outDir, a.name);
    try {
      console.log('Downloading', a.url);
      await download(a.url, dest);
      console.log('Saved to', dest);
    } catch (err) {
      console.error('Failed to download', a.url, err.message);
    }
  }
  console.log('Mirror finished.');
})();
