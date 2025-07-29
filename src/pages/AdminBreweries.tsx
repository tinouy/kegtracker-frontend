import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../hooks/useLang';
import { DataGrid } from '@mui/x-data-grid';
import { Fab, Box, Snackbar, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';

const BreweryForm = ({ brewery, onSuccess }: { brewery?: any; onSuccess: () => void }) => {
  const t = useLang();
  const { token } = useAuth();
  const [name, setName] = useState(brewery?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (brewery) {
        await axios.patch(`/api/breweries/${brewery.id}`, { name }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/breweries/', { name }, { headers: { Authorization: `Bearer ${token}` } });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <TextField
                  label={t('Name') || 'Nombre'}
        value={name}
        onChange={e => setName(e.target.value)}
        required
        fullWidth
        sx={{ minWidth: 0, width: '100%' }}
      />
      <Button type="submit" variant="contained" color="primary" disabled={loading}>
                  {loading ? t('Loading') : brewery ? t('Edit') || 'Editar' : t('Create') || 'Crear'}
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
    </form>
  );
};

const AdminBreweries: React.FC = () => {
  const t = useLang();
  const { token, user } = useAuth();
  const [breweries, setBreweries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBrewery, setEditBrewery] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const fetchBreweries = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/breweries/', { headers: { Authorization: `Bearer ${token}` } });
      setBreweries(res.data);
    } catch {
      setErrorMsg('Error al cargar cervecerías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreweries();
    // eslint-disable-next-line
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirm_delete') || '¿Seguro que quieres eliminar esta cervecería?')) return;
    try {
      await axios.delete(`/api/breweries/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(t('deleted_ok') || 'Cervecería eliminada');
      fetchBreweries();
    } catch {
      setErrorMsg('Error al eliminar');
    }
  };

  if (!user || user.role !== 'global_admin') return <Box textAlign="center" py={8}>{t('no_access') || 'Sin acceso'}</Box>;
  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2, position: 'relative' }}>
      <Typography variant="h4" gutterBottom>{t('Breweries') || 'Cervecerías'}</Typography>
      <DataGrid
        rows={breweries}
        columns={[
          { field: 'id', headerName: 'ID', width: 80 },
                  { field: 'name', headerName: t('Name') || 'Nombre', flex: 1 },
        { field: 'active', headerName: t('Active') || 'Activa', width: 100, renderCell: (params) => params.value ? '✔️' : '❌' },
          {
            field: 'actions',
            width: 220,
            headerName: t('Actions') || 'Acciones',
            sortable: false,
            renderCell: (params) => (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minHeight: 56 }}>
                <Fab size="small" color="primary" onClick={() => { setEditBrewery(params.row); setShowForm(true); }} title={t('Edit') || 'Editar'}><EditIcon /></Fab>
                <Fab size="small" color="error" onClick={() => handleDelete(params.row.id)} title={t('Delete') || 'Eliminar'}><DeleteIcon /></Fab>
                <Tooltip title={t('Manage brewery') || 'Gestionar cervecería'} arrow>
                  <Fab size="small" color="info" onClick={() => navigate(`/admin/breweries/${params.row.id}`)}><BusinessIcon /></Fab>
                </Tooltip>
              </Box>
            ),
          },
        ]}
        autoHeight
        pageSizeOptions={[10, 20, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2 }}
        getRowId={row => row.id}
      />
      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1200 }} onClick={() => { setEditBrewery(null); setShowForm(true); }}>
        <AddIcon />
      </Fab>
      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditBrewery(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>{editBrewery ? t('Edit') || 'Editar cervecería' : t('Create') || 'Crear cervecería'}</DialogTitle>
        <DialogContent>
          <BreweryForm brewery={editBrewery} onSuccess={() => { setShowForm(false); setEditBrewery(null); fetchBreweries(); setSuccessMsg(t('saved_ok') || 'Guardado'); }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowForm(false); setEditBrewery(null); }}>{t('Close') || 'Cerrar'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>{successMsg}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMsg} autoHideDuration={3000} onClose={() => setErrorMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setErrorMsg('')} severity="error" sx={{ width: '100%' }}>{errorMsg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminBreweries; 