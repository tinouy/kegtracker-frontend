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
  Typography,
  Autocomplete
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

// Definiciones movidas dentro del componente para usar t()

const KegForm = ({ keg, onSuccess }: { keg?: any; onSuccess?: () => void }) => {
  const t = useLang();
  const { token, user } = useAuth();
  
  const kegStates = [
    { value: 'in_use', label: t('In use') },
    { value: 'empty', label: t('Empty') },
    { value: 'dirty', label: t('Dirty') },
    { value: 'clean', label: t('Clean') },
    { value: 'ready', label: t('Ready') }
  ];
  
  const kegTypes = [
    { value: 'keg', label: t('Keg') },
    { value: 'corni', label: t('Corni') }
  ];
  
  const kegConnectors = {
    keg: [
      { value: 'S', label: t('S connector') },
      { value: 'A', label: t('A connector') },
      { value: 'G', label: t('G connector') }
    ],
    corni: [
      { value: 'ball_lock', label: t('Ball Lock') },
      { value: 'pin_lock', label: t('Pin Lock') }
    ]
  };
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
    brewery_id: isGlobalAdmin ? (keg?.brewery_id || '') : String(user?.brewery_id || ''),
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
        const requests = [
          axios.get('/api/users/', { headers: { Authorization: `Bearer ${token}` } })
        ];
        
        // Solo cargar breweries si es Global_Admin
        if (isGlobalAdmin) {
          requests.push(axios.get('/api/breweries/', { headers: { Authorization: `Bearer ${token}` } }));
        }
        
        const responses = await Promise.all(requests);
        setUsers(responses[0].data);
        
        if (isGlobalAdmin && responses[1]) {
          setBreweries(responses[1].data);
        }
      } catch {
        //
      }
    };
    fetchData();
  }, [token, isGlobalAdmin]);

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
      setError(t('Name is required'));
      return;
    }
    if (Number(form.current_content) > Number(form.capacity)) {
      setError(t('Current content cannot be greater than capacity'));
      return;
    }
    
    // Validar brewery_id
    let brewery_id = form.brewery_id;
    if (!isGlobalAdmin) {
      // Para admin, moderator y user, usar su brewery_id
      brewery_id = user?.brewery_id || '';
    }
    
    if (!brewery_id || brewery_id.trim() === '') {
      if (isGlobalAdmin) {
        setError(t('Please select a brewery'));
      } else {
        setError(t('Cannot determine brewery error'));
      }
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      let payload: any = { ...form };
      payload.brewery_id = brewery_id;
      
      // Convertir a número los campos numéricos
      payload.capacity = Number(payload.capacity);
      payload.current_content = Number(payload.current_content);

      if (keg && keg.id) {
        await axios.patch(`/api/kegs/${keg.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/kegs/', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setSuccess(keg ? t('Keg updated successfully') : t('Keg created successfully'));
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || t('Error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '0 auto', padding: 0 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}></Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <TextField label={t('Name')} name="name" value={form.name} onChange={handleInputChange} required fullWidth sx={{ mb: 2 }} />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('Type')}</InputLabel>
        <Select name="type" value={form.type} label={t('Type')} onChange={handleTypeChange} required>
          {kegTypes.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('Connector')}</InputLabel>
        <Select name="connector" value={form.connector} label={t('Connector')} onChange={handleSelectChange} required>
          {kegConnectors[form.type].map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </Select>
      </FormControl>
      <TextField label={t('Capacity L')} name="capacity" type="number" value={form.capacity} onChange={handleInputChange} required fullWidth sx={{ mb: 2 }} inputProps={{ min: 1 }} />
      <TextField label={t('Current content L')} name="current_content" type="number" value={form.current_content} onChange={handleInputChange} required fullWidth sx={{ mb: 2 }} inputProps={{ min: 0, max: form.capacity }} />
      <TextField label={t('Beer type')} name="beer_type" value={form.beer_type} onChange={handleInputChange} required fullWidth sx={{ mb: 2 }} />
      <TextField label={t('Location')} name="location" value={form.location} onChange={handleInputChange} fullWidth sx={{ mb: 2 }} />
      {isGlobalAdmin && (
        <Autocomplete
          options={breweries}
          getOptionLabel={(option) => option.name || ''}
          value={breweries.find(b => b.id === form.brewery_id) || null}
          onChange={(event, newValue) => {
            setForm({ ...form, brewery_id: newValue?.id || '' });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('Brewery')}
              placeholder={t('Search brewery')}
              required
              fullWidth
              sx={{ mb: 2 }}
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          noOptionsText={t('No breweries found')}
          loadingText={t('Loading breweries')}
        />
      )}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('State')}</InputLabel>
        <Select name="state" value={form.state} label={t('State')} onChange={handleSelectChange} required>
          {kegStates.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </Select>
      </FormControl>
      <Button type="submit" variant="contained" color="primary" fullWidth size="large" sx={{ mt: 2, fontWeight: 'bold', borderRadius: 2 }} disabled={loading}>
        {loading ? <CircularProgress size={22} color="inherit" /> : (keg ? t('Edit') : t('Create'))}
      </Button>
    </form>
  );
};

export default KegForm; 