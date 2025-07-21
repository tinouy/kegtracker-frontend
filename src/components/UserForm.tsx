import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../hooks/useLang';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Person as PersonIcon
} from '@mui/icons-material';

interface UserFormProps {
  userEdit?: any;
  onSuccess: () => void;
  onCancel: () => void;
  breweries: any[];
  open: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ userEdit, onSuccess, onCancel, breweries, open }) => {
  const t = useLang();
  const { token, user } = useAuth();
  const [email, setEmail] = useState(userEdit?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(userEdit?.role || 'user');
  const [breweryId, setBreweryId] = useState(userEdit?.brewery_id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(userEdit?.email || '');
    setRole(userEdit?.role || 'user');
    setBreweryId(userEdit?.brewery_id || '');
  }, [userEdit]);

  // Roles disponibles según el rol del usuario logueado
  let availableRoles = [
    { value: 'user', label: t('User') },
    { value: 'moderator', label: t('Moderator') },
    { value: 'admin', label: t('Administrator') },
    { value: 'global_admin', label: t('Global administrator') }
  ];
  if (user?.role === 'moderator') {
    availableRoles = availableRoles.filter(r => r.value === 'user' || r.value === 'moderator');
  } else if (user?.role === 'admin') {
    availableRoles = availableRoles.filter(r => r.value !== 'global_admin');
  }

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || (!userEdit && !password.trim())) {
      setError(t('Email and password are required'));
      return;
    }
    
    // SEGURIDAD: Prevenir edición de global admin por usuarios no global admin
    if (userEdit && userEdit.role === 'global_admin' && user?.role !== 'global_admin') {
      setError(t('Cannot modify global admin'));
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      if (userEdit) {
        await axios.patch(`/api/users/${userEdit.id}`, { email, role, brewery_id: breweryId }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/users/', { email, password, role, brewery_id: breweryId }, { headers: { Authorization: `Bearer ${token}` } });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail === 'Method Not Allowed' ? t('No permissions error') : err.response?.data?.detail || t('Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setRole('user');
    setBreweryId('');
    setError('');
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon />
          {userEdit ? t('Edit user') : t('New user')}
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label={t('Email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="outlined"
            />
            {!userEdit && (
              <TextField
                fullWidth
                label={t('Password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                variant="outlined"
              />
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>{t('Role')}</InputLabel>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  label={t('Role')}
                >
                  {availableRoles.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <Autocomplete
                  options={breweries}
                  getOptionLabel={(option) => option.name || ''}
                  value={breweries.find(b => String(b.id) === String(breweryId)) || null}
                  onChange={(_, newValue) => setBreweryId(newValue ? String(newValue.id) : '')}
                  renderInput={(params) => <TextField {...params} label={t('Brewery')} required />} 
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </FormControl>
            </Box>
            {error && (
              <Alert severity="error">{error}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? t('Saving') : (userEdit ? t('Update') : t('Create'))}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserForm; 