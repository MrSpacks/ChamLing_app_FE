import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import LoginModal from '../components/LoginModal/LoginModal';
import * as authAPI from '../api/auth';

jest.mock('../api/auth', () => ({
  loginUser: jest.fn(),
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('LoginModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('отображает форму входа', () => {
    renderWithProviders(<LoginModal onClose={() => {}} />);
    
    expect(screen.getByLabelText(/email|почта/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password|пароль/i)).toBeInTheDocument();
  });

  test('валидирует email', async () => {
    renderWithProviders(<LoginModal onClose={() => {}} />);
    
    const emailInput = screen.getByLabelText(/email|почта/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.getByText(/некорректный email|invalid/i)).toBeInTheDocument();
    });
  });

  test('валидирует обязательные поля', async () => {
    renderWithProviders(<LoginModal onClose={() => {}} />);
    
    const submitButton = screen.getByRole('button', { name: /войти|login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      const errors = screen.queryAllByText(/обязателен|required/i);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  test('успешно выполняет вход', async () => {
    const mockResponse = {
      access: 'access_token',
      refresh: 'refresh_token',
    };
    
    authAPI.loginUser.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const onClose = jest.fn();
    renderWithProviders(<LoginModal onClose={onClose} />);
    
    const emailInput = screen.getByLabelText(/email|почта/i);
    const passwordInput = screen.getByLabelText(/password|пароль/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: /войти|login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(authAPI.loginUser).toHaveBeenCalled();
    });
  });
});

