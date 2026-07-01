import { useState, useRef } from 'react';
import './FileUpload.css';

const FileUpload = ({ label, id, accept, onChange, error, hint, maxMb = 5, isImage = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    // Validate size
    if (file.size > maxMb * 1024 * 1024) {
      alert(`File is too large. Maximum size is ${maxMb}MB.`);
      return;
    }

    setFileName(file.name);
    onChange(file);

    // Create preview for images
    if (isImage && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const removeFile = (e) => {
    e.preventDefault();
    setPreview(null);
    setFileName('');
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`file-upload-wrapper ${error ? 'has-error' : ''}`}>
      {label && (
        <label htmlFor={id} className="file-upload-label">
          {label}
        </label>
      )}
      
      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isImage ? 'is-image-zone' : ''} ${preview !== null ? 'has-preview' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          id={id}
          accept={accept}
          className="file-input-hidden"
          onChange={handleFileChange}
        />
        
        {preview && isImage ? (
          <div className="preview-container">
            <img src={preview} alt="Preview" className="image-preview" />
            <div className="preview-overlay">
              <button type="button" className="remove-file-btn" onClick={removeFile}>
                Change Photo
              </button>
            </div>
          </div>
        ) : fileName ? (
          <div className="file-info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="file-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span className="file-name">{fileName}</span>
            <button type="button" className="remove-file-btn-small" onClick={removeFile}>
              &times;
            </button>
          </div>
        ) : (
          <div className="drop-zone-content">
            {isImage ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            )}
            <p className="upload-text">
              <span className="upload-browse">Click to upload</span> or drag and drop
            </p>
            {hint && <p className="upload-hint">{hint} (Max {maxMb}MB)</p>}
          </div>
        )}
      </div>

      {error && <span className="file-error-msg">{error}</span>}
    </div>
  );
};

export default FileUpload;
