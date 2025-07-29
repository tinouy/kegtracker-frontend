import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserMenu from './components/UserMenu';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import KegList from './pages/KegList';
import BreweryAdmin from './pages/BreweryAdmin';
import AdminPanel from './pages/AdminPanel';
import AdminUsers from './pages/AdminUsers';
import AdminBreweries from './pages/AdminBreweries';
import AdminKegs from './pages/AdminKegs';
import KegDetail from './pages/KegDetail';
import Initialize from './pages/Initialize';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useAuth } from './context/AuthContext';

// Material UI imports
import { AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Divider, useTheme as useMuiTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const drawerWidth = 220;

const menuItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/', roles: ['global_admin', 'admin', 'moderator', 'user'] },
  { text: 'Barriles', icon: <LocalDrinkIcon />, path: '/kegs', roles: ['global_admin', 'admin', 'moderator', 'user'] },
  { text: 'Usuarios', icon: <GroupIcon />, path: '/admin/users', roles: ['global_admin', 'admin', 'moderator'] },
  { text: 'Cervecerías', icon: <BusinessIcon />, path: '/admin/breweries', roles: ['global_admin'] }, // Solo global_admin
];

function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Rutas donde NO se debe mostrar menú ni título
  const hideLayoutRoutes = [
    '/login', '/register', '/forgot-password', '/reset-password', '/initialize'
  ];
  const isHideLayout = hideLayoutRoutes.some(r => location.pathname.startsWith(r));

  if (!user || isHideLayout) {
    // No mostrar menús ni AppBar si no está autenticado o si es una ruta de utilidades
    return <Box component="main" sx={{ flexGrow: 1, p: 0, width: '100vw', minHeight: '100vh', bgcolor: 'background.default' }}>{children}</Box>;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.filter(item => item.roles.includes(user.role)).map((item) => (
          <ListItem 
            key={item.text} 
            component={Link} 
            to={item.path} 
            onClick={() => setMobileOpen(false)}
            sx={{
              color: 'text.primary',
              textDecoration: 'none',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              '&:visited': {
                color: 'text.primary',
              },
              '&:link': {
                color: 'text.primary',
              },
              '&:active': {
                color: 'text.primary',
              }
            }}
          >
            <ListItemIcon sx={{ color: 'text.primary' }}>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                color: 'text.primary',
                '& .MuiTypography-root': {
                  color: 'text.primary'
                }
              }} 
            />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            KegTracker
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <UserMenu />
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppLayout>
              <Routes>
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/kegs" element={<ProtectedRoute><KegList /></ProtectedRoute>} />
              <Route path="/initialize" element={<Initialize />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin" element={<ProtectedRoute roles={["global_admin","admin","moderator"]}><AdminPanel /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={["global_admin","admin","moderator"]}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/breweries" element={<ProtectedRoute roles={["global_admin","admin","moderator"]}><AdminBreweries /></ProtectedRoute>} />
              <Route path="/admin/breweries/:breweryId" element={<ProtectedRoute roles={["global_admin","admin","moderator"]}><BreweryAdmin /></ProtectedRoute>} />
              <Route path="/admin/kegs" element={<ProtectedRoute roles={["global_admin","admin","moderator"]}><AdminKegs /></ProtectedRoute>} />
              <Route path="/keg/:id" element={<ProtectedRoute><KegDetail /></ProtectedRoute>} />
              <Route path="/brewery-admin" element={<ProtectedRoute roles={["admin","moderator","global_admin"]}><BreweryAdmin /></ProtectedRoute>} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App; 