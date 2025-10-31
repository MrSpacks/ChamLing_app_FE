import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import AddDict from '../pages/AddDict/AddDict';
import * as authAPI from '../api/auth';

// Мокаем API
jest.mock('../api/auth', () => ({
  createDictionary: jest.fn(),
}));

// Мокаем localStorage для i18n
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Мокаем navigator.language
Object.defineProperty(navigator, 'language', {
  writable: true,
  value: 'ru',
});

// Обертка для компонента с i18n
const renderWithProviders = (component) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('AddDict Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    i18n.changeLanguage('ru');
  });

  test('отображает форму создания словаря', () => {
    renderWithProviders(<AddDict />);
    
    // Проверяем наличие основных элементов формы
    expect(screen.getByLabelText(/название|title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/описание|description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /создать|create/i })).toBeInTheDocument();
  });

  test('валидирует обязательные поля', async () => {
    renderWithProviders(<AddDict />);
    
    const submitButton = screen.getByRole('button', { name: /создать|create/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Проверяем что появились ошибки валидации
      const errorMessages = screen.queryAllByText(/обязательно|required/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  test('валидирует минимальную длину названия', async () => {
    renderWithProviders(<AddDict />);
    
    const nameInput = screen.getByLabelText(/название|title/i);
    fireEvent.change(nameInput, { target: { value: 'ab' } });
    fireEvent.blur(nameInput);
    
    await waitFor(() => {
      expect(screen.getByText(/не менее|at least|3 символов|characters/i)).toBeInTheDocument();
    });
  });

  test('валидирует максимальную длину названия', async () => {
    renderWithProviders(<AddDict />);
    
    const nameInput = screen.getByLabelText(/название|title/i);
    const longName = 'a'.repeat(101);
    fireEvent.change(nameInput, { target: { value: longName } });
    fireEvent.blur(nameInput);
    
    await waitFor(() => {
      expect(screen.getByText(/не должно превышать|must not exceed|100/i)).toBeInTheDocument();
    });
  });

  test('валидирует что языки должны отличаться', async () => {
    renderWithProviders(<AddDict />);
    
    const sourceLangSelect = screen.getAllByLabelText(/язык-источник|source/i)[0];
    const targetLangSelect = screen.getAllByLabelText(/язык-перевод|target/i)[0];
    
    fireEvent.change(sourceLangSelect, { target: { value: 'en' } });
    fireEvent.change(targetLangSelect, { target: { value: 'en' } });
    
    const submitButton = screen.getByRole('button', { name: /создать|create/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/языки должны отличаться|must be different/i)).toBeInTheDocument();
    });
  });

  test('требует описание для словаря на продажу', async () => {
    renderWithProviders(<AddDict />);
    
    // Заполняем базовые поля
    const nameInput = screen.getByLabelText(/название|title/i);
    fireEvent.change(nameInput, { target: { value: 'Test Dictionary' } });
    
    const sourceLangSelect = screen.getAllByLabelText(/язык-источник|source/i)[0];
    const targetLangSelect = screen.getAllByLabelText(/язык-перевод|target/i)[0];
    
    fireEvent.change(sourceLangSelect, { target: { value: 'en' } });
    fireEvent.change(targetLangSelect, { target: { value: 'ru' } });
    
    // Включаем продажу
    const sellCheckbox = screen.getByLabelText(/продавать|sell/i);
    fireEvent.click(sellCheckbox);
    
    // Пытаемся отправить форму
    const submitButton = screen.getByRole('button', { name: /создать|create/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/описание обязательно|description is required/i)).toBeInTheDocument();
    });
  });

  test('валидирует цену для словаря на продажу', async () => {
    renderWithProviders(<AddDict />);
    
    // Заполняем базовые поля
    const nameInput = screen.getByLabelText(/название/i);
    fireEvent.change(nameInput, { target: { value: 'Test Dictionary' } });
    
    const descriptionInput = screen.getByLabelText(/описание/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    const sourceLangSelect = screen.getAllByLabelText(/язык-источник/i)[0];
    const targetLangSelect = screen.getAllByLabelText(/язык-перевод/i)[0];
    
    fireEvent.change(sourceLangSelect, { target: { value: 'en' } });
    fireEvent.change(targetLangSelect, { target: { value: 'ru' } });
    
    // Включаем продажу
    const sellCheckbox = screen.getByLabelText(/продавать словарь/i);
    fireEvent.click(sellCheckbox);
    
    // Устанавливаем слишком низкую цену
    const priceInput = screen.getByLabelText(/цена/i);
    fireEvent.change(priceInput, { target: { value: '0.3' } });
    fireEvent.blur(priceInput);
    
    await waitFor(() => {
      expect(screen.getByText(/цена должна быть не менее/i)).toBeInTheDocument();
    });
  });

  test('обрабатывает ошибку сервера non_field_errors для описания', async () => {
    const mockError = {
      non_field_errors: ['Описание обязательно для словаря на продажу.']
    };
    
    authAPI.createDictionary.mockResolvedValueOnce({
      ok: false,
      json: async () => mockError
    });
    
    renderWithProviders(<AddDict />);
    
    // Заполняем форму
    const nameInput = screen.getByLabelText(/название/i);
    fireEvent.change(nameInput, { target: { value: 'Test Dictionary' } });
    
    const sourceLangSelect = screen.getAllByLabelText(/язык-источник/i)[0];
    const targetLangSelect = screen.getAllByLabelText(/язык-перевод/i)[0];
    
    fireEvent.change(sourceLangSelect, { target: { value: 'en' } });
    fireEvent.change(targetLangSelect, { target: { value: 'ru' } });
    
    const sellCheckbox = screen.getByLabelText(/продавать словарь/i);
    fireEvent.click(sellCheckbox);
    
    const submitButton = screen.getByRole('button', { name: /создать/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/описание обязательно для словаря на продажу/i)).toBeInTheDocument();
    });
  });

  test('обрабатывает ошибки сервера по полям', async () => {
    const mockError = {
      name: ['Это поле обязательно.'],
      description: ['Описание обязательно для словаря на продажу.']
    };
    
    authAPI.createDictionary.mockResolvedValueOnce({
      ok: false,
      json: async () => mockError
    });
    
    renderWithProviders(<AddDict />);
    
    const submitButton = screen.getByRole('button', { name: /создать/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/это поле обязательно/i)).toBeInTheDocument();
      expect(screen.getByText(/описание обязательно для словаря на продажу/i)).toBeInTheDocument();
    });
  });

  test('успешно создает словарь', async () => {
    const mockResponse = {
      id: 1,
      name: 'Test Dictionary',
      description: 'Test description'
    };
    
    authAPI.createDictionary.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    renderWithProviders(<AddDict />);
    
    // Заполняем форму
    const nameInput = screen.getByLabelText(/название/i);
    fireEvent.change(nameInput, { target: { value: 'Test Dictionary' } });
    
    const descriptionInput = screen.getByLabelText(/описание/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    const sourceLangSelect = screen.getAllByLabelText(/язык-источник/i)[0];
    const targetLangSelect = screen.getAllByLabelText(/язык-перевод/i)[0];
    
    fireEvent.change(sourceLangSelect, { target: { value: 'en' } });
    fireEvent.change(targetLangSelect, { target: { value: 'ru' } });
    
    const submitButton = screen.getByRole('button', { name: /создать/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/словарь успешно создан/i)).toBeInTheDocument();
    });
  });

  test('показывает индикатор обязательности для описания при включенной продаже', () => {
    renderWithProviders(<AddDict />);
    
    const sellCheckbox = screen.getByLabelText(/продавать словарь/i);
    fireEvent.click(sellCheckbox);
    
    const descriptionLabel = screen.getByText(/описание/i);
    expect(descriptionLabel).toBeInTheDocument();
    // Проверяем наличие индикатора обязательности
    expect(descriptionLabel.textContent).toContain('*');
  });

  test('показывает счетчик символов для названия', () => {
    renderWithProviders(<AddDict />);
    
    const nameInput = screen.getByLabelText(/название/i);
    fireEvent.change(nameInput, { target: { value: 'Test' } });
    
    expect(screen.getByText(/4\/100/i)).toBeInTheDocument();
  });

  test('очищает ошибки при изменении полей', async () => {
    renderWithProviders(<AddDict />);
    
    const submitButton = screen.getByRole('button', { name: /создать/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/название обязательно/i)).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText(/название/i);
    fireEvent.change(nameInput, { target: { value: 'Test Dictionary' } });
    
    await waitFor(() => {
      expect(screen.queryByText(/название обязательно/i)).not.toBeInTheDocument();
    });
  });

  test('блокирует кнопку отправки во время загрузки', async () => {
    authAPI.createDictionary.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
    );
    
    renderWithProviders(<AddDict />);
    
    // Заполняем форму
    const nameInput = screen.getByLabelText(/название/i);
    fireEvent.change(nameInput, { target: { value: 'Test Dictionary' } });
    
    const sourceLangSelect = screen.getAllByLabelText(/язык-источник/i)[0];
    const targetLangSelect = screen.getAllByLabelText(/язык-перевод/i)[0];
    
    fireEvent.change(sourceLangSelect, { target: { value: 'en' } });
    fireEvent.change(targetLangSelect, { target: { value: 'ru' } });
    
    const submitButton = screen.getByRole('button', { name: /создать/i });
    fireEvent.click(submitButton);
    
    // Кнопка должна быть заблокирована
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 2000 });
  });
});

