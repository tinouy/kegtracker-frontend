import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../hooks/useLang';
import UserForm from '../components/UserForm';
import KegForm from './KegForm';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Fab, Box, Snackbar, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Tooltip, IconButton } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
/* import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete'; */
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import { useParams } from 'react-router-dom';

interface Brewery {
  id: number;
  name: string;
}

const BreweryAdmin: React.FC = () => {
  const t = useLang();
  const { token, user } = useAuth();
  const { breweryId } = useParams();
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [breweries, setBreweries] = useState<Brewery[]>([]);
  const [breweryFilter, setBreweryFilter] = useState('');
  const [selectedBrewery, setSelectedBrewery] = useState<Brewery | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [kegs, setKegs] = useState<any[]>([]);
  const [userForm, setUserForm] = useState<any>(null);
  const [editKeg, setEditKeg] = useState<any>(null);
  const [refresh, setRefresh] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  // Cargar cervecerías si global_admin o admin
  useEffect(() => {
    if (user.role === 'global_admin' || user.role === 'admin') {
      axios.get('/api/breweries/', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setBreweries(res.data))
        .catch(() => setBreweries([]));
    }
  }, [token, user.role]);

  // Seleccionar automáticamente la cervecería del usuario si no es global_admin ni admin
  useEffect(() => {
    if (breweryId) {
      // Buscar la cervecería por ID
      axios.get(`/api/breweries/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const found = res.data.find((b: any) => String(b.id) === String(breweryId));
          if (found) setSelectedBrewery(found);
        })
        .catch(() => setSelectedBrewery(null));
    } else if (user.role === 'moderator' || user.role === 'user') {
      setSelectedBrewery({ id: String(user.brewery_id), name: user.brewery_name || '' });
    }
  }, [breweryId, token, user]);

  // Cargar usuarios y barriles de la cervecería seleccionada
  useEffect(() => {
    if (selectedBrewery) {
      axios.get('/api/users/', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUsers(res.data.filter((u: any) => String(u.brewery_id) === String(selectedBrewery.id))))
        .catch(() => setUsers([]));
      axios.get('/api/kegs/', { headers: { Authorization: `Bearer ${token}` }, params: { brewery_id: selectedBrewery.id } })
        .then(res => setKegs(res.data))
        .catch(() => setKegs([]));
    }
  }, [selectedBrewery, token, refresh]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (!selectedBrewery) throw new Error('Debes seleccionar una cervecería');
      await axios.post('/api/invite/generate', { email, brewery_id: selectedBrewery.id }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(t('invite_sent') || 'Invitación enviada');
      setEmail('');
      setTimeout(() => {
        setShowInvite(false);
        setSuccessMsg('');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  // CRUD de usuarios
  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('¿Seguro que quieres eliminar este usuario?')) return;
    await axios.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setRefresh(r => r + 1);
  };

  // CRUD de barriles
  const handleDeleteKeg = async (id: number) => {
    if (!window.confirm('¿Seguro que quieres eliminar este barril?')) return;
    await axios.delete(`/api/kegs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setRefresh(r => r + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditKeg(null);
  };
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditKeg(null);
    setRefresh(r => r + 1);
  };

  // Eliminar el Autocomplete y el filtro de cervecerías del render

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2, position: 'relative' }}>
      <Typography variant="h4" gutterBottom>{selectedBrewery ? selectedBrewery.name : t('Manage brewery')}</Typography>
      {selectedBrewery && (
        <>
          {/* Usuarios */}
          <Box mb={6}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="h6" gutterBottom>{t('Users')}</Typography>
              <Button variant="contained" color="primary" startIcon={<PersonAddIcon />} onClick={() => setShowInvite(true)}>
                {t('Invite user')}
              </Button>
            </Box>
            <DataGrid
              rows={users}
              columns={[
                { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
                { field: 'role', headerName: t('Role'), width: 140 },
                {
                  field: 'actions',
                  headerName: t('actions') || 'Acciones',
                  width: 120,
                  sortable: false,
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minHeight: 56 }}>
                      <Fab size="small" color="primary" onClick={() => setUserForm(params.row)} title={t('Edit')}><EditIcon /></Fab>
                      <Fab size="small" color="error" onClick={() => handleDeleteUser(params.row.id)} title={t('Delete')}><DeleteIcon /></Fab>
                    </Box>
                  ),
                },
              ]}
              autoHeight
              pageSizeOptions={[10, 20, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
              sx={{ background: '#fff', borderRadius: 2, boxShadow: 2 }}
              getRowId={row => row.id}
            />
          </Box>
          {/* Barriles */}
          <Box mb={6}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="h6" gutterBottom>{t('Kegs')}</Typography>
              <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setEditKeg({ brewery_id: selectedBrewery.id }); setShowForm(true); }}>
                {t('Add keg')}
              </Button>
            </Box>
            <DataGrid
              rows={kegs}
              columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                              { field: 'name', headerName: t('Name'), flex: 1, minWidth: 180 },
              { field: 'type', headerName: t('Type'), width: 120, renderCell: (params) => {
                switch (params.value) {
                  case 'keg': return t('Keg');
                  case 'corni': return t('Corni');
                  default: return params.value;
                }
              } },
                              { field: 'state', headerName: t('State'), width: 120, renderCell: (params) => {
                  switch (params.value) {
                    case 'in_use': return t('In use');
                    case 'empty': return t('Empty');
                    case 'dirty': return t('Dirty');
                    case 'clean': return t('Clean');
                    case 'ready': return t('Ready');
                    default: return params.value;
                  }
                } },
                {
                  field: 'actions',
                                  headerName: t('Actions'),
                width: 120,
                sortable: false,
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minHeight: 56 }}>
                    <Fab size="small" color="primary" onClick={() => { setEditKeg(params.row); setShowForm(true); }} title={t('Edit')}><EditIcon /></Fab>
                    <Fab size="small" color="error" onClick={() => handleDeleteKeg(params.row.id)} title={t('Delete')}><DeleteIcon /></Fab>
                    </Box>
                  ),
                },
              ]}
              autoHeight
              pageSizeOptions={[10, 20, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
              sx={{ background: '#fff', borderRadius: 2, boxShadow: 2 }}
              getRowId={row => row.id}
            />
          </Box>
          {/* Modal de invitación de usuario */}
          <Dialog open={showInvite} onClose={() => setShowInvite(false)} maxWidth="xs" fullWidth>
            <DialogTitle>{t('Invite user by email')}</DialogTitle>
            <form onSubmit={handleInvite}>
              <DialogContent>
                <TextField
                  type="email"
                  label={t('Invite user by email')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  fullWidth
                  sx={{ mb: 2 }}
                />
                {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
                {successMsg && <Alert severity="success">{successMsg}</Alert>}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowInvite(false)}>{t('Close')}</Button>
                <Button type="submit" variant="contained" color="primary" disabled={loading || !email}>{loading ? t('Loading') : t('Send invite')}</Button>
              </DialogActions>
            </form>
          </Dialog>
          {/* Modales y feedback */}
          <UserForm 
            userEdit={userForm && typeof userForm === 'object' ? userForm : null}
            onSuccess={() => { 
              setUserForm(null); 
              setRefresh(r => r + 1); 
              setSuccessMsg(t('Saved ok')); 
            }} 
            onCancel={() => setUserForm(null)}
            breweries={breweries.length ? breweries : selectedBrewery ? [selectedBrewery] : []}
            open={!!userForm}
          />
          {/* Modal de formulario de Barriles */}
          <Dialog open={showForm} onClose={handleFormCancel} maxWidth="xs" fullWidth>
            <DialogTitle>{editKeg ? 'Editar barril' : 'Crear barril'}</DialogTitle>
            <DialogContent>
              <KegForm keg={editKeg} onSuccess={handleFormSuccess} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleFormCancel}>{t('Close')}</Button>
            </DialogActions>
          </Dialog>

          {/* {/* Modal de formulario (unificado para agregar y editar): 
          <Dialog open={showForm} onClose={handleFormCancel} maxWidth="xs" fullWidth>
            <DialogTitle>{editKeg ? 'Editar Keg' : 'Crear Keg'}</DialogTitle>
            <DialogContent>
              <KegForm keg={editKeg} onSuccess={handleFormSuccess} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleFormCancel}>{t('Close')}</Button>
            </DialogActions>
          </Dialog> */}

          <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>{successMsg}</Alert>
          </Snackbar>
          <Snackbar open={!!errorMsg} autoHideDuration={3000} onClose={() => setErrorMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert onClose={() => setErrorMsg('')} severity="error" sx={{ width: '100%' }}>{errorMsg}</Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
};

export default BreweryAdmin; 