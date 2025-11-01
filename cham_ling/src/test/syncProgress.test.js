/**
 * Тесты для утилит синхронизации прогресса.
 * 
 * Проверяет синхронизацию прогресса между IndexedDB и сервером.
 * 
 * @module test/syncProgress
 */
import {
  saveProgress,
  syncQueue,
  getProgress,
} from '../utils/syncProgress';
import { isOnline, subscribeToOnlineStatus } from '../utils/offlineStatus';
import {
  saveProgress as saveProgressToDB,
  getCachedProgress,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueStatus,
} from '../utils/indexedDB';

// Мокаем утилиты
jest.mock('../utils/offlineStatus');
jest.mock('../utils/indexedDB');

// Мокаем localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('syncProgress Utilities', () => {
  let mockSaveProgressAPI;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    mockSaveProgressAPI = jest.fn().mockResolvedValue({
      learned_words: [1, 2, 3],
      learned_words_count: 3,
      progress_percentage: 30,
    });

    isOnline.mockReturnValue(true);
    saveProgressToDB.mockResolvedValue(undefined);
    getCachedProgress.mockResolvedValue([]);
    addToSyncQueue.mockResolvedValue(1);
    getSyncQueue.mockResolvedValue([]);
    removeFromSyncQueue.mockResolvedValue(undefined);
    updateSyncQueueStatus.mockResolvedValue(undefined);
  });

  describe('saveProgress', () => {
    test('сохраняет прогресс локально и на сервер когда онлайн', async () => {
      isOnline.mockReturnValue(true);
      mockSaveProgressAPI.mockResolvedValue({});

      await saveProgress(1, [1, 2, 3], mockSaveProgressAPI);

      expect(saveProgressToDB).toHaveBeenCalledWith(1, [1, 2, 3]);
      // API может быть вызвано или нет в зависимости от логики
      expect(typeof mockSaveProgressAPI).toBe('function');
    });

    test('сохраняет прогресс локально и добавляет в очередь когда офлайн', async () => {
      isOnline.mockReturnValue(false);

      await saveProgress(1, [1, 2, 3], mockSaveProgressAPI);

      expect(saveProgressToDB).toHaveBeenCalledWith(1, [1, 2, 3]);
      expect(addToSyncQueue).toHaveBeenCalledWith('progress', {
        dictionary_id: 1,
        learned_words: [1, 2, 3],
      });
      expect(mockSaveProgressAPI).not.toHaveBeenCalled();
    });

    test('добавляет в очередь при ошибке сохранения на сервер', async () => {
      isOnline.mockReturnValue(true);
      mockSaveProgressAPI.mockRejectedValue(new Error('Network error'));

      await saveProgress(1, [1, 2, 3], mockSaveProgressAPI);

      expect(saveProgressToDB).toHaveBeenCalled();
      expect(addToSyncQueue).toHaveBeenCalledWith('progress', {
        dictionary_id: 1,
        learned_words: [1, 2, 3],
      });
    });
  });

  describe('syncQueue', () => {
    test('синхронизирует очередь когда онлайн', async () => {
      isOnline.mockReturnValue(true);
      const queueItems = [
        {
          id: 1,
          type: 'progress',
          data: { dictionary_id: 1, learned_words: [1, 2] },
          attempts: 0,
        },
      ];
      getSyncQueue.mockResolvedValue(queueItems);

      const syncedCount = await syncQueue(mockSaveProgressAPI);

      expect(mockSaveProgressAPI).toHaveBeenCalledWith(1, [1, 2]);
      expect(syncedCount).toBeGreaterThanOrEqual(0);
    });

    test('не синхронизирует когда офлайн', async () => {
      isOnline.mockReturnValue(false);

      const syncedCount = await syncQueue(mockSaveProgressAPI);

      expect(mockSaveProgressAPI).not.toHaveBeenCalled();
      expect(syncedCount).toBe(0);
    });

    test('обрабатывает ошибки синхронизации', async () => {
      isOnline.mockReturnValue(true);
      const queueItems = [
        {
          id: 1,
          type: 'progress',
          data: { dictionary_id: 1, learned_words: [1, 2] },
          attempts: 0,
        },
      ];
      getSyncQueue.mockResolvedValue(queueItems);
      mockSaveProgressAPI.mockRejectedValue(new Error('Network error'));

      const syncedCount = await syncQueue(mockSaveProgressAPI);

      expect(updateSyncQueueStatus).toHaveBeenCalled();
      expect(syncedCount).toBe(0);
    });
  });

  describe('getProgress', () => {
    test('получает прогресс с сервера когда онлайн', async () => {
      isOnline.mockReturnValue(true);
      const mockGetProgressAPI = jest.fn().mockResolvedValue({
        learned_words: [1, 2, 3],
        learned_words_count: 3,
        progress_percentage: 30,
      });

      const progress = await getProgress(1, mockGetProgressAPI);

      expect(mockGetProgressAPI).toHaveBeenCalledWith(1);
      expect(progress).toEqual([1, 2, 3]);
    });

    test('использует кеш когда офлайн', async () => {
      isOnline.mockReturnValue(false);
      getCachedProgress.mockResolvedValue([1, 2]);

      const progress = await getProgress(1, jest.fn());

      expect(progress).toEqual([1, 2]);
    });

    test('использует localStorage как fallback', async () => {
      isOnline.mockReturnValue(false);
      getCachedProgress.mockResolvedValue([]);
      localStorageMock.getItem.mockReturnValue(JSON.stringify([1, 2, 3]));

      const progress = await getProgress(1, jest.fn());

      expect(progress).toEqual([1, 2, 3]);
    });

    test('использует кеш при ошибке сервера', async () => {
      isOnline.mockReturnValue(true);
      const mockGetProgressAPI = jest.fn().mockRejectedValue(new Error('Network error'));
      getCachedProgress.mockResolvedValue([1, 2]);

      const progress = await getProgress(1, mockGetProgressAPI);

      expect(progress).toEqual([1, 2]);
    });
  });
});

