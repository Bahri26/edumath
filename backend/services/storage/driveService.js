const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');
const { google } = require('googleapis');

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const driveListOpts = { supportsAllDrives: true, includeItemsFromAllDrives: true };
const driveWriteOpts = { supportsAllDrives: true };

function backendRoot() {
  return path.resolve(__dirname, '../..');
}

function resolveCredentialsPath() {
  const raw = process.env.GOOGLE_DRIVE_CREDENTIALS_JSON || './gcp-service-account.json';
  if (raw.trim().startsWith('{')) {
    return null;
  }
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(backendRoot(), raw);
}

function loadServiceAccountKey() {
  const inline = process.env.GOOGLE_DRIVE_CREDENTIALS_JSON?.trim();
  if (inline?.startsWith('{')) {
    return JSON.parse(inline);
  }
  const keyFile = resolveCredentialsPath();
  if (!keyFile || !fs.existsSync(keyFile)) {
    throw new Error(
      'Google Drive kimlik bilgisi yok. backend/gcp-service-account.json kopyalayın veya GOOGLE_DRIVE_CREDENTIALS_JSON ayarlayın.',
    );
  }
  return JSON.parse(fs.readFileSync(keyFile, 'utf8'));
}

function getImagesFolderId() {
  return process.env.GOOGLE_DRIVE_IMAGES_FOLDER_ID?.trim() || '';
}

function getPatternsFolderId() {
  return process.env.GOOGLE_DRIVE_PATTERNS_FOLDER_ID?.trim() || getImagesFolderId();
}

function resolveFolderId(prefix = '') {
  const normalized = String(prefix || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  if (normalized.includes('pattern')) {
    return getPatternsFolderId();
  }
  return getImagesFolderId();
}

function isDriveConfigured() {
  try {
    if (!getImagesFolderId()) return false;
    const inline = process.env.GOOGLE_DRIVE_CREDENTIALS_JSON?.trim();
    if (inline?.startsWith('{')) return true;
    const keyFile = resolveCredentialsPath();
    return Boolean(keyFile && fs.existsSync(keyFile));
  } catch {
    return false;
  }
}

function isPublicSharingEnabled() {
  return String(process.env.GOOGLE_DRIVE_PUBLIC || 'true').toLowerCase() === 'true';
}

function buildPublicViewUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
}

async function getServiceAccountDriveClient() {
  const key = loadServiceAccountKey();
  const impersonate = process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL?.trim();

  let auth;
  if (impersonate) {
    auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: [DRIVE_SCOPE],
      subject: impersonate,
    });
  } else {
    auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: [DRIVE_SCOPE],
    });
  }

  return google.drive({ version: 'v3', auth });
}

async function getDriveClient() {
  const { getOAuthDriveClient } = require('./driveOAuth');
  const oauth = await getOAuthDriveClient();
  if (oauth) return oauth;
  return getServiceAccountDriveClient();
}

async function getDriveAuthMode() {
  const { isOAuthConfigured } = require('./driveOAuth');
  if (isOAuthConfigured()) return 'oauth';
  if (process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL?.trim()) return 'service_account_impersonate';
  return 'service_account';
}

async function ensurePublicRead(drive, fileId) {
  if (!isPublicSharingEnabled()) return;
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
      ...driveWriteOpts,
    });
  } catch (err) {
    if (!String(err.message || '').includes('already exists')) {
      throw err;
    }
  }
}

function sanitizeFileName(name, fallback = 'file') {
  const base = String(name || fallback)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || fallback;
}

function buildDriveFileName(originalName, prefix) {
  const parsed = path.parse(originalName || 'file.bin');
  const ext = parsed.ext || '';
  const base = sanitizeFileName(parsed.name, 'file');
  const prefixPart = String(prefix || '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/[/\\]+/g, '-');
  const unique = crypto.randomUUID().slice(0, 8);
  return prefixPart ? `${prefixPart}-${base}-${unique}${ext}` : `${base}-${unique}${ext}`;
}

async function uploadBuffer(buffer, options = {}) {
  const {
    originalName = 'file.bin',
    mimeType = 'application/octet-stream',
    prefix = '',
    folderId = resolveFolderId(prefix),
  } = options;

  const targetFolderId = folderId || resolveFolderId(prefix);
  if (!targetFolderId) {
    throw new Error('GOOGLE_DRIVE_IMAGES_FOLDER_ID tanımlı değil.');
  }

  const drive = await getDriveClient();
  const name = buildDriveFileName(originalName, prefix);
  const media = { mimeType, body: Readable.from(buffer) };

  const response = await drive.files.create({
    requestBody: { name, parents: [targetFolderId] },
    media,
    fields: 'id,name,webViewLink,webContentLink',
    ...driveWriteOpts,
  });

  const fileId = response.data.id;
  await ensurePublicRead(drive, fileId);

  return {
    url: buildPublicViewUrl(fileId),
    key: fileId,
    provider: 'gdrive',
    fileName: name,
    webContentLink: response.data.webContentLink || null,
  };
}

async function deleteFile(fileId) {
  if (!fileId) return;
  const drive = await getDriveClient();
  await drive.files.delete({ fileId, ...driveWriteOpts });
}

async function inspectFolder(folderId) {
  const drive = await getDriveClient();
  const meta = await drive.files.get({
    fileId: folderId,
    fields: 'id,name,mimeType,driveId,capabilities,owners,shared',
    supportsAllDrives: true,
  });
  const list = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(name)',
    pageSize: 10,
    ...driveListOpts,
  });
  return {
    ...meta.data,
    sampleFiles: (list.data.files || []).map((f) => f.name),
  };
}

module.exports = {
  backendRoot,
  getImagesFolderId,
  getPatternsFolderId,
  resolveFolderId,
  isDriveConfigured,
  isPublicSharingEnabled,
  buildPublicViewUrl,
  getDriveClient,
  getDriveAuthMode,
  uploadBuffer,
  deleteFile,
  inspectFolder,
};
