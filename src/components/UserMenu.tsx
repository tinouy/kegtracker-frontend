import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { useLang } from '../hooks/useLang';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Tooltip,
  Typography,
  Box,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import LanguageIcon from '@mui/icons-material/Language';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const UserMenu: React.FC = () => {
  const t = useLang();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [avatar, setAvatar] = useState<string | null>(null);
  if (!user) return null;

  // Función para traducir roles
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'user': return t('User');
      case 'moderator': return t('Moderator');
      case 'admin': return t('Administrator');
      case 'global_admin': return t('Global administrator');
      default: return role;
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };
  const handleChangePassword = () => {
    navigate('/profile');
    // El cambio de contraseña está en el perfil
    handleClose();
  };
  const handleLogout = () => {
    logout();
    handleClose();
  };
  const handleLangChange = (e: SelectChangeEvent) => {
    setLanguage(e.target.value as string);
    localStorage.setItem('lang', e.target.value as string);
  };
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar(ev.target?.result as string);
        localStorage.setItem('avatar', ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ position: 'fixed', top: 16, right: 24, zIndex: 1201 }}>
      <Tooltip title={user.email || user.sub} arrow>
        <IconButton onClick={handleMenu} size="large" sx={{ p: 0 }} aria-label={t('User menu')}>
          <Avatar sx={{ bgcolor: 'primary.main' }} src={avatar || localStorage.getItem('avatar') || undefined}>
            {user.email?.[0]?.toUpperCase() || '?'}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 4,
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: 2,
            p: 1,
          },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>{user.email?.[0]?.toUpperCase() || '?'}</Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">{user.email}</Typography>
            <Typography variant="caption" color="text.secondary">{getRoleLabel(user.role)}</Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleProfile}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          {t('Profile')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={toggleTheme}>
          <ListItemIcon>
            {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          {isDarkMode ? t('Light mode') : t('Dark mode')}
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemIcon><LanguageIcon fontSize="small" /></ListItemIcon>
          <FormControl size="small" sx={{ minWidth: 90, ml: 1 }}>
            <InputLabel id="lang-select-label">{t('Language')}</InputLabel>
            <Select
              labelId="lang-select-label"
              id="lang-select"
              value={language}
              label={t('Language')}
              onChange={handleLangChange}
              size="small"
            >
              <MenuItem value="es">{t('Spanish')}</MenuItem>
              <MenuItem value="en">{t('English')}</MenuItem>
            </Select>
          </FormControl>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          {t('Logout')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserMenu; 