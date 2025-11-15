// frontend-react/src/components/Upload/ProfilePictureUpload.jsx
import { useState, useRef } from 'react';
import { uploadProfilePicture, previewImage, validateFile, getFileUrl } from '../../services/uploadService';
import './ProfilePictureUpload.css';

const ProfilePictureUpload = ({ currentPicture, onUploadSuccess }) => {
  const [preview, setPreview] = useState(currentPicture ? getFileUrl(currentPicture) : null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    });

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Show preview
    try {
      const previewUrl = await previewImage(file);
      setPreview(previewUrl);
    } catch (err) {
      setError('Önizleme oluşturulamadı!');
    }

    // Auto-upload after selection (optional)
    // handleUpload(file);
  };

  const handleUpload = async (file = null) => {
    const fileToUpload = file || fileInputRef.current?.files?.[0];
    
    if (!fileToUpload) {
      setError('Lütfen bir dosya seçin!');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const result = await uploadProfilePicture(fileToUpload);
      
      setUploadProgress(100);
      
      // Call success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      // Update preview with uploaded image
      setPreview(getFileUrl(result.fileUrl));
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Yükleme başarısız!');
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="profile-picture-upload">
      <div className="upload-container">
        {/* Preview Area */}
        <div className="preview-area">
          {preview ? (
            <img 
              src={preview} 
              alt="Profile preview" 
              className="profile-preview"
            />
          ) : (
            <div className="no-preview">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Profil Resmi</span>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="upload-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${uploadProgress}%` }}
            />
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="file-input"
          disabled={uploading}
        />

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={uploading}
            className="btn-select"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Resim Seç
          </button>

          {fileInputRef.current?.files?.[0] && !uploading && (
            <button
              type="button"
              onClick={() => handleUpload()}
              className="btn-upload"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Yükle
            </button>
          )}

          {preview && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="btn-remove"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Kaldır
            </button>
          )}
        </div>

        {/* Upload Info */}
        <div className="upload-info">
          <p>JPEG, PNG, GIF veya WebP</p>
          <p>Maksimum 5MB</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
