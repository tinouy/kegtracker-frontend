import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../hooks/useLang';
import UserForm from '../components/UserForm';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Fab, Box, Snackbar, Alert, Typography, Tooltip, IconButton, Button } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const AdminUsers: React.FC = () => {
  const t = useLang();
  const { token, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [breweries, setBreweries] = useState<any[]>([]);
  const navigate = useNavigate();

  const isGlobalAdmin = user && user.role === 'global_admin';
  const isAdmin = user && user.role === 'admin';
  const isModerator = user && user.role === 'moderator';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [usersRes, breweriesRes] = await Promise.all([
        axios.get('/api/users/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/breweries/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      let users = usersRes.data; // IDs como string
      if (!isGlobalAdmin) {
        users = users.filter((u: any) => u.brewery_id === user.brewery_id);
      }
      setUsers(users);
      setBreweries(breweriesRes.data);
    } catch (err: any) {
      setError('Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('confirm_delete') || '¿Seguro que quieres eliminar este usuario?')) return;
    try {
      await axios.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(t('deleted_ok') || 'Usuario eliminado');
      fetchUsers();
    } catch {
      setErrorMsg('Error al eliminar');
    }
  };

  const activateUser = async (id: number) => {
    try {
      await axios.patch(`/api/users/${id}/activate/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(t('activated_ok') || 'Usuario activado');
      fetchUsers();
    } catch {
      setErrorMsg('Error al activar usuario');
    }
  };

  const deactivateUser = async (id: number) => {
    try {
      await axios.patch(`/api/users/${id}/deactivate/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(t('deactivated_ok') || 'Usuario desactivado');
      fetchUsers();
    } catch {
      setErrorMsg('Error al desactivar usuario');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'email', headerName: t('email') || 'Email', flex: 1 },
    { field: 'role', headerName: t('role') || 'Rol', width: 140 },
    { field: 'brewery_id', headerName: t('brewery') || 'Cervecería', width: 180, renderCell: (params) => {
      const brewery = breweries.find((b: any) => String(b.id) === String(params.value));
      return brewery ? brewery.name : params.value;
    } },
    { field: 'active', headerName: t('active') || 'Activo', width: 100, type: 'boolean' },
    {
      field: 'actions',
      headerName: t('actions') || 'Acciones',
      width: 180,
      sortable: false,
      renderCell: (params) => {
        const isOwnBrewery = params.row.brewery_id === user?.brewery_id;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(isGlobalAdmin || (isAdmin && isOwnBrewery) || (isModerator && isOwnBrewery)) && (
              <Fab size="small" color="primary" onClick={() => { setEditUser(params.row); setShowForm(true); }} title={t('edit') || 'Editar'}>
                <EditIcon />
              </Fab>
            )}
            {(isGlobalAdmin || (isAdmin && isOwnBrewery) || (isModerator && isOwnBrewery)) && (
              <Fab size="small" color={params.row.active ? 'warning' : 'success'} onClick={() => params.row.active ? deactivateUser(params.row.id) : activateUser(params.row.id)} title={params.row.active ? t('deactivate') || 'Desactivar' : t('activate') || 'Activar'}>
                {params.row.active ? <BlockIcon /> : <CheckCircleIcon />}
              </Fab>
            )}
            {(isGlobalAdmin || (isAdmin && isOwnBrewery)) && (
              <Fab size="small" color="error" onClick={() => handleDelete(params.row.id)} title={t('delete') || 'Eliminar'}>
                <DeleteIcon />
              </Fab>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2, position: 'relative' }}>
      <Typography variant="h4" gutterBottom>{t('users') || 'Usuarios'}</Typography>
      <DataGrid
        rows={users}
        columns={columns}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 20, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } }
        }}
        disableRowSelectionOnClick
        sx={{ background: '#fff', borderRadius: 2, boxShadow: 2 }}
        getRowId={row => row.id}
      />
      {isGlobalAdmin && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1200 }}
          onClick={() => { setEditUser(null); setShowForm(true); }}
        >
          <AddIcon />
        </Fab>
      )}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditUser(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>{editUser ? t('edit') || 'Editar usuario' : t('create') || 'Crear usuario'}</DialogTitle>
        <DialogContent>
          <UserForm userEdit={editUser} onSuccess={() => { setShowForm(false); setEditUser(null); fetchUsers(); setSuccessMsg(t('saved_ok') || 'Guardado'); }} onCancel={() => { setShowForm(false); setEditUser(null); }} breweries={breweries} open={showForm} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowForm(false); setEditUser(null); }}>{t('close') || 'Cerrar'}</Button>
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

export default AdminUsers; 