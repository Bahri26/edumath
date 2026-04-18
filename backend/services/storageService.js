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

let s3Client = null;

function ensureLocalDir(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

function isObjectStorageEnabled() {
  return ['r2', 's3'].includes(STORAGE_PROVIDER)
    && !!S3_BUCKET_NAME
    && !!S3_ACCESS_KEY_ID
    && !!S3_SECRET_ACCESS_KEY
    && (STORAGE_PROVIDER !== 'r2' || !!S3_ENDPOINT);
}

function getProviderName() {
  return isObjectStorageEnabled() ? STORAGE_PROVIDER : 'local';
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
  if (!file?.buffer) {
    throw new Error('Yüklenecek dosya buffer içermiyor.');
  }

  return uploadBuffer(file.buffer, {
    originalName: file.originalname,
    mimeType: file.mimetype || inferMimeType(file.originalname),
    prefix,
  });
}

async function uploadSvg(svgMarkup, prefix, fileName = 'generated.svg') {
  return uploadBuffer(Buffer.from(svgMarkup, 'utf8'), {
    originalName: fileName,
    mimeType: 'image/svg+xml',
    prefix,
    extension: '.svg',
  });
}

async function deleteStoredAsset({ key, provider, url } = {}) {
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  const normalizedKey = String(key || '').replace(/^\/+/, '');

  if (!normalizedKey && (!url || !String(url).startsWith('/uploads/'))) {
    return;
  }

  if ((normalizedProvider === 'local' || (!normalizedProvider && String(url || '').startsWith('/uploads/'))) && (normalizedKey || url)) {
    const localKey = normalizedKey || String(url).replace(/^\/uploads\/?/, '');
    const targetPath = path.join(LOCAL_UPLOAD_DIR, localKey);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
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
  deleteStoredAsset,
  isObjectStorageEnabled,
  getProviderName,
};