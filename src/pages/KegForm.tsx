import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../hooks/useLang';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Snackbar,
  Typography
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

const kegTypes = [
  { value: 'keg', label: 'Keg' },
  { value: 'corni', label: 'Corni' }
];
const kegConnectors = {
  keg: [
    { value: 'S', label: 'S' },
    { value: 'A', label: 'A' },
    { value: 'G', label: 'G' }
  ],
  corni: [
    { value: 'ball_lock', label: 'Ball Lock' },
    { value: 'pin_lock', label: 'Pin Lock' }
  ]
};
const kegStates = [
  { value: 'in_use', label: 'En uso' },
  { value: 'empty', label: 'Vacío' },
  { value: 'dirty', label: 'Sucio' },
  { value: 'clean', label: 'Limpio' },
  { value: 'ready', label: 'Pronto para usar' }
];

const KegForm = ({ keg, onSuccess }: { keg?: any; onSuccess?: () => void }) => {
  const t = useLang();
  const { token, user } = useAuth();
  const isAdminOrMod = user && (user.role === 'global_admin' || user.role === 'admin' || user.role === 'moderator');
  const isGlobalAdmin = user && user.role === 'global_admin';
  const [form, setForm] = useState({
    name: keg?.name || '',
    type: keg?.type || 'keg',
    connector: keg?.connector || 'S',
    capacity: keg?.capacity || 20,
    current_content: keg?.current_content || 0,
    beer_type: keg?.beer_type || '',
    state: keg?.state || 'ready',
    brewery_id: isGlobalAdmin ? (keg?.brewery_id !== undefined && keg?.brewery_id !== '' ? String(keg.brewery_id) : '') : String(user?.brewery_id || ''),
    location: keg?.location || ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [breweries, setBreweries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, breweriesRes] = await Promise.all([
          axios.get('/api/users/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/breweries/', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUsers(usersRes.data);
        setBreweries(breweriesRes.data);
      } catch {
        //
      }
    };
    fetchData();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm({ ...form, [name as string]: value });
  };
  const handleTypeChange = (e: SelectChangeEvent) => {
    const value = e.target.value as string;
    setForm({ ...form, type: value, connector: kegConnectors[value][0].value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t('name') + ' ' + (t('required') || 'es obligatorio'));
      return;
    }
    if (Number(form.current_content) > Number(form.capacity)) {
      setError('El contenido actual no puede ser mayor que la capacidad');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let payload: any = { ...form };
      if (!isGlobalAdmin) {
        payload.brewery_id = String(user?.brewery_id || '');
      }
      // Convertir a número los campos numéricos
      payload.capacity = Number(payload.capacity);
      payload.current_content = Number(payload.current_content);

      if (keg && keg.id) {
        await axios.patch(`/api/kegs/${keg.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/kegs/', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setSuccess(keg ? t('edit_ok') || 'Barril actualizado correctamente' : t('create_ok') || 'Barril creado correctamente');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '0 auto', padding: 0 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}></Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <TextField label={t('name') || 'Nombre'} name="name" value={form.name} onChange={handleInputChange} required fullWidth sx={{ mb: 2 }} />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('type') || 'Tipo'}</InputLabel>
        <Select name="type" value={form.type} label={t('type') || 'Tipo'} onChange={handleTypeChange} required>
          {kegTypes.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('connector') || 'Conector'}</InputLabel>
        <Select name="connector" value={form.connector} label={t('connector') || 'Conector'} onChange={handleSelectChange} required>
          {kegConnectors[form.type].map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </Select>
      </FormControl>
      <TextField label={t('capacity') || 'Capacidad (L)'} name="capacity" type="number" value={form.capacity} onChange={handleInputChange} required fullWidth sx={{ mb: 2 }} inputProps={{ min: 1 }} />
      <TextField label={t('current_content') || 'Contenido actual (L)'} name="current_content" type="number" value={form.current_content} onChange={handleInputChange} required fullWidth sx={{ mb: 2 }} inputProps={{ min: 0, max: form.capacity }} />
      <TextField label={t('beer_type') || 'Tipo de cerveza'} name="beer_type" value={form.beer_type} onChange={handleInputChange} required fullWidth sx={{ mb: 2 }} />
      <TextField label={t('location') || 'Ubicación'} name="location" value={form.location} onChange={handleInputChange} fullWidth sx={{ mb: 2 }} />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('state') || 'Estado'}</InputLabel>
        <Select name="state" value={form.state} label={t('state') || 'Estado'} onChange={handleSelectChange} required>
          {kegStates.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </Select>
      </FormControl>
      <Button type="submit" variant="contained" color="primary" fullWidth size="large" sx={{ mt: 2, fontWeight: 'bold', borderRadius: 2 }} disabled={loading}>
        {loading ? <CircularProgress size={22} color="inherit" /> : (keg ? t('edit') || 'Editar' : t('create') || 'Crear')}
      </Button>
    </form>
  );
};

export default KegForm; 