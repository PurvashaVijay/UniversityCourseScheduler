// src/components/common/Unauthorized.tsx

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Unauthorized: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: '#f5f5f5'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500,
          mx: 'auto'
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          You don't have permission to access this page.
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          {user ? (
            <>
              You are logged in as <strong>{user.first_name} {user.last_name}</strong> with role <strong>{user.role}</strong>, 
              but this page requires different access privileges.
            </>
          ) : (
            'You need to login with appropriate credentials to access this page.'
          )}
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          {user ? (
            <>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to={user.role === 'admin' ? '/admin/dashboard' : '/professor/dashboard'}
                sx={{ bgcolor: '#00539F' }}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={logout}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/login"
              sx={{ bgcolor: '#00539F' }}
            >
              Login
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Unauthorized;