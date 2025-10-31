import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import RegisterPage from '../pages/RegisterPage/RegisterPage';
import * as authAPI from '../api/auth';

jest.mock('../api/auth', () => ({
  registerUser: jest.fn(),
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

describe('RegisterPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('отображает форму регистрации', () => {
    renderWithProviders(<RegisterPage />);
    
    expect(screen.getByLabelText(/username|имя пользователя/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email|почта/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password|пароль/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm|подтверждение/i)).toBeInTheDocument();
  });

  test('валидирует обязательные поля', async () => {
    renderWithProviders(<RegisterPage />);
    
    const submitButton = screen.getByRole('button', { name: /зарегистрироваться|register/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      const errors = screen.queryAllByText(/обязателен|required/i);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  test('валидирует совпадение паролей', async () => {
    renderWithProviders(<RegisterPage />);
    
    const passwordInput = screen.getAllByLabelText(/password|пароль/i)[0];
    const confirmPasswordInput = screen.getByLabelText(/confirm|подтверждение/i);
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    fireEvent.blur(confirmPasswordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/не совпадают|don't match/i)).toBeInTheDocument();
    });
  });

  test('валидирует минимальную длину пароля', async () => {
    renderWithProviders(<RegisterPage />);
    
    const passwordInput = screen.getAllByLabelText(/password|пароль/i)[0];
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.blur(passwordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/не менее|at least|8/i)).toBeInTheDocument();
    });
  });

  test('успешно регистрирует пользователя', async () => {
    const mockResponse = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    };
    
    authAPI.registerUser.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithProviders(<RegisterPage />);
    
    const usernameInput = screen.getByLabelText(/username|имя пользователя/i);
    const emailInput = screen.getByLabelText(/email|почта/i);
    const passwordInput = screen.getAllByLabelText(/password|пароль/i)[0];
    const confirmPasswordInput = screen.getByLabelText(/confirm|подтверждение/i);
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: /зарегистрироваться|register/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(authAPI.registerUser).toHaveBeenCalled();
    });
  });
});

