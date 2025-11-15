# 📤 Media Upload Pipeline - EduMath Platform

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Özellikler](#özellikler)
3. [Backend Yapısı](#backend-yapısı)
4. [Frontend Kullanımı](#frontend-kullanımı)
5. [API Endpoints](#api-endpoints)
6. [Örnek Kullanımlar](#örnek-kullanımlar)
7. [Güvenlik](#güvenlik)
8. [Sınırlamalar](#sınırlamalar)

---

## 🎯 Genel Bakış

EduMath platformu için kapsamlı bir medya yükleme sistemi. Profil resimleri, soru görselleri ve video dosyalarının güvenli bir şekilde yüklenmesini, saklanmasını ve yönetilmesini sağlar.

### Temel Özellikler
✅ **Profil Resmi Yükleme** - Kullanıcı profil fotoğrafları (max 5MB)  
✅ **Soru Görseli Yükleme** - Tek veya çoklu soru resimleri (max 10MB)  
✅ **Video Yükleme** - Eğitim videoları (max 100MB)  
✅ **Dosya Validasyonu** - MIME type ve boyut kontrolü  
✅ **Önizleme Desteği** - Yüklemeden önce görsel önizleme  
✅ **Progress Tracking** - Upload ilerleme göstergesi  
✅ **Static File Serving** - `/uploads` endpoint üzerinden dosya erişimi

---

## 🏗️ Backend Yapısı

### 1. Upload Middleware (`middleware/uploadMiddleware.js`)

Multer tabanlı dosya yükleme middleware'i:

```javascript
const {
  uploadProfile,           // Profil resmi (5MB max)
  uploadQuestion,          // Tek soru görseli (10MB max)
  uploadVideo,             // Video dosyası (100MB max)
  uploadMultipleQuestions, // Çoklu soru görseli (10 dosya max)
  handleUploadError        // Error handler
} = require('../middleware/uploadMiddleware');
```

#### Desteklenen Dosya Türleri

**Resimler:**
- `image/jpeg`, `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`

**Videolar:**
- `video/mp4`
- `video/mpeg`
- `video/quicktime` (MOV)
- `video/x-msvideo` (AVI)
- `video/webm`

#### Boyut Limitleri

| Tür | Max Boyut | Max Dosya |
|-----|-----------|-----------|
| Profil | 5MB | 1 |
| Soru Görseli | 10MB | 1 |
| Çoklu Soru | 10MB/dosya | 10 |
| Video | 100MB | 1 |

### 2. Upload Controller (`controllers/uploadController.js`)

```javascript
// Profil resmi yükle ve User modelini güncelle
uploadProfilePicture(req, res)

// Soru görseli yükle ve URL döndür
uploadQuestionImage(req, res)

// Çoklu soru görseli yükle
uploadMultipleQuestionImages(req, res)

// Video yükle
uploadVideo(req, res)

// Dosya sil
deleteFile(req, res)

// Dosya bilgisi al
getFileInfo(req, res)
```

### 3. Routes (`routes/uploadRoutes.js`)

| Method | Endpoint | Body Field | Auth | Role |
|--------|----------|------------|------|------|
| POST | `/api/upload/profile` | `profile` | ✅ | Any |
| POST | `/api/upload/question` | `question` | ✅ | Teacher |
| POST | `/api/upload/questions-multiple` | `questions[]` | ✅ | Teacher |
| POST | `/api/upload/video` | `video` | ✅ | Teacher |
| DELETE | `/api/upload/:type/:filename` | - | ✅ | Any |
| GET | `/api/upload/info/:type/:filename` | - | ✅ | Any |

### 4. Static File Serving

```javascript
// server.js
app.use('/uploads', express.static('uploads'));
```

Yüklenen dosyalar şu URL'lerden erişilebilir:
- `http://localhost:8000/uploads/profiles/filename.jpg`
- `http://localhost:8000/uploads/questions/filename.png`
- `http://localhost:8000/uploads/videos/filename.mp4`

---

## 💻 Frontend Kullanımı

### Upload Service (`services/uploadService.js`)

```javascript
import {
  uploadProfilePicture,
  uploadQuestionImage,
  uploadMultipleQuestionImages,
  uploadVideo,
  deleteFile,
  getFileInfo,
  getFileUrl,
  validateFile,
  previewImage
} from './services/uploadService';
```

### Örnek: Profil Resmi Yükleme

```jsx
import { uploadProfilePicture } from './services/uploadService';

const handleUpload = async (file) => {
  try {
    const result = await uploadProfilePicture(file);
    console.log('Upload successful:', result);
    // result.fileUrl -> "/uploads/profiles/photo-1234567890.jpg"
    // result.user -> Updated user object
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

### ProfilePictureUpload Component

```jsx
import ProfilePictureUpload from './components/Upload/ProfilePictureUpload';

function ProfilePage() {
  const handleUploadSuccess = (result) => {
    console.log('New profile picture:', result.fileUrl);
    // Update user state, show notification, etc.
  };

  return (
    <ProfilePictureUpload
      currentPicture="/uploads/profiles/current.jpg"
      onUploadSuccess={handleUploadSuccess}
    />
  );
}
```

### Dosya Validasyonu

```javascript
import { validateFile } from './services/uploadService';

const validation = validateFile(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png']
});

if (!validation.valid) {
  alert(validation.error);
  return;
}
```

### Önizleme Oluşturma

```javascript
import { previewImage } from './services/uploadService';

const preview = await previewImage(file);
setPreviewUrl(preview); // Data URL for <img> src
```

---

## 🔌 API Endpoints

### POST `/api/upload/profile`
Profil resmi yükler ve User modelinde günceller.

**Request:**
```http
POST /api/upload/profile HTTP/1.1
Authorization: Bearer <token>
Content-Type: multipart/form-data

profile=<file>
```

**Response:**
```json
{
  "message": "Profil resmi başarıyla yüklendi!",
  "fileUrl": "/uploads/profiles/photo-1700000000000-123456789.jpg",
  "user": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "profilePicture": "/uploads/profiles/photo-1700000000000-123456789.jpg"
  }
}
```

### POST `/api/upload/question`
Tek bir soru görseli yükler.

**Request:**
```http
POST /api/upload/question HTTP/1.1
Authorization: Bearer <token>
Content-Type: multipart/form-data

question=<file>
```

**Response:**
```json
{
  "message": "Soru resmi başarıyla yüklendi!",
  "fileUrl": "/uploads/questions/question-1700000000000-123456789.png",
  "filename": "question-1700000000000-123456789.png",
  "mimetype": "image/png",
  "size": 245678
}
```

### POST `/api/upload/questions-multiple`
Çoklu soru görseli yükler (max 10).

**Request:**
```http
POST /api/upload/questions-multiple HTTP/1.1
Authorization: Bearer <token>
Content-Type: multipart/form-data

questions=<file1>
questions=<file2>
questions=<file3>
```

**Response:**
```json
{
  "message": "3 soru resmi başarıyla yüklendi!",
  "files": [
    {
      "url": "/uploads/questions/q1-1700000000000-123456789.png",
      "filename": "q1-1700000000000-123456789.png",
      "mimetype": "image/png",
      "size": 245678
    },
    {
      "url": "/uploads/questions/q2-1700000000000-987654321.jpg",
      "filename": "q2-1700000000000-987654321.jpg",
      "mimetype": "image/jpeg",
      "size": 312456
    }
  ],
  "count": 2
}
```

### POST `/api/upload/video`
Video dosyası yükler.

**Request:**
```http
POST /api/upload/video HTTP/1.1
Authorization: Bearer <token>
Content-Type: multipart/form-data

video=<file>
duration=120
```

**Response:**
```json
{
  "message": "Video başarıyla yüklendi!",
  "fileUrl": "/uploads/videos/lesson-1700000000000-123456789.mp4",
  "filename": "lesson-1700000000000-123456789.mp4",
  "mimetype": "video/mp4",
  "size": 52428800,
  "duration": 120
}
```

### DELETE `/api/upload/:type/:filename`
Dosya siler.

**Request:**
```http
DELETE /api/upload/profiles/photo-1700000000000-123456789.jpg HTTP/1.1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Dosya başarıyla silindi!",
  "filename": "photo-1700000000000-123456789.jpg"
}
```

---

## 🛡️ Güvenlik

### 1. Dosya Türü Kontrolü
Sadece izin verilen MIME type'lar kabul edilir:
```javascript
const allowedMimes = ['image/jpeg', 'image/png', ...];
if (!allowedMimes.includes(file.mimetype)) {
  throw new Error('Geçersiz dosya türü!');
}
```

### 2. Boyut Limitleri
```javascript
limits: {
  fileSize: 5 * 1024 * 1024 // 5MB
}
```

### 3. Path Traversal Koruması
```javascript
if (filename.includes('..') || filename.includes('/')) {
  return res.status(400).json({ message: 'Geçersiz dosya adı!' });
}
```

### 4. Authentication Required
Tüm upload endpoint'leri `protect` middleware ile korunur:
```javascript
router.use(protect); // JWT token required
```

### 5. Role-Based Access
Soru ve video yükleme sadece Teacher rolü için:
```javascript
router.post('/question', teacherCheck, uploadQuestion, ...);
```

### 6. Unique Filenames
Dosya adı充돌ını önlemek için timestamp + random suffix:
```javascript
const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
```

---

## 📊 Sınırlamalar

| Kategori | Limit | Açıklama |
|----------|-------|----------|
| Profil Resmi | 5MB | Kullanıcı başına tek dosya |
| Soru Görseli | 10MB | Soru başına tek dosya |
| Çoklu Soru | 10 dosya | Request başına max 10 dosya |
| Video | 100MB | Video başına max boyut |
| Toplam Depolama | ∞ | Sunucu kapasitesine bağlı |

### Önerilen Optimizasyonlar

**Üretim Ortamı için:**

1. **Cloud Storage Entegrasyonu**
   - AWS S3, Azure Blob Storage, Google Cloud Storage
   - CDN entegrasyonu ile hızlı erişim

2. **Image Processing**
   - Sharp veya Jimp ile otomatik resize
   - Thumbnail oluşturma
   - Format optimizasyonu (WebP)

3. **Video Processing**
   - FFmpeg ile video encoding
   - Farklı çözünürlükler (720p, 1080p)
   - HLS streaming desteği

4. **Rate Limiting**
   - Upload endpoint'leri için özel limit
   - IP bazlı throttling

---

## 🚀 Hızlı Başlangıç

### 1. Backend'i Başlat
```bash
cd backend-express
node server.js
```

### 2. Frontend'i Başlat
```bash
cd frontend-react
npm run dev
```

### 3. Test Et

**Postman ile:**
```bash
POST http://localhost:8000/api/upload/profile
Headers:
  Authorization: Bearer <your-token>
Body (form-data):
  profile: <select-file>
```

**Frontend ile:**
```jsx
import ProfilePictureUpload from './components/Upload/ProfilePictureUpload';

<ProfilePictureUpload
  currentPicture={user.profilePicture}
  onUploadSuccess={(result) => console.log(result)}
/>
```

---

## 📝 TODO - Gelecek Geliştirmeler

- [ ] AWS S3 entegrasyonu
- [ ] Image resize & optimization (Sharp)
- [ ] Video transcoding (FFmpeg)
- [ ] Chunk upload for large files
- [ ] Resume interrupted uploads
- [ ] File compression before upload
- [ ] Virus scanning integration
- [ ] Upload analytics & monitoring
- [ ] Bandwidth optimization
- [ ] Multi-region CDN support

---

## 📄 Lisans

Bu özellik EduMath Platform'un bir parçasıdır.

---

## 🤝 Katkıda Bulunma

Sorular veya öneriler için:
- GitHub Issues
- Pull Requests welcome!

---

**Son Güncelleme:** 15 Kasım 2025  
**Versiyon:** 1.0.0  
**Durum:** ✅ Production Ready
