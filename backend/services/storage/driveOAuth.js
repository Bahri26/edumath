const fs = require('fs');
const http = require('http');
const path = require('path');
const { google } = require('googleapis');
const { backendRoot } = require('./driveService');

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const AUTH_PORT = 8765;

function resolveOAuthClientPath() {
  const raw = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_JSON || './drive-oauth-client.json';
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(backendRoot(), raw);
}

function resolveOAuthTokenPath() {
  const raw = process.env.GOOGLE_DRIVE_OAUTH_TOKEN_JSON || './drive-oauth-token.json';
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(backendRoot(), raw);
}

function loadOAuthClientSecrets() {
  const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET?.trim();
  if (clientId && clientSecret) {
    return {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [`http://localhost:${AUTH_PORT}/oauth2callback`],
    };
  }

  const clientPath = resolveOAuthClientPath();
  if (!fs.existsSync(clientPath)) return null;

  const json = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
  return json.installed || json.web || null;
}

function loadOAuthToken() {
  const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN?.trim();
  if (refreshToken) {
    return { refresh_token: refreshToken };
  }

  const tokenPath = resolveOAuthTokenPath();
  if (!fs.existsSync(tokenPath)) return null;
  return JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
}

function isOAuthConfigured() {
  return Boolean(loadOAuthClientSecrets() && loadOAuthToken());
}

function loopbackRedirectUri() {
  return `http://127.0.0.1:${AUTH_PORT}/oauth2callback`;
}

function createOAuth2Client(secrets) {
  return new google.auth.OAuth2(
    secrets.client_id,
    secrets.client_secret,
    loopbackRedirectUri(),
  );
}

async function getOAuthDriveClient() {
  const secrets = loadOAuthClientSecrets();
  const token = loadOAuthToken();
  if (!secrets || !token) return null;

  const client = createOAuth2Client(secrets);
  client.setCredentials(token);
  return google.drive({ version: 'v3', auth: client });
}

function openBrowser(url) {
  const { exec } = require('child_process');
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

async function authorizeInteractive() {
  const secrets = loadOAuthClientSecrets();
  if (!secrets) {
    throw new Error(
      'OAuth istemci dosyası yok. GCP Console → Credentials → OAuth Desktop Client → ' +
        'backend/drive-oauth-client.json olarak kaydedin.',
    );
  }

  const client = createOAuth2Client(secrets);
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [DRIVE_SCOPE],
    prompt: 'consent',
  });

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, `http://127.0.0.1:${AUTH_PORT}`);
        const authCode = url.searchParams.get('code');
        if (!authCode) {
          if (url.pathname !== '/oauth2callback' && url.pathname !== '/') {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(400);
          res.end('Yetkilendirme kodu alınamadı.');
          reject(new Error('OAuth kodu alınamadı.'));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Drive bağlantısı tamam.</h1><p>Bu sekmeyi kapatabilirsiniz.</p>');
        resolve(authCode);
      } catch (err) {
        reject(err);
      } finally {
        setTimeout(() => server.close(), 500);
      }
    });

    server.listen(AUTH_PORT, () => {
      console.log(`\nTarayıcıda Google hesabınızla giriş yapın:\n${authUrl}\n`);
      openBrowser(authUrl);
    });
    server.on('error', reject);
  });

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const tokenPath = resolveOAuthTokenPath();
  await fs.promises.writeFile(tokenPath, JSON.stringify(tokens, null, 2), 'utf8');
  console.log(`\n✅ Token kaydedildi: ${tokenPath}`);
  if (tokens.refresh_token) {
    console.log(
      '\nRender için .env / panel:\n' +
        `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`,
    );
  }

  return google.drive({ version: 'v3', auth: client });
}

module.exports = {
  AUTH_PORT,
  isOAuthConfigured,
  getOAuthDriveClient,
  authorizeInteractive,
  resolveOAuthClientPath,
  resolveOAuthTokenPath,
};
