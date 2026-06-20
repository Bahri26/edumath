require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { getStorageStatus } = require('../../services/storageService');
const driveService = require('../../services/storage/driveService');

async function main() {
  const status = getStorageStatus();
  console.log('Storage:', JSON.stringify(status, null, 2));

  if (!status.googleDriveEnabled) {
    console.error('\nSTORAGE_PROVIDER=gdrive ve Drive env değişkenleri gerekli.');
    process.exit(1);
  }

  const buffer = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#14b8a6"/></svg>',
    'utf8',
  );

  const uploaded = await driveService.uploadBuffer(buffer, {
    originalName: 'edumath-drive-test.svg',
    mimeType: 'image/svg+xml',
    prefix: 'test',
  });

  console.log('\n✅ Test yükleme başarılı:');
  console.log(`  URL: ${uploaded.url}`);
  console.log(`  File ID: ${uploaded.key}`);
  console.log('\nTarayıcıda URL\'yi açarak görseli doğrulayın.');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
