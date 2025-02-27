import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container,
  Link,
  Avatar,
  Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={6} 
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'rgba(187, 134, 252, 0.3)'
        }}
      >
        <Avatar sx={{ 
          m: 1, 
          bgcolor: 'primary.main',
          boxShadow: '0 0 10px rgba(187, 134, 252, 0.5)'
        }}>
          <LockOutlinedIcon />
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          AdminFiles Login
        </Typography>
        
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  boxShadow: '0 0 5px rgba(187, 134, 252, 0.5)',
                },
              },
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  boxShadow: '0 0 5px rgba(187, 134, 252, 0.5)',
                },
              },
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ 
              mt: 3, 
              mb: 2, 
              py: 1.2,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: '0 0 15px rgba(187, 134, 252, 0.7)',
              },
              boxShadow: '0 0 8px rgba(187, 134, 252, 0.4)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Link component={RouterLink} to="/register" variant="body2" color="primary.light">
              {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          AdminFiles - Secure Cloud Storage
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;
