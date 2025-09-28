import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../App';
import { setupDefaultFetchMocks } from '../utils/testSetup';

describe('App - Basic Rendering', () => {
  beforeEach(() => {
    window.fetch = jest.fn();
    setupDefaultFetchMocks();
  });

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

  test('renders user icon in navigation', () => {
    render(<App />);
    const userIcon = document.querySelector('#user-icon-container');
    expect(userIcon).toBeInTheDocument();
  });

  test('renders output menu at bottom', () => {
    render(<App />);
    const outputMenu = document.querySelector('#output-menu');
    expect(outputMenu).toBeInTheDocument();
  });
});