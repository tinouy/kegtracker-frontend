import React, { useState } from 'react';
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
  Container,
  Paper
} from '@mui/material';
import {
  Email as EmailIcon,
  LockReset as LockResetIcon,
  Login as LoginIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const ForgotPassword: React.FC = () => {
  const t = useLang();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError(t('Please enter your email'));
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('Error sending recovery email'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4
          }}
        >
          <Paper
            elevation={8}
            sx={{
              width: '100%',
              maxWidth: 400,
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                color: 'white',
                p: 3,
                textAlign: 'center'
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" component="h1" fontWeight="bold">
                Email Enviado
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Revisa tu bandeja de entrada
              </Typography>
            </Box>

            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                {t('reset_email_sent') || 'Se ha enviado un email para restablecer la contraseña.'}
              </Alert>
              
              <Typography variant="body1" sx={{ mb: 3 }}>
                Hemos enviado un enlace de recuperación a tu email. 
                Revisa tu bandeja de entrada y sigue las instrucciones.
              </Typography>

              <Button
                fullWidth
                variant="contained"
                size="large"
                component={RouterLink}
                to="/login"
                startIcon={<LoginIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  }
                }}
              >
                Volver al Login
              </Button>
            </CardContent>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
              color: 'white',
              p: 3,
              textAlign: 'center'
            }}
          >
            <LockResetIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              {t('forgot_password') || 'Recuperar Contraseña'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              Ingresa tu email para recibir un enlace de recuperación
            </Typography>
          </Box>

          {/* Form */}
          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockResetIcon />}
                sx={{
                  mt: 2,
                  mb: 3,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
                  }
                }}
              >
                {loading ? (t('loading') || 'Cargando...') : (t('send_reset_link') || 'Enviar Enlace')}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component={RouterLink}
                  to="/login"
                  variant="body2"
                  sx={{
                    color: '#9c27b0',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  ¿Recordaste tu contraseña? Inicia sesión
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 