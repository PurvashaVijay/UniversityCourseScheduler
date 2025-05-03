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
  CircularProgress,
  Grid
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
const udLogo = require('./ud-logo.png').default || require('./ud-logo.png');
const mascot = require('./mascot.png').default || require('./mascot.png');

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Form validation states
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  
  // States for handling login process
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('error');

  // Email validation
  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    if (!email.endsWith('@udel.edu')) {
      setEmailError('Only @udel.edu email addresses are allowed');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  // Password validation
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  // Form validation
  const validateForm = (): boolean => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    return isEmailValid && isPasswordValid;
  };

  // Handle regular login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use authService instead of direct fetch
      const result = await authService.login(email, password);
      
      if (result.success) {
        // Show success message
        setAlertSeverity('success');
        setAlertMessage('Login successful! Redirecting...');
        setAlertOpen(true);
        
        // Redirect to admin dashboard after a brief delay
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
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleForgotPassword = async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Sending forgot password request for:', email);
      
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setAlertSeverity('success');
        setAlertMessage('Password reset instructions have been sent to your email');
        setAlertOpen(true);
      } else {
        setAlertSeverity('error');
        setAlertMessage(data.message || 'Failed to process password reset request');
        setAlertOpen(true);
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      setAlertSeverity('error');
      setAlertMessage('An error occurred. Please try again.');
      setAlertOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // For development testing only
  const handleTempLogin = async () => {
    if (!validateEmail(email)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await authService.tempLogin(email);
      
      if (result.success) {
        // Show success message
        setAlertSeverity('success');
        setAlertMessage('Temporary login successful! Redirecting...');
        setAlertOpen(true);
        
        console.log('Temp login successful:', result.user);
        
        // Redirect to admin dashboard after 2 seconds
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        // Show error message
        setAlertSeverity('error');
        setAlertMessage(result.message || 'Temporary login failed');
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
        pt: 0
      }}
    >
      <Grid container sx={{ height: '100%' }}>
        {/* Left side with mascot */}
        <Grid item xs={12} md={5} sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          p: 3 
        }}>
          <Box sx={{ 
            maxWidth: '100%', 
            maxHeight: '70vh',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <img 
              src={mascot} 
              alt="Blue Hen Mascot" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain'
              }} 
            />
          </Box>
        </Grid>
      {/* Right side with login form */}
      <Grid item xs={12} md={7}>
          <Container 
            component="main" 
            maxWidth="sm" 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 4,
              height: '100%'
            }}
          >
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <img 
                src={udLogo} 
                alt="University of Delaware Logo" 
                style={{ 
                  width: '120px',
                  height: 'auto', 
                  marginBottom: '16px' 
                }} 
              />
              <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                Lerner Graduate Programs
              </Typography>
              <Typography variant="h4" sx={{ color: '#FFD200', fontWeight: 'bold' /* UD Yellow */ }}>
                CourseHen
              </Typography>
            </Box>

        <Card sx={{ 
          width: '100%', 
          maxWidth: '400px', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: 2,
          mb: 4
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                error={!!emailError}
                helperText={emailError}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                error={!!passwordError}
                helperText={passwordError}
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

              {/* Temporary login button for development - you can remove this in production */}
              <Button
                fullWidth
                variant="outlined"
                disabled={isLoading}
                onClick={handleTempLogin}
                sx={{ 
                  mb: 2, 
                  py: 1,
                  color: '#00539F',
                  borderColor: '#00539F',
                  '&:hover': {
                    borderColor: '#003d75',
                  }
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Temporary Login (Dev)'}
              </Button>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link href="#" 
                variant="body2"
                onClick={handleForgotPassword} 
                sx={{ display: 'block', mb: 1, color: '#00539F' }}
                >
                  Forgot password?
                </Link>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Link href="/signup" sx={{ color: '#00539F' }}>
                    Sign Up
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
      </Grid>
      </Grid>
      
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