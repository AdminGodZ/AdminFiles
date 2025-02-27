import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '../context/AuthContext';
import { getFiles, uploadFile, deleteFile, getDownloadUrl } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import FileList from '../components/FileList';
import FileUpload from '../components/FileUpload';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'success' });
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const fetchedFiles = await getFiles();
      setFiles(fetchedFiles);
      setError('');
    } catch (err) {
      setError('Failed to load files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpload = async (file) => {
    try {
      await uploadFile(file, null);
      setNotification({
        show: true,
        message: 'File uploaded successfully!',
        severity: 'success'
      });
      setShowUploadDialog(false);
      fetchFiles();
    } catch (err) {
      setNotification({
        show: true,
        message: err.message || 'Failed to upload file',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await deleteFile(fileId);
      setFiles(files.filter(file => file.id !== fileId));
      setNotification({
        show: true,
        message: 'File deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      setNotification({
        show: true,
        message: err.message || 'Failed to delete file',
        severity: 'error'
      });
    }
  };

  const handleDownload = (fileId, filename) => {
    const url = getDownloadUrl(fileId);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, show: false });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ 
        backgroundColor: 'background.paper', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 0 8px rgba(187, 134, 252, 0.25)',
        borderBottom: '1px solid rgba(187, 134, 252, 0.3)'
      }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <span style={{ color: theme.palette.primary.main }}>Admin</span>Files
          </Typography>
          <Box>
            <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'inline' } }}>
              {user?.username || 'User'}
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={handleLogout}
              aria-label="logout"
              sx={{ 
                '&:hover': { 
                  color: theme.palette.primary.main,
                  backgroundColor: 'rgba(187, 134, 252, 0.1)'
                } 
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Paper elevation={6} sx={{ 
          p: 3, 
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'rgba(187, 134, 252, 0.3)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1">
              Your Files
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setShowUploadDialog(true)}
              sx={{ 
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: '0 0 15px rgba(187, 134, 252, 0.5)',
                },
                boxShadow: '0 0 8px rgba(187, 134, 252, 0.4)',
              }}
            >
              Upload
            </Button>
          </Box>
          
          <Divider sx={{ my: 2, borderColor: 'rgba(187, 134, 252, 0.2)' }} />
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : (
            <FileList 
              files={files} 
              onDelete={handleDelete} 
              onDownload={handleDownload} 
              isMobile={isMobile}
            />
          )}
        </Paper>
      </Container>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: 'background.paper',
          borderTop: '1px solid rgba(187, 134, 252, 0.2)'
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            AdminFiles - Secure Cloud Storage &copy; {new Date().getFullYear()}
          </Typography>
        </Container>
      </Box>
      
      <FileUpload
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleUpload}
      />
      
      <Snackbar 
        open={notification.show} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
