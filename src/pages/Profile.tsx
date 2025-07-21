import React, { useState } from 'react';
import axios from 'axios';
import { useLang } from '../hooks/useLang';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, Avatar } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

const Profile: React.FC = () => {
  const t = useLang();
  const { token, user } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(localStorage.getItem('avatar'));
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(t('password_changed_ok') || 'Contraseña cambiada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setShowPwd(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleAvatarConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarPreview) {
      setAvatar(avatarPreview);
      localStorage.setItem('avatar', avatarPreview);
      setAvatarPreview(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', mt: 4 }}>
      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mb: 1 }} src={avatarPreview || avatar || undefined}>
              {user?.email?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <form onSubmit={handleAvatarConfirm} style={{ marginTop: 8, marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                component="label"
                size="small"
              >
                Cambiar avatar
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              </Button>
              {avatarPreview && (
                <Button type="submit" variant="contained" color="primary" size="small" sx={{ mt: 1 }}>
                  Confirmar cambio
                </Button>
              )}
            </form>
            <Typography variant="h5" gutterBottom>{user?.email}</Typography>
            <Typography color="text.secondary">{t('brewery') || 'Cervecería'}: {user?.brewery_name || 'Sin asignar'}</Typography>
            <Typography color="text.secondary">{t('email') || 'Email'}: {user?.sub}</Typography>
            <Button variant="contained" startIcon={<LockIcon />} onClick={() => setShowPwd(true)} sx={{ mt: 2 }}>
              {t('change_password') || 'Cambiar contraseña'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Dialog open={showPwd} onClose={() => setShowPwd(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('change_password') || 'Cambiar contraseña'}</DialogTitle>
        <form onSubmit={handleChangePassword}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('current_password') || 'Contraseña actual'}
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={t('new_password') || 'Nueva contraseña'}
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPwd(false)}>{t('close') || 'Cerrar'}</Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {loading ? t('loading') : t('change_password') || 'Cambiar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile; 