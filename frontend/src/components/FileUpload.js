import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useDropzone } from 'react-dropzone';
import './FileUpload.module.css';

const FileUpload = ({ open, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Progress simulation - in real implementation this would be updated by the onProgress callback
      const interval = setInterval(() => {
        setUploadProgress((prevProgress) => {
          const newProgress = prevProgress + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 300);
      
      await onUpload(selectedFile);
      clearInterval(interval);
      setUploadProgress(100);
      
      // Reset state
      setTimeout(() => {
        setSelectedFile(null);
        setUploading(false);
        setUploadProgress(0);
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={uploading ? null : handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { 
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'rgba(187, 134, 252, 0.3)'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Upload File
        </Typography>
        {!uploading && (
          <IconButton
            aria-label="close"
            onClick={handleCancel}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'rgba(187, 134, 252, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {!selectedFile ? (
          <Paper
            {...getRootProps()}
            elevation={0}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
            sx={{
              p: 3,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'rgba(187, 134, 252, 0.3)',
              borderRadius: 2,
              backgroundColor: 'rgba(187, 134, 252, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(187, 134, 252, 0.08)',
              }
            }}
          >
            <input {...getInputProps()} />
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center'
              }}
            >
              <CloudUploadIcon 
                sx={{ 
                  fontSize: 48, 
                  color: 'primary.main',
                  mb: 2,
                  filter: 'drop-shadow(0 0 8px rgba(187, 134, 252, 0.6))'
                }} 
              />
              <Typography variant="body1" gutterBottom>
                {isDragActive
                  ? "Drop the file here..."
                  : "Drag & drop a file here, or click to select"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports any file type - Maximum size: 100MB
              </Typography>
            </Box>
          </Paper>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Selected File:
            </Typography>
            <Paper
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'rgba(187, 134, 252, 0.3)',
                borderRadius: 1,
                backgroundColor: 'rgba(187, 134, 252, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography variant="body2" noWrap sx={{ maxWidth: '300px' }}>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
              
              {!uploading && (
                <Button 
                  size="small"
                  onClick={() => setSelectedFile(null)}
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  Change
                </Button>
              )}
            </Paper>
            
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Uploading: {uploadProgress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(187, 134, 252, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'primary.main',
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        )}
        
        {error && (
          <Typography 
            variant="body2" 
            color="error" 
            sx={{ mt: 2 }}
          >
            {error}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleCancel} 
          disabled={uploading}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading}
          variant="contained"
          sx={{ 
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: '0 0 10px rgba(187, 134, 252, 0.5)',
            }
          }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUpload;
