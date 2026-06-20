require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const {
  getDriveClient,
  getImagesFolderId,
  getPatternsFolderId,
  inspectFolder,
  getDriveAuthMode,
} = require('../../services/storage/driveService');

async function inspect(label, folderId) {
  if (!folderId) {
    console.log(`\n${label}: (tanımlı değil)`);
    return;
  }
  try {
    const info = await inspectFolder(folderId);
    console.log(`\n${label} (${folderId})`);
    console.log(`  Ad: ${info.name}`);
    console.log(`  Paylaşılan sürücü: ${info.driveId ? 'evet ✓' : 'hayır — kişisel Drive (OAuth gerekebilir)'}`);
    if (info.capabilities) {
      console.log(`  canAddChildren: ${info.capabilities.canAddChildren}`);
    }
    console.log(`  Örnek dosyalar: ${info.sampleFiles?.length ? info.sampleFiles.join(', ') : '(boş)'}`);
  } catch (err) {
    console.log(`\n${label}: HATA — ${err.message}`);
  }
}

async function main() {
  const authMode = await getDriveAuthMode();
  console.log(`Drive auth modu: ${authMode}`);
  await getDriveClient();
  await inspect('Soru görselleri', getImagesFolderId());
  await inspect('Örüntü / pattern', getPatternsFolderId());
  console.log('\n✅ Drive erişim kontrolü tamamlandı');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
