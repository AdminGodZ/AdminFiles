import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors by redirecting to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onProgress) {
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Upload failed' };
  }
};

export const getFiles = async () => {
  try {
    const response = await api.get('/api/files');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch files' };
  }
};

export const deleteFile = async (fileId) => {
  try {
    await api.delete(`/api/files/${fileId}`);
    return true;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete file' };
  }
};

export const getDownloadUrl = (fileId) => {
  return `/api/files/${fileId}/download`;
};

export default api;
