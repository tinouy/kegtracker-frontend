import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../hooks/useLang';
import KegForm from './KegForm';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Fab, Box, Snackbar, Alert, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

const KegList: React.FC = () => {
  const t = useLang();
  const { token, user } = useAuth();
  const [kegs, setKegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editKeg, setEditKeg] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const isGlobalAdmin = user && user.role === 'global_admin';
  const isAdmin = user && user.role === 'admin';
  const isModerator = user && user.role === 'moderator';

  const fetchKegs = async () => {
    setLoading(true);
    try {
      let res;
      if (user && user.role === 'global_admin') {
        res = await axios.get('/api/kegs/', { headers: { Authorization: `Bearer ${token}` } });
      } else if (user && user.brewery_id) {
        res = await axios.get('/api/kegs/', { headers: { Authorization: `Bearer ${token}` }, params: { brewery_id: user.brewery_id } });
      } else {
        res = { data: [] };
      }
      setKegs(res.data);
    } catch (err: any) {
      setError(t('Error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKegs();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('Confirm delete'))) return;
    try {
      await axios.delete(`/api/kegs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(t('Deleted successfully'));
      fetchKegs();
    } catch {
      setErrorMsg(t('Delete error'));
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: t('Name'), flex: 1 },
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
    { field: 'brewery_name', headerName: t('Brewery'), width: 180 },
    {
      field: 'actions',
      headerName: t('Actions'),
      width: 180,
      sortable: false,
      renderCell: (params) => {
        const isOwnBrewery = params.row.brewery_id === user?.brewery_id;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Fab size="small" color="info" onClick={() => navigate(`/keg/${params.row.id}`)} title={t('View detail')}>
              <VisibilityIcon />
            </Fab>
            <Fab size="small" color="primary" onClick={() => { setEditKeg(params.row); setShowForm(true); }} title={t('Edit')}>
              <EditIcon />
            </Fab>
            {(isGlobalAdmin || (isAdmin && isOwnBrewery)) && (
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
      <Typography variant="h4" gutterBottom>{t('Kegs')}</Typography>
      <DataGrid
        rows={kegs}
        columns={columns}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 20, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } }
        }}
        disableRowSelectionOnClick
        sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2 }}
        getRowId={row => row.id}
      />
      {(isGlobalAdmin || isAdmin || isModerator) && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1200 }}
          onClick={() => { setEditKeg(null); setShowForm(true); }}
        >
          <AddIcon />
        </Fab>
      )}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditKeg(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>{editKeg ? t('Edit keg') : t('Create keg')}</DialogTitle>
        <DialogContent>
          <KegForm keg={editKeg} onSuccess={() => { setShowForm(false); setEditKeg(null); fetchKegs(); setSuccessMsg(t('Saved successfully')); }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowForm(false); setEditKeg(null); }}>{t('Close')}</Button>
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

export default KegList; 