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

  // Función para traducir roles
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'user': return t('User');
      case 'moderator': return t('Moderator');
      case 'admin': return t('Administrator');
      case 'global_admin': return t('Global administrator');
      default: return role;
    }
  };

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
    const targetUser = users.find(u => u.id === id);
    
    // SEGURIDAD: Verificar si es global_admin
    if (targetUser?.role === 'global_admin' && user?.role !== 'global_admin') {
      setErrorMsg(t('Cannot delete global admin'));
      return;
    }
    
    // SEGURIDAD: Impedir que global_admin se elimine a sí mismo
    if (targetUser?.id === user?.id && user?.role === 'global_admin') {
      setErrorMsg(t('Global admin cannot delete themselves'));
      return;
    }
    
    if (!window.confirm(t('Delete confirm'))) return;
    try {
      await axios.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(t('Deleted ok'));
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || t('Delete error'));
    }
  };

  const activateUser = async (id: number) => {
    const targetUser = users.find(u => u.id === id);
    
    // SEGURIDAD: Verificar si es global_admin
    if (targetUser?.role === 'global_admin' && user?.role !== 'global_admin') {
      setErrorMsg(t('Only global admin can modify global admin users'));
      return;
    }
    
    try {
      await axios.patch(`/api/users/${id}/activate/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(t('Activated ok'));
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Error al activar usuario');
    }
  };

  const deactivateUser = async (id: number) => {
    const targetUser = users.find(u => u.id === id);
    
    // SEGURIDAD: Verificar si es global_admin
    if (targetUser?.role === 'global_admin' && user?.role !== 'global_admin') {
      setErrorMsg(t('Only global admin can modify global admin users'));
      return;
    }
    
    // SEGURIDAD: Impedir que global_admin se desactive a sí mismo
    if (targetUser?.id === user?.id && user?.role === 'global_admin') {
      setErrorMsg(t('Global admin cannot deactivate themselves'));
      return;
    }
    
    try {
      await axios.patch(`/api/users/${id}/deactivate/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(t('Deactivated ok'));
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Error al desactivar usuario');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'email', headerName: t('Email'), flex: 1 },
    { field: 'role', headerName: t('Role'), width: 140, renderCell: (params) => getRoleLabel(params.value) },
    { field: 'brewery_id', headerName: t('Brewery'), width: 180, renderCell: (params) => {
      const brewery = breweries.find((b: any) => String(b.id) === String(params.value));
      return brewery ? brewery.name : params.value;
    } },
    { field: 'active', headerName: t('Active'), width: 100, type: 'boolean' },
    {
      field: 'actions',
      headerName: t('Actions'),
      width: 180,
      sortable: false,
      renderCell: (params) => {
        const isOwnBrewery = params.row.brewery_id === user?.brewery_id;
        const isTargetGlobalAdmin = params.row.role === 'global_admin';
        const canModifyTarget = isTargetGlobalAdmin ? isGlobalAdmin : true;
        const canDeleteTarget = isTargetGlobalAdmin ? isGlobalAdmin : true;
        const isSelfDelete = params.row.id === user?.id && user?.role === 'global_admin';
        
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(isGlobalAdmin || (isAdmin && isOwnBrewery) || (isModerator && isOwnBrewery)) && canModifyTarget && (
              <Fab size="small" color="primary" onClick={() => { setEditUser(params.row); setShowForm(true); }} title={t('Edit')}>
                <EditIcon />
              </Fab>
            )}
            {(isGlobalAdmin || (isAdmin && isOwnBrewery) || (isModerator && isOwnBrewery)) && canModifyTarget && !isSelfDelete && (
              <Fab size="small" color={params.row.active ? 'warning' : 'success'} onClick={() => params.row.active ? deactivateUser(params.row.id) : activateUser(params.row.id)} title={params.row.active ? t('Deactivate') : t('Activate')}>
                {params.row.active ? <BlockIcon /> : <CheckCircleIcon />}
              </Fab>
            )}
            {(isGlobalAdmin || (isAdmin && isOwnBrewery)) && canDeleteTarget && !isSelfDelete && (
              <Fab size="small" color="error" onClick={() => handleDelete(params.row.id)} title={t('Delete')}>
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
      <Typography variant="h4" gutterBottom>{t('Users')}</Typography>
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
        <DialogTitle>{editUser ? t('Edit user') : t('New user')}</DialogTitle>
        <DialogContent>
          <UserForm userEdit={editUser} onSuccess={() => { setShowForm(false); setEditUser(null); fetchUsers(); setSuccessMsg(t('Saved ok')); }} onCancel={() => { setShowForm(false); setEditUser(null); }} breweries={breweries} open={showForm} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowForm(false); setEditUser(null); }}>{t('Close')}</Button>
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