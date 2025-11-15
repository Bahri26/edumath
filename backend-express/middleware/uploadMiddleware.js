// backend-express/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage for different upload types
const createStorage = (destination) => {
  ensureDirectoryExists(destination);
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Generate unique filename: timestamp-randomstring-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
  });
};

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir! (JPEG, PNG, GIF, WebP)'), false);
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  const allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece video dosyaları yüklenebilir! (MP4, MPEG, MOV, AVI, WebM)'), false);
  }
};

// File filter for both images and videos
const mediaFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim veya video dosyaları yüklenebilir!'), false);
  }
};

// Upload configurations for different purposes
const uploadConfigs = {
  // Profile picture upload (max 5MB)
  profile: multer({
    storage: createStorage('./uploads/profiles'),
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  }),
  
  // Question image upload (max 10MB)
  question: multer({
    storage: createStorage('./uploads/questions'),
    fileFilter: imageFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  }),
  
  // Video upload (max 100MB)
  video: multer({
    storage: createStorage('./uploads/videos'),
    fileFilter: videoFilter,
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB
    }
  }),
  
  // General media upload (max 50MB)
  media: multer({
    storage: createStorage('./uploads'),
    fileFilter: mediaFilter,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB
    }
  })
};

// Error handling middleware for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'Dosya boyutu çok büyük!', 
        maxSize: err.field === 'profile' ? '5MB' : 
                 err.field === 'question' ? '10MB' : 
                 err.field === 'video' ? '100MB' : '50MB'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Beklenmeyen dosya alanı!',
        field: err.field 
      });
    }
    return res.status(400).json({ 
      message: 'Dosya yükleme hatası!', 
      error: err.message 
    });
  } else if (err) {
    // Custom filter errors
    return res.status(400).json({ 
      message: err.message || 'Dosya yükleme hatası!' 
    });
  }
  next();
};

module.exports = {
  uploadProfile: uploadConfigs.profile.single('profile'),
  uploadQuestion: uploadConfigs.question.single('question'),
  uploadVideo: uploadConfigs.video.single('video'),
  uploadMedia: uploadConfigs.media.single('media'),
  uploadMultipleQuestions: uploadConfigs.question.array('questions', 10), // Max 10 images
  handleUploadError
};
