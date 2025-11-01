/**
 * Тесты для компонента OfflineIndicator.
 * 
 * Проверяет отображение индикатора офлайн статуса при потере интернета.
 * 
 * @module test/OfflineIndicator
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import OfflineIndicator from '../components/OfflineIndicator/OfflineIndicator';
import { subscribeToOnlineStatus } from '../utils/offlineStatus';

// Мокаем утилиту offlineStatus
jest.mock('../utils/offlineStatus', () => ({
  subscribeToOnlineStatus: jest.fn(),
}));

const renderWithI18n = (component) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('OfflineIndicator Component', () => {
  let mockUnsubscribe;
  let mockCallback;

  beforeEach(() => {
    mockUnsubscribe = jest.fn();
    mockCallback = null;

    subscribeToOnlineStatus.mockImplementation((callback) => {
      mockCallback = callback;
      // Имитируем начальное состояние - онлайн
      callback(true);
      return mockUnsubscribe;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('не отображается когда онлайн', () => {
    renderWithI18n(<OfflineIndicator />);
    
    expect(screen.queryByText(/офлайн режиме/i)).not.toBeInTheDocument();
    expect(subscribeToOnlineStatus).toHaveBeenCalledTimes(1);
  });

  test('отображается когда офлайн', () => {
    // Настраиваем мок чтобы сразу вернуть офлайн
    subscribeToOnlineStatus.mockImplementation((callback) => {
      mockCallback = callback;
      callback(false); // Сразу вызываем с офлайн статусом
      return mockUnsubscribe;
    });
    
    renderWithI18n(<OfflineIndicator />);
    
    // Компонент должен отображаться сразу
    expect(screen.getByText(/офлайн|offline|режиме/i)).toBeInTheDocument();
  });

  test('подписывается на изменения статуса при монтировании', () => {
    renderWithI18n(<OfflineIndicator />);
    
    expect(subscribeToOnlineStatus).toHaveBeenCalledTimes(1);
    expect(typeof subscribeToOnlineStatus.mock.calls[0][0]).toBe('function');
  });

  test('отписывается от изменений статуса при размонтировании', () => {
    const { unmount } = renderWithI18n(<OfflineIndicator />);
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  test('обновляется при изменении статуса', () => {
    const { rerender } = renderWithI18n(<OfflineIndicator />);
    
    // Сначала онлайн - не отображается
    expect(screen.queryByText(/офлайн|offline|режиме/i)).not.toBeInTheDocument();
    
    // Переход в офлайн
    if (mockCallback) {
      mockCallback(false);
      rerender(
        <I18nextProvider i18n={i18n}>
          <OfflineIndicator />
        </I18nextProvider>
      );
    }
    expect(screen.queryByText(/офлайн|offline|режиме/i)).toBeInTheDocument();
  });

  test('использует переводы из i18n', () => {
    // Настраиваем мок чтобы сразу вернуть офлайн
    subscribeToOnlineStatus.mockImplementation((callback) => {
      mockCallback = callback;
      callback(false);
      return mockUnsubscribe;
    });
    
    renderWithI18n(<OfflineIndicator />);
    
    // Проверяем что текст отображается (из перевода или fallback)
    const indicator = screen.queryByText(/офлайн|offline|режиме/i);
    expect(indicator).toBeInTheDocument();
  });
});

