import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../hooks/useLang';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Stack,
  LinearProgress
} from '@mui/material';

import {
  LocalBar as LocalBarIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Inventory as InventoryIcon,
  LocalShipping as LocalShippingIcon,
  CleaningServices as CleaningServicesIcon,
  EventAvailable as EventAvailableIcon
} from '@mui/icons-material';

interface DashboardStats {
  totalKegs: number;
  activeKegs: number;
  emptyKegs: number;
  dirtyKegs: number;
  cleanKegs: number;
  readyKegs: number;
  totalUsers: number;
  totalBreweries: number;
  recentActivity: any[];
  kegStates: { state: string; count: number; percentage: number }[];
  topBreweries: { name: string; kegCount: number }[];
}

const Dashboard: React.FC = () => {
  const t = useLang();
  const { token, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let kegsRes, kegs, filteredKegs;
      if (user.role === 'user' || user.role === 'moderator') {
        kegsRes = await axios.get('/api/kegs/', { headers: { Authorization: `Bearer ${token}` }, params: { brewery_id: user.brewery_id } });
        kegs = kegsRes.data || [];
        filteredKegs = kegs;
        let usersCount = 0;
        if (user.role === 'moderator') {
          // Obtener usuarios de la cervecería
          const usersRes = await axios.get('/api/users/', { headers: { Authorization: `Bearer ${token}` } });
          const users = usersRes.data || [];
          usersCount = users.filter(u => u.brewery_id === user.brewery_id).length;
        }

        // Calcular estadísticas igual que en el else
        const totalKegs = filteredKegs.length;
        const activeKegs = filteredKegs.filter((k) => k.state === 'in_use').length;
        const emptyKegs = filteredKegs.filter((k) => k.state === 'empty').length;
        const dirtyKegs = filteredKegs.filter((k) => k.state === 'dirty').length;
        const cleanKegs = filteredKegs.filter((k) => k.state === 'clean').length;
        const readyKegs = filteredKegs.filter((k) => k.state === 'ready').length;

        const kegStates = [
          { state: 'in_use', count: activeKegs, percentage: totalKegs > 0 ? (activeKegs / totalKegs) * 100 : 0 },
          { state: 'empty', count: emptyKegs, percentage: totalKegs > 0 ? (emptyKegs / totalKegs) * 100 : 0 },
          { state: 'dirty', count: dirtyKegs, percentage: totalKegs > 0 ? (dirtyKegs / totalKegs) * 100 : 0 },
          { state: 'clean', count: cleanKegs, percentage: totalKegs > 0 ? (cleanKegs / totalKegs) * 100 : 0 },
          { state: 'ready', count: readyKegs, percentage: totalKegs > 0 ? (readyKegs / totalKegs) * 100 : 0 }
        ];

        const recentActivity = filteredKegs
          .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
          .slice(0, 10);

        setStats({
          totalKegs,
          activeKegs,
          emptyKegs,
          dirtyKegs,
          cleanKegs,
          readyKegs,
          totalUsers: usersCount,
          totalBreweries: 0,
          recentActivity,
          kegStates,
          topBreweries: []
        });
      } else {
        const [kegsR, usersRes, breweriesRes] = await Promise.all([
          axios.get('/api/kegs/', { headers: { Authorization: `Bearer ${token}` }, params: (user.role !== 'global_admin') ? { brewery_id: user.brewery_id } : {} }),
          axios.get('/api/users/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/breweries/', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        kegs = kegsR.data || [];
        const users = usersRes.data || [];
        const breweries = breweriesRes.data || [];
        filteredKegs = user.role === 'global_admin' ? kegs : kegs.filter((keg) => keg.brewery_id === user.brewery_id);

        // Calcular estadísticas
        const totalKegs = filteredKegs.length;
        const activeKegs = filteredKegs.filter((k) => k.state === 'in_use').length;
        const emptyKegs = filteredKegs.filter((k) => k.state === 'empty').length;
        const dirtyKegs = filteredKegs.filter((k) => k.state === 'dirty').length;
        const cleanKegs = filteredKegs.filter((k) => k.state === 'clean').length;
        const readyKegs = filteredKegs.filter((k) => k.state === 'ready').length;

        // Calcular porcentajes por estado
        const kegStates = [
          { state: 'in_use', count: activeKegs, percentage: totalKegs > 0 ? (activeKegs / totalKegs) * 100 : 0 },
          { state: 'empty', count: emptyKegs, percentage: totalKegs > 0 ? (emptyKegs / totalKegs) * 100 : 0 },
          { state: 'dirty', count: dirtyKegs, percentage: totalKegs > 0 ? (dirtyKegs / totalKegs) * 100 : 0 },
          { state: 'clean', count: cleanKegs, percentage: totalKegs > 0 ? (cleanKegs / totalKegs) * 100 : 0 },
          { state: 'ready', count: readyKegs, percentage: totalKegs > 0 ? (readyKegs / totalKegs) * 100 : 0 }
        ];

        // Top cervecerías por número de barriles
        const breweryKegCounts = filteredKegs.reduce((acc, keg) => {
          const brewery = breweries.find((b) => b.id === keg.brewery_id);
          if (brewery) {
            acc[brewery.name] = (acc[brewery.name] || 0) + 1;
          }
          return acc;
        }, {});

        const topBreweries = Object.entries(breweryKegCounts)
          .map(([name, count]) => ({ name, kegCount: count as number }))
          .sort((a, b) => b.kegCount - a.kegCount)
          .slice(0, 5);

        // Actividad reciente (últimos 10 barriles)
        const recentActivity = filteredKegs
          .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
          .slice(0, 10);

        setStats({
          totalKegs,
          activeKegs,
          emptyKegs,
          dirtyKegs,
          cleanKegs,
          readyKegs,
          totalUsers: users.length,
          totalBreweries: user.role === 'global_admin' ? breweries.length : 1,
          recentActivity,
          kegStates,
          topBreweries
        });
      }
    } catch (err: any) {
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
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

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'in_use': return <LocalBarIcon />;
      case 'empty': return <InventoryIcon />;
      case 'dirty': return <CleaningServicesIcon />;
      case 'clean': return <CheckCircleIcon />;
      case 'ready': return <EventAvailableIcon />;
      default: return <InfoIcon />;
    }
  };

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

  if (!stats) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" display="flex" alignItems="center" gap={1}>
          <TrendingUpIcon />
          Dashboard
        </Typography>
        {user.role === 'user' && (
          <Typography variant="h6" color="text.secondary" sx={{ ml: 2 }}>
            {t('brewery') || 'Cervecería'}: {user.brewery_name || t('no_brewery') || 'Sin asignar'}
          </Typography>
        )}
        <Tooltip title="Actualizar datos">
          <IconButton onClick={fetchDashboardData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Estadísticas principales */}
      {/* El render debe mostrar siempre las tarjetas de stats, distribución y actividad reciente, aunque el total sea 0 */}
      {/* Solo ocultar Usuarios, Cervecerías y Top Cervecerías para user.role === 'user' */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Barriles
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalKegs}
                  </Typography>
                </Box>
                <LocalBarIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    En Uso
                  </Typography>
                  <Typography variant="h4" component="div" color="primary">
                    {stats.activeKegs}
                  </Typography>
                </Box>
                <LocalBarIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
        {/* Solo para moderador */}
        {user.role === 'moderator' && (
          <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Usuarios
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.totalUsers}
                    </Typography>
                  </Box>
                  <GroupIcon color="secondary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
        {/* Solo para roles con privilegios altos */}
        {user.role !== 'user' && user.role !== 'moderator' && (
          <>
            <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Usuarios
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stats.totalUsers}
                      </Typography>
                    </Box>
                    <GroupIcon color="secondary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Cervecerías
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stats.totalBreweries}
                      </Typography>
                    </Box>
                    <BusinessIcon color="success" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </>
        )}
      </Box>

      {/* Distribución de estados */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
        <Box sx={{ flex: '1 1 400px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <InventoryIcon />
                Distribución por Estado
              </Typography>
              <Stack spacing={2}>
                {stats.kegStates.map((item) => (
                  <Box key={item.state}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStateIcon(item.state)}
                        <Typography variant="body2">
                          {getStateLabel(item.state)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={item.percentage}
                      color={getStateColor(item.state) as any}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Actividad reciente */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <TrendingUpIcon />
              Actividad Reciente
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {stats.recentActivity.map((keg: any) => (
                <Box sx={{ flex: '1 1 300px', minWidth: 300 }} key={keg.id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        label={getStateLabel(keg.state)}
                        color={getStateColor(keg.state)}
                        size="small"
                        icon={getStateIcon(keg.state)}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {keg.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {keg.type} • ID: {keg.id}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Top cervecerías solo para global_admin */}
      {user.role === 'global_admin' && (
        <Box sx={{ flex: '1 1 400px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <BusinessIcon />
                Top Cervecerías
              </Typography>
              <Stack spacing={2}>
                {stats.topBreweries.map((brewery, index) => (
                  <Box key={brewery.name} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        color={index === 0 ? 'primary' : 'default'}
                      />
                      <Typography variant="body2">
                        {brewery.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {brewery.kegCount} barriles
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard; 