const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';
const fs = require('fs');
const path = require('path');

async function postJson(path, body) {
  try {
    const res = await fetch(`${OLLAMA_HOST}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      console.error(`[ollamaService] ${path} error ${res.status}:`, text);
      throw new Error(`Ollama ${path} error ${res.status}: ${text}`);
    }
    
    return res.json();
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Ollama servisi çalışmıyor. Lütfen Ollama\'yı başlatın.');
    }
    throw error;
  }
}

async function generateText(prompt, options = {}) {
  try {
    const body = {
      model: options.model || OLLAMA_MODEL,
      prompt,
      stream: false,
      options: options.options || {},
    };
    const data = await postJson('/api/generate', body);
    return data?.response || '';
  } catch (error) {
    console.error('[ollamaService.generateText] Hata:', error.message);
    throw error;
  }
}

async function generateJson(prompt, options = {}) {
  try {
    const body = {
      model: options.model || OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0, ...(options.options || {}) },
    };
    const data = await postJson('/api/generate', body);
    
    let parsed;
    try {
      parsed = JSON.parse(data?.response || '{}');
    } catch (parseError) {
      console.error('[ollamaService.generateJson] JSON parse hatası:', parseError.message);
      console.error('Raw response:', data?.response);
      parsed = {};
    }
    return parsed;
  } catch (error) {
    console.error('[ollamaService.generateJson] Hata:', error.message);
    throw error;
  }
}

module.exports = {
  generateText,
  generateJson,
  OLLAMA_HOST,
  OLLAMA_MODEL,
};

// --- Vision helpers ---
function extToMime(ext) {
  const e = String(ext || '').toLowerCase();
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.png') return 'image/png';
  if (e === '.webp') return 'image/webp';
  if (e === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

async function generateVisionText(prompt, imagePath, opts = {}) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Görsel dosyası bulunamadı: ${imagePath}`);
    }
    
    const buf = fs.readFileSync(imagePath);
    const base64 = buf.toString('base64');
    const mime = opts.mimeType || extToMime(path.extname(imagePath));
    
    const body = {
      model: opts.model || 'llama3.2-vision',
      prompt,
      stream: false,
      images: [`data:${mime};base64,${base64}`],
      options: opts.options || {},
    };
    
    const data = await postJson('/api/generate', body);
    return data?.response || '';
  } catch (error) {
    console.error('[ollamaService.generateVisionText] Hata:', error.message);
    throw error;
  }
}

async function generateVisionJson(prompt, imagePath, opts = {}) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Görsel dosyası bulunamadı: ${imagePath}`);
    }
    
    const buf = fs.readFileSync(imagePath);
    const base64 = buf.toString('base64');
    const mime = opts.mimeType || extToMime(path.extname(imagePath));
    
    const body = {
      model: opts.model || 'llama3.2-vision',
      prompt,
      stream: false,
      format: 'json',
      images: [`data:${mime};base64,${base64}`],
      options: { temperature: 0, ...(opts.options || {}) },
    };
    
    const data = await postJson('/api/generate', body);
    
    let parsed;
    try {
      parsed = JSON.parse(data?.response || '{}');
    } catch (parseError) {
      console.error('[ollamaService.generateVisionJson] JSON parse hatası:', parseError.message);
      parsed = {};
    }
    return parsed;
  } catch (error) {
    console.error('[ollamaService.generateVisionJson] Hata:', error.message);
    throw error;
  }
}

module.exports.generateVisionText = generateVisionText;
module.exports.generateVisionJson = generateVisionJson;
