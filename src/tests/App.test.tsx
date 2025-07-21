import { render, screen } from '@testing-library/react';
import App from '../App';

test('muestra el texto de bienvenida', () => {
  render(<App />);
  expect(screen.getByText(/Bienvenido a KegTracker|Welcome to KegTracker/i)).toBeInTheDocument();
}); 