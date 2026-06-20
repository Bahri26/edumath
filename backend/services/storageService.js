const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const STORAGE_PROVIDER = String(process.env.STORAGE_PROVIDER || 'local').trim().toLowerCase();
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
const S3_REGION = process.env.S3_REGION || 'auto';
const S3_ENDPOINT = process.env.S3_ENDPOINT || '';
const S3_PUBLIC_BASE_URL = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || '';
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || '';
const S3_FORCE_PATH_STYLE = String(process.env.S3_FORCE_PATH_STYLE || '').toLowerCase() === 'true';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

const driveService = (() => {
  try {
    return require('./storage/driveService');
  } catch {
    return null;
  }
})();

let s3Client = null;
let cloudinaryClient = null;

function ensureLocalDir(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

function isCloudinaryEnabled() {
  return STORAGE_PROVIDER === 'cloudinary'
    && !!CLOUDINARY_CLOUD_NAME
    && !!CLOUDINARY_API_KEY
    && !!CLOUDINARY_API_SECRET;
}

function isGoogleDriveEnabled() {
  return STORAGE_PROVIDER === 'gdrive' && driveService?.isDriveConfigured?.();
}

function isObjectStorageEnabled() {
  return ['r2', 's3'].includes(STORAGE_PROVIDER)
    && !!S3_BUCKET_NAME
    && !!S3_ACCESS_KEY_ID
    && !!S3_SECRET_ACCESS_KEY
    && (STORAGE_PROVIDER !== 'r2' || !!S3_ENDPOINT);
}

function isRemoteStorageEnabled() {
  return isCloudinaryEnabled() || isGoogleDriveEnabled() || isObjectStorageEnabled();
}

function getProviderName() {
  if (isCloudinaryEnabled()) return 'cloudinary';
  if (isGoogleDriveEnabled()) return 'gdrive';
  if (isObjectStorageEnabled()) return STORAGE_PROVIDER;
  return 'local';
}

function ensureLocalUploadDirs() {
  if (isRemoteStorageEnabled()) {
    return;
  }
  const subdirs = ['temp', 'temp/crops', 'questions', 'questions/diagrams', 'question-options', 'generated', 'pattern-templates'];
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  subdirs.forEach((dir) => {
    fs.mkdirSync(path.join(LOCAL_UPLOAD_DIR, dir), { recursive: true });
  });
}

function getStorageStatus() {
  const cloudinary = isCloudinaryEnabled();
  const gdrive = isGoogleDriveEnabled();
  const objectEnabled = isObjectStorageEnabled();
  return {
    provider: getProviderName(),
    objectStorageEnabled: objectEnabled,
    cloudinaryEnabled: cloudinary,
    googleDriveEnabled: gdrive,
    remoteStorageEnabled: isRemoteStorageEnabled(),
    localUploadDir: isRemoteStorageEnabled() ? null : LOCAL_UPLOAD_DIR,
    publicBaseUrl: cloudinary
      ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`
      : gdrive
        ? 'https://drive.google.com/uc?export=view&id=…'
        : objectEnabled
          ? (S3_PUBLIC_BASE_URL || '(S3_PUBLIC_BASE_URL gerekli)')
          : '/uploads',
    bucket: objectEnabled ? S3_BUCKET_NAME : null,
    cloudName: cloudinary ? CLOUDINARY_CLOUD_NAME : null,
    driveImagesFolderId: gdrive ? driveService.getImagesFolderId() : null,
    productionHint: process.env.NODE_ENV === 'production' && !isRemoteStorageEnabled()
      ? 'Render üretiminde STORAGE_PROVIDER=gdrive veya cloudinary ayarlayın.'
      : null,
  };
}

function getCloudinary() {
  if (!isCloudinaryEnabled()) {
    return null;
  }
  if (!cloudinaryClient) {
    // eslint-disable-next-line global-require
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    cloudinaryClient = cloudinary;
  }
  return cloudinaryClient;
}

function toCloudinaryFolder(prefix) {
  return String(prefix || 'edumath')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .join('/');
}

function getS3Client() {
  if (!isObjectStorageEnabled()) {
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT || undefined,
      forcePathStyle: S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3Client;
}

function sanitizeSegment(value, fallback = 'file') {
  const cleaned = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

function buildObjectKey(prefix, originalName, extension) {
  const safePrefix = String(prefix || '').replace(/^\/+|\/+$/g, '');
  const parsed = path.parse(originalName || 'file');
  const baseName = sanitizeSegment(parsed.name, 'file');
  const ext = extension || parsed.ext || '';
  const keyName = `${baseName}-${crypto.randomUUID()}${ext}`;
  return safePrefix ? `${safePrefix}/${keyName}` : keyName;
}

function inferMimeType(fileName = '', fallback = 'application/octet-stream') {
  const ext = path.extname(fileName).toLowerCase();
  const byExt = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  return byExt[ext] || fallback;
}

function buildPublicUrl(key) {
  const normalizedKey = String(key || '').replace(/^\/+/, '');
  if (!normalizedKey) {
    return '';
  }

  if (!isObjectStorageEnabled()) {
    return `/uploads/${normalizedKey}`;
  }

  if (S3_PUBLIC_BASE_URL) {
    return `${S3_PUBLIC_BASE_URL}/${normalizedKey}`;
  }

  if (STORAGE_PROVIDER === 's3' && !S3_ENDPOINT) {
    return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${normalizedKey}`;
  }

  throw new Error('S3_PUBLIC_BASE_URL ayarlanmadan public storage URL üretilemedi.');
}

async function uploadBuffer(buffer, options = {}) {
  const {
    originalName = 'file.bin',
    mimeType = inferMimeType(originalName),
    prefix = '',
    extension,
  } = options;

  const key = buildObjectKey(prefix, originalName, extension);

  if (isGoogleDriveEnabled()) {
    const uploaded = await driveService.uploadBuffer(buffer, {
      originalName,
      mimeType,
      prefix,
    });
    return uploaded;
  }

  if (isCloudinaryEnabled()) {
    const cloudinary = getCloudinary();
    const folder = toCloudinaryFolder(prefix);
    const resourceType = mimeType === 'image/svg+xml' ? 'raw' : 'auto';
    const result = await new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: resourceType,
        public_id: `${sanitizeSegment(path.parse(originalName).name, 'file')}-${crypto.randomUUID()}`,
      };
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult);
      });
      stream.end(buffer);
    });
    return {
      url: result.secure_url,
      key: result.public_id,
      provider: 'cloudinary',
    };
  }

  if (!isObjectStorageEnabled()) {
    const targetPath = path.join(LOCAL_UPLOAD_DIR, key);
    ensureLocalDir(targetPath);
    fs.writeFileSync(targetPath, buffer);
    return {
      url: buildPublicUrl(key),
      key,
      provider: 'local',
    };
  }

  const client = getS3Client();
  await client.send(new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));

  return {
    url: buildPublicUrl(key),
    key,
    provider: STORAGE_PROVIDER,
  };
}

async function uploadFile(file, prefix) {
  if (file?.buffer) {
    return uploadBuffer(file.buffer, {
      originalName: file.originalname,
      mimeType: file.mimetype || inferMimeType(file.originalname),
      prefix,
    });
  }

  if (file?.path && fs.existsSync(file.path)) {
    const buffer = fs.readFileSync(file.path);
    return uploadBuffer(buffer, {
      originalName: file.originalname || path.basename(file.path),
      mimeType: file.mimetype || inferMimeType(file.originalname || file.path),
      prefix,
    });
  }

  throw new Error('Yüklenecek dosya buffer veya path içermiyor.');
}

function toUploadRelativePath(input) {
  const raw = String(input || '').trim();
  if (!raw || raw.startsWith('blob:') || raw.startsWith('data:')) {
    return '';
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const pathname = new URL(raw).pathname || '';
      const idx = pathname.indexOf('/uploads/');
      if (idx >= 0) return pathname.slice(idx);
    } catch {
      const match = raw.match(/\/uploads\/[^\s?#]+/i);
      if (match) return match[0];
    }
    return '';
  }

  if (raw.startsWith('/api/uploads/')) {
    return `/uploads/${raw.slice('/api/uploads/'.length).replace(/^\/+/, '')}`;
  }
  if (raw.startsWith('/uploads/')) {
    return raw;
  }
  if (raw.startsWith('uploads/')) {
    return `/${raw}`;
  }
  return `/uploads/${raw.replace(/^\/?uploads\/?/, '')}`;
}

function toUploadStorageKey(relativePath) {
  return String(relativePath || '')
    .replace(/^\/api\/uploads\//, '')
    .replace(/^\/uploads\//, '')
    .replace(/^\/+/, '');
}

/** Smart-parse temp görselini kalıcı questions/ altına taşır (veya S3'e yükler). */
async function promoteLocalUpload(url, prefix = 'questions', options = {}) {
  const { allowMissing = false } = options;
  const relative = toUploadRelativePath(url);
  if (!relative) {
    return { url: '', key: '', provider: getProviderName() };
  }

  const key = toUploadStorageKey(relative);
  if (!key.includes('temp/')) {
    return {
      url: relative,
      key,
      provider: getProviderName(),
    };
  }

  const srcPath = path.join(LOCAL_UPLOAD_DIR, key);
  if (!fs.existsSync(srcPath)) {
    const message = `Temp görsel bulunamadı: ${key}`;
    if (allowMissing) {
      console.warn(message);
      return { url: relative, key: '', provider: getProviderName(), missing: true };
    }
    throw new Error(message);
  }

  const buffer = fs.readFileSync(srcPath);
  const uploaded = await uploadBuffer(buffer, {
    originalName: path.basename(srcPath),
    mimeType: inferMimeType(srcPath),
    prefix,
  });

  try {
    fs.unlinkSync(srcPath);
  } catch (_) {
    /* temp silinemezse devam */
  }

  return uploaded;
}

async function uploadSvg(svgMarkup, prefix, fileName = 'generated.svg') {
  return uploadBuffer(Buffer.from(svgMarkup, 'utf8'), {
    originalName: fileName,
    mimeType: 'image/svg+xml',
    prefix,
    extension: '.svg',
  });
}

async function promoteUrlIfTemp(url, prefix = 'questions') {
  const relative = toUploadRelativePath(url);
  if (!relative || !/\/uploads\/temp\//i.test(relative)) {
    return { url: relative || String(url || '').trim(), key: '', provider: getProviderName() };
  }
  return promoteLocalUpload(relative, prefix, { allowMissing: true });
}

/** Smart-parse kırpılmış diyagram / şık şeridi görsellerini kalıcı depoya taşır */
async function promoteAssessmentMetaAssets(assessmentMeta) {
  if (!assessmentMeta || typeof assessmentMeta !== 'object') {
    return assessmentMeta;
  }

  const layout = { ...(assessmentMeta.parseLayout || {}) };
  const promotions = [
    { pathKey: 'diagramImagePath', prefix: 'questions/diagrams', keyField: 'diagramImageKey', providerField: 'diagramImageProvider' },
    { pathKey: 'optionsStripImagePath', prefix: 'questions/options-strips', keyField: 'optionsStripImageKey', providerField: 'optionsStripImageProvider' },
  ];

  for (const item of promotions) {
    const current = layout[item.pathKey];
    if (!current) continue;
    try {
      const promoted = await promoteUrlIfTemp(current, item.prefix);
      layout[item.pathKey] = promoted.url;
      if (promoted.key) {
        layout[item.keyField] = promoted.key;
        layout[item.providerField] = promoted.provider;
      }
    } catch (error) {
      console.warn(`promoteAssessmentMetaAssets ${item.pathKey}:`, error?.message);
    }
  }

  return { ...assessmentMeta, parseLayout: layout };
}

async function deleteStoredAsset({ key, provider, url } = {}) {
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  const normalizedKey = String(key || '').replace(/^\/+/, '');

  if (!normalizedKey && (!url || !String(url).startsWith('/uploads/'))) {
    if (!normalizedKey || normalizedProvider !== 'cloudinary') {
      return;
    }
  }

  if ((normalizedProvider === 'local' || (!normalizedProvider && String(url || '').startsWith('/uploads/'))) && (normalizedKey || url)) {
    const localKey = normalizedKey || String(url).replace(/^\/uploads\/?/, '');
    const targetPath = path.join(LOCAL_UPLOAD_DIR, localKey);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    return;
  }

  if (normalizedProvider === 'gdrive' && normalizedKey) {
    try {
      await driveService.deleteFile(normalizedKey);
    } catch (err) {
      console.warn('gdrive delete failed:', err?.message);
    }
    return;
  }

  if (normalizedProvider === 'cloudinary' && normalizedKey) {
    const cloudinary = getCloudinary();
    if (cloudinary) {
      try {
        await cloudinary.uploader.destroy(normalizedKey, { resource_type: 'image' });
      } catch (_) {
        try {
          await cloudinary.uploader.destroy(normalizedKey, { resource_type: 'raw' });
        } catch (err) {
          console.warn('cloudinary delete failed:', err?.message);
        }
      }
    }
    return;
  }

  if (!isObjectStorageEnabled() || !normalizedKey) {
    return;
  }

  const client = getS3Client();
  await client.send(new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: normalizedKey,
  }));
}

module.exports = {
  uploadBuffer,
  uploadFile,
  uploadSvg,
  promoteLocalUpload,
  promoteUrlIfTemp,
  promoteAssessmentMetaAssets,
  toUploadRelativePath,
  deleteStoredAsset,
  isObjectStorageEnabled,
  isCloudinaryEnabled,
  isGoogleDriveEnabled,
  isRemoteStorageEnabled,
  getProviderName,
  ensureLocalUploadDirs,
  getStorageStatus,
};