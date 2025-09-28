import { render, screen } from '@testing-library/react';
import App from './App';

test('renders feed section', () => {
  render(<App />);
  const feedElement = screen.getByText(/Feed público/i);
  expect(feedElement).toBeInTheDocument();
});

test('renders navigation', () => {
  render(<App />);
  const feedNavElement = screen.getByRole('link', { name: /Feed/i });
  expect(feedNavElement).toBeInTheDocument();
});