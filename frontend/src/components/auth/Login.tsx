import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Link,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
const udLogo = require('./ud-logo.png').default || require('./ud-logo.png');

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // States for handling login process
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('error');

  // Add this new handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Use temp login for testing
      console.log("Attempting temp login with:", email);
      const result = await authService.tempLogin(email);
      
      if (result.success) {
        // Show success message
        setAlertSeverity('success');
        setAlertMessage('Login successful! Redirecting...');
        setAlertOpen(true);
        
        console.log('Login successful:', result.user);
        
        // Redirect to admin dashboard after 2 seconds
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        // Show error message
        setAlertSeverity('error');
        setAlertMessage(result.message || 'Login failed');
        setAlertOpen(true);
      }
    } catch (error) {
      // Show generic error
      setAlertSeverity('error');
      setAlertMessage('An unexpected error occurred. Please try again.');
      setAlertOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        bgcolor: '#00539F', // University of Delaware blue
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'auto',
        pt:0
      }}
    >
    <Container 
      component="main" 
      maxWidth="sm" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
      <img 
        src={udLogo} 
        alt="University of Delaware Logo" 
        style={{ 
          width: '120px',        // Reduced from 240px
          height: 'auto', 
          marginBottom: '16px' 
  }} 
        />
        <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
          Lerner Graduate College
        </Typography>
        <Typography variant="h6" sx={{ color: '#FFD200' /* UD Yellow */ }}>
          Course Scheduling System
        </Typography>
      </Box>

      <Card sx={{ 
        width: '100%', 
        maxWidth: '400px', 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" sx={{ color: '#00539F', mb: 3, textAlign: 'center' }}>
            Sign In
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
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
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Checkbox 
                  value="remember" 
                  color="primary" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              }
              label="Remember me"
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ 
                mt: 1, 
                mb: 2, 
                py: 1.2,
                bgcolor: '#00539F',
                '&:hover': {
                  bgcolor: '#003d75',
                },
                fontWeight: 'bold'
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link href="#" variant="body2" sx={{ display: 'block', mb: 1, color: '#00539F' }}>
                Forgot password?
              </Link>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link href="#" sx={{ color: '#00539F' }}>
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
      
    {/* Success/Error Alert */}
    <Snackbar 
      open={alertOpen} 
      autoHideDuration={6000} 
      onClose={() => setAlertOpen(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={() => setAlertOpen(false)} 
        severity={alertSeverity} 
        sx={{ width: '100%' }}
      >
        {alertMessage}
      </Alert>
    </Snackbar>
  </Box>
  );
};

export default Login;