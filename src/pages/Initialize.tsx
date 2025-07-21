import React, { useState, useEffect } from 'react';
import { useLang } from '../hooks/useLang';
import axios from 'axios';
import { Card, CardContent, Typography, TextField, Button, Alert, CircularProgress, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Initialize: React.FC = () => {
  const t = useLang();
  const [brewery, setBrewery] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si la app ya fue inicializada antes de mostrar el formulario
    axios.get('/api/wizard/status')
      .then(res => {
        if (res.data.initialized) {
          setBlocked(true);
          setError(t('already_initialized') || 'La aplicación ya fue inicializada.');
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [t]);

  useEffect(() => {
    if (blocked) {
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }
    if (success) {
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }
  }, [blocked, success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return; // No permitir submit si está bloqueado
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/wizard/initialize', {
        brewery_name: brewery,
        admin_email: email,
        admin_password: password,
      });
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(t('already_initialized') || 'La aplicación ya fue inicializada.');
        setBlocked(true);
      } else {
        setError(err.response?.data?.detail || 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f5f5">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f5f5">
      <Card sx={{ minWidth: 350, maxWidth: 400, mx: 'auto', p: 2 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom align="center">{t('initialize')}</Typography>
          {blocked && !success && <Alert severity="info" sx={{ mb: 2 }}>{error} {t('redirecting') || 'Redirigiendo...'}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{t('initialize')} OK! {t('redirecting') || 'Redirigiendo...'}</Alert>}
          {!blocked && !success && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextField label={t('brewery')} value={brewery} onChange={e => setBrewery(e.target.value)} required sx={{ mb: 2 }} />
              <TextField label={t('login')} type="email" value={email} onChange={e => setEmail(e.target.value)} required sx={{ mb: 2 }} />
              <TextField label={t('password')} type="password" value={password} onChange={e => setPassword(e.target.value)} required sx={{ mb: 2 }} />
              <Button type="submit" variant="contained" color="primary" sx={{ mt: 1 }}>
                {loading ? <CircularProgress size={24} /> : t('initialize')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Initialize; 