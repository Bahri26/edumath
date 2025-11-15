// frontend-react/src/services/uploadService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Upload profile picture
 * @param {File} file - Image file to upload
 * @returns {Promise<{fileUrl: string, message: string, user: object}>}
 */
export const uploadProfilePicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append('profile', file);

    const token = localStorage.getItem('accessToken');
    
    const response = await axios.post(`${API_URL}/upload/profile`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });

    return response.data;
  } catch (error) {
    console.error('Profile picture upload error:', error);
    throw error.response?.data || { message: 'Profil resmi yüklenirken hata oluştu!' };
  }
};

/**
 * Upload question image (single)
 * @param {File} file - Image file to upload
 * @returns {Promise<{fileUrl: string, message: string, filename: string}>}
 */
export const uploadQuestionImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('question', file);

    const token = localStorage.getItem('accessToken');
    
    const response = await axios.post(`${API_URL}/upload/question`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });

    return response.data;
  } catch (error) {
    console.error('Question image upload error:', error);
    throw error.response?.data || { message: 'Soru resmi yüklenirken hata oluştu!' };
  }
};

/**
 * Upload multiple question images
 * @param {File[]} files - Array of image files to upload
 * @returns {Promise<{files: Array, message: string, count: number}>}
 */
export const uploadMultipleQuestionImages = async (files) => {
  try {
    const formData = new FormData();
    
    // Append all files with the same field name
    files.forEach(file => {
      formData.append('questions', file);
    });

    const token = localStorage.getItem('accessToken');
    
    const response = await axios.post(`${API_URL}/upload/questions-multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });

    return response.data;
  } catch (error) {
    console.error('Multiple question images upload error:', error);
    throw error.response?.data || { message: 'Soru resimleri yüklenirken hata oluştu!' };
  }
};

/**
 * Upload video
 * @param {File} file - Video file to upload
 * @param {number} duration - Optional video duration in seconds
 * @returns {Promise<{fileUrl: string, message: string, filename: string}>}
 */
export const uploadVideo = async (file, duration = null) => {
  try {
    const formData = new FormData();
    formData.append('video', file);
    
    if (duration) {
      formData.append('duration', duration);
    }

    const token = localStorage.getItem('accessToken');
    
    const response = await axios.post(`${API_URL}/upload/video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });

    return response.data;
  } catch (error) {
    console.error('Video upload error:', error);
    throw error.response?.data || { message: 'Video yüklenirken hata oluştu!' };
  }
};

/**
 * Delete uploaded file
 * @param {string} type - File type (profiles, questions, videos)
 * @param {string} filename - File name to delete
 * @returns {Promise<{message: string, filename: string}>}
 */
export const deleteFile = async (type, filename) => {
  try {
    const token = localStorage.getItem('accessToken');
    
    const response = await axios.delete(`${API_URL}/upload/${type}/${filename}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('File deletion error:', error);
    throw error.response?.data || { message: 'Dosya silinirken hata oluştu!' };
  }
};

/**
 * Get file info
 * @param {string} type - File type (profiles, questions, videos)
 * @param {string} filename - File name
 * @returns {Promise<{filename: string, type: string, url: string, size: number}>}
 */
export const getFileInfo = async (type, filename) => {
  try {
    const token = localStorage.getItem('accessToken');
    
    const response = await axios.get(`${API_URL}/upload/info/${type}/${filename}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Get file info error:', error);
    throw error.response?.data || { message: 'Dosya bilgisi alınırken hata oluştu!' };
  }
};

/**
 * Get full file URL
 * @param {string} relativePath - Relative path from server (e.g., "/uploads/profiles/image.jpg")
 * @returns {string} Full URL
 */
export const getFileUrl = (relativePath) => {
  if (!relativePath) return null;
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // If path already starts with http, return as is
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  
  // Remove leading slash if present
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {object} options - Validation options
 * @returns {{valid: boolean, error?: string}}
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  } = options;

  // Check if file exists
  if (!file) {
    return { valid: false, error: 'Dosya seçilmedi!' };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `Dosya boyutu ${maxSizeMB}MB'dan küçük olmalı!` };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Geçersiz dosya türü!' };
  }

  return { valid: true };
};

/**
 * Preview image file before upload
 * @param {File} file - Image file
 * @returns {Promise<string>} Data URL for preview
 */
export const previewImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Dosya seçilmedi!'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okunamadı!'));
    };
    
    reader.readAsDataURL(file);
  });
};

export default {
  uploadProfilePicture,
  uploadQuestionImage,
  uploadMultipleQuestionImages,
  uploadVideo,
  deleteFile,
  getFileInfo,
  getFileUrl,
  validateFile,
  previewImage
};
