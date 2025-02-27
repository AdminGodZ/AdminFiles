import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import './FileList.module.css';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper to determine file icon based on file type
const getFileIcon = (fileType) => {
  if (fileType.startsWith('image/')) {
    return <ImageIcon className="file-icon" />;
  } else if (fileType === 'application/pdf') {
    return <PictureAsPdfIcon className="file-icon" />;
  } else if (fileType.startsWith('text/')) {
    return <DescriptionIcon className="file-icon" />;
  } else if (fileType.startsWith('video/')) {
    return <VideoFileIcon className="file-icon" />;
  } else if (fileType.startsWith('audio/')) {
    return <AudioFileIcon className="file-icon" />;
  } else {
    return <InsertDriveFileIcon className="file-icon" />;
  }
};

const FileList = ({ files, onDelete, onDownload, isMobile }) => {
  if (files.length === 0) {
    return (
      <Paper elevation={0} sx={{ 
        p: 3, 
        textAlign: 'center',
        backgroundColor: 'rgba(187, 134, 252, 0.05)',
        border: '1px dashed rgba(187, 134, 252, 0.3)',
        borderRadius: 2
      }}>
        <Typography color="text.secondary">
          No files uploaded yet. Click the Upload button to add files.
        </Typography>
      </Paper>
    );
  }

  return (
    <div className="file-list-container">
      <List sx={{ width: '100%' }}>
        {files.map((file, index) => (
          <React.Fragment key={file.id}>
            <ListItem
              alignItems="flex-start"
              className="file-list-item"
              sx={{
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(187, 134, 252, 0.08)',
                }
              }}
            >
              <ListItemIcon sx={{ color: 'primary.main' }}>
                {getFileIcon(file.file_type)}
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Typography variant="subtitle1" component="span" sx={{ wordBreak: 'break-word' }}>
                    {file.original_filename}
                  </Typography>
                }
                secondary={
                  <>
                    <Chip 
                      label={formatFileSize(file.file_size)} 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        mr: 1, 
                        borderColor: 'rgba(187, 134, 252, 0.3)',
                        fontSize: '0.7rem'
                      }} 
                    />
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {formatDate(file.created_at)}
                    </Typography>
                  </>
                }
              />
              
              <ListItemSecondaryAction>
                <Tooltip title="Download">
                  <IconButton 
                    edge="end" 
                    aria-label="download"
                    onClick={() => onDownload(file.id, file.original_filename)}
                    className="download-button"
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete">
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => onDelete(file.id)}
                    className="delete-button"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
            
            {index < files.length - 1 && (
              <Divider variant="inset" component="li" sx={{ borderColor: 'rgba(187, 134, 252, 0.1)' }} />
            )}
          </React.Fragment>
        ))}
      </List>
    </div>
  );
};

export default FileList;
