import { useTheme as useKegTheme } from '../context/ThemeContext';

// Hook personalizado para evitar conflictos con useTheme de Material-UI
export const useAppTheme = () => {
  return useKegTheme();
};