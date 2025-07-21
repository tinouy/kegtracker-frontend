/// <reference types="vite/client" />
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../hooks/useLang';
import KegForm from './KegForm';
import QRCode from 'qrcode.react';
import jsPDF from 'jspdf';
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
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import UserForm from '../components/UserForm';
import {
  Inventory as InventoryIcon,
  LocalBar as LocalBarIcon,
  FilterList as FilterListIcon,
  Download as DownloadIconMaterial,
  LocalDrink as LocalDrinkIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const kegStates = [
  { value: 'in_use', label: 'En uso' },
  { value: 'empty', label: 'Vacío' },
  { value: 'dirty', label: 'Sucio' },
  { value: 'clean', label: 'Limpio' },
  { value: 'ready', label: 'Pronto para usar' }
];

const KegDetail: React.FC = () => {
  const t = useLang();
  const { token, user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [keg, setKeg] = useState<any>(null);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stateLoading, setStateLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [breweries, setBreweries] = useState<any[]>([]);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchKeg = async () => {
      try {
        const res = await axios.get(`/api/kegs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setKeg(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Error');
      } finally {
        setLoading(false);
      }
    };
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users/', { headers: { Authorization: `Bearer ${token}` } });
        setUsers(res.data);
      } catch {}
    };
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/api/kegs/${id}/history`, { headers: { Authorization: `Bearer ${token}` } });
        setHistory(res.data);
      } catch {}
    };
    const fetchBreweries = async () => {
      if (!user || user.role === 'user') return;
      try {
        const res = await axios.get('/api/breweries/', { headers: { Authorization: `Bearer ${token}` } });
        setBreweries(res.data);
      } catch {}
    };
    fetchKeg();
    fetchUsers();
    fetchHistory();
    fetchBreweries();
  }, [id, token]);

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStateLoading(true);
    try {
      await axios.patch(`/api/kegs/${id}`, { ...keg, state: e.target.value }, { headers: { Authorization: `Bearer ${token}` } });
      setKeg({ ...keg, state: e.target.value });
    } catch {
      //
    } finally {
      setStateLoading(false);
    }
  };

  const handleUserChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserLoading(true);
    try {
      await axios.patch(`/api/kegs/${id}`, { ...keg, user_id: e.target.value || null }, { headers: { Authorization: `Bearer ${token}` } });
      setKeg({ ...keg, user_id: e.target.value });
    } catch {
      //
    } finally {
      setUserLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const qrCanvas = qrRef.current?.querySelector('canvas');
    if (qrCanvas) {
      const imgData = qrCanvas.toDataURL('image/png');
      doc.text(`Keg: ${keg.name}`, 10, 10);
      doc.addImage(imgData, 'PNG', 10, 20, 50, 50);
      doc.save(`keg_${keg.id}_qr.pdf`);
    }
  };

  const getBreweryName = (breweryId: string) => {
    if (user && user.role === 'user') return user.brewery_name || user.brewery_id || 'Sin asignar';
    const brewery = breweries.find((b: any) => String(b.id) === String(breweryId));
    return brewery ? brewery.name : breweryId || 'Sin asignar';
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>;
  if (error || !keg) return <Box color="red" textAlign="center" py={4}>{error || 'Not found'}</Box>;

  const canEdit = user && (
    user.role === 'global_admin' ||
    user.role === 'admin' ||
    user.role === 'moderator' ||
    (user.role === 'user' && keg && keg.brewery_id === user.brewery_id)
  );

  const frontendUrl = import.meta.env.FRONTEND_FQDN || window.location.origin;
  const qrValue = `${frontendUrl}/keg/${String(keg.id)}`;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h5" fontWeight="bold">{t('keg_details') || 'Detalle de Barril'}</Typography>
            <Tooltip title={t('back') || 'Volver'}><IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton></Tooltip>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip label={kegStates.find(s => s.value === keg.state)?.label || keg.state} color="primary" sx={{ fontSize: 16, px: 2, py: 1 }} />
              <Typography variant="h5" fontWeight="bold">{keg.name}</Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={1} bgcolor="#f5f5f5" px={2} py={1} borderRadius={2} minWidth={140}>
                <InventoryIcon color="info" />
                <Typography fontWeight={500}>{t('type') || 'Tipo'}:</Typography>
                <Typography>{keg.type}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} bgcolor="#f5f5f5" px={2} py={1} borderRadius={2} minWidth={140}>
                <LocalBarIcon color="secondary" />
                <Typography fontWeight={500}>{t('connector') || 'Conector'}:</Typography>
                <Typography>{keg.connector}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} bgcolor="#f5f5f5" px={2} py={1} borderRadius={2} minWidth={140}>
                <FilterListIcon color="success" />
                <Typography fontWeight={500}>{t('capacity') || 'Capacidad'}:</Typography>
                <Typography>{keg.capacity} L</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} bgcolor="#f5f5f5" px={2} py={1} borderRadius={2} minWidth={140}>
                <DownloadIcon color="action" />
                <Typography fontWeight={500}>{t('current_content') || 'Contenido actual'}:</Typography>
                <Typography>{keg.current_content} L</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} bgcolor="#f5f5f5" px={2} py={1} borderRadius={2} minWidth={180}>
                <LocalDrinkIcon color="primary" />
                <Typography fontWeight={500}>{t('beer_type') || 'Tipo de cerveza'}:</Typography>
                <Typography>{keg.beer_type}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} bgcolor="#f5f5f5" px={2} py={1} borderRadius={2} minWidth={180}>
                <BusinessIcon color="warning" />
                <Typography fontWeight={500}>{t('brewery') || 'Cervecería'}:</Typography>
                <Typography>{getBreweryName(keg.brewery_id)}</Typography>
              </Box>
              {keg.user_email && (
                <Box display="flex" alignItems="center" gap={1} bgcolor="#f5f5f5" px={2} py={1} borderRadius={2} minWidth={180}>
                  <PersonIcon color="info" />
                  <Typography fontWeight={500}>{t('user') || 'Usuario'}:</Typography>
                  <Typography>{keg.user_email}</Typography>
                </Box>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Box ref={qrRef}><QRCode value={qrValue} size={96} /></Box>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadPDF}>{t('download_qr_pdf') || 'Descargar QR en PDF'}</Button>
            </Box>
            {canEdit && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                fullWidth
                sx={{ mt: 2, fontWeight: 'bold', fontSize: 18 }}
                onClick={() => setEdit(true)}
              >
                {t('edit') || 'Editar'}
              </Button>
            )}
          </Stack>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>{t('state_history') || 'Historial de estados'}</Typography>
          <Stack spacing={1}>
            {history.length === 0 && <Typography color="text.secondary">Sin historial</Typography>}
            {history.map((h, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1}>
                <Typography variant="caption">{h.changed_at}:</Typography>
                <Chip size="small" label={h.old_state} />
                <span>→</span>
                <Chip size="small" label={h.new_state} color="primary" />
                {h.user_email && (
                  <Typography variant="caption">({h.user_email})</Typography>
                )}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
      {(canEdit && edit) && (
        <Dialog open={edit} onClose={() => setEdit(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{t('edit_keg') || 'Editar barril'}</DialogTitle>
          <DialogContent>
            <KegForm keg={keg} onSuccess={() => { setEdit(false); navigate(0); }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEdit(false)}>{t('close') || 'Cerrar'}</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default KegDetail; 