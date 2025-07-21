// Agregar declaración global para Vite import.meta.glob si no existe
declare global {
  interface ImportMeta {
    glob: (pattern: string, options?: { as?: string; eager?: boolean }) => Record<string, unknown>;
  }
}

import { useContext, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

const langFiles = import.meta.glob('../lang/*.lang', { as: 'raw', eager: true });

function parseLangFile(raw: string): Record<string, string> {
  const lines = raw.split('\n');
  const dict: Record<string, string> = {};
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const [key, ...rest] = line.split('=');
    if (key && rest.length) dict[key.trim()] = rest.join('=').trim();
  }
  return dict;
}

export function useLang() {
  const { language } = useLanguage();
  const dict = useMemo(() => {
    const fileKey = `../lang/${language}.lang`;
    const raw = langFiles[fileKey] as string;
    return parseLangFile(raw || '');
  }, [language]);
  return (key: string) => dict[key] || key;
} 