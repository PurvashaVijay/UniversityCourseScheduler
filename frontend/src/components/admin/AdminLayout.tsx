// src/components/admin/AdminLayout.tsx

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  //Drawer,
  IconButton,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
// Import the logo using require to handle potential bundling issues
const udLogo = require('./ud-logo.png').default || require('./ud-logo.png');

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Determine if we're on the dashboard page
  const isDashboard = location.pathname === '/admin/dashboard' || location.pathname === '/admin';

  // Set the current tab based on the current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/departments')) setCurrentTab(0);
    else if (path.includes('/programs')) setCurrentTab(1);
    else if (path.includes('/courses')) setCurrentTab(2);
    else if (path.includes('/professors')) setCurrentTab(3);
    else if (path.includes('/schedules')) setCurrentTab(4);
    else setCurrentTab(-1); // Set to -1 for dashboard or other pages not in tabs
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuId = 'primary-search-account-menu';

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      id={menuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>
        <AccountCircleIcon fontSize="small" style={{ marginRight: 8 }} />
        Profile
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ExitToAppIcon fontSize="small" style={{ marginRight: 8 }} />
        Logout
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ backgroundColor: '#00539F', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Link to="/admin/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              {/* Use the imported logo */}
              <img 
                src={udLogo} 
                alt="University of Delaware Logo" 
                style={{ height: 40, marginRight: 16 }} 
              />
              <Typography 
                variant="h6" 
                noWrap 
                component="div" 
                sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  color: isDashboard ? '#FFD200' : 'white',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: '#FFD200'
                  }
                }}
              >
                Course Scheduling System
              </Typography>
            </Link>
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              textColor="inherit"
              indicatorColor="secondary"
              sx={{ '& .MuiTab-root': { minWidth: 120 } }}
            >
              <Tab label="Departments" component={Link} to="/admin/departments" />
              <Tab label="Programs" component={Link} to="/admin/programs" />
              <Tab label="Courses" component={Link} to="/admin/courses" />
              <Tab label="Professors" component={Link} to="/admin/professors" />
              <Tab label="Schedules" component={Link} to="/admin/schedules" />
            </Tabs>
          </Box>
          <Box>
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ bgcolor: '#FFD200', color: '#00539F' }}>
                {user?.first_name?.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMenu}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 0px)` },
          mt: 8,
        }}
      >
        {children || <Outlet />}
      </Box>
    </Box>
  );
};

export default AdminLayout;