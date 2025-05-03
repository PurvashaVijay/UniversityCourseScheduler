import React, { useState } from 'react';
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
  Link,
  Alert,
  Snackbar,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
const udLogo = require('./ud-logo.png').default || require('./ud-logo.png');

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  // Form validation states
  const [firstNameError, setFirstNameError] = useState<string>('');
  const [lastNameError, setLastNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  
  // States for handling signup process
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('error');

  // First name validation
  const validateFirstName = (name: string): boolean => {
    if (!name) {
      setFirstNameError('First name is required');
      return false;
    }
    setFirstNameError('');
    return true;
  };

  // Last name validation
  const validateLastName = (name: string): boolean => {
    if (!name) {
      setLastNameError('Last name is required');
      return false;
    }
    setLastNameError('');
    return true;
  };

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
    const isFirstNameValid = validateFirstName(firstName);
    const isLastNameValid = validateLastName(lastName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    return isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Log what we're sending
      console.log('Sending registration data:', {
        first_name: firstName,
        last_name: lastName,
        email,
        password
      });
  
      // Make sure this URL matches your backend configuration
      const apiUrl = 'http://localhost:3000/api/auth/register';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password
        }),
        // Add this to prevent CORS issues if using different origins
        credentials: 'include'
      });
      
      // Log response status for debugging
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        // Show success message
        setAlertSeverity('success');
        setAlertMessage('Account created successfully! Redirecting to login...');
        setAlertOpen(true);
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Show specific error message from server
        setAlertSeverity('error');
        setAlertMessage(data.message || 'Registration failed');
        setAlertOpen(true);
      }
    } catch (error) {
      // For network errors or JSON parsing errors
      console.error('Registration error:', error);
      setAlertSeverity('error');
      
      // Provide more helpful error message
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        setAlertMessage('Network error. Please check your connection and try again.');
      } else if (error instanceof SyntaxError) {
        setAlertMessage('Invalid response from server. The server might be down or misconfigured.');
      } else {
        setAlertMessage('An unexpected error occurred. Please try again.');
      }
      
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
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'auto',
        pt: 4,
        pb: 4
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
            Lerner Graduate Programs
          </Typography>
          <Typography variant="h6" sx={{ color: '#FFD200' /* UD Yellow */ }}>
            Course Scheduling System
          </Typography>
        </Box>

        <Card sx={{ 
          width: '100%', 
          maxWidth: '500px', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: 2,
          mb: 4
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" sx={{ color: '#00539F', mb: 3, textAlign: 'center' }}>
              Create Account
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              {/* First Name Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                autoFocus
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (e.target.value) validateFirstName(e.target.value);
                }}
                onBlur={() => validateFirstName(firstName)}
                error={!!firstNameError}
                helperText={firstNameError}
                sx={{ mb: 2 }}
              />

              {/* Last Name Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (e.target.value) validateLastName(e.target.value);
                }}
                onBlur={() => validateLastName(lastName)}
                error={!!lastNameError}
                helperText={lastNameError}
                sx={{ mb: 2 }}
              />

              {/* Email Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
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

              {/* Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
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

              {/* Confirm Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
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

              <FormHelperText sx={{ mb: 2, textAlign: 'center' }}>
                Only @udel.edu email addresses are accepted. Password must be at least 8 characters.
              </FormHelperText>

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
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
              </Button>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link href="/login" sx={{ color: '#00539F' }}>
                    Sign In
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

export default SignUp;