import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KegForm from '../pages/KegForm';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import axios from 'axios';
import { vi, describe, it, beforeEach, expect } from 'vitest';

vi.mock('axios');

// Mock de localStorage para LanguageProvider
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => 'es'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

describe('KegForm', () => {
  beforeEach(() => {
    (axios.get as any).mockResolvedValue({ data: [] });
  });

  it('renderiza el formulario y valida campos obligatorios', async () => {
    render(
      <AuthProvider>
        <LanguageProvider>
          <KegForm onSuccess={vi.fn()} />
        </LanguageProvider>
      </AuthProvider>
    );
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '' } });
    fireEvent.submit(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText(/obligatorio|required/i)).toBeInTheDocument();
    });
  });

  it('envía el formulario correctamente', async () => {
    (axios.post as any).mockResolvedValueOnce({ data: { id: 1 } });
    render(
      <AuthProvider>
        <LanguageProvider>
          <KegForm onSuccess={vi.fn()} />
        </LanguageProvider>
      </AuthProvider>
    );
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Barril Test' } });
    fireEvent.change(screen.getByLabelText(/capacity/i), { target: { value: 20 } });
    fireEvent.submit(screen.getByRole('button'));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });
}); 