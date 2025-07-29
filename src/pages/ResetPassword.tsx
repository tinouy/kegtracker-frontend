import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLang } from '../hooks/useLang';
import { Card, CardContent, Typography, TextField, Button, Alert, CircularProgress, Box } from '@mui/material';

const ResetPassword: React.FC = () => {
  const t = useLang();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Chequear el token antes de mostrar el formulario
    axios.get('/api/auth/reset-password/validate', { params: { token } })
      .then(() => setChecking(false))
      .catch((err) => {
        const msg = err.response?.data?.detail || 'Error';
        setError(msg);
        if (msg.includes('expired')) setErrorType('expired');
        else if (msg.includes('already used')) setErrorType('used');
        else setErrorType('other');
        setChecking(false);
      });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate('/login'), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrorType('');
    try {
      await axios.post('/api/auth/reset-password', { token, password });
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

  if (checking) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f5f5">
      <Card sx={{ minWidth: 350, maxWidth: 400, mx: 'auto', p: 2 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom align="center">{t('reset_password') || 'Reset Password'}</Typography>
          {success && <Alert severity="success" sx={{ mb: 2 }}>{t('password_reset_ok') || 'Password reset. Redirecting...'}</Alert>}
          {!success && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorType === 'expired' && (t('reset_link_expired') || 'The link has expired. Please request a new one.')}
              {errorType === 'used' && (t('reset_link_used') || 'The link has already been used. Please request a new one.')}
              {errorType === 'other' && error}
            </Alert>
          )}
          {!success && !errorType && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextField
                label={t('password') || 'New password'}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 1 }}>
                {loading ? <CircularProgress size={24} /> : t('reset_password') || 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPassword; 