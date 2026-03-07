const path = require('path');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Sadece görsel dosyaları yüklenebilir.'));
    }
    cb(null, true);
  }
});

function sanitizeFileName(fileName) {
  return String(fileName || 'image')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

async function uploadImage(req, res) {
  try {
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      return res.status(500).json({ error: 'GCS_BUCKET_NAME ayarı eksik.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'image alanı zorunlu.' });
    }

    const ext = path.extname(req.file.originalname || '') || '.png';
    const base = path.basename(req.file.originalname || 'image', ext);
    const safeName = sanitizeFileName(base);
    const filePath = `questions/${Date.now()}-${safeName}${ext.toLowerCase()}`;

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    await file.save(req.file.buffer, {
      resumable: false,
      metadata: {
        contentType: req.file.mimetype,
        cacheControl: 'public, max-age=31536000'
      }
    });

    const url = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(filePath).replace(/%2F/g, '/')}`;
    return res.status(201).json({
      url,
      path: filePath,
      contentType: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Yükleme başarısız.' });
  }
}

module.exports = {
  upload,
  uploadImage
};
