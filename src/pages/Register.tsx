import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useLang } from '../hooks/useLang';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Container,
  Paper
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const Register: React.FC = () => {
  const t = useLang();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || '';

  useEffect(() => {
    // Check token before showing form
    axios.get('/api/invite/validate', { params: { token } })
      .then(() => setChecking(false))
      .catch((err) => {
        const msg = err.response?.data?.detail || t('Error');
        setError(msg);
        if (msg.includes('expired')) setErrorType('expired');
        else if (msg.includes('already used')) setErrorType('used');
        else setErrorType('other');
        setChecking(false);
      });
    // eslint-disable-next-line
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrorType('');
    if (password !== confirmPassword) {
      setError(t('passwords_no_match') || 'Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    try {
      await axios.post('/api/invite/register', { token, password });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error';
      setError(msg);
      if (msg.includes('expired')) setErrorType('expired');
      else if (msg.includes('already used')) setErrorType('used');
      else setErrorType('other');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />} sx={{ mb: 2 }}>
          {t('register_ok') || 'Registro exitoso. Ya puedes iniciar sesión.'}
        </Alert>
        <Button variant="contained" color="primary" href="/login" startIcon={<LoginIcon />}>
          {t('login') || 'Iniciar sesión'}
        </Button>
      </Container>
    );
  }

  if (checking) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom align="center">
            {t('register') || 'Registrarse'}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorType === 'expired' && (t('invite_link_expired') || 'El enlace de invitación ha expirado. Solicita uno nuevo.')}
              {errorType === 'used' && (t('invite_link_used') || 'El enlace de invitación ya fue utilizado. Solicita uno nuevo.')}
              {errorType === 'other' && error}
            </Alert>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextField
              label={t('password') || 'Contraseña'}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(v => !v)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label={t('confirm_password') || 'Confirmar contraseña'}
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(v => !v)} edge="end">
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button type="submit" variant="contained" color="primary" disabled={loading} startIcon={<PersonAddIcon />}>
              {loading ? <CircularProgress size={24} /> : t('register') || 'Registrarse'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Register; 