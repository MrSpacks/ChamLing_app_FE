import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import AddWord from '../pages/AddWord/AddWord';
import * as authAPI from '../api/auth';

// Мокаем API
jest.mock('../api/auth', () => ({
  addWordToDictionary: jest.fn(),
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

// Мокаем FileReader для тестирования загрузки файлов
class MockFileReader {
  result = null;
  onloadend = null;

  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
}

global.FileReader = MockFileReader;

// Обертка для компонента с i18n
const renderWithProviders = (component) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('AddWord Component', () => {
  const mockDictionaryId = 1;
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    i18n.changeLanguage('ru');
  });

  test('отображает форму добавления слова', () => {
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    // Проверяем наличие основных элементов формы
    expect(screen.getByLabelText(/слово|word/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/перевод|translation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /добавить|add/i })).toBeInTheDocument();
  });

  test('валидирует обязательные поля', async () => {
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Проверяем что появились ошибки валидации
      const errorMessages = screen.queryAllByText(/обязательно|required/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  test('валидирует поле "слово"', async () => {
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    const wordInput = screen.getByLabelText(/слово|word/i);
    fireEvent.blur(wordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/слово обязательно|word is required/i)).toBeInTheDocument();
    });
  });

  test('валидирует поле "перевод"', async () => {
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    const translationInput = screen.getByLabelText(/перевод|translation/i);
    fireEvent.blur(translationInput);
    
    await waitFor(() => {
      expect(screen.getByText(/перевод обязателен|translation is required/i)).toBeInTheDocument();
    });
  });

  test('успешно добавляет слово без изображения', async () => {
    const mockResponse = {
      id: 1,
      word: 'Hello',
      translation: 'Привет',
    };
    
    authAPI.addWordToDictionary.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    // Заполняем форму
    const wordInput = screen.getByLabelText(/слово|word/i);
    fireEvent.change(wordInput, { target: { value: 'Hello' } });
    
    const translationInput = screen.getByLabelText(/перевод|translation/i);
    fireEvent.change(translationInput, { target: { value: 'Привет' } });
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(authAPI.addWordToDictionary).toHaveBeenCalledWith(
        mockDictionaryId,
        {
          word: 'Hello',
          translation: 'Привет',
        }
      );
      expect(screen.getByText(/слово успешно добавлено|word successfully added/i)).toBeInTheDocument();
    });
  });

  test('успешно добавляет слово с примером', async () => {
    const mockResponse = {
      id: 1,
      word: 'Hello',
      translation: 'Привет',
      example: 'Hello, how are you?',
    };
    
    authAPI.addWordToDictionary.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    // Заполняем форму
    const wordInput = screen.getByLabelText(/слово|word/i);
    fireEvent.change(wordInput, { target: { value: 'Hello' } });
    
    const translationInput = screen.getByLabelText(/перевод|translation/i);
    fireEvent.change(translationInput, { target: { value: 'Привет' } });
    
    const exampleInput = screen.getByLabelText(/пример|example/i);
    fireEvent.change(exampleInput, { target: { value: 'Hello, how are you?' } });
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(authAPI.addWordToDictionary).toHaveBeenCalledWith(
        mockDictionaryId,
        {
          word: 'Hello',
          translation: 'Привет',
          example: 'Hello, how are you?',
        }
      );
    });
  });

  test('успешно добавляет слово с URL изображения', async () => {
    const mockResponse = {
      id: 1,
      word: 'Hello',
      translation: 'Привет',
      image_url: 'https://example.com/image.jpg',
    };
    
    authAPI.addWordToDictionary.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    // Включаем использование своего изображения
    const useCustomImageCheckbox = screen.getByLabelText(/добавить свое изображение|use custom image/i);
    fireEvent.click(useCustomImageCheckbox);
    
    // Выбираем источник - URL
    const urlRadio = screen.getByLabelText(/по ссылке|from url/i);
    fireEvent.click(urlRadio);
    
    // Заполняем форму
    const wordInput = screen.getByLabelText(/слово|word/i);
    fireEvent.change(wordInput, { target: { value: 'Hello' } });
    
    const translationInput = screen.getByLabelText(/перевод|translation/i);
    fireEvent.change(translationInput, { target: { value: 'Привет' } });
    
    const imageUrlInput = screen.getByPlaceholderText(/example.com/i);
    fireEvent.change(imageUrlInput, { target: { value: 'https://example.com/image.jpg' } });
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(authAPI.addWordToDictionary).toHaveBeenCalledWith(
        mockDictionaryId,
        {
          word: 'Hello',
          translation: 'Привет',
          image_url: 'https://example.com/image.jpg',
        }
      );
    });
  });

  test('не отправляет пустой example', async () => {
    const mockResponse = {
      id: 1,
      word: 'Hello',
      translation: 'Привет',
    };
    
    authAPI.addWordToDictionary.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    // Заполняем форму
    const wordInput = screen.getByLabelText(/слово|word/i);
    fireEvent.change(wordInput, { target: { value: 'Hello' } });
    
    const translationInput = screen.getByLabelText(/перевод|translation/i);
    fireEvent.change(translationInput, { target: { value: 'Привет' } });
    
    // Оставляем example пустым или только пробелами
    const exampleInput = screen.getByLabelText(/пример|example/i);
    fireEvent.change(exampleInput, { target: { value: '   ' } });
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(authAPI.addWordToDictionary).toHaveBeenCalledWith(
        mockDictionaryId,
        {
          word: 'Hello',
          translation: 'Привет',
        }
      );
    });
  });

  test('не отправляет пустой image_url когда не используется пользовательское изображение', async () => {
    const mockResponse = {
      id: 1,
      word: 'Hello',
      translation: 'Привет',
    };
    
    authAPI.addWordToDictionary.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    // Заполняем форму БЕЗ включения пользовательского изображения
    const wordInput = screen.getByLabelText(/слово|word/i);
    fireEvent.change(wordInput, { target: { value: 'Hello' } });
    
    const translationInput = screen.getByLabelText(/перевод|translation/i);
    fireEvent.change(translationInput, { target: { value: 'Привет' } });
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      const callArgs = authAPI.addWordToDictionary.mock.calls[0];
      expect(callArgs[1]).not.toHaveProperty('image_url');
    });
  });

  test('обрабатывает ошибки сервера по полям', async () => {
    const mockError = {
      word: ['Это поле обязательно.'],
      translation: ['Это поле обязательно.']
    };
    
    authAPI.addWordToDictionary.mockResolvedValueOnce({
      ok: false,
      json: async () => mockError
    });
    
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Проверяем наличие ошибок валидации на полях
      const errorTexts = screen.getAllByText(/обязательно/i);
      expect(errorTexts.length).toBeGreaterThan(0);
    });
  });

  test('обрабатывает общие ошибки сервера', async () => {
    const mockError = {
      detail: 'Ошибка при создании слова.'
    };
    
    authAPI.addWordToDictionary.mockResolvedValueOnce({
      ok: false,
      json: async () => mockError
    });
    
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    // Заполняем форму
    const wordInput = screen.getByLabelText(/слово|word/i);
    fireEvent.change(wordInput, { target: { value: 'Hello' } });
    
    const translationInput = screen.getByLabelText(/перевод|translation/i);
    fireEvent.change(translationInput, { target: { value: 'Привет' } });
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/ошибка при создании слова/i)).toBeInTheDocument();
    });
  });

  test('вызывает onSuccess после успешного добавления', async () => {
    const mockResponse = {
      id: 1,
      word: 'Hello',
      translation: 'Привет',
    };
    
    authAPI.addWordToDictionary.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    // Заполняем форму
    const wordInput = screen.getByLabelText(/слово|word/i);
    fireEvent.change(wordInput, { target: { value: 'Hello' } });
    
    const translationInput = screen.getByLabelText(/перевод|translation/i);
    fireEvent.change(translationInput, { target: { value: 'Привет' } });
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  test('вызывает onCancel при нажатии на кнопку отмены', () => {
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /отмена|cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('блокирует кнопку отправки во время загрузки', async () => {
    // Используем более простой подход с задержкой
    authAPI.addWordToDictionary.mockImplementation(() => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ id: 1 })
          });
        }, 100);
      })
    );
    
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    // Заполняем форму
    const wordInput = screen.getByLabelText(/слово|word/i);
    fireEvent.change(wordInput, { target: { value: 'Hello' } });
    
    const translationInput = screen.getByLabelText(/перевод|translation/i);
    fireEvent.change(translationInput, { target: { value: 'Привет' } });
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    
    // Проверяем, что кнопка не заблокирована до отправки
    expect(submitButton).not.toBeDisabled();
    
    fireEvent.click(submitButton);
    
    // Кнопка должна быть заблокирована сразу после клика
    expect(submitButton).toBeDisabled();
    
    // Ждем завершения запроса
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  test('очищает форму после успешного добавления', async () => {
    const mockResponse = {
      id: 1,
      word: 'Hello',
      translation: 'Привет',
    };
    
    authAPI.addWordToDictionary.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    renderWithProviders(
      <AddWord 
        dictionaryId={mockDictionaryId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );
    
    // Заполняем форму
    const wordInput = screen.getByLabelText(/слово|word/i);
    fireEvent.change(wordInput, { target: { value: 'Hello' } });
    
    const translationInput = screen.getByLabelText(/перевод|translation/i);
    fireEvent.change(translationInput, { target: { value: 'Привет' } });
    
    const submitButton = screen.getByRole('button', { name: /добавить|add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(wordInput.value).toBe('');
      expect(translationInput.value).toBe('');
    }, { timeout: 2000 });
  });
});
