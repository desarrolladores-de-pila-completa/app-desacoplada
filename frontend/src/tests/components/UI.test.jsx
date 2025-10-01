import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../App';
import { setupDefaultFetchMocks } from '../utils/testSetup';

describe('App - UI Components and Navigation', () => {
  beforeEach(() => {
    window.fetch = jest.fn();
    setupDefaultFetchMocks();
  });

  describe('Navigation', () => {
    test('navigates to feed when clicking feed link', async () => {
      render(<App />);
      
      const feedLink = screen.getByRole('link', { name: /Feed/i });
      
      await act(async () => {
        fireEvent.click(feedLink);
      });
      
      // Verificar que se mantiene en la sección del feed
      expect(screen.getByText(/Feed público/i)).toBeInTheDocument();
    });

    test('feed link has correct href', () => {
      render(<App />);
      
      const feedLink = screen.getByRole('link', { name: /Feed/i });
      expect(feedLink).toHaveAttribute('href', '/feed');
    });
  });

  describe('Output Menu', () => {
    test('toggles output minimize/maximize', async () => {
      render(<App />);
      
      // Buscar el botón de minimizar
      const minimizeButton = document.querySelector('#output-min-btn');
      expect(minimizeButton).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.click(minimizeButton);
      });
      
      // Verificar que aparece el botón de restaurar
      const restoreButton = document.querySelector('#output-restore-btn');
      expect(restoreButton).toBeInTheDocument();
    });

    test('restore button brings back the output menu', async () => {
      render(<App />);
      
      // Minimizar primero
      const minimizeButton = document.querySelector('#output-min-btn');
      await act(async () => {
        fireEvent.click(minimizeButton);
      });
      
      // Restaurar
      const restoreButton = document.querySelector('#output-restore-btn');
      await act(async () => {
        fireEvent.click(restoreButton);
      });
      
      // Verificar que el botón de minimizar vuelve a aparecer
      expect(document.querySelector('#output-min-btn')).toBeInTheDocument();
    });

    test('output menu displays messages with correct styling', async () => {
      render(<App />);
      
      const outputArea = document.querySelector('#output-area');
      expect(outputArea).toBeInTheDocument();
      
      // Verificar estilos básicos del área de output
      expect(outputArea).toHaveStyle('min-height: 32px');
      expect(outputArea).toHaveStyle('font-size: 1em');
    });
  });

  describe('Layout Structure', () => {
    test('renders main navigation structure', () => {
      render(<App />);
      
      // Verificar estructura básica de navegación
      const nav = document.querySelector('nav');
      expect(nav).toBeInTheDocument();
      
      // Verificar contenedor del icono de usuario
      const userIconContainer = document.querySelector('#user-icon-container');
      expect(userIconContainer).toBeInTheDocument();
      expect(userIconContainer).toHaveStyle('cursor: pointer');
    });

    test('renders feed section structure', () => {
      render(<App />);
      
      // Verificar estructura de la sección del feed
      const feedSection = document.querySelector('#section-feed');
      expect(feedSection).toBeInTheDocument();
      
      const feedList = document.querySelector('#listaFeed');
      expect(feedList).toBeInTheDocument();
    });

    test('renders output menu container structure', () => {
      render(<App />);
      
      // Verificar estructura del contenedor de output
      const outputContainer = document.querySelector('#output-menu-container');
      expect(outputContainer).toBeInTheDocument();
      expect(outputContainer).toHaveStyle('position: fixed');
      expect(outputContainer).toHaveStyle('bottom: 0px');
      
      const outputMenu = document.querySelector('#output-menu');
      expect(outputMenu).toBeInTheDocument();
    });

    test('hidden sections are not displayed', () => {
      render(<App />);
      
      // Verificar que las secciones ocultas tienen display: none
      const paginasSection = document.querySelector('#section-paginas');
      expect(paginasSection).toHaveStyle('display: none');
      
      const verPaginaSection = document.querySelector('#section-ver-pagina');
      expect(verPaginaSection).toHaveStyle('display: none');
    });
  });

  describe('Responsive Design Elements', () => {
    test('output menu has responsive width', () => {
      render(<App />);
      
      const outputMenu = document.querySelector('#output-menu');
      expect(outputMenu).toHaveStyle('width: 100vw');
      expect(outputMenu).toHaveStyle('max-width: 480px');
    });

    test('output menu container spans full viewport', () => {
      render(<App />);
      
      const outputContainer = document.querySelector('#output-menu-container');
      expect(outputContainer).toHaveStyle('width: 100vw');
    });
  });

  describe('Interactive Elements', () => {
    test('user icon has proper interactive styling', () => {
      render(<App />);
      
      const userIcon = document.querySelector('#user-icon-container');
      expect(userIcon).toHaveStyle('cursor: pointer');
    });

    test('minimize button has proper styling', () => {
      render(<App />);
      
      const minimizeButton = document.querySelector('#output-min-btn');
      expect(minimizeButton).toHaveStyle('cursor: pointer');
      expect(minimizeButton).toHaveStyle('position: absolute');
    });
  });
});