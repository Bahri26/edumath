// backend-express/controllers/uploadController.js
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

/**
 * @desc    Upload profile picture
 * @route   POST /api/upload/profile
 * @access  Private
 */
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Lütfen bir dosya seçin!' });
    }

    // Get the file URL
    const fileUrl = `/uploads/profiles/${req.file.filename}`;

    // Update user's profile picture in database
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: fileUrl },
      { new: true, select: '-password' }
    );

    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Kullanıcı bulunamadı!' });
    }

    res.status(200).json({
      message: 'Profil resmi başarıyla yüklendi!',
      fileUrl,
      user
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Profil resmi yüklenirken hata oluştu!' });
  }
};

/**
 * @desc    Upload question image
 * @route   POST /api/upload/question
 * @access  Private (Teacher)
 */
const uploadQuestionImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Lütfen bir dosya seçin!' });
    }

    const fileUrl = `/uploads/questions/${req.file.filename}`;

    res.status(200).json({
      message: 'Soru resmi başarıyla yüklendi!',
      fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Question image upload error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Soru resmi yüklenirken hata oluştu!' });
  }
};

/**
 * @desc    Upload multiple question images
 * @route   POST /api/upload/questions-multiple
 * @access  Private (Teacher)
 */
const uploadMultipleQuestionImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Lütfen en az bir dosya seçin!' });
    }

    const fileUrls = req.files.map(file => ({
      url: `/uploads/questions/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size
    }));

    res.status(200).json({
      message: `${req.files.length} soru resmi başarıyla yüklendi!`,
      files: fileUrls,
      count: req.files.length
    });
  } catch (error) {
    console.error('Multiple question images upload error:', error);
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ message: 'Soru resimleri yüklenirken hata oluştu!' });
  }
};

/**
 * @desc    Upload video
 * @route   POST /api/upload/video
 * @access  Private (Teacher)
 */
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Lütfen bir video dosyası seçin!' });
    }

    const fileUrl = `/uploads/videos/${req.file.filename}`;

    res.status(200).json({
      message: 'Video başarıyla yüklendi!',
      fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      duration: req.body.duration || null // Can be sent from frontend
    });
  } catch (error) {
    console.error('Video upload error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Video yüklenirken hata oluştu!' });
  }
};

/**
 * @desc    Delete uploaded file
 * @route   DELETE /api/upload/:type/:filename
 * @access  Private
 */
const deleteFile = async (req, res) => {
  try {
    const { type, filename } = req.params;
    
    // Validate type
    const validTypes = ['profiles', 'questions', 'videos'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Geçersiz dosya tipi!' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', type, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Dosya bulunamadı!' });
    }

    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: 'Geçersiz dosya adı!' });
    }

    // If deleting profile picture, update user
    if (type === 'profiles') {
      await User.findByIdAndUpdate(
        req.user._id,
        { profilePicture: null }
      );
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.status(200).json({ 
      message: 'Dosya başarıyla silindi!',
      filename 
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ message: 'Dosya silinirken hata oluştu!' });
  }
};

/**
 * @desc    Get file info
 * @route   GET /api/upload/info/:type/:filename
 * @access  Private
 */
const getFileInfo = async (req, res) => {
  try {
    const { type, filename } = req.params;
    
    const validTypes = ['profiles', 'questions', 'videos'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Geçersiz dosya tipi!' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', type, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Dosya bulunamadı!' });
    }

    const stats = fs.statSync(filePath);

    res.status(200).json({
      filename,
      type,
      url: `/uploads/${type}/${filename}`,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ message: 'Dosya bilgisi alınırken hata oluştu!' });
  }
};

module.exports = {
  uploadProfilePicture,
  uploadQuestionImage,
  uploadMultipleQuestionImages,
  uploadVideo,
  deleteFile,
  getFileInfo
};
