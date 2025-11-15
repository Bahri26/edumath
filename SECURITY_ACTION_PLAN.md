# 🚨 ACİL AKSİYON PLANI - GÜVENLİK FİXLERİ

## 📋 Özet

**Toplam Sorun:** 15+ güvenlik açığı tespit edildi  
**Kritik:** 4 adet 🔴  
**Yüksek:** 4 adet 🟡  
**Düşük:** 7+ adet 🟢  

**Tahmini Süre:** 1 hafta (40 saat)  
**Öncelik:** 🔥 ACİL

---

## ⚡ BUGÜN YAPMALISINIZ (2-3 saat)

### 1. CORS Düzelt (30 dakika)

**Dosya:** `backend-express/server.js`

```javascript
// Mevcut satırı bul (satır 35)
app.use(cors());

// Şununla değiştir:
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      // Production domain'lerini ekle
      // 'https://edumath.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy tarafından engellendi'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### 2. Rate Limiting Ekle (1 saat)

**Adım 1:** Paketi yükle
```bash
cd backend-express
npm install express-rate-limit
```

**Adım 2:** `server.js` dosyasına ekle (satır 6'dan sonra)
```javascript
const rateLimit = require('express-rate-limit');

// Genel API limiti
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 100 istek
  message: {
    error: 'Çok fazla istek. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login endpoint'i için özel limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 15 dakikada sadece 5 deneme
  skipSuccessfulRequests: true,
  message: {
    error: 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.'
  }
});

// Middleware'leri uygula (satır 40'tan sonra)
app.use('/api/', apiLimiter); // Tüm API'ye limit
app.use('/api/auth/login', loginLimiter); // Login'e özel limit
app.use('/api/auth/register', loginLimiter); // Register'a özel limit
```

### 3. NoSQL Injection Koruması (30 dakika)

**Adım 1:** Paketi yükle
```bash
npm install express-mongo-sanitize
```

**Adım 2:** `server.js` dosyasına ekle (satır 6'dan sonra)
```javascript
const mongoSanitize = require('express-mongo-sanitize');

// JSON middleware'den sonra ekle (satır 39'dan sonra)
app.use(express.json());
app.use(mongoSanitize()); // ✅ NoSQL injection koruması
```

### 4. Security Headers Ekle (30 dakika)

**Adım 1:** Paketi yükle
```bash
npm install helmet
```

**Adım 2:** `server.js` dosyasına ekle (satır 6'dan sonra)
```javascript
const helmet = require('helmet');

// CORS'tan önce ekle (satır 35'ten önce)
app.use(helmet());
```

**Test Et:**
```bash
# Backend'i yeniden başlat
npm run dev

# Test et
curl -I http://localhost:8000/api/health
# X-Content-Type-Options, X-Frame-Options gibi headerları görmeli
```

---

## 📅 BU HAFTA YAPMALISINIZ (1-2 gün)

### 5. Input Validation Middleware (3 saat)

**Adım 1:** Paketi yükle
```bash
npm install express-validator
```

**Adım 2:** `middleware/validation.js` dosyası oluştur
```javascript
const { body, validationResult } = require('express-validator');

// Validation sonuçlarını kontrol eden middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi girin')
    .normalizeEmail(),
  body('password')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Şifre boş olamaz'),
  validate
];

// Register validation
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi girin')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalıdır')
    .matches(/[A-Z]/)
    .withMessage('Şifre en az bir büyük harf içermelidir')
    .matches(/[a-z]/)
    .withMessage('Şifre en az bir küçük harf içermelidir')
    .matches(/[0-9]/)
    .withMessage('Şifre en az bir rakam içermelidir'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Ad en az 2 karakter olmalıdır'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Soyad en az 2 karakter olmalıdır'),
  validate
];

module.exports = {
  loginValidation,
  registerValidation
};
```

**Adım 3:** `routes/authRoutes.js` dosyasını güncelle
```javascript
const { loginValidation, registerValidation } = require('../middleware/validation');

// Mevcut route'ları bul ve şununla değiştir:
router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
```

### 6. JWT Expiration ve Refresh Token (4 saat)

**Dosya:** `utils/generateToken.js` oluştur veya güncelle

```javascript
const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 dakika
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 gün
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};
```

**`controllers/authController.js` güncelle:**
```javascript
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

// Login controller'da
if (user && (await user.matchPassword(password))) {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: {
        isTeacher: user.isTeacher,
        isStudent: user.isStudent
      }
    }
  });
}
```

**Yeni route ekle:** `routes/authRoutes.js`
```javascript
// Refresh token endpoint'i
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ 
      success: false, 
      message: 'Refresh token gerekli' 
    });
  }
  
  try {
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    
    const newAccessToken = generateAccessToken(decoded.id);
    
    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Geçersiz refresh token' 
    });
  }
});
```

### 7. XSS Koruması (2 saat)

**Adım 1:** Paketi yükle
```bash
npm install dompurify jsdom
```

**Adım 2:** `utils/sanitize.js` oluştur
```javascript
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitizeHtml = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'u', 'br', 'strong', 'em'],
    ALLOWED_ATTR: []
  });
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return sanitizeHtml(input);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
};

module.exports = { sanitizeHtml, sanitizeInput };
```

**Adım 3:** Controller'larda kullan
```javascript
const { sanitizeInput } = require('../utils/sanitize');

// Örnek: Question controller'da
const createQuestion = async (req, res) => {
  const sanitizedData = sanitizeInput(req.body);
  
  const question = await Question.create({
    title: sanitizedData.title,
    content: sanitizedData.content,
    // ...
  });
  
  res.json({ success: true, question });
};
```

### 8. Logging Sistemi (3 saat)

**Adım 1:** Paketi yükle
```bash
npm install winston
```

**Adım 2:** `utils/logger.js` oluştur
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // All logs
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Development'ta console'a da yaz
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Sensitive data'yı maskeleyen helper
const sanitizeLogData = (data) => {
  const sanitized = { ...data };
  if (sanitized.password) sanitized.password = '***REDACTED***';
  if (sanitized.token) sanitized.token = '***REDACTED***';
  if (sanitized.refreshToken) sanitized.refreshToken = '***REDACTED***';
  return sanitized;
};

module.exports = { logger, sanitizeLogData };
```

**Adım 3:** `server.js`'de kullan
```javascript
const { logger } = require('./utils/logger');

// Console.log yerine logger kullan
// console.log('MongoDB bağlantısı başarılı.');
logger.info('MongoDB bağlantısı başarılı.');

// Hata logları
// console.error('MongoDB bağlantı hatası:', err);
logger.error('MongoDB bağlantı hatası:', { error: err.message, stack: err.stack });
```

**Adım 4:** `logs/` klasörünü .gitignore'a ekle
```bash
echo "logs/" >> .gitignore
```

---

## 🔄 SONRASI (1-2 gün)

### 9. Error Handler Middleware

**Dosya:** `middleware/errorHandler.js` oluştur
```javascript
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error caught:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Sunucu hatası',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack 
    })
  });
};

module.exports = errorHandler;
```

**`server.js`'e ekle (en sona, listen'dan önce):**
```javascript
const errorHandler = require('./middleware/errorHandler');

// Tüm route'lardan sonra
app.use(errorHandler);

app.listen(PORT, () => {
  // ...
});
```

### 10. Environment Variables Güçlendir

**`.env.example` güncellemesi:**
```env
# Server
PORT=8000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/edumathDB

# JWT (Güçlü secret kullan!)
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_very_long_random_secret_here_at_least_64_chars
JWT_REFRESH_SECRET=another_very_long_random_secret_here

# CORS (Production domain'leri ekle)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

**Güçlü secret oluştur:**
```bash
# Terminal'de çalıştır
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## ✅ KONTROL LİSTESİ

Yapılması gereken her şeyi işaretle:

**Bugün (Acil):**
- [ ] CORS wildcard kaldır, whitelist ekle
- [ ] Rate limiting ekle (express-rate-limit)
- [ ] NoSQL injection koruması (mongo-sanitize)
- [ ] Security headers (helmet)
- [ ] Backend'i test et

**Bu Hafta:**
- [ ] Input validation middleware (express-validator)
- [ ] JWT expiration ayarla (15m + refresh token)
- [ ] XSS sanitization (DOMPurify)
- [ ] Logging sistemi (Winston)
- [ ] Error handler middleware
- [ ] .env güçlendir

**Sonrası:**
- [ ] Frontend'e refresh token logic ekle
- [ ] 2FA/MFA araştır
- [ ] Security audit tools çalıştır (npm audit)
- [ ] Penetration test yaptır
- [ ] Dokümantasyon güncelle

---

## 🧪 TEST SENARYOLARI

### Test 1: CORS Kontrolü
```bash
# Evil origin'den istek
curl -X GET http://localhost:8000/api/health \
  -H "Origin: https://evil.com"

# Beklenen: CORS hatası
# Mevcut: 200 OK ❌
# Düzeltme sonrası: Hata ✅
```

### Test 2: Rate Limiting
```bash
# 10 hızlı istek
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Request $i"
done

# Beklenen: 6. istekte 429 Too Many Requests
```

### Test 3: NoSQL Injection
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}'

# Beklenen: 400 Bad Request (validation hatası)
```

---

## 📞 YARDIM

**Hata alırsan:**
1. Backend log'larını kontrol et
2. Package versiyonlarını kontrol et
3. .env dosyasını kontrol et
4. Node.js versiyonunu kontrol et (18+ olmalı)

**Sorular:**
- DETAILED_SECURITY_AUDIT.md dosyasına bak
- Her adım için detaylı açıklamalar var

---

**Tahmini Süre:** 2-3 gün (full-time)  
**Öncelik:** 🔥 ACİL  
**Sonraki Adım:** Test et ve production'a al

