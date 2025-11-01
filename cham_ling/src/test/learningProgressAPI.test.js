/**
 * Тесты для API функций прогресса изучения.
 * 
 * Проверяет работу с API endpoints для прогресса.
 * 
 * @module test/learningProgressAPI
 */
import { getLearningProgress, saveLearningProgress } from '../api/auth';
import { isOnline } from '../utils/offlineStatus';
import { getCachedProgress } from '../utils/indexedDB';

// Мокаем localStorage перед импортами
const localStorageMock = {
  getItem: jest.fn(() => JSON.stringify({ accessToken: 'test-token' })),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Мокаем утилиты
jest.mock('../utils/offlineStatus');
jest.mock('../utils/indexedDB');

describe('Learning Progress API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ accessToken: 'test-token' }));
    isOnline.mockReturnValue(true);
    getCachedProgress.mockResolvedValue([]);
  });

  describe('getLearningProgress', () => {
    test('имеет правильную сигнатуру функции', () => {
      expect(typeof getLearningProgress).toBe('function');
      expect(getLearningProgress.length).toBe(1);
    });

    test('использует кеш когда офлайн', async () => {
      isOnline.mockReturnValue(false);
      getCachedProgress.mockResolvedValue([1, 2, 3]);

      const progress = await getLearningProgress(1);

      expect(progress.learned_words).toEqual([1, 2, 3]);
      expect(progress.learned_words_count).toBe(3);
    });
  });

  describe('saveLearningProgress', () => {
    test('имеет правильную сигнатуру функции', () => {
      expect(typeof saveLearningProgress).toBe('function');
      expect(saveLearningProgress.length).toBe(2);
    });
  });
});

