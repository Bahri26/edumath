/**
 * Cloudinary bağlantı testi — backend/.env içindeki değerleri kullanır.
 * node scripts/tools/testCloudinary.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Eksik env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  console.error('backend/.env dosyasına yazın (git\'e eklemeyin).');
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

const demoUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

async function main() {
  console.log('1) Demo görsel yükleniyor...');
  const uploaded = await cloudinary.uploader.upload(demoUrl, { folder: 'edumath-test' });
  console.log('   secure_url:', uploaded.secure_url);
  console.log('   public_id:', uploaded.public_id);

  console.log('2) Görsel detayları...');
  const details = await cloudinary.api.resource(uploaded.public_id);
  console.log('   width:', details.width);
  console.log('   height:', details.height);
  console.log('   format:', details.format);
  console.log('   bytes:', details.bytes);

  // f_auto: tarayıcıya uygun format (WebP/AVIF vb.)
  // q_auto: otomatik kalite optimizasyonu
  const transformed = cloudinary.url(uploaded.public_id, {
    fetch_format: 'auto',
    quality: 'auto',
    secure: true,
  });
  console.log('3) Dönüştürülmüş URL (f_auto + q_auto):');
  console.log('  ', transformed);
  console.log('\nDone! Yukarıdaki linki tarayıcıda açarak format/boyutu kontrol edin.');

  await cloudinary.uploader.destroy(uploaded.public_id);
  console.log('4) Test görseli silindi.');
}

main().catch((err) => {
  console.error('Cloudinary test hatası:', err.message || err);
  process.exit(1);
});
