import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../hooks/useLang';
import KegForm from './KegForm';
import {
  Box,
  Typography,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Toolbar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowSelectionModel,
  GridToolbarContainer
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  LocalBar as LocalBarIcon,
  Inventory as InventoryIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

const kegStates = [
  { value: '', label: 'Todos' },
  { value: 'in_use', label: 'En uso' },
  { value: 'empty', label: 'Vacío' },
  { value: 'dirty', label: 'Sucio' },
  { value: 'clean', label: 'Limpio' },
  { value: 'ready', label: 'Pronto para usar' }
];

const kegTypes = [
  { value: '', label: 'Todos' },
  { value: 'keg', label: 'Keg' },
  { value: 'corni', label: 'Corni' }
];

function toCSV(rows: any[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')].concat(
    rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  );
  return csv.join('\n');
}

const AdminKegs: React.FC = () => {
  const t = useLang();
  const { token, user } = useAuth();
  const [kegs, setKegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [breweries, setBreweries] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    state: '',
    type: '',
    user_id: '',
    brewery_id: '',
    search: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [editKeg, setEditKeg] = useState<any>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kegsRes, usersRes, breweriesRes] = await Promise.all([
        axios.get('/api/kegs/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/users/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/breweries/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setKegs(kegsRes.data);
      setUsers(usersRes.data);
      setBreweries(breweriesRes.data);
    } catch (err: any) {
      setError('Error al cargar los datos');
      showSnackbar('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const deleteKeg = async (id: number) => {
    try {
      await axios.delete(`/api/kegs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setKegs(kegs => kegs.filter(k => k.id !== id));
      showSnackbar('Barril eliminado correctamente');
    } catch (err) {
      showSnackbar('Error al eliminar barril', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;

    try {
      await Promise.all(selected.map((id: any) => 
        axios.delete(`/api/kegs/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      ));
      setKegs(kegs => kegs.filter(k => !selected.includes(k.id)));
      setSelected([]);
      showSnackbar(`${selected.length} barriles eliminados correctamente`);
    } catch (err) {
      showSnackbar('Error al eliminar barriles', 'error');
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      state: '',
      type: '',
      user_id: '',
      brewery_id: '',
      search: ''
    });
  };

  const handleExportCSV = () => {
    const csv = toCSV(kegs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'barriles.csv';
    a.click();
    URL.revokeObjectURL(url);
    showSnackbar('CSV exportado correctamente');
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditKeg(null);
    fetchData();
    showSnackbar(editKeg ? 'Barril actualizado correctamente' : 'Barril creado correctamente');
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditKeg(null);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'in_use': return 'primary';
      case 'empty': return 'default';
      case 'dirty': return 'warning';
      case 'clean': return 'info';
      case 'ready': return 'success';
      default: return 'default';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'in_use': return 'En uso';
      case 'empty': return 'Vacío';
      case 'dirty': return 'Sucio';
      case 'clean': return 'Limpio';
      case 'ready': return 'Pronto';
      default: return state;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'keg': return 'Keg';
      case 'corni': return 'Corni';
      default: return type;
    }
  };

  const getBreweryName = (breweryId: string) => {
    const brewery = breweries.find(b => b.id === breweryId);
    return brewery ? brewery.name : 'Sin asignar';
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : 'Sin asignar';
  };

  // Filtrar kegs basado en los filtros aplicados
  const filteredKegs = kegs.filter(keg => {
    if (filters.state && keg.state !== filters.state) return false;
    if (filters.type && keg.type !== filters.type) return false;
    if (filters.user_id && keg.user_id !== filters.user_id) return false;
    if (filters.brewery_id && keg.brewery_id !== filters.brewery_id) return false;
    if (filters.search && !keg.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      type: 'number'
    },
    {
      field: 'name',
      headerName: 'Nombre',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <LocalBarIcon fontSize="small" />
          {params.value}
        </Box>
      )
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getTypeLabel(params.value)}
          size="small"
          variant="outlined"
          icon={<InventoryIcon />}
        />
      )
    },
    {
      field: 'state',
      headerName: t('state') || 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip label={getStateLabel(params.value)} color={getStateColor(params.value)} size="small" />
      )
    },
    {
      field: 'brewery_id',
      headerName: 'Cervecería',
      width: 200,
      renderCell: (params) => getBreweryName(params.value)
    },
    {
      field: 'user_id',
      headerName: 'Usuario',
      width: 200,
      renderCell: (params) => getUserEmail(params.value)
    },
    {
      field: 'actions',
      headerName: t('actions') || 'Acciones',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => {
        const canEdit = user && (
          user.role === 'global_admin' ||
          user.role === 'admin' ||
          user.role === 'moderator' ||
          (user.role === 'user' && params.row.brewery_id === user.brewery_id)
        );
        return (
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} width="100%" height="100%">
            <Tooltip title="Ver" arrow>
              <IconButton size="small" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32 }} onClick={() => {/* lógica de ver barril */}}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEdit && (
              <Tooltip title="Editar" arrow>
                <IconButton size="small" color="primary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32 }} onClick={() => { setEditKeg(params.row); setShowForm(true); }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Eliminar" arrow>
              <IconButton size="small" color="error" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32 }} onClick={() => deleteKeg(params.row.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      }
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Card>
        <CardContent>
          <Toolbar sx={{ justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">{t('kegs') || 'Barriles'}</Typography>
            <Tooltip title="Agregar barril" arrow>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => { setEditKeg(null); setShowForm(true); }}
                sx={{ borderRadius: 2, fontWeight: 'bold' }}
              >
                {t('add_keg') || 'Agregar'}
              </Button>
            </Tooltip>
          </Toolbar>

          {/* Filtros */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <FilterListIcon />
                <Typography variant="h6">Filtros</Typography>
              </Box>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <TextField
                  label="Buscar por nombre"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  size="small"
                  sx={{ minWidth: 200 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.state}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                    label="Estado"
                  >
                    {kegStates.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    label="Tipo"
                  >
                    {kegTypes.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Usuario</InputLabel>
                  <Select
                    value={filters.user_id}
                    onChange={(e) => handleFilterChange('user_id', e.target.value)}
                    label="Usuario"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Cervecería</InputLabel>
                  <Select
                    value={filters.brewery_id}
                    onChange={(e) => handleFilterChange('brewery_id', e.target.value)}
                    label="Cervecería"
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {breweries.map(brewery => (
                      <MenuItem key={brewery.id} value={brewery.id}>
                        {brewery.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  size="small"
                >
                  Limpiar
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Toolbar para acciones masivas */}
          {selected.length > 0 && (
            <Toolbar sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {selected.length} barril(es) seleccionado(s)
              </Typography>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={handleBulkDelete}
                startIcon={<DeleteIcon />}
              >
                Eliminar
              </Button>
            </Toolbar>
          )}

          {/* DataGrid */}
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredKegs}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              checkboxSelection
              onRowSelectionModelChange={(newSelection) => setSelected(newSelection as unknown as number[])}
              rowSelectionModel={selected as any}
              disableRowSelectionOnClick
              slots={{
                toolbar: GridToolbarContainer,
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: false, // Ya tenemos filtros personalizados
                },
              }}
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* FAB para crear nuevo barril */}
      <Fab
        color="primary"
        aria-label="Nuevo barril"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          setEditKeg(null);
          setShowForm(true);
        }}
      >
        <AddIcon />
      </Fab>

      {/* Modal de formulario (unificado para agregar y editar): */}
      <Dialog open={showForm} onClose={handleFormCancel} maxWidth="xs" fullWidth>
        <DialogTitle>{editKeg ? t('edit_keg') || 'Editar barril' : t('create_keg') || 'Crear barril'}</DialogTitle>
        <DialogContent>
          <KegForm keg={editKeg} onSuccess={handleFormSuccess} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormCancel}>{t('close') || 'Cerrar'}</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminKegs; 