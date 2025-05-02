// frontend/src/components/auth/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const udLogo = require('../auth/ud-logo.png').default || require('../auth/ud-logo.png');

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  // Form validation states
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  
  // States for handling reset process
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('error');
  const [tokenValid, setTokenValid] = useState<boolean>(true);

  // Extract token and email from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('token');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      // If no token provided, mark as invalid
      setTokenValid(false);
      setAlertSeverity('error');
      setAlertMessage('Invalid or missing reset token. Please request a new password reset link.');
      setAlertOpen(true);
    }
  }, [location.search]);

  // Password validation
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  // Confirm password validation
  const validateConfirmPassword = (confirm: string): boolean => {
    if (!confirm) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    
    if (confirm !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    
    setConfirmPasswordError('');
    return true;
  };

  // Form validation
  const validateForm = (): boolean => {
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    return isPasswordValid && isConfirmPasswordValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:3000/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          password
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAlertSeverity('success');
        setAlertMessage('Password has been reset successfully! Redirecting to login...');
        setAlertOpen(true);
        
        // Redirect to login page after a brief delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setAlertSeverity('error');
        setAlertMessage(data.message || 'Failed to reset password');
        setAlertOpen(true);
      }
    } catch (error) {
      console.error('Password reset error:', error);
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
        minHeight: '100vh',
        bgcolor: '#00539F', // University of Delaware blue
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        py: 4
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
            CourseHen
          </Typography>
          <Typography variant="h6" sx={{ color: '#FFD200' /* UD Yellow */ }}>
            Password Reset
          </Typography>
        </Box>

        {tokenValid ? (
          <Card sx={{ 
            width: '100%', 
            maxWidth: '400px', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            mb: 4
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" sx={{ color: '#00539F', mb: 3, textAlign: 'center' }}>
                Create New Password
              </Typography>

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  value={email}
                  disabled
                  sx={{ mb: 2 }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value) validatePassword(e.target.value);
                    if (confirmPassword) validateConfirmPassword(confirmPassword);
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

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (e.target.value) validateConfirmPassword(e.target.value);
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword)}
                  error={!!confirmPasswordError}
                  helperText={confirmPasswordError}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
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
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                </Button>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2">
                    Remember your password?{' '}
                    <Button 
                      onClick={() => navigate('/login')}
                      sx={{ color: '#00539F', textTransform: 'none', p: 0 }}
                    >
                      Back to Login
                    </Button>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ 
            width: '100%', 
            maxWidth: '400px', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            mb: 4
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" sx={{ color: '#00539F', mb: 3, textAlign: 'center' }}>
                Invalid Reset Link
              </Typography>
              
              <Alert severity="error" sx={{ mb: 3 }}>
                This password reset link is invalid or has expired. Please request a new one.
              </Alert>
              
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/login')}
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
                Back to Login
              </Button>
            </CardContent>
          </Card>
        )}
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

export default ResetPassword;